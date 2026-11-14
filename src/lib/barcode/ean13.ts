/**
 * Chust Textile ERP - CorelDRAW uslubidagi EAN-13 va Shtrix-kod Vektor Generator
 * 
 * Standart EAN-13 (ISO/IEC 15420) xalqaro standarti va 1-rasm talablari:
 * - 13 ta raqam (masalan: 4 620336 807300, 4 620336 842646)
 * - 1-raqam (masalan: 4) himoya chiziqlaridan tashqarida, chap "Quiet Zone" maydonida turadi
 * - Chap 6 ta raqam (masalan: 620336) chap modul bloklari ostida
 * - O'ng 6 ta raqam (masalan: 807300) o'ng modul bloklari ostida
 * - Chekka (Start/End) va o'rta (Center) himoya chiziqlari (Guard bars) pastga uzayib, raqamlar zonasiga tushadi
 * - O'ng tomonda EAC muvofiqlik belgisi
 */

// L-kod (Left Hand Odd Parity): 7 modulli naqshlar
const L_PATTERNS = [
  "0001101", // 0
  "0011001", // 1
  "0010011", // 2
  "0111101", // 3
  "0100011", // 4
  "0110001", // 5
  "0101111", // 6
  "0111011", // 7
  "0110111", // 8
  "0001011"  // 9
];

// G-kod (Left Hand Even Parity): 7 modulli naqshlar
const G_PATTERNS = [
  "0100111", // 0
  "0110011", // 1
  "0011011", // 2
  "0100001", // 3
  "0011101", // 4
  "0111001", // 5
  "0000101", // 6
  "0010001", // 7
  "0001001", // 8
  "0010111"  // 9
];

// R-kod (Right Hand Even Parity): 7 modulli naqshlar
const R_PATTERNS = [
  "1110010", // 0
  "1100110", // 1
  "1101100", // 2
  "1000010", // 3
  "1011100", // 4
  "1001110", // 5
  "1010000", // 6
  "1000100", // 7
  "1001000", // 8
  "1110100"  // 9
];

// 1-raqamga qarab chap 6 ta raqamning L va G kombinatsiyasi
const FIRST_DIGIT_STRUCTURE = [
  "LLLLLL", // 0
  "LLGLGG", // 1
  "LLGGLG", // 2
  "LLGGGL", // 3
  "LGLLGG", // 4
  "LGGLLG", // 5
  "LGGGLL", // 6
  "LGLGLG", // 7
  "LGLGGL", // 8
  "LGGLGL"  // 9
];

/**
 * 12 ta raqamdan 13-tekshiruv raqamini hisoblaydi (Modulo 10)
 */
export function calculateEan13CheckDigit(twelveDigits: string): number {
  const digits = twelveDigits.replace(/\D/g, '').slice(0, 12);
  if (digits.length < 12) return 0;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = parseInt(digits[i], 10);
    // Toq o'rindagi (1-dan boshlab) raqamlar * 1, juft o'rindagilar * 3
    sum += (i % 2 === 0) ? n : n * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Kiritilgan kodni 13 xonali to'liq EAN-13 kodga aylantiradi
 */
export function formatToValidEan13(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 13) {
    return digits;
  }
  if (digits.length === 12) {
    return digits + calculateEan13CheckDigit(digits);
  }
  if (digits.length < 12) {
    const padded = digits.padStart(12, '0');
    return padded + calculateEan13CheckDigit(padded);
  }
  return digits.slice(0, 13);
}

export interface Ean13Bar {
  x: number;
  width: number;
  height: number;
  isGuard: boolean;
}

export interface Ean13Digit {
  char: string;
  x: number;
  y: number;
  role: 'first' | 'left' | 'right';
}

export interface Ean13RenderData {
  bars: Ean13Bar[];
  totalWidth: number;
  totalHeight: number;
  firstDigit: string;
  leftDigits: string;
  rightDigits: string;
  checkDigit: string;
  isValid: boolean;
  leftNotchStartX: number;
  leftNotchEndX: number;
  rightNotchStartX: number;
  rightNotchEndX: number;
  guardBottomY: number;
  dataBottomY: number;
  digitsList: Ean13Digit[];
}

/**
 * CorelDRAW uslubidagi EAN-13 vektor chiziqlari va joylashuvlarini hisoblaydi
 * 1-rasm talablariga 100% mos:
 * - Ma'lumot chiziqlari (data bars) balandligi: ~50-52px
 * - Himoya chiziqlari (guard bars) pastga uzaygan: +6px
 * - Har bir raqam o'zining 7 modulli bloki ostida markazlashgan
 * - 1-raqam chapda start guarddan tashqarida
 */
