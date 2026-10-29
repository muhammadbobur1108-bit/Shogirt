/**
 * Chust Textile ERP - Parallel Barcode Reader (ZXing + Tesseract.js)
 * 
 * Ushbu modul:
 * 1. ZXing (Code 128) orqali rasmni 0°, 90°, 180°, 270° burib va masshtablab o'qiydi.
 * 2. Tesseract.js orqali shtrix-kod ostidagi (00)... yozuvini OCR qiladi (oq ro'yxat: 0-9 va qavslar).
 * 3. Ikkala usulni parallel ishga tushiradi.
 * 4. SSCC Mod 10 nazorat raqami bilan tekshiradi va bitta xatolik bo'lsa avtomatik tuzatadi.
 */

import { 
  MultiFormatReader, 
  BarcodeFormat, 
  DecodeHintType, 
  BinaryBitmap, 
  HybridBinarizer, 
  HTMLCanvasElementLuminanceSource 
} from '@zxing/library';
import { createWorker, Worker } from 'tesseract.js';
import { validateSSCC, cleanSSCCDigits, tryCorrectSSCC, formatSSCC } from './sscc';
import { BarcodeStatus } from './types';

// Reusable singletons
let globalReader: MultiFormatReader | null = null;
let globalOcrWorker: Worker | null = null;
let workerInitPromise: Promise<Worker> | null = null;

function getZXingReader(): MultiFormatReader {
  if (!globalReader) {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
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
      tessedit_char_whitelist: '0123456789() -',
      tessedit_pageseg_mode: '6' as any // Assume single uniform block of text
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
  method: 'zxing' | 'ocr' | 'corrected' | 'none';
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
  cropBottomRatio: number = 0 // Masalan 0.35 faqat pastki 35% qismini kesish
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const rad = (rotationDeg * Math.PI) / 180;
  
  // Kesish o'lchamlari
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
    img.onerror = (e) => reject(new Error('Rasm yuklanmadi'));

    if (typeof src === 'string') {
      img.src = src;
    } else {
      const url = URL.createObjectURL(src);
      img.src = url;
    }
  });
}

/**
 * ZXing orqali ko'p burchakli (0°, 90°, 180°, 270°) va masshtabli o'qish
 */
async function decodeWithZXing(img: HTMLImageElement): Promise<string | null> {
  const reader = getZXingReader();
  const angles = [0, 90, 270, 180];
  const scales = [1.0, 2.0, 1.5];

  for (const scale of scales) {
    for (const angle of angles) {
      try {
        const canvas = createTransformedCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height, angle, scale);
        const lumSource = new HTMLCanvasElementLuminanceSource(canvas);
        const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
        const result = reader.decode(bitmap);
        if (result && result.getText()) {
          const text = result.getText();
          const clean = cleanSSCCDigits(text);
          // Agar 18 xonali to'g'ri SSCC bo'lsa darhol qaytaramiz
          if (clean.length === 18 && validateSSCC(clean)) {
            return clean;
          }
          if (clean.length >= 17) {
            return clean;
          }
        }
      } catch {
        // ZXing topolmasa navbatdagi burchakka o'tadi
      }
    }
  }

  return null;
}

/**
 * Tesseract.js OCR orqali shtrix-kod ostidagi yozuvni o'qish
 */
async function decodeWithOCR(img: HTMLImageElement): Promise<string | null> {
  try {
    const worker = await getOcrWorker();
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    // Pastki 40% qismida inson o'qiydigan yozuv bo'ladi
    const croppedCanvas = createTransformedCanvas(img, w, h, 0, 2.0, 0.45);
    const result = await worker.recognize(croppedCanvas);
    const text = result.data.text || '';

    // Regex orqali (00) va 18 xonali raqamni topish
    const fullMatch = text.match(/(?:00|\(00\))?\s*(\d{17,20})/);
    if (fullMatch) {
      return cleanSSCCDigits(fullMatch[1]);
    }

    // Hech bo'lmasa 17-18 ta raqam bormi
    const anyDigits = cleanSSCCDigits(text);
    if (anyDigits.length >= 17) {
      return anyDigits.slice(0, 18);
    }
  } catch (err) {
    console.warn('OCR jarayonida xatolik:', err);
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

    // Foydalanuvchi tanlagandek: ZXing va OCR parallel ishga tushadi
    const [zxingPromise, ocrPromise] = [
      decodeWithZXing(img),
      decodeWithOCR(img)
    ];

    const [zxingRes, ocrRes] = await Promise.allSettled([zxingPromise, ocrPromise]);

    const zxingVal = zxingRes.status === 'fulfilled' ? zxingRes.value : null;
    const ocrVal = ocrRes.status === 'fulfilled' ? ocrRes.value : null;

    // 1. Agar ZXing to'g'ri SSCC topgan bo'lsa (eng yuqori ishonchlilik)
    if (zxingVal && validateSSCC(zxingVal)) {
      return {
        success: true,
        rawCode: zxingVal,
        sscc: zxingVal,
        formattedCode: formatSSCC(zxingVal),
        status: 'OK',
        method: 'zxing',
        details: 'ZXing Code 128 o\'quvchisi orqali to\'liq va to\'g\'ri aniqlandi'
      };
    }

    // 2. Agar OCR to'g'ri SSCC topgan bo'lsa
    if (ocrVal && validateSSCC(ocrVal)) {
      return {
        success: true,
        rawCode: ocrVal,
        sscc: ocrVal,
        formattedCode: formatSSCC(ocrVal),
        status: 'OCR',
        method: 'ocr',
        details: 'Matn qismidan (OCR) o\'qildi, SSCC nazorat raqami to\'g\'ri'
      };
    }

    // 3. Agar ZXing raqam topgan bo'lsa, lekin nazorat raqami xato bo'lsa — avto-tuzatish sinab ko'ramiz
    const candidateCode = zxingVal || ocrVal;

    if (candidateCode) {
      const correction = tryCorrectSSCC(candidateCode);
      if (correction && correction.wasCorrected) {
        return {
          success: true,
          rawCode: candidateCode,
          sscc: correction.corrected,
          formattedCode: formatSSCC(correction.corrected),
          status: 'tuzatildi',
          method: 'corrected',
          details: correction.details || 'OCR xatosi bitta raqam almashtirish orqali to\'g\'rilandi'
        };
      }

      // Tuzatib bo'lmadi, nazorat raqami mos emas
      const cleanCandidate = cleanSSCCDigits(candidateCode);
      return {
        success: false,
        rawCode: candidateCode,
        sscc: cleanCandidate,
        formattedCode: formatSSCC(cleanCandidate),
        status: 'nazorat_mos_emas',
        method: zxingVal ? 'zxing' : 'ocr',
        details: 'Raqam aniqlandi, biroq GS1 SSCC Mod 10 nazorat raqami mos kelmadi'
      };
    }

    // 4. Umuman o'qilmadi
    return {
      success: false,
      rawCode: '',
      sscc: '',
      formattedCode: '',
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
      status: 'oqilmadi',
      method: 'none',
      details: err?.message || 'O\'qishda xatolik yuz berdi'
    };
  }
}
