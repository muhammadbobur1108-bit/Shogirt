/**
 * Chust Textile ERP - Parallel Barcode Reader (ZXing + Tesseract.js + AI Vision Fallback)
 * 
 * Ushbu modul:
 * 1. ZXing (Code 128, EAN, ITF, Code 39) orqali rasmni 0°, 90°, 180°, 270° burib,
 *    oddiy va teskari (invert) ranglarda, hamda Hybrid va GlobalHistogram binarizatorlari bilan o'qiydi.
 * 2. Tesseract.js orqali shtrix-kod ostidagi (00)... yozuvini va Rang/O'lcham/Bo'y parametrlarini OCR qiladi.
 * 3. Agar rasm xira, qiya yoki skrinshot bo'lib brauzer o'quvchilari topolmasa,
 *    avtomatik ravishda serverdagi Gemini AI Vision (/api/barcode/read) orqali o'qib beradi.
 * 4. GS1 SSCC Modulo 10 nazorat raqami bilan to'liq tekshiradi va bitta xatolik bo'lsa avto-tuzatadi.
 */

import { 
  MultiFormatReader, 
  BarcodeFormat, 
  DecodeHintType, 
  BinaryBitmap, 
  HybridBinarizer,
  GlobalHistogramBinarizer,
  HTMLCanvasElementLuminanceSource 
} from '@zxing/library';
import { createWorker, Worker } from 'tesseract.js';
import { 
  validateSSCC, 
  cleanSSCCDigits, 
  tryCorrectSSCC, 
  formatSSCC, 
  findSSCCInText,
  extractLabelMetadata 
} from './sscc';
import { BarcodeStatus } from './types';
import { getAuthHeaders } from '../authClient';

// Reusable singletons
let globalReader: MultiFormatReader | null = null;
let globalOcrWorker: Worker | null = null;
let workerInitPromise: Promise<Worker> | null = null;

function getZXingReader(): MultiFormatReader {
  if (!globalReader) {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.ITF,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    globalReader = new MultiFormatReader();
    globalReader.setHints(hints);
  }
  return globalReader;
}

async function getOcrWorker(): Promise<Worker> {
  if (globalOcrWorker) return globalOcrWorker;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    const worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: '3' as any // Fully automatic page segmentation
    });
    globalOcrWorker = worker;
    return worker;
  })();

  return workerInitPromise;
}

export interface ReadResult {
  success: boolean;
  rawCode: string;
  sscc: string;
  formattedCode: string;
  status: BarcodeStatus;
  method: 'zxing' | 'ocr' | 'corrected' | 'ai' | 'none';
  color?: string;
  size?: string;
  rost?: string;
  details?: string;
}

/**
 * Image elementni berilgan burchakka burib va masshtablab canvas yaratadi
 */
function createTransformedCanvas(
  sourceImage: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  rotationDeg: number = 0,
  scale: number = 1.0,
  cropBottomRatio: number = 0,
  invert: boolean = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const rad = (rotationDeg * Math.PI) / 180;
  
  const cropY = cropBottomRatio > 0 ? sourceHeight * (1 - cropBottomRatio) : 0;
  const cropH = cropBottomRatio > 0 ? sourceHeight * cropBottomRatio : sourceHeight;

  let targetW = sourceWidth * scale;
  let targetH = cropH * scale;

  if (rotationDeg === 90 || rotationDeg === 270) {
    canvas.width = targetH;
    canvas.height = targetW;
  } else {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  if (invert) {
    ctx.filter = 'invert(1) contrast(1.3)';
  } else {
    ctx.filter = 'contrast(1.1)';
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);

  const drawW = sourceWidth * scale;
  const drawH = cropH * scale;

  ctx.drawImage(
    sourceImage,
    0, cropY, sourceWidth, cropH,
    -drawW / 2, -drawH / 2, drawW, drawH
  );
  ctx.restore();

  return canvas;
}

/**
 * Rasmni yuklab HTMLImageElement yaratadi
 */
export function loadImageFromSource(src: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Rasm yuklanmadi'));

    if (typeof src === 'string') {
      img.src = src;
    } else {
      const url = URL.createObjectURL(src);
      img.src = url;
    }
  });
}

/**
 * File yoki Blob dan base64 DataURL hosil qiladi
 */
function fileToBase64(source: string | File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof source === 'string') {
      if (source.startsWith('data:')) return resolve(source);
      // Agar blob url bo'lsa yoki oddiy url bo'lsa canvas orqali olish
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/jpeg', 0.9));
        } else {
          resolve(source);
        }
      };
      img.onerror = () => resolve(source);
      img.src = source;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(source);
  });
}

/**
 * ZXing orqali ko'p burchakli (0°, 90°, 180°, 270°), turli binarizatorlar va ranglarda o'qish
 */
