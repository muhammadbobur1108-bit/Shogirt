# Etiketkalar / Shtrix-kod (GS1-128 / SSCC) Moduli

Chust Textile ERP tizimiga to'liq mijoz (brauzer) tomonida ishlaydigan, 40x58 mm o'lchamli GS1-128 (Code 128 / SSCC) etiketkalarini yaratish, shtrix-kod rasmlarini o'qish, tahrirlash va PDF shaklida chop etish modulini joriy qilish.

## Foydalanuvchi Tasdiqlagan Qarorlar (User Review & Confirmed Choices)

> [!IMPORTANT] 
> Foydalanuvchi bilan quyidagi asosiy arxitektura qarorlari kelishib olindi:
> - **Joylashuvi:** ERP asosiy chap menyusida alohida «Shtrix-kod / Etiketkalar» bo'limi sifatida ochiladi.
> - **Bog'liqlik:** Modul to'liq mustaqil (avtonom) ishlaydi, tashqi buyurtmalarga qat'iy bog'lanmaydi.
> - **PDF Dvigateli:** `pdf-lib` va `@pdf-lib/fontkit` orqali to'liq vektorli shtrix-kod to'rtburchaklari va Kirill shrifti (Liberation Sans / Arimo) bilan generatsiya qilinadi.
> - **O'qish Tartibi:** Shtrix-kod rasmlari yuklanganda ZXing (barkod dekoder) va Tesseract.js (matn OCR) parallel ishlatilib, SSCC nazorat raqami bilan tekshiriladi va xatolar tuzatiladi.

---

## 1. Modulning Vazifasi va Imkoniyatlari

1. **Kirish Ma'lumotlari:**
   - Shtrix-kod rasmlari (Drag & Drop, Fayl tanlash, yoki `Ctrl+V` buferidan nusxalash — `Win+Shift+S` skrinshotlari).
   - Excel fayl orqali import (ustun nomiga emas, 18-20 xonali raqam mazmuniga qarab avtomatik aniqlanadi).
   - Qo'lda jadvalga yangi qator kiritish.