export function generateEan13VectorData(
  code: string,
  options: {
    moduleWidth?: number;       // Bir modul eni (px, default 1.8)
    height?: number;            // Asosiy ma'lumot chiziqlari balandligi (px, default 52)
    guardExtraHeight?: number;  // Himoya chiziqlarining pastga cho'zilishi (px, default 6)
    leftQuietZoneModules?: number; // 1-raqam sig'ishi uchun chap bo'shliq (default 8)
    rightQuietZoneModules?: number; // O'ng bo'shliq (default 4)
  } = {}
): Ean13RenderData {
  const cleanCode = formatToValidEan13(code || "4620336807300");
  const moduleW = options.moduleWidth || 1.8;
  const dataBarHeight = options.height || 52;
  const guardExtra = options.guardExtraHeight ?? 6;
  const leftQuiet = options.leftQuietZoneModules ?? 8;
  const rightQuiet = options.rightQuietZoneModules ?? 4;

  const firstDigit = parseInt(cleanCode[0], 10) || 0;
  const structure = FIRST_DIGIT_STRUCTURE[firstDigit] || "LLLLLL";

  const bars: Ean13Bar[] = [];
  let currentX = leftQuiet * moduleW;

  const addModules = (moduleStr: string, isGuard: boolean) => {
    let i = 0;
    while (i < moduleStr.length) {
      if (moduleStr[i] === '1') {
        let count = 0;
        while (i < moduleStr.length && moduleStr[i] === '1') {
          count++;
          i++;
        }
        bars.push({
          x: currentX,
          width: count * moduleW,
          height: isGuard ? dataBarHeight + guardExtra : dataBarHeight,
          isGuard
        });
        currentX += count * moduleW;
      } else {
        let count = 0;
        while (i < moduleStr.length && moduleStr[i] === '0') {
          count++;
          i++;
        }
        currentX += count * moduleW;
      }
    }
  };

  // 1. Start Guard: 101 (3 modul)
  const startGuardX = currentX;
  addModules("101", true);
  const leftNotchStartX = currentX;

  // 2. Chap 6 ta raqam (42 modul = 6 * 7 modul)
  for (let i = 1; i <= 6; i++) {
    const digit = parseInt(cleanCode[i], 10) || 0;
    const isL = structure[i - 1] === 'L';
    const pattern = isL ? L_PATTERNS[digit] : G_PATTERNS[digit];
    addModules(pattern, false);
  }
  const leftNotchEndX = currentX;

  // 3. Center Guard: 01010 (5 modul)
  addModules("01010", true);
  const rightNotchStartX = currentX;

  // 4. O'ng 6 ta raqam (42 modul = 6 * 7 modul)
  for (let i = 7; i <= 12; i++) {
    const digit = parseInt(cleanCode[i], 10) || 0;
    const pattern = R_PATTERNS[digit];
    addModules(pattern, false);
  }
  const rightNotchEndX = currentX;

  // 5. End Guard: 101 (3 modul)
  addModules("101", true);

  const totalWidth = currentX + (rightQuiet * moduleW);
  const guardBottomY = dataBarHeight + guardExtra;
  const digitY = guardBottomY + 7;

  // Har bir raqamni aniq CorelDRAW va 1-rasm koordinatalari bilan joylashtirish
  const digitsList: Ean13Digit[] = [];

  // 1-raqam chap tomonda (Start guard tashqarisida)
  digitsList.push({
    char: cleanCode[0],
    x: startGuardX - 4.5 * moduleW,
    y: digitY,
    role: 'first'
  });

  // Chap 6 ta raqam (Har biri o'zining 7 modulli bloki markazida)
  for (let i = 0; i < 6; i++) {
    digitsList.push({
      char: cleanCode[i + 1],
      x: leftNotchStartX + (i * 7 + 3.5) * moduleW,
      y: digitY,
      role: 'left'
    });
  }

  // O'ng 6 ta raqam (Har biri o'zining 7 modulli bloki markazida)
  for (let i = 0; i < 6; i++) {
    digitsList.push({
      char: cleanCode[i + 7],
      x: rightNotchStartX + (i * 7 + 3.5) * moduleW,
      y: digitY,
      role: 'right'
    });
  }

  return {
    bars,
    totalWidth,
    totalHeight: guardBottomY + 12,
    firstDigit: cleanCode[0],
    leftDigits: cleanCode.slice(1, 7),
    rightDigits: cleanCode.slice(7, 13),
    checkDigit: cleanCode[12],
    isValid: cleanCode.length === 13,
    leftNotchStartX,
    leftNotchEndX,
    rightNotchStartX,
    rightNotchEndX,
    guardBottomY,
    dataBottomY: dataBarHeight,
    digitsList
  };
}
