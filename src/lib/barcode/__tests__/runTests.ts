/**
 * Chust Textile ERP - Shtrix-kod va PDF Unit Testlari
 * 
 * Ushbu test quyidagilarni tekshiradi:
 * 1. Code 128 kodlovchi 00046400143805267798 uchun aniq 156 ta modul hosil qilishi
 * 2. GS1 SSCC Modulo 10 nazorat raqami to'g'ri hisoblanishi va tekshirilishi
 * 3. OCR chalkashadigan raqamlarini avto-tuzatish (Heuristic correction)
 * 4. 40x58 mm PDF generatsiyasi va uning to'g'riligi
 */

import { encodeGS1_128_SSCC } from '../code128';
import { calculateSSCCCheckDigit, validateSSCC, tryCorrectSSCC } from '../sscc';
import { generateLabelsPdf } from '../pdfGenerator';
import { BarcodeItem, DEFAULT_LABEL_SETTINGS, SETTINGS_80x50 } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('=== 1. CODE 128 (GS1-128 SSCC) KODLOVCHI TESTI ===');
  
  // Test 1: 00046400143805267798 uchun modullar soni va naqsh
  const testInput = '00046400143805267798';
  const encoded = encodeGS1_128_SSCC(testInput);

  assert(encoded.totalModules === 156, `Jami modullar soni 156 ta bo'lishi kerak (haqiqiy: ${encoded.totalModules})`);
  assert(encoded.symbols[0] === 105, `Boshlang'ich belgi Start C (105) bo'lishi kerak (haqiqiy: ${encoded.symbols[0]})`);
  assert(encoded.symbols[1] === 102, `Ikkinchi belgi FNC1 (102) bo'lishi kerak (haqiqiy: ${encoded.symbols[1]})`);
  assert(encoded.symbols[encoded.symbols.length - 1] === 106, `Oxirgi belgi Stop (106) bo'lishi kerak`);
  assert(encoded.checksum === 63, `Modulo 103 checksum 63 bo'lishi kerak (haqiqiy: ${encoded.checksum})`);
  assert(encoded.binaryModules.length === 156, `Binary modullar qatori uzunligi 156 ta belgi bo'lishi kerak`);

  console.log('\n=== 2. GS1 SSCC MODULO 10 NAZORAT RAQAMI TESTI ===');
  
  // Test 2: SSCC 17 xonali qismidan 18-nazorat raqamini hisoblash
  const sscc17 = '04640014380526779';
  const expectedCheckDigit = 8;
  const calculatedCheck = calculateSSCCCheckDigit(sscc17);
  assert(calculatedCheck === expectedCheckDigit, `'${sscc17}' uchun nazorat raqami ${expectedCheckDigit} bo'lishi kerak (haqiqiy: ${calculatedCheck})`);

  // To'liq 18 xonali kod validatsiyasi
  assert(validateSSCC('046400143805267798') === true, `'046400143805267798' validatsiya qilinishi kerak`);
  assert(validateSSCC('(00)046400143805267798') === true, `'(00)046400143805267798' validatsiya qilinishi kerak`);
  assert(validateSSCC('046400143805267795') === false, `Noto'g'ri nazorat raqami bilan kod rad etilishi kerak`);

  console.log('\n=== 3. OCR XATOLARINI AVTO-TUZATISH TESTI ===');
  
  // Test 3: OCR '6' ni '5' deb o'qigan holat: pos 2 da 5 -> 6
  const ocrMistake = '045400143805267798';
  const corrected = tryCorrectSSCC(ocrMistake);
  assert(corrected !== null && corrected.wasCorrected === true, `OCR xatosi tuzatilishi kerak`);
  assert(corrected?.corrected === '046400143805267798', `Tuzatilgan kod '046400143805267798' bo'lishi kerak (haqiqiy: ${corrected?.corrected})`);

  // Test 3b: 17 xonali kod (oxirgi nazorat raqami tushib qolgan)
  const missing17 = '04640014380526779';
  const corrected17 = tryCorrectSSCC(missing17);
  assert(corrected17 !== null && corrected17.corrected === '046400143805267798', `17 xonali kodga hisoblangan nazorat raqami qo'shilishi kerak`);

  console.log('\n=== 4. 40x58 MM VA 80x50 MM VEKTOR PDF GENERATORI TESTLARI ===');
  
  const testItems: BarcodeItem[] = [
    {
      id: 'test-1',
      fileName: 'test_label.jpg',
      rawCode: '046400143805267798',
      sscc: '046400143805267798',
      formattedCode: '(00)046400143805267798',
      color: 'Серый агат / Черный / Лавровый венок',
      size: 'XL',
      rost: '170-176',
      copies: 2,
      status: 'OK',
      createdAt: new Date().toISOString()
    },
    {
      id: 'test-photo-match',
      fileName: 'image_ce40541a.png',
      rawCode: '046602509310827968',
      sscc: '046602509310827968',
      formattedCode: '(00)046602509310827968',
      color: 'Зеленый',
      size: '104',
      rost: '170-176',
      copies: 4,
      status: 'OK',
      createdAt: new Date().toISOString()
    }
  ];

  // 40x58 mm sinovi
  const pdfBytes40x58 = await generateLabelsPdf(testItems, DEFAULT_LABEL_SETTINGS);
  assert(pdfBytes40x58 && pdfBytes40x58.length > 500, `40x58 mm PDF fayl muvaffaqiyatli generatsiya qilindi (hajmi: ${pdfBytes40x58.length} bayt)`);

  // 80x50 mm (Vertikal 3-rasm bo'yicha) sinovi
  assert(SETTINGS_80x50.barcodeWidthMm === 44.0, `80x50 shtrix-kod eni 44.0 mm bo'lishi kerak`);
  assert(SETTINGS_80x50.barcodeHeightMm === 57.0, `80x50 shtrix-kod bo'yi 57.0 mm (baland) bo'lishi kerak`);

  const pdfBytes80x50 = await generateLabelsPdf(testItems, SETTINGS_80x50);
  assert(pdfBytes80x50 && pdfBytes80x50.length > 500, `80x50 mm (Vertikal 44x57mm 3-rasm) PDF fayl muvaffaqiyatli generatsiya qilindi (hajmi: ${pdfBytes80x50.length} bayt)`);

  // 80x50 mm - 4.2 mm x 5.1 mm kabi kiritilgan o'lchamlar sinovi
  const pdfBytesWith4_2 = await generateLabelsPdf(testItems, SETTINGS_80x50, {
    widthMm: 80,
    heightMm: 50,
    barcodeWidthMm: 4.2,
    barcodeHeightMm: 5.1
  });
  assert(pdfBytesWith4_2 && pdfBytesWith4_2.length > 500, `80x50 mm (4.2 mm x 5.1 mm transformatsiyasi) PDF fayl muvaffaqiyatli generatsiya qilindi (hajmi: ${pdfBytesWith4_2.length} bayt)`);

  console.log('\n=======================================');
  console.log(`TEST NATIJALARI: Jami ${passed + failed} ta test, O'tdi: ${passed}, Xato: ${failed}`);
  console.log('=======================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Testlarni bajarishda kutilmagan xato:', err);
  process.exit(1);
});
