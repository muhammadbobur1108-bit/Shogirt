/**
 * Chust Textile ERP - Parvarish Belgilari Kutubxonasi (ISO 3758 / GINETEX / GOST)
 * 
 * Barcha belgilar 100% oflayn vektor SVG ko'rinishida saqlanadi.
 * Xalqaro standart tartibi (ISO Sequence):
 * 1. Yuvish (Washing)
 * 2. Oqartirish (Bleaching)
 * 3. Quritish (Drying / Tumbling)
 * 4. Dazmollash (Ironing)
 * 5. Kimyoviy tozalash (Dry cleaning / Professional)
 * 6. Sertifikatlar (EAC, OEKO-TEX)
 */

export type CareCategory = 'wash' | 'bleach' | 'dry' | 'iron' | 'clean' | 'cert';

export interface CareSymbol {
  id: string;
  category: CareCategory;
  order: number; // 1: Wash, 2: Bleach, 3: Dry, 4: Iron, 5: Clean, 6: Cert
  nameUz: string;
  nameRu: string;
  svgPath: string; // Inner SVG contents (viewBox 0 0 48 48)
  viewBox?: string;
  isCustom?: boolean;
}

export const DEFAULT_CARE_SYMBOLS: CareSymbol[] = [
  // ================= 1. YUVISH (WASHING - ORDER 1) =================
  {
    id: 'wash_30',
    category: 'wash',
    order: 1,
    nameUz: '30°C da nozik yuvish',
    nameRu: 'Стирка при 30°C',
    svgPath: `
      <path d="M6 14 C10 14, 12 18, 16 18 C20 18, 22 14, 26 14 C30 14, 32 18, 36 18 C40 18, 42 14, 46 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M8 17 L12 38 C12 40, 14 42, 17 42 L31 42 C34 42, 36 40, 36 38 L40 17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="24" y="32" font-family="Arial, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="currentColor">30°</text>
    `
  },
  {
    id: 'wash_40',
    category: 'wash',
    order: 1,
    nameUz: '40°C da yuvish',
    nameRu: 'Стирка при 40°C',
    svgPath: `
      <path d="M6 14 C10 14, 12 18, 16 18 C20 18, 22 14, 26 14 C30 14, 32 18, 36 18 C40 18, 42 14, 46 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M8 17 L12 38 C12 40, 14 42, 17 42 L31 42 C34 42, 36 40, 36 38 L40 17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="24" y="32" font-family="Arial, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="currentColor">40°</text>
    `
  },
  {
    id: 'wash_60',
    category: 'wash',
    order: 1,
    nameUz: '60°C da yuvish',
    nameRu: 'Стирка при 60°C',
    svgPath: `
      <path d="M6 14 C10 14, 12 18, 16 18 C20 18, 22 14, 26 14 C30 14, 32 18, 36 18 C40 18, 42 14, 46 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M8 17 L12 38 C12 40, 14 42, 17 42 L31 42 C34 42, 36 40, 36 38 L40 17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="24" y="32" font-family="Arial, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="currentColor">60°</text>
    `
  },
  {
    id: 'wash_95',
    category: 'wash',
    order: 1,
    nameUz: '95°C da qaynatib yuvish',
    nameRu: 'Стирка при 95°C (Кипячение)',
    svgPath: `
      <path d="M6 14 C10 14, 12 18, 16 18 C20 18, 22 14, 26 14 C30 14, 32 18, 36 18 C40 18, 42 14, 46 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M8 17 L12 38 C12 40, 14 42, 17 42 L31 42 C34 42, 36 40, 36 38 L40 17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="24" y="32" font-family="Arial, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="currentColor">95°</text>
    `
  },
  {
    id: 'wash_hand',
    category: 'wash',
    order: 1,
    nameUz: "Qo'lda yuvish",
    nameRu: 'Ручная стирка',
    svgPath: `
      <path d="M6 18 C10 18, 12 21, 16 21 C20 21, 22 18, 26 18 C30 18, 32 21, 36 21 C40 21, 42 18, 46 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M8 20 L12 38 C12 40, 14 42, 17 42 L31 42 C34 42, 36 40, 36 38 L40 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 6 L22 18 M25 7 L25 18 M28 9 L28 18 M19 10 L19 18 M17 14 L17 19 C17 22, 20 25, 24 25 C28 25, 30 22, 30 19 L30 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `
  },
  {
    id: 'wash_not',
    category: 'wash',
    order: 1,
    nameUz: 'Yuvilmaydi',
    nameRu: 'Не стирать',
    svgPath: `
      <path d="M6 14 C10 14, 12 18, 16 18 C20 18, 22 14, 26 14 C30 14, 32 18, 36 18 C40 18, 42 14, 46 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M8 17 L12 38 C12 40, 14 42, 17 42 L31 42 C34 42, 36 40, 36 38 L40 17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="6" y1="8" x2="42" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="42" y1="8" x2="6" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    `
  },

  // ================= 2. OQARTIRISH (BLEACHING - ORDER 2) =================
  {
    id: 'bleach_ok',
    category: 'bleach',
    order: 2,
    nameUz: 'Oqartirish mumkin (Hamma vosita)',
    nameRu: 'Отбеливание разрешено',
    svgPath: `
      <polygon points="24,6 44,42 4,42" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
    `
  },
  {
    id: 'bleach_non_chlorine',
    category: 'bleach',
    order: 2,
    nameUz: 'Faqat xlorsiz oqartirish',
    nameRu: 'Только кислородный отбеливатель',
    svgPath: `
      <polygon points="24,6 44,42 4,42" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="18" y1="41" x2="28" y2="23" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="26" y1="41" x2="33" y2="28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    `
  },
  {
    id: 'bleach_not',
    category: 'bleach',
    order: 2,
    nameUz: 'Oqartirish taqiqlanadi',
    nameRu: 'Не отбеливать',
    svgPath: `
      <polygon points="24,6 44,42 4,42" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="8" y1="8" x2="40" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="40" y1="8" x2="8" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    `
  },

  // ================= 3. QURITISH (DRYING / TUMBLING - ORDER 3) =================
  {
    id: 'dry_tumble_ok',
    category: 'dry',
    order: 3,
    nameUz: 'Barabanda quritish mumkin',
    nameRu: 'Барабанная сушка разрешена',
    svgPath: `
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" stroke-width="2.5"/>
    `
  },
  {
    id: 'dry_tumble_low',
    category: 'dry',
    order: 3,
    nameUz: 'Past haroratda quritish (60°C)',
    nameRu: 'Сушка при низкой температуре (1 точка)',
    svgPath: `
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
    `
  },
  {
    id: 'dry_tumble_not',
    category: 'dry',
    order: 3,
    nameUz: 'Barabanda quritish taqiqlanadi',
    nameRu: 'Барабанная сушка запрещена',
    svgPath: `
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <line x1="6" y1="6" x2="42" y2="42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="42" y1="6" x2="6" y2="42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    `
  },
  {
    id: 'dry_drip_vertical',
    category: 'dry',
    order: 3,
    nameUz: 'Siquvsiz tik osib quritish (3 chiziq)',
    nameRu: 'Сушка без отжима в подвешенном виде',
    svgPath: `
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <line x1="18" y1="14" x2="18" y2="34" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="30" y1="14" x2="30" y2="34" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    `
  },
  {
    id: 'dry_line',
    category: 'dry',
    order: 3,
    nameUz: 'Arqonda tik quritish',
    nameRu: 'Вертикальная сушка на веревке',
    svgPath: `
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    `
  },
  {
    id: 'dry_flat',
    category: 'dry',
    order: 3,
    nameUz: 'Yotiq holda tekis quritish',
    nameRu: 'Сушка на горизонтальной плоскости',
    svgPath: `
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <line x1="14" y1="24" x2="34" y2="24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    `
  },

  // ================= 4. DAZMOLLASH (IRONING - ORDER 4) =================
  {
    id: 'iron_low',
    category: 'iron',
    order: 4,
    nameUz: 'Past haroratda dazmollash (110°C)',
    nameRu: 'Глажка до 110°C (1 точка)',
    svgPath: `
      <path d="M8 36 L40 36 C42 36, 44 34, 44 30 C44 22, 38 18, 30 18 L16 18 C11 18, 7 22, 7 27 L7 35 C7 35.5, 7.5 36, 8 36 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M12 18 L12 14 C12 12, 14 10, 16 10 L32 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="24" cy="27" r="2.5" fill="currentColor"/>
    `
  },
  {
    id: 'iron_medium',
    category: 'iron',
    order: 4,
    nameUz: "O'rtacha dazmollash (150°C)",
    nameRu: 'Глажка до 150°C (2 точки)',
    svgPath: `
      <path d="M8 36 L40 36 C42 36, 44 34, 44 30 C44 22, 38 18, 30 18 L16 18 C11 18, 7 22, 7 27 L7 35 C7 35.5, 7.5 36, 8 36 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M12 18 L12 14 C12 12, 14 10, 16 10 L32 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="19" cy="27" r="2.2" fill="currentColor"/>
      <circle cx="29" cy="27" r="2.2" fill="currentColor"/>
    `
  },
  {
    id: 'iron_high',
    category: 'iron',
    order: 4,
    nameUz: 'Yuqori dazmollash (200°C)',
    nameRu: 'Глажка до 200°C (3 точки)',
    svgPath: `
      <path d="M8 36 L40 36 C42 36, 44 34, 44 30 C44 22, 38 18, 30 18 L16 18 C11 18, 7 22, 7 27 L7 35 C7 35.5, 7.5 36, 8 36 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M12 18 L12 14 C12 12, 14 10, 16 10 L32 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="16" cy="27" r="2" fill="currentColor"/>
      <circle cx="24" cy="27" r="2" fill="currentColor"/>
      <circle cx="32" cy="27" r="2" fill="currentColor"/>
    `
  },
  {
    id: 'iron_not',
    category: 'iron',
    order: 4,
    nameUz: 'Dazmollash taqiqlanadi',
    nameRu: 'Не гладить',
    svgPath: `
      <path d="M8 36 L40 36 C42 36, 44 34, 44 30 C44 22, 38 18, 30 18 L16 18 C11 18, 7 22, 7 27 L7 35 C7 35.5, 7.5 36, 8 36 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M12 18 L12 14 C12 12, 14 10, 16 10 L32 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="6" y1="8" x2="42" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="42" y1="8" x2="6" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    `
  },

  // ================= 5. KIMYOVIY TOZALASH (CLEANING - ORDER 5) =================
  {
    id: 'clean_p',
    category: 'clean',
    order: 5,
    nameUz: 'Quruq kimyoviy tozalash (P)',
    nameRu: 'Химчистка перхлорэтиленом (P)',
    svgPath: `
      <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <text x="24" y="31" font-family="Arial, sans-serif" font-size="19" font-weight="900" text-anchor="middle" fill="currentColor">P</text>
    `
  },
  {
    id: 'clean_not',
    category: 'clean',
    order: 5,
    nameUz: 'Kimyoviy tozalash taqiqlanadi',
    nameRu: 'Химчистка запрещена',
    svgPath: `
      <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <line x1="8" y1="8" x2="40" y2="40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="40" y1="8" x2="8" y2="40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    `
  },

  // ================= 6. SERTIFIKATLAR (CERTS - ORDER 6) =================
  {
    id: 'cert_eac',
    category: 'cert',
    order: 6,
    nameUz: 'EAC Muvofiqlik belgisi (Bojxona Ittifoqi)',
    nameRu: 'Знак соответствия ЕАС',
    viewBox: '0 0 54 60',
    svgPath: `
      <g fill="currentColor">
        <path d="M0 0 h16 v6 h-10 v21 h9 v6 h-9 v21 h10 v6 h-16 Z" />
        <path d="M19 0 h16 v60 h-6 v-27 h-4 v27 h-6 Z M25 6 h4 v15 h-4 Z" />
        <path d="M38 0 h16 v6 h-10 v48 h10 v6 h-16 Z" />
      </g>
    `
  }
];

