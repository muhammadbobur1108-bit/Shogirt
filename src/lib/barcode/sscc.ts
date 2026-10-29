/**
 * Chust Textile ERP - GS1 SSCC (Serial Shipping Container Code) Modulo 10
 * Nazorat raqamini hisoblash, tekshirish va OCR xatolarini tuzatish algoritmi.
 */

/**
 * 17 xonali raqamlar qatori uchun GS1 Modulo 10 nazorat raqamini hisoblaydi.
 * Qoida: oxirgi (o'ngdagi) raqamdan chapga qarab 3, 1, 3, 1... og'irliklar ko'paytiriladi.
 */
export function calculateSSCCCheckDigit(digits17: string): number {
  if (digits17.length !== 17) {
    throw new Error(`SSCC nazorat raqamini hisoblash uchun 17 ta raqam kerak, berildi: ${digits17.length}`);
  }

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const digit = parseInt(digits17[16 - i], 10);
    const weight = (i % 2 === 0) ? 3 : 1;
    sum += digit * weight;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * 18 xonali (yoki (00) / 00 bilan boshlangan 20 xonali) SSCC raqamini tekshiradi.
 */
export function validateSSCC(input: string): boolean {
  const digits = cleanSSCCDigits(input);
  if (digits.length !== 18) return false;

  const body17 = digits.slice(0, 17);
  const checkDigit = parseInt(digits[17], 10);

  return calculateSSCCCheckDigit(body17) === checkDigit;
}

/**
 * Har qanday yozuvdan toza 18 xonali SSCC raqamini ajratib oladi.
 * Agar 20 xonali bo'lib "00" bilan boshlansa, "00" olib tashlanadi.
 */
export function cleanSSCCDigits(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.length === 20 && digits.startsWith('00')) {
    return digits.substring(2);
  }
  return digits;
}

/**
 * 18 xonali SSCC raqamini inson o'qiydigan standart GS1 ko'rinishiga keltiradi:
 * Masalan: "046400143805267798" -> "(00)046400143805267798"
 */
export function formatSSCC(sscc: string): string {
  const clean = cleanSSCCDigits(sscc);
  if (clean.length === 18) {
    return `(00)${clean}`;
  }
  return sscc;
}

/**
 * OCR da eng ko'p adashadigan raqamlar guruhlari.
 * Faqat ushbu guruhlar ichidan almashtirish qilinadi:
 * 0 ↔ 6 ↔ 8, 1 ↔ 7, 3 ↔ 8, 5 ↔ 6, 2 ↔ 7, 4 ↔ 9
 */
const CONFUSION_GROUPS: string[][] = [
  ['0', '6', '8'],
  ['1', '7'],
  ['3', '8'],
  ['5', '6'],
  ['2', '7'],
  ['4', '9']
];

export interface CorrectionResult {
  corrected: string;
  wasCorrected: boolean;
  original: string;
  details?: string;
}

/**
 * OCR natijasida o'qilgan raqamni tekshiradi.
 * Agar nazorat raqami to'g'ri bo'lsa - o'zini qaytaradi.
 * Agar noto'g'ri bo'lsa, OCR adashadigan juftliklar orasidan bitta raqamni almashtirib ko'radi.
 * Agar YAGONA to'g'ri variant topilsa - qabul qiladi va "tuzatildi" deb qaytaradi.
 */
export function tryCorrectSSCC(rawInput: string): CorrectionResult | null {
  const clean = cleanSSCCDigits(rawInput);

  // 1. Agar 18 xonali va allaqachon to'g'ri bo'lsa
  if (clean.length === 18 && validateSSCC(clean)) {
    return {
      corrected: clean,
      wasCorrected: false,
      original: clean
    };
  }

  // 2. Agar 17 xonali bo'lsa (oxirgi nazorat raqami o'qilmay qolgan bo'lsa)
  if (clean.length === 17) {
    const check = calculateSSCCCheckDigit(clean);
    const completed = clean + check.toString();
    return {
      corrected: completed,
      wasCorrected: true,
      original: clean,
      details: `17 xonali kodga hisoblangan nazorat raqami (${check}) qo'shildi`
    };
  }

  // 3. Agar 18 xonali bo'lsa, lekin nazorat raqami xato bo'lsa: bitta raqam almashtirish sinovi
  if (clean.length === 18) {
    const validCandidates: { candidate: string; position: number; from: string; to: string }[] = [];

    const chars = clean.split('');

    for (let pos = 0; pos < 18; pos++) {
      const originalChar = chars[pos];
      
      // Ushbu raqam qaysi chalkashish guruhlarida borligini topamiz
      const matchingGroups = CONFUSION_GROUPS.filter(g => g.includes(originalChar));
      const possibleSubstitutes = new Set<string>();

      for (const group of matchingGroups) {
        for (const ch of group) {
          if (ch !== originalChar) {
            possibleSubstitutes.add(ch);
          }
        }
      }

      for (const substitute of possibleSubstitutes) {
        const candidateChars = [...chars];
        candidateChars[pos] = substitute;
        const candidateStr = candidateChars.join('');

        if (validateSSCC(candidateStr)) {
          // Takrorlanmaslik uchun tekshiramiz
          if (!validCandidates.some(c => c.candidate === candidateStr)) {
            validCandidates.push({
              candidate: candidateStr,
              position: pos,
              from: originalChar,
              to: substitute
            });
          }
        }
      }
    }

    // Qoida: Faqat va faqat YAGONA to'g'ri almashtirish mavjud bo'lsa qabul qilinadi
    if (validCandidates.length === 1) {
      const hit = validCandidates[0];
      return {
        corrected: hit.candidate,
        wasCorrected: true,
        original: clean,
        details: `${hit.position + 1}-o'rindagi '${hit.from}' raqami '${hit.to}' ga to'g'rilandi`
      };
    }
  }

  return null;
}
