/**
 * Chust Textile ERP - Shtrix-kodlar Excel Import va Eksport Moduli (SheetJS)
 * 
 * Kod ustunini sarlavhaga emas, katak mazmuniga (18 yoki 20 xonali SSCC raqamiga) qarab
 * avtomatik aniqlaydi.
 */

import * as XLSX from 'xlsx';
import { BarcodeItem, BarcodeStatus } from './types';
import { cleanSSCCDigits, validateSSCC, tryCorrectSSCC, formatSSCC } from './sscc';

export interface ExcelImportResult {
  items: BarcodeItem[];
  totalRows: number;
  validCodesCount: number;
}

/**
 * Excel fayldan shtrix-kodlarni aqlli import qilish
 */
export async function importBarcodesFromExcel(file: File | ArrayBuffer): Promise<ExcelImportResult> {
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(data, { type: 'array' });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error('Excel faylda bo\'sh yoki sahifa topilmadi');
  }

  // 2D massiv ko'rinishida o'qiymiz
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rows.length === 0) {
    return { items: [], totalRows: 0, validCodesCount: 0 };
  }

  // Sarlavha qatorini tekshirish (ixtiyoriy ustun indekslarini topish)
  let headerRowIndex = 0;
  let colorCol = -1;
  let sizeCol = -1;
  let rostCol = -1;
  let nameCol = -1;
  let notesCol = -1;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r];
    if (Array.isArray(row)) {
      row.forEach((cell, idx) => {
        const text = String(cell || '').toLowerCase().trim();
        if (text.includes('rang') || text.includes('цвет') || text.includes('color')) colorCol = idx;
        if (text.includes('o\'lcham') || text.includes('olcham') || text.includes('размер') || text.includes('size')) sizeCol = idx;
        if (text.includes('rost') || text.includes('рост') || text.includes('bo\'y') || text.includes('height')) rostCol = idx;
        if (text.includes('rasm') || text.includes('nom') || text.includes('файл') || text.includes('name')) nameCol = idx;
        if (text.includes('izoh') || text.includes('примечание') || text.includes('note')) notesCol = idx;
      });
      if (colorCol !== -1 || sizeCol !== -1 || rostCol !== -1) {
        headerRowIndex = r + 1;
        break;
      }
    }
  }

  const items: BarcodeItem[] = [];

  for (let r = headerRowIndex; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    // Spetsifikatsiya bo'yicha: kod ustuni sarlavhaga emas, mazmunga (18 yoki 20 xonali raqamga) qarab topiladi
    let foundCode = '';
    let foundColIdx = -1;

    for (let c = 0; c < row.length; c++) {
      const valStr = String(row[c] || '').trim();
      const clean = cleanSSCCDigits(valStr);

      if (clean.length === 18 || (clean.length === 20 && clean.startsWith('00'))) {
        foundCode = clean.length === 20 ? clean.substring(2) : clean;
        foundColIdx = c;
        break;
      }
      // Agar qavs ichida bo'lsa: (00)046400143805267798
      const match = valStr.match(/(?:00|\(00\))?\s*(\d{17,18})/);
      if (match) {
        foundCode = match[1];
        foundColIdx = c;
        break;
      }
    }

    if (!foundCode) continue;

    // Rang, o'lcham va rostni olish
    let color = colorCol !== -1 && row[colorCol] ? String(row[colorCol]).trim() : '';
    let size = sizeCol !== -1 && row[sizeCol] ? String(row[sizeCol]).trim() : '';
    let rost = rostCol !== -1 && row[rostCol] ? String(row[rostCol]).trim() : '170-176';
    let fileName = nameCol !== -1 && row[nameCol] ? String(row[nameCol]).trim() : `Excel_${r + 1}`;
    let notes = notesCol !== -1 && row[notesCol] ? String(row[notesCol]).trim() : 'Excel orqali import qilindi';

    // Holatni aniqlash
    let status: BarcodeStatus = 'oqilmadi';
    let sscc = foundCode;

    if (validateSSCC(foundCode)) {
      status = 'OK';
    } else {
      const correction = tryCorrectSSCC(foundCode);
      if (correction && correction.wasCorrected) {
        sscc = correction.corrected;
        status = 'tuzatildi';
        notes = `${notes} (${correction.details})`;
      } else {
        status = 'nazorat_mos_emas';
      }
    }

    items.push({
      id: `bc-excel-${Date.now()}-${r}`,
      fileName,
      rawCode: foundCode,
      sscc,
      formattedCode: formatSSCC(sscc),
      color,
      size,
      rost,
      copies: 4,
      status,
      notes,
      createdAt: new Date().toISOString()
    });
  }

  const validCount = items.filter(i => i.status === 'OK' || i.status === 'OCR' || i.status === 'tuzatildi').length;

  return {
    items,
    totalRows: rows.length - headerRowIndex,
    validCodesCount: validCount
  };
}

/**
 * Shtrix-kodlar ro'yxatini Excel (.xlsx) formatida eksport qilish
 */
export function exportBarcodesToExcel(items: BarcodeItem[], filename: string = 'Shtrix_kodlar_Chust_Textile.xlsx') {
  const exportData = items.map((item, idx) => ({
    '№': idx + 1,
    'Rasm / Fayl nomi': item.fileName,
    'Shtrix-kod raqami': item.formattedCode || item.sscc || item.rawCode,
    'Holati': item.status === 'OK' ? 'OK (Aniq o\'qildi)'
            : item.status === 'OCR' ? 'OCR (Yozuvdan o\'qildi)'
            : item.status === 'tuzatildi' ? 'Tuzatildi (Nazorat to\'g\'rilandi)'
            : item.status === 'takror' ? 'Takroriy kod'
            : item.status === 'nazorat_mos_emas' ? 'Nazorat raqami mos emas'
            : 'O\'qilmadi',
    'Rang (Цвет)': item.color || '',
    'O\'lcham (Размер)': item.size || '',
    'Bo\'y (Рост)': item.rost || '',
    'Nusxalar soni': item.copies || 4,
    'Izoh': item.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Ustunlar kengligini chiroyli moslash
  worksheet['!cols'] = [
    { wch: 6 },   // №
    { wch: 24 },  // Rasm nomi
    { wch: 30 },  // Shtrix-kod
    { wch: 32 },  // Holati
    { wch: 22 },  // Rang
    { wch: 14 },  // O'lcham
    { wch: 14 },  // Rost
    { wch: 14 },  // Nusxa
    { wch: 35 }   // Izoh
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Etiketkalar');
  XLSX.writeFile(workbook, filename);
}