/**
 * Saqlangan maxsus belgilarni yuklab beradi (LocalStorage)
 */
export function getAllCareSymbols(): CareSymbol[] {
  try {
    const custom = localStorage.getItem('chust_custom_care_symbols');
    if (custom) {
      const parsed: CareSymbol[] = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...DEFAULT_CARE_SYMBOLS, ...parsed];
      }
    }
  } catch (e) {
    console.warn('Failed to load custom care symbols:', e);
  }
  return DEFAULT_CARE_SYMBOLS;
}

/**
 * Yangi maxsus belgi qo'shish
 */
export function saveCustomCareSymbol(symbol: CareSymbol): void {
  try {
    const existing = getAllCareSymbols().filter(s => s.isCustom);
    const updated = [...existing.filter(s => s.id !== symbol.id), { ...symbol, isCustom: true }];
    localStorage.setItem('chust_custom_care_symbols', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom symbol:', e);
  }
}

/**
 * Tanlangan belgilar ID ro'yxatini xalqaro ISO 3758 tartibi bo'yicha saralaydi:
 * 1. Yuvish (Wash) -> 2. Oqartirish (Bleach) -> 3. Quritish (Dry) -> 4. Dazmollash (Iron) -> 5. Kimyoviy (Clean) -> 6. EAC
 */
export function sortCareSymbolsISO(symbolIds: string[]): string[] {
  const all = getAllCareSymbols();
  const map = new Map<string, CareSymbol>();
  for (const s of all) {
    map.set(s.id, s);
  }

  // Takrorlanmas qilib ajratish
  const uniqueIds = Array.from(new Set(symbolIds));

  return uniqueIds.sort((a, b) => {
    const symA = map.get(a);
    const symB = map.get(b);
    const orderA = symA ? symA.order : 99;
    const orderB = symB ? symB.order : 99;
    return orderA - orderB;
  });
}