2. **Qayta Ishlash va Validatsiya:**
   - ZXing-wasm / Browser barcod dekodlash (0°, 90°, 180°, 270° burish va 2x/3x kattalashtirish bilan).
   - Parallel OCR fallback (Tesseract.js, raqamlar va qavslar oq ro'yxati, pastki qismni kesish, bir necha masshtabda ovoz berish).
   - GS1 Modulo 10 (SSCC) nazorat raqamini tekshirish.
   - Bitta raqam xato bo'lsa, OCR chalkashadigan juftliklar (0/6/8, 1/7, 3/8, 5/6, 2/7...) orasidan yagona to'g'rilovchi variantni topib, «tuzatildi» deb belgilash.
3. **Interaktiv Tahrirlash:**
   - Rang va O'lcham maydonlarini to'ldirish.
   - Barcha qatorlarga bir vaqtda Rang/O'lcham qo'llash (ommaviy to'ldirish).
   - Nusxa sonini belgilash (standart: 4 nusxa).
   - Qator holatlari rangli ko'rinadi: Yashil (OK), Moviy (OCR), Binafsha (Tuzatildi), Sariq (Takror), Qizil (O'qilmadi / Nazorat raqami noto'g'ri).
4. **Chiqarish va Chop Etish:**
   - 40x58 mm (yoki foydalanuvchi tanlagan o'lchamda) har bir sahifaga 1 ta vertikal etiketka.
   - Shtrix-kod 90° burilgan: 156 ta modul, modul eni 0.27 mm (~42.1 mm), chiziq balandligi 33 mm.
   - Matnlar: Kirillcha rang nomlari (bitta yoki ko'p qatorli vergul/nuqta bilan), o'lcham, va `(00)...` inson o'qiydigan raqam.
   - Excel eksport (barcha qatorlar va holatlar bilan).

---

## 2. Foydalanuvchi Tajribasi va Dizayn (UX / UI)

- **ERP Uslubiga Moslik:** Mavjud Chust Textile ERP'ning to'q ko'k/slate (`bg-slate-950`, `bg-slate-900`) va oq yorug'lik rejimiga moslashuvchan dizayn.
- **Top Bar & Dashboard Boshqaruvi:**
  - Yuqori qatorda: Yuklash zonasi (Drag & Drop + Ctrl+V indikatori), Jarayon indikatori (0-100% progress va qolgan vaqt), Jami kodlar, To'g'ri kodlar va Xatoliklar statistikasi.
  - Ommaviy harakatlar: "Hammasiga Rang qo'llash", "Hammasiga O'lcham qo'llash", "Nusxalar soni", "Excel Import", "Excel Eksport", "PDF Yaratish (N nusxa)".
- **Jadval Ko'rinishi:**
  - Ustunlar: `№`, `Rasm ko'rinishi`, `Shtrix-kod raqami`, `Holat`, `Rang`, `O'lcham`, `Nusxa`, `Amallar`.
  - Qator ustida to'g'ridan-to'g'ri tahrirlash imkoniyati (`input`lar orqali).
  - Rasmni bosganda kattalashtirilgan modalda ko'rish.
- **Etiketka Jonli Prevyusi (Live Preview):**
  - Tanlangan etiketkaning 40x58 mm o'lchamdagi haqiqiy vektor ko'rinishini ekranda jonli ko'rsatish (SVG / Canvas).

---

## 3. Texnik Arxitektura va Modul Tuzilishi

### Tizim Diagrammasi

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CHUST TEXTILE ERP UI                            │
│  [Asosiy Menyu: Shtrix-kod / Etiketkalar]                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    BarcodeLabelsView (React Komponent)                 │
│  - Drag & Drop / Ctrl+V Paste Listener                                 │
│  - Progress Bar (0-100% + ETA)                                         │
│  - Editable Table + Batch Actions                                      │
│  - Live Label Preview (40x58 mm)                                       │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
                    ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       BarcodeReaderEngine            │  │     LabelPdfGenerator        │
│  - ZXing (Code 128 / Multi-angle)    │  │  - pdf-lib + fontkit         │
│  - Tesseract.js (Parallel OCR)       │  │  - Cyrillic TTF (Arimo font) │
│  - GS1 / SSCC Mod 10 Checksum        │  │  - Vector Code 128 Rects     │
│  - OCR Error Auto-correction         │  │  - Multi-color Text Wrap     │
└───────────────────┬──────────────────┘  └──────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Repository Layer (IndexedDB / LocalStore)             │
│  - ILabelRepository (Abstrakt ma'lumotlar qatlami)                     │
│  - IndexedDBLabelRepository (Mijoz xotirasi, server talab qilmaydi)    │
│  - Kelajakda Supabase yoki API bilan almashtirish oson                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Fayllar Daraxti

```
src/
├── components/
│   ├── BarcodeLabelsView.tsx        # Asosiy etiketkalar moduli sahifasi
│   ├── LabelPreviewCard.tsx         # 40x58 mm jonli SVG/Canvas prevyusi
│   └── LabelBatchModal.tsx          # Ommaviy parametrlar va sozlamalar modali
├── lib/
│   └── barcode/
│       ├── code128.ts               # Code 128 Start C, FNC1, 107 naqsh, mod 103
│       ├── sscc.ts                  # GS1 SSCC mod 10 hisoblash va tekshirish
│       ├── reader.ts                # ZXing + Tesseract.js parallel o'qish & correction
│       ├── pdfGenerator.ts          # pdf-lib + fontkit 40x58 mm vektor PDF tuzuvchi
│       ├── fonts.ts                 # Base64 Kirill TTF shrift (Arimo / Liberation Sans)
│       └── excel.ts                 # SheetJS (xlsx) orqali aqlli import va eksport
└── repository/
    ├── labelRepository.ts           # ILabelRepository interfeysi va IndexedDB realizatsiyasi
    └── types.ts                     # Modul uchun barcha TypeScript turlari
```

---

## 4. Matematik va Algoritmik Qoidalar (Python kodidan to'g'ridan-to'g'ri ko'chirilgan)

### 1. Code 128 Naqshlari va GS1-128 (SSCC)
- 107 ta naqsh massivi: har bir belgi 11 moduldan iborat (Stop belgisi 13 modul).
- Start C (105), FNC1 (102), 10 ta raqamlar juftligi (`(00)` prefiksi va 18 xonali raqam = 20 ta raqam).
- Nazorat summasi:
  $$\text{Checksum} = \left( 105 + 1 \times 102 + \sum_{i=2}^{11} i \times \text{PairValue}_{i-1} \right) \pmod{103}$$
- Jami modullar: $11 + 11 + 10 \times 11 + 11 + 13 = 156\text{ modul}$.

### 2. SSCC Nazorat Raqami (GS1 Modulo 10)
- 17 ta dastlabki raqam olinadi. O'ngdan chapga 3, 1, 3, 1... og'irliklar ko'paytiriladi:
  $$\text{Sum} = \sum (\text{digit} \times \text{weight})$$
  $$\text{CheckDigit} = (10 - (\text{Sum} \pmod{10})) \pmod{10}$$
- Ushbu raqam 18-raqamga teng bo'lishi shart.

### 3. OCR Avto-Tuzatish (Heuristic Error Correction)
- Agar SSCC nazorat raqami mos kelmasa va matn OCR orqali o'qilgan bo'lsa:
  Chalkashadigan juftliklar: `['0','6','8']`, `['1','7']`, `['3','8']`, `['5','6']`, `['2','7']`, `['4','9']`.
- Matndagi har bir raqam o'rniga faqat shu juftlikdagi muqobillar qo'yib ko'riladi.
- Agar barcha kombinatsiyalar ichida **YAGONA** bir almashtirish to'g'ri SSCC nazorat raqamini bersa — shu qiymat qabul qilinadi va qator holati `"tuzatildi"` etib belgilanadi.

### 4. 40x58 mm Etiketka Chizish Geometriyasi (pdf-lib)
- O'lcham: $40\text{ mm} \times 58\text{ mm}$ ($113.39\text{ pt} \times 164.41\text{ pt}$).
- Shtrix-kod vertikal yo'naltirilgan (chiziqlar gorizontal):
  - Chiziq balandligi: $33\text{ mm}$ ($93.54\text{ pt}$).
  - Modul eni: $0.27\text{ mm}$ ($0.765\text{ pt}$) $\times 156 = 42.12\text{ mm}$ ($119.39\text{ pt}$).
  - Joylashuvi: Chapdan $3.5\text{ mm}$, Yuqoridan $2.5\text{ mm}$.
- Matnlar:
  - Raqam: `(00)046400143805267798`, shrift $5.6\text{ pt}$, markazda $x=18.8\text{ mm}$, pastdan $6.6\text{ mm}$.
  - Yagona rang: $6\text{ pt}$ Bold, $x=6\text{ mm}$, O'lcham $x=18\text{ mm}$, pastdan $3.3\text{ mm}$.
  - Ko'p rangli: $5.5\text{ pt}$ dan $4.3\text{ pt}$ gacha kichrayuvchi, $x=11.5\text{ mm}$ markazda, qatorlar oxirida vergul, oxirgisida nuqta, o'lcham qatorlar o'rtasida $x=21.5\text{ mm}$.

---

## 5. Sinovlar va Ishga Tushirish

1. **Unit Testlar (Algoritmik Tekshiruv):**
   - `00046400143805267798` kodi uchun Code 128 naqshi aniq 156 ta modul hosil qilishi va Python dasturidagisi bilan 100% bir xilligini tekshirish.
   - SSCC Mod 10 algoritmi turli 18 xonali raqamlar uchun to'g'ri nazorat raqamini hisoblashini tekshirish.
2. **ZXing & Tesseract Brauzer Tekshiruvi:**
   - Turli sifatdagi namunaviy shtrix-kod rasmlarini yuklab, parallel dekodlash va avto-tuzatish ishlashini tasdiqlash.
3. **PDF Generatsiyasi:**
   - 40x58 mm o'lchamdagi haqiqiy PDF faylni hosil qilish, kirill harflari buzilmasligini va vektor shtrix-kod to'g'ri chop etilishini tekshirish.
