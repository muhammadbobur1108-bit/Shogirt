/**
 * Chust Textile ERP - 40x58 mm Etiketka PDF Generatori (pdf-lib + fontkit)
 * 
 * Ushbu modul:
 * - Har bir sahifaga 1 ta 40x58 mm vertikal etiketka hosil qiladi
 * - Shtrix-kodni 90° burilgan holda 156 ta vektor to'rtburchaklar bilan chizadi
 * - Kirill shrifti (Liberation Sans Regular va Bold) ni to'liq joylaydi
 * - Yagona rang va ko'p rangli yozuvlarni spetsifikatsiya bo'yicha markazlashtirib chizadi
 * - Faqat to'g'ri kodli qatorlarni kiritadi (har biridan N nusxa)
 */

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { BarcodeItem, LabelSettings, LabelDimensions, DEFAULT_LABEL_SETTINGS } from './types';
import { encodeGS1_128_SSCC } from './code128';
import { formatSSCC } from './sscc';

// 1 mm = 72 / 25.4 points
const MM_TO_PT = 72 / 25.4;

// Shrift kesh
let cachedRegularFontBytes: Uint8Array | null = null;
let cachedBoldFontBytes: Uint8Array | null = null;

async function loadFontBytes(filename: string): Promise<Uint8Array> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/fonts/${filename}`);
    if (!res.ok) {
      throw new Error(`Shrift fayli yuklanmadi: ${filename} (status ${res.status})`);
    }
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } else {
    // Node.js muhiti (unit testlar uchun)
    const fs = await import('fs');
    const path = await import('path');
    const p = path.resolve(process.cwd(), 'public/fonts', filename);
    return new Uint8Array(fs.readFileSync(p));
  }
}

async function getFonts(): Promise<{ regular: Uint8Array; bold: Uint8Array }> {
  if (!cachedRegularFontBytes) {
    cachedRegularFontBytes = await loadFontBytes('LiberationSans-Regular.ttf');
  }
  if (!cachedBoldFontBytes) {
    cachedBoldFontBytes = await loadFontBytes('LiberationSans-Bold.ttf');
  }
  return {
    regular: cachedRegularFontBytes,
    bold: cachedBoldFontBytes
  };
}

/**
 * 40x58 mm yoki 80x50 mm etiketkalar PDF faylini generatsiya qiladi.
 * Faqat to'g'ri (OK, OCR, tuzatildi va takror bo'lmagan) kodlar kiritiladi.
 * labelDimensions parametri orqali o'lchamlarni dinamik boshqarish mumkin.
 */
export async function generateLabelsPdf(
  items: BarcodeItem[],
  settings: LabelSettings = DEFAULT_LABEL_SETTINGS,
  labelDimensions?: Partial<LabelDimensions>
): Promise<Uint8Array> {
  // labelDimensions parametri berilgan bo'lsa, settings bilan birlashtiramiz
  const activeSettings: LabelSettings = {
    ...settings,
    ...(labelDimensions || {}),
    ...(labelDimensions?.widthMm === 50 && labelDimensions?.heightMm === 80 
        ? { 
            formatType: '80x50' as const, 
            barcodeWidthMm: labelDimensions.barcodeWidthMm || 42.0, 
            barcodeHeightMm: labelDimensions.barcodeHeightMm || 51.0,
            marginTopMm: labelDimensions.marginTopMm || 3.5,
            marginLeftMm: labelDimensions.marginLeftMm != null ? labelDimensions.marginLeftMm : 4.0
          } 
        : {})
  };

  // Faqat to'g'ri SSCC kodli qatorlarni filtrlaymiz
  const validItems = items.filter(
    item => (item.status === 'OK' || item.status === 'OCR' || item.status === 'tuzatildi') && item.sscc.length === 18
  );

  if (validItems.length === 0) {
    throw new Error('PDF yaratish uchun kamida bitta to\'g\'ri shtrix-kod bo\'lishi shart!');
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const { regular: regBytes, bold: boldBytes } = await getFonts();
  const regularFont = await pdfDoc.embedFont(regBytes, { subset: true });
  const boldFont = await pdfDoc.embedFont(boldBytes, { subset: true });

  const is80x50Format = activeSettings.formatType === '80x50' ||
    (activeSettings.widthMm === 80 && activeSettings.heightMm === 50) ||
    (activeSettings.widthMm === 50 && activeSettings.heightMm === 80) ||
    activeSettings.heightMm >= 75;

  // 80x50 mm formati uchun standart vertikal o'lchamlar: Eni 50 mm, Bo'yi 80 mm
  const targetWidthMm = is80x50Format ? 50 : activeSettings.widthMm;
  const targetHeightMm = is80x50Format ? 80 : activeSettings.heightMm;

  // Proporsional masshtab (standart 40x58 mm ga nisbatan)
  const scaleX = targetWidthMm / 40;
  const scaleY = targetHeightMm / 58;
  const overallScale = Math.min(scaleX, scaleY);

  const pageWidthPt = targetWidthMm * MM_TO_PT;
  const pageHeightPt = targetHeightMm * MM_TO_PT;

  for (const item of validItems) {
    const copies = Math.max(1, item.copies || activeSettings.defaultCopies || 4);

    // 156 modulni kodlaymiz
    const encoded = encodeGS1_128_SSCC(item.sscc);
    const binary = encoded.binaryModules;

    for (let c = 0; c < copies; c++) {
      const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

      // AGAR 80x50 mm (50x80 vertikal) FORMAT TANLANGAN BO'LSA
      if (is80x50Format) {
        // ----------------------------------------------------
        // 80x50 mm (Eni 50 mm, Bo'yi 80 mm) VERTIKAL MAKET
        // 3-rasm (namuna) bo'yicha aniq proporsiyalar:
        // Shtrix-kod: Baland (57.0 mm), Keng (44.0 mm)
        // ----------------------------------------------------
        const rawW = activeSettings.barcodeWidthMm || 44.0;
        const effBarWidthMm = (rawW > 0 && rawW < 10) ? rawW * 10 : rawW; // 4.2 yoki 44 mm

        const rawH = activeSettings.barcodeHeightMm || 57.0;
        const effBarHeightMm = (rawH > 0 && rawH < 10) ? rawH * 10 : rawH; // 5.1 yoki 57 mm

        const totalBarWidthPt = effBarWidthMm * MM_TO_PT;
        const barHeightPt = effBarHeightMm * MM_TO_PT;
        const topMarginPt = (activeSettings.marginTopMm || 3.5) * MM_TO_PT;

        // Markazlashtirilgan chap hoshiya: (50 - 44) / 2 = 3.0 mm
        const barLeftPt = activeSettings.marginLeftMm != null && activeSettings.marginLeftMm > 0
          ? activeSettings.marginLeftMm * MM_TO_PT 
          : (pageWidthPt - totalBarWidthPt) / 2;
        const moduleWidthPt = totalBarWidthPt / 156;
        const barBottomPt = pageHeightPt - topMarginPt - barHeightPt;

        // 1. Vertikal shtrix-kod chiziqlarini chizish (156 ta modul)
        let runStart = -1;
        for (let k = 0; k <= binary.length; k++) {
          const isOne = k < binary.length && binary[k] === '1';
          if (isOne && runStart === -1) {
            runStart = k;
          } else if (!isOne && runStart !== -1) {
            const runLength = k - runStart;
            const rectW = runLength * moduleWidthPt;
            const rectX = barLeftPt + (runStart * moduleWidthPt);

            page.drawRectangle({
              x: rectX,
              y: barBottomPt,
              width: rectW,
              height: barHeightPt,
              color: rgb(0, 0, 0)
            });

            runStart = -1;
          }
        }

        // 2. Shtrix-kod tagidagi 20 xonali oraliqli raqamlar: AI "00" + 18 xonali SSCC
        const full20Digits = ('00' + item.sscc).slice(0, 20);
        const digitStepPt = totalBarWidthPt / 20;
        const digitY = barBottomPt - 7.0;

        for (let d = 0; d < full20Digits.length; d++) {
          const char = full20Digits[d];
          const charW = boldFont.widthOfTextAtSize(char, 6.8);
          const charX = barLeftPt + (d * digitStepPt) + (digitStepPt - charW) / 2;

          page.drawText(char, {
            x: charX,
            y: digitY,
            size: 6.8,
            font: boldFont,
            color: rgb(0, 0, 0)
          });
        }

        // 3. Markaziy formatlangan kod: (00)046602509310827968
        const formattedNumber = formatSSCC(item.sscc);
        const numFontSize = 7.4;
        const numTextWidth = regularFont.widthOfTextAtSize(formattedNumber, numFontSize);
        const numX = (pageWidthPt - numTextWidth) / 2;
        const numY = barBottomPt - 18.5;

        page.drawText(formattedNumber, {
          x: numX,
          y: numY,
          size: numFontSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        // 4. Pastki 3 ta ustun: Цвет: | Размер: | Рост:
        // 3-rasmdagi aniq joylashuv
        const headerY = 22.0;
        const valueY = 8.5;

        const headerSize = 6.8;
        const valueSize = 7.6;

        // Ustun 1: Цвет:
        const col1Header = 'Цвет:';
        const col1Value = item.color || '—';
        const col1CenterX = 11.0 * MM_TO_PT;
        const col1HeaderW = regularFont.widthOfTextAtSize(col1Header, headerSize);
        const col1ValueW = boldFont.widthOfTextAtSize(col1Value, valueSize);

        page.drawText(col1Header, {
          x: col1CenterX - (col1HeaderW / 2),
          y: headerY,
          size: headerSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        page.drawText(col1Value, {
          x: col1CenterX - (col1ValueW / 2),
          y: valueY,
          size: valueSize,
          font: boldFont,
          color: rgb(0, 0, 0)
        });

        // Ustun 2: Размер:
        const col2Header = 'Размер:';
        const col2Value = item.size || '—';
        const col2CenterX = pageWidthPt / 2;
        const col2HeaderW = regularFont.widthOfTextAtSize(col2Header, headerSize);
        const col2ValueW = boldFont.widthOfTextAtSize(col2Value, valueSize);

        page.drawText(col2Header, {
          x: col2CenterX - (col2HeaderW / 2),
          y: headerY,
          size: headerSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        page.drawText(col2Value, {
          x: col2CenterX - (col2ValueW / 2),
          y: valueY,
          size: valueSize,
          font: boldFont,
          color: rgb(0, 0, 0)
        });

        // Ustun 3: Рост:
        const col3Header = 'Рост:';
        const col3Value = item.rost || '170-176';
        const col3CenterX = 39.0 * MM_TO_PT;
        const col3HeaderW = regularFont.widthOfTextAtSize(col3Header, headerSize);
        const col3ValueW = boldFont.widthOfTextAtSize(col3Value, valueSize);

        page.drawText(col3Header, {
          x: col3CenterX - (col3HeaderW / 2),
          y: headerY,
          size: headerSize,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        page.drawText(col3Value, {
          x: col3CenterX - (col3ValueW / 2),
          y: valueY,
          size: valueSize,
          font: boldFont,
          color: rgb(0, 0, 0)
        });

      } else {
        // ----------------------------------------------------
        // STANDART 40x58 mm (90° burilgan gorizontal shtrix-kod)
        // ----------------------------------------------------
        const barWidthPt = activeSettings.barcodeWidthMm * MM_TO_PT * scaleX; // gorizontal chiziq eni (33 mm)
        const moduleHeightPt = activeSettings.moduleWidthMm * MM_TO_PT * scaleY; // vertikal modul balandligi (0.27 mm)
        const barLeftPt = activeSettings.marginLeftMm * MM_TO_PT * scaleX; // chapdan (3.5 mm)
        const topStartPt = pageHeightPt - (activeSettings.marginTopMm * MM_TO_PT * scaleY); // yuqoridan (2.5 mm)

        // Ketma-ket 1 larni guruhlab to'rtburchak chizamiz
        let runStart = -1;
        for (let k = 0; k <= binary.length; k++) {
          const isOne = k < binary.length && binary[k] === '1';
          if (isOne && runStart === -1) {
            runStart = k;
          } else if (!isOne && runStart !== -1) {
            const runLength = k - runStart;
            const rectHeight = runLength * moduleHeightPt;
            const rectTop = topStartPt - (runStart * moduleHeightPt);
            const rectY = rectTop - rectHeight;

            page.drawRectangle({
              x: barLeftPt,
              y: rectY,
              width: barWidthPt,
              height: rectHeight,
              color: rgb(0, 0, 0)
            });

            runStart = -1;
          }
        }

        // Matnlar
        const rawColors = (item.color || '')
          .split(/[/,;]/)
          .map(s => s.trim())
          .filter(Boolean);

        const formattedNumber = formatSSCC(item.sscc);

        if (rawColors.length <= 1) {
          // Bitta rang
          const numFontSize = 5.6 * overallScale;
          const numTextWidth = regularFont.widthOfTextAtSize(formattedNumber, numFontSize);
          const numCenterPt = 18.8 * MM_TO_PT * scaleX;
          const numX = numCenterPt - (numTextWidth / 2);
          const numY = 6.6 * MM_TO_PT * scaleY;

          page.drawText(formattedNumber, {
            x: numX,
            y: numY,
            size: numFontSize,
            font: regularFont,
            color: rgb(0, 0, 0)
          });

          const colorText = rawColors[0] || item.color || '';
          const colorFontSize = 6.0 * overallScale;
          const colorX = 6.0 * MM_TO_PT * scaleX;
          const colorY = 3.3 * MM_TO_PT * scaleY;

          if (colorText) {
            page.drawText(colorText, {
              x: colorX,
              y: colorY,
              size: colorFontSize,
              font: boldFont,
              color: rgb(0, 0, 0)
            });
          }

          const sizeText = item.size || '';
          if (sizeText) {
            page.drawText(sizeText, {
              x: 18.0 * MM_TO_PT * scaleX,
              y: 3.3 * MM_TO_PT * scaleY,
              size: colorFontSize,
              font: boldFont,
              color: rgb(0, 0, 0)
            });
          }

        } else {
          // Bir nechta rang
          const lineSpacingMm = 2.6;
          const lineSpacingPt = lineSpacingMm * MM_TO_PT * scaleY;
          const colorCount = rawColors.length;

          const rawColorFontSize = Math.max(4.3, 5.5 - (colorCount - 2) * 0.4);
          const colorFontSize = rawColorFontSize * overallScale;

          const baseColorYMm = 2.2;
          const baseColorYPt = baseColorYMm * MM_TO_PT * scaleY;

          for (let i = 0; i < colorCount; i++) {
            const isLast = (i === colorCount - 1);
            const lineText = rawColors[i] + (isLast ? '.' : ',');
            const lineY = baseColorYPt + (colorCount - 1 - i) * lineSpacingPt;

            const lineWidth = boldFont.widthOfTextAtSize(lineText, colorFontSize);
            const lineCenterX = 11.5 * MM_TO_PT * scaleX;
            const lineX = Math.max(2 * MM_TO_PT * scaleX, lineCenterX - (lineWidth / 2));

            page.drawText(lineText, {
              x: lineX,
              y: lineY,
              size: colorFontSize,
              font: boldFont,
              color: rgb(0, 0, 0)
            });
          }

          const sizeText = item.size || '';
          if (sizeText) {
            const middleY = baseColorYPt + ((colorCount - 1) / 2) * lineSpacingPt;
            page.drawText(sizeText, {
              x: 21.5 * MM_TO_PT * scaleX,
              y: middleY,
              size: colorFontSize * 1.05,
              font: boldFont,
              color: rgb(0, 0, 0)
            });
          }

          const extraPushMm = (colorCount - 1) * lineSpacingMm;
          const numY = (6.6 + extraPushMm * 0.75) * MM_TO_PT * scaleY;
          const numFontSize = 5.4 * overallScale;
          const numTextWidth = regularFont.widthOfTextAtSize(formattedNumber, numFontSize);
          const numCenterPt = 18.8 * MM_TO_PT * scaleX;
          const numX = numCenterPt - (numTextWidth / 2);

          page.drawText(formattedNumber, {
            x: numX,
            y: numY,
            size: numFontSize,
            font: regularFont,
            color: rgb(0, 0, 0)
          });
        }
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Brauzerda generatsiya qilingan PDF faylni yuklab olish
 */
export function downloadPdfBlob(pdfBytes: Uint8Array, filename: string = 'etiketkalar-40x58.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