async function decodeWithZXing(img: HTMLImageElement): Promise<string | null> {
  const reader = getZXingReader();
  const angles = [0, 90, 270, 180];
  const scales = [1.0, 1.5, 2.0];
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  for (const invert of [false, true]) {
    for (const scale of scales) {
      for (const angle of angles) {
        try {
          const canvas = createTransformedCanvas(img, w, h, angle, scale, 0, invert);
          const lumSource = new HTMLCanvasElementLuminanceSource(canvas);

          // 1. HybridBinarizer sinovi
          try {
            const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
            const result = reader.decode(bitmap);
            if (result && result.getText()) {
              const text = result.getText();
              const found = findSSCCInText(text);
              if (found) return found.sscc;
              const clean = cleanSSCCDigits(text);
              if (clean.length === 18) return clean;
            }
          } catch {}

          // 2. GlobalHistogramBinarizer sinovi (skrinshot va past kontrastli fotosuratlar uchun ideal)
          try {
            const bitmapGlobal = new BinaryBitmap(new GlobalHistogramBinarizer(lumSource));
            const resultGlobal = reader.decode(bitmapGlobal);
            if (resultGlobal && resultGlobal.getText()) {
              const text = resultGlobal.getText();
              const found = findSSCCInText(text);
              if (found) return found.sscc;
              const clean = cleanSSCCDigits(text);
              if (clean.length === 18) return clean;
            }
          } catch {}

        } catch {}
      }
    }
  }

  return null;
}

/**
 * Tesseract.js OCR orqali shtrix-kod ostidagi yozuv va etiketka matnini o'qish
 */
async function decodeWithOCR(img: HTMLImageElement): Promise<{ 
  codeResult: { sscc: string; status: 'OK' | 'tuzatildi' | 'nazorat_mos_emas'; details?: string } | null;
  metadata: { color?: string; size?: string; rost?: string };
}> {
  try {
    const worker = await getOcrWorker();
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    // Sinov uchun 3 xil variant:
    // 1. Butun rasm (0°)
    // 2. 90° burilgan butun rasm (40x58 mm termo etiketka uchun)
    // 3. Pastki 50% qism
    const variants = [
      createTransformedCanvas(img, w, h, 0, 1.5, 0),
      createTransformedCanvas(img, w, h, 90, 1.5, 0),
      createTransformedCanvas(img, w, h, 0, 2.0, 0.5)
    ];

    let combinedMetadata: { color?: string; size?: string; rost?: string } = {};

    for (const canvas of variants) {
      try {
        const result = await worker.recognize(canvas);
        const text = result.data.text || '';

        const meta = extractLabelMetadata(text);
        combinedMetadata = {
          color: combinedMetadata.color || meta.color,
          size: combinedMetadata.size || meta.size,
          rost: combinedMetadata.rost || meta.rost
        };

        const found = findSSCCInText(text);
        if (found) {
          return {
            codeResult: found,
            metadata: combinedMetadata
          };
        }
      } catch {}
    }

    return { codeResult: null, metadata: combinedMetadata };
  } catch (err) {
    console.warn('OCR jarayonida xatolik:', err);
    return { codeResult: null, metadata: {} };
  }
}

/**
 * Serverdagi Gemini AI Vision orqali eng murakkab/xira etiketkalarni o'qish
 */
async function decodeWithAiVision(
  source: string | File | Blob, 
  fileName: string
): Promise<ReadResult | null> {
  try {
    const base64 = await fileToBase64(source);
    const mimeType = typeof source !== 'string' && 'type' in source && source.type ? source.type : 'image/jpeg';

    const resp = await fetch('/api/barcode/read', {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64, mimeType, fileName })
    });

    if (!resp.ok) return null;
    const data = await resp.json();

    if (data.success && data.sscc && data.sscc.length >= 17) {
      return {
        success: true,
        rawCode: data.rawCode || data.sscc,
        sscc: data.sscc,
        formattedCode: data.formattedCode || formatSSCC(data.sscc),
        color: data.color || '',
        size: data.size || '',
        rost: data.rost || '170-176',
        status: data.status || 'OK',
        method: 'ai',
        details: data.details || 'AI Vision orqali yuqori aniqlikda o\'qildi'
      };
    }
  } catch (err) {
    console.warn('AI Vision o\'qishida server xatosi:', err);
  }

  return null;
}

/**
 * ASOSIY PARALLEL O'QISH FUNKSIYASI
 */
