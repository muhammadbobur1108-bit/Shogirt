/**
 * Chust Textile ERP - Code 128 va GS1-128 (SSCC) Kodlovchi Modul
 * 
 * Ushbu algoritm Python prototipidagi (_PAT va GS1-128 Start C) mantiqni
 * 100% aynan TypeScript'ga ko'chiradi.
 */

// 107 ta standart Code 128 naqshlari (0 - 106)
export const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

export interface Code128Encoded {
  symbols: number[];         // Har bir belgining Code 128 indeksi [105, 102, ...]
  patterns: string[];        // Har bir belgining kenglik naqshi ["211232", ...]
  binaryModules: string;     // 156 ta '1' va '0' lardan iborat modul qatori
  totalModules: number;      // Aniq 156 ta modul
  checksum: number;          // Modulo 103 tekshirish qiymati
}

/**
 * Naqsh qatorini ("211232") 1 va 0 lar ko'rinishidagi binary modullarga aylantiradi.
 * Toq indekslar - chiziqlar (1), juft indekslar - bo'shliqlar (0).
 */
export function patternToBinary(pattern: string): string {
  let result = '';
  for (let i = 0; i < pattern.length; i++) {
    const width = parseInt(pattern[i], 10);
    const isBar = i % 2 === 0;
    result += (isBar ? '1' : '0').repeat(width);
  }
  return result;
}

/**
 * 18 xonali SSCC raqamini (yoki 20 xonali AI 00 bilan) GS1-128 Code Set C bo'yicha kodlaydi.
 * 
 * Kodlash tartibi:
 * 1. Start C (105)
 * 2. FNC1 (102) - GS1 standarti belgisi
 * 3. AI "00" + 18 xonali SSCC = 20 ta raqam -> 10 ta raqam juftligi (Code Set C)
 * 4. Nazorat summasi: (105 + 1*102 + 2*P1 + 3*P2 + ... + 11*P10) mod 103
 * 5. Stop (106)
 * 
 * Jami uzunlik: 11 + 11 + 110 + 11 + 13 = 156 modul.
 */
export function encodeGS1_128_SSCC(ssccInput: string): Code128Encoded {
  // Faqat raqamlarni ajratib olish
  const cleanDigits = ssccInput.replace(/\D/g, '');
  
  // 18 xonali bo'lsa "00" prefiksini qo'shamiz, 20 xonali bo'lsa tekshiramiz
  let fullDigits = cleanDigits;
  if (cleanDigits.length === 18) {
    fullDigits = '00' + cleanDigits;
  } else if (cleanDigits.length === 20 && cleanDigits.startsWith('00')) {
    fullDigits = cleanDigits;
  } else {
    throw new Error(`SSCC raqami 18 xonali yoki 00 bilan boshlangan 20 xonali bo'lishi kerak. Kiritilgan: "${ssccInput}" (${cleanDigits.length} ta raqam)`);
  }

  const symbols: number[] = [];
  const patterns: string[] = [];

  // 1. Start C
  const startC = 105;
  symbols.push(startC);
  patterns.push(CODE128_PATTERNS[startC]);

  // 2. FNC1
  const fnc1 = 102;
  symbols.push(fnc1);
  patterns.push(CODE128_PATTERNS[fnc1]);

  // 3. 10 ta raqam juftligi
  let checksumSum = startC + (1 * fnc1); // i=1 FNC1 uchun

  for (let pairIndex = 0; pairIndex < 10; pairIndex++) {
    const pairStr = fullDigits.substring(pairIndex * 2, pairIndex * 2 + 2);
    const pairValue = parseInt(pairStr, 10);
    
    symbols.push(pairValue);
    patterns.push(CODE128_PATTERNS[pairValue]);

    // Og'irlik: FNC1 1-pozitsiyada, juftliklar 2..11 pozitsiyalarda
    const weight = pairIndex + 2;
    checksumSum += weight * pairValue;
  }

  // 4. Checksum Modulo 103
  const checksum = checksumSum % 103;
  symbols.push(checksum);
  patterns.push(CODE128_PATTERNS[checksum]);

  // 5. Stop (106)
  const stop = 106;
  symbols.push(stop);
  patterns.push(CODE128_PATTERNS[stop]);

  // Barcha naqshlarni 1 va 0 larga aylantirish
  let binaryModules = '';
  for (const pat of patterns) {
    binaryModules += patternToBinary(pat);
  }

  return {
    symbols,
    patterns,
    binaryModules,
    totalModules: binaryModules.length,
    checksum
  };
}
