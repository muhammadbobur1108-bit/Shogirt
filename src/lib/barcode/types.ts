/**
 * Chust Textile ERP - Shtrix-kod va Etiketkalar moduli turlari
 */

export type BarcodeStatus = 
  | 'OK'                // Barkod o'quvchi to'g'ri o'qidi va nazorat raqami to'g'ri
  | 'OCR'               // Matn qismidan (OCR) o'qildi va nazorat raqami to'g'ri
  | 'tuzatildi'         // OCR xatosi bitta raqam almashtirish orqali to'g'rilandi
  | 'nazorat_mos_emas'  // Raqam o'qildi, lekin SSCC nazorat raqami mos kelmadi
  | 'oqilmadi'          // Rasmda shtrix-kod yoki raqam aniqlanmadi
  | 'takror';           // Ushbu shtrix-kod ro'yxatda takrorlangan

export interface BarcodeItem {
  id: string;
  fileName: string;
  imageUrl?: string;        // Blob yoki Data URL (prevyu uchun)
  rawCode: string;          // O'qilgan xom raqam
  sscc: string;             // 18 xonali toza SSCC raqam (046400143805267798)
  formattedCode: string;    // (00)046400143805267798
  color: string;            // Rang nomi (masalan: "Белый" yoki "Зеленый")
  size: string;             // O'lcham (masalan: "104" yoki "XL")
  rost?: string;            // Bo'y / Rost (masalan: "170-176")
  copies: number;           // Chop etiladigan nusxalar soni (standart: 4)
  status: BarcodeStatus;    // Qator holati
  notes?: string;           // Izoh yoki o'qish detali
  createdAt: string;
}

export type LabelFormatType = '40x58' | '80x50';

export interface LabelDimensions {
  widthMm: number;          // Masalan: 50 yoki 40 mm
  heightMm: number;         // Masalan: 80 yoki 58 mm
  barcodeWidthMm?: number;  // Shtrix-kod eni (masalan: 42.0 mm / 4.2 sm)
  barcodeHeightMm?: number; // Shtrix-kod bo'yi (masalan: 51.0 mm / 5.1 sm)
  marginTopMm?: number;     // Yuqori hoshiya (3.5 mm)
  marginLeftMm?: number;    // Chap hoshiya (4.0 mm)
}

export interface LabelSettings {
  formatType: LabelFormatType; // '40x58' (gorizontal 90°) yoki '80x50' (vertikal 50x80)
  widthMm: number;          // 40 yoki 50 mm
  heightMm: number;         // 58 yoki 80 mm
  defaultCopies: number;    // Standart: 4 nusxa
  barcodeWidthMm: number;   // Standart: 33 mm (40x58) yoki 42 mm (80x50)
  barcodeHeightMm: number;  // Standart: 42.1 mm (40x58) yoki 51 mm (80x50)
  moduleWidthMm: number;    // Standart: 0.27 mm
  marginTopMm: number;      // Standart: 2.5 mm yoki 3.5 mm
  marginLeftMm: number;     // Standart: 3.5 mm yoki 4.0 mm
  autoCorrectOcr: boolean;  // OCR xatolarini avto-tuzatish
  runParallelOcr: boolean;  // Har doim ikkala usulni parallel ishlatish
}

export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  formatType: '40x58',
  widthMm: 40,
  heightMm: 58,
  defaultCopies: 4,
  barcodeWidthMm: 33,
  barcodeHeightMm: 42.1,
  moduleWidthMm: 0.27,
  marginTopMm: 2.5,
  marginLeftMm: 3.5,
  autoCorrectOcr: true,
  runParallelOcr: true
};

export interface ApiSettings {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  syncOnLoad: boolean;
  lastSync?: string;
}

export const DEFAULT_API_SETTINGS: ApiSettings = {
  enabled: false,
  apiUrl: '',
  apiKey: '',
  syncOnLoad: false
};

export const SETTINGS_80x50: LabelSettings = {
  formatType: '80x50',
  widthMm: 50,
  heightMm: 80,
  defaultCopies: 4,
  barcodeWidthMm: 44.0,   // 3-rasm bo'yicha: Eniga 44.0 mm
  barcodeHeightMm: 57.0,  // 3-rasm bo'yicha: Bo'yiga 57.0 mm (baland shtrix-kod)
  moduleWidthMm: 44.0 / 156, // ~0.282 mm
  marginTopMm: 3.5,
  marginLeftMm: 3.0,      // (50 - 44) / 2 = 3.0 mm markazlashtirilgan
  autoCorrectOcr: true,
  runParallelOcr: true
};