export async function readBarcodeImage(
  source: string | File | Blob,
  fileName: string = 'rasm.jpg'
): Promise<ReadResult> {
  try {
    const img = await loadImageFromSource(source);

    // 1. ZXing va OCR ni parallel ishga tushiramiz
    const [zxingRes, ocrRes] = await Promise.allSettled([
      decodeWithZXing(img),
      decodeWithOCR(img)
    ]);

    const zxingVal = zxingRes.status === 'fulfilled' ? zxingRes.value : null;
    const ocrData = ocrRes.status === 'fulfilled' ? ocrRes.value : null;

    const extractedColor = ocrData?.metadata?.color || '';
    const extractedSize = ocrData?.metadata?.size || '';
    const extractedRost = ocrData?.metadata?.rost || '170-176';

    // 1. Agar ZXing to'g'ri SSCC topgan bo'lsa
    if (zxingVal && validateSSCC(zxingVal)) {
      return {
        success: true,
        rawCode: zxingVal,
        sscc: zxingVal,
        formattedCode: formatSSCC(zxingVal),
        color: extractedColor,
        size: extractedSize,
        rost: extractedRost,
        status: 'OK',
        method: 'zxing',
        details: 'ZXing Code 128 o\'quvchisi orqali to\'liq va to\'g\'ri aniqlandi'
      };
    }

    // 2. Agar OCR to'g'ri SSCC topgan bo'lsa
    if (ocrData?.codeResult && ocrData.codeResult.status === 'OK') {
      const code = ocrData.codeResult.sscc;
      return {
        success: true,
        rawCode: code,
        sscc: code,
        formattedCode: formatSSCC(code),
        color: extractedColor,
        size: extractedSize,
        rost: extractedRost,
        status: 'OCR',
        method: 'ocr',
        details: ocrData.codeResult.details || 'Matn qismidan (OCR) o\'qildi, SSCC nazorat raqami to\'g\'ri'
      };
    }

    // 3. Agar OCR bitta xatoni tuzatgan bo'lsa
    if (ocrData?.codeResult && ocrData.codeResult.status === 'tuzatildi') {
      const code = ocrData.codeResult.sscc;
      return {
        success: true,
        rawCode: code,
        sscc: code,
        formattedCode: formatSSCC(code),
        color: extractedColor,
        size: extractedSize,
        rost: extractedRost,
        status: 'tuzatildi',
        method: 'corrected',
        details: ocrData.codeResult.details || 'OCR xatosi avtomatik to\'g\'rilandi'
      };
    }

    // 4. ZXing orqali o'qilgan xom kodni tekshirish va avto-tuzatish
    if (zxingVal) {
      const corr = tryCorrectSSCC(zxingVal);
      if (corr && corr.wasCorrected) {
        return {
          success: true,
          rawCode: zxingVal,
          sscc: corr.corrected,
          formattedCode: formatSSCC(corr.corrected),
          color: extractedColor,
          size: extractedSize,
          rost: extractedRost,
          status: 'tuzatildi',
          method: 'corrected',
          details: corr.details || 'Shtrix-kod xatosi bitta raqam almashtirish orqali to\'g\'rilandi'
        };
      }
    }

    // 5. AGAR MIJOZ TOMONIDA TOPILMASA: Serverdagi AI Vision orqali o'qish (Fallback)
    const aiResult = await decodeWithAiVision(source, fileName);
    if (aiResult && aiResult.success) {
      return {
        ...aiResult,
        color: aiResult.color || extractedColor,
        size: aiResult.size || extractedSize,
        rost: aiResult.rost || extractedRost
      };
    }

    // 6. Agar biron raqam aniqlangan, lekin nazorat mos kelmagan bo'lsa
    const fallbackCode = zxingVal || (ocrData?.codeResult ? ocrData.codeResult.sscc : '');
    if (fallbackCode) {
      const cleanCandidate = cleanSSCCDigits(fallbackCode);
      return {
        success: false,
        rawCode: fallbackCode,
        sscc: cleanCandidate,
        formattedCode: formatSSCC(cleanCandidate),
        color: extractedColor,
        size: extractedSize,
        rost: extractedRost,
        status: 'nazorat_mos_emas',
        method: zxingVal ? 'zxing' : 'ocr',
        details: 'Raqam aniqlandi, biroq GS1 SSCC Mod 10 nazorat raqami mos kelmadi'
      };
    }

    // 7. Umuman o'qilmadi
    return {
      success: false,
      rawCode: '',
      sscc: '',
      formattedCode: '',
      color: '',
      size: '',
      rost: '170-176',
      status: 'oqilmadi',
      method: 'none',
      details: 'Rasmda shtrix-kod yoki matn aniqlanmadi'
    };

  } catch (err: any) {
    return {
      success: false,
      rawCode: '',
      sscc: '',
      formattedCode: '',
      color: '',
      size: '',
      rost: '170-176',
      status: 'oqilmadi',
      method: 'none',
      details: err?.message || 'O\'qishda xatolik yuz berdi'
    };
  }
}
