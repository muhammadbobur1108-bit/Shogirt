import { Order } from '../types';

export interface FactoryLedgerRow {
  id: string;
  brand?: string;          // Бренд (Texnoavia, Stark Cotton, Sab collection, TodoModa...)
  orderNo: string;         // Заказ№
  model: string;           // Модель
  color: string;           // Цвет
  colorCode?: string;      // Код цвета (напр. TQ-C00218.9)
  rost?: string;           // Рост (158-164, 170-176, 182-188, 194-200)
  qtyOrder: number;        // заказ кол-во
  qtyCut: number;          // Крой кол-во
  qtyDistribution: number; // Раздача кол-во
  qtySewing: number;       // Пошив кол-во
  qtyPackaging: number;    // Упаковка кол-во
  qtyDefect: number;       // Брак
  qtyTotalPack: number;    // Общ-упак (Упаковка + Брак)
  difference: number;      // Разница (Раздача - Общ-упак)
  qtyShipped: number;      // Отгрузка
  qtyStock: number;        // Остаток на складе (Упаковка - Отгрузка)
  percent: number;         // Закрытие % (Общ-упак / Раздача * 100%)
  month: string;           // Месяц
  notes: string;           // Примечание
}

export type SizePresetId =
  | 'alpha_xs_3xl'
  | 'alpha_4xl_8xl'
  | 'alpha_9xl_12xl'
  | 'gost_80_168'
  | 'kids_24_42'
  | 'kids_122_164'
  | 'height_158'
  | 'ru_44'
  | 'custom';

export interface SizeCellValues {
  order: number;
  cut: number;
  dist: number;
  sew: number;
  pack: number;
}

export interface OrderSizeMatrix {
  rowId: string;
  presetId: SizePresetId;
  sizes: string[];
  values: Record<string, SizeCellValues>;
  defect: number;
}

export const DEFAULT_MONTHS = [
  'Сентябрь 2026',
  'Октябрь 2026',
  'Ноябрь 2026',
  'Декабрь 2026',
  'Январь 2027'
];

export const DEFAULT_BRANDS = [
  'Texnoavia',
  'Stark Cotton',
  'Sab collection',
  'TodoModa'
];

export const ROST_OPTIONS = [
  '158-164',
  '170-176',
  '182-188',
  '194-200'
];

export const COMMON_COLORS = [
  'Белый',
  'Черный',
  'Красный',
  'Синий',
  'Т.синий',
  'Голубой',
  'Св.голубой',
  'Бирюзовый',
  'Васильковый',
  'Серый',
  'Св.серый',
  'Меланж',
  'Антрацит',
  'Зеленый',
  'Св.зеленый',
  'Салатовый',
  'Хаки',
  'Оливковый',
  'Желтый',
  'Оранжевый',
  'Горчичный',
  'Коричневый',
  'Св.коричневый',
  'Бежевый',
  'Бордовый',
  'Фиолетовый',
  'Индиго',
  'Электрик'
];

export const SIZE_PRESETS: Record<Exclude<SizePresetId, 'custom'>, { label: string; shortLabel: string; sizes: string[] }> = {
  alpha_xs_3xl: {
    label: 'Буквенные (XS – 3XL)',
    shortLabel: 'XS – 3XL',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
  },
  alpha_4xl_8xl: {
    label: 'Батал (4XL – 8XL)',
    shortLabel: '4XL – 8XL',
    sizes: ['4XL', '5XL', '6XL', '7XL', '8XL']
  },
  alpha_9xl_12xl: {
    label: 'Супер батал (9XL – 12XL)',
    shortLabel: '9XL – 12XL',
    sizes: ['9XL', '10XL', '11XL', '12XL']
  },
  gost_80_168: {
    label: 'ГОСТ обхват (80 – 168)',
    shortLabel: '80 – 168',
    sizes: ['80', '84', '88', '92', '96', '100', '104', '108', '112', '116', '120', '124', '128', '132', '136', '140', '144', '148', '152', '156', '160', '168']
  },
  kids_24_42: {
    label: 'Детский (24-26 – 40-42)',
    shortLabel: 'Дет. 24-42',
    sizes: ['24-26', '28-30', '32-34', '36-38', '40-42']
  },
  kids_122_164: {
    label: 'Детский рост (122 – 164)',
    shortLabel: 'Дет. 122-164',
    sizes: ['122', '128', '134', '140', '146', '152', '158', '164']
  },
  height_158: {
    label: 'Ростовка (158-164 – 194-200)',
    shortLabel: 'Рост 158-200',
    sizes: ['158-164', '170-176', '182-188', '194-200']
  },
  ru_44: {
    label: 'Российские (44 – 64)',
    shortLabel: '44 – 64',
    sizes: ['44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64']
  }
};

export const STORAGE_ROWS_KEY = 'tex_erp_factory_ledger_rows';
export const STORAGE_MATRICES_KEY = 'tex_erp_order_size_matrices';
export const STORAGE_MONTHS_KEY = 'tex_erp_factory_months';
export const STORAGE_BRANDS_KEY = 'tex_erp_factory_brands';
export const STORAGE_IMAGES_KEY = 'tex_erp_model_images';
export const DEMO_WIPED_FLAG_KEY = 'tex_erp_orders_demo_wiped_v2';
export const TEX_ORDERS_UPDATED_EVENT = 'tex-erp-orders-updated';

// Нулевые демо-данные (раздел Заказы полностью очищен)
export const INITIAL_FACTORY_DATA: FactoryLedgerRow[] = [];

export function normalizePresetId(rawPreset?: string): SizePresetId {
  if (!rawPreset) return 'alpha_xs_3xl';
  if (rawPreset === 'alpha') return 'alpha_xs_3xl';
  if (rawPreset === 'alpha_ext') return 'alpha_4xl_8xl';
  if (rawPreset === 'gost_88' || rawPreset === 'gost_88_ext') return 'gost_80_168';
  if (rawPreset === 'kids_116') return 'kids_122_164';
  if (rawPreset === 'custom') return 'custom';
  if (rawPreset in SIZE_PRESETS) return rawPreset as Exclude<SizePresetId, 'custom'>;
  return 'custom';
}

export function detectSizePresetForRow(row: Pick<FactoryLedgerRow, 'orderNo' | 'model' | 'color' | 'notes' | 'brand'>): Exclude<SizePresetId, 'custom'> {
  const haystack = `${row.brand || ''} ${row.orderNo} ${row.model} ${row.color} ${row.notes || ''}`.toLowerCase();

  if (/\b(24-26|28-30|32-34|36-38|40-42)\b/.test(haystack)) {
    return 'kids_24_42';
  }
  if (/\b(122|128|134|140|146|152)\b/.test(haystack) || haystack.includes('детск') || haystack.includes('kids')) {
    return 'kids_122_164';
  }
  if (/\b(9xl|10xl|11xl|12xl)\b/.test(haystack)) {
    return 'alpha_9xl_12xl';
  }
  if (/\b(4xl|5xl|6xl|7xl|8xl)\b/.test(haystack)) {
    return 'alpha_4xl_8xl';
  }
  if (
    /\b(80|84|88|92|96|100|104|108|112|116|120|124|132|136|144|148|156|160|168)\b/.test(haystack) ||
    haystack.includes('texnoavia') ||
    haystack.includes('техноавиа') ||
    row.orderNo.toUpperCase().startsWith('HV-')
  ) {
    return 'gost_80_168';
  }
  if (/\b(158-164|170-176|182-188|194-200)\b/.test(haystack)) {
    return 'height_158';
  }
  if (/\b(44|46|48|50|52|54|56|58|60|62|64)\b/.test(haystack)) {
    return 'ru_44';
  }
  return 'alpha_xs_3xl';
}

/**
 * Возвращает только те размеры, по которым реально введены данные (> 0 хотя бы на одном этапе).
 */
export function getPopulatedSizes(matrix?: OrderSizeMatrix | null): string[] {
  if (!matrix || !Array.isArray(matrix.sizes)) return [];
  return matrix.sizes.filter(sz => {
    const c = matrix.values?.[sz];
    if (!c) return false;
    return (
      (Number(c.order) || 0) > 0 ||
      (Number(c.cut) || 0) > 0 ||
      (Number(c.dist) || 0) > 0 ||
      (Number(c.sew) || 0) > 0 ||
      (Number(c.pack) || 0) > 0
    );
  });
}

/**
 * Для отчетов, сводных таблиц и дашбордов: показывает только заполненные размеры.
 * Если данные еще не введены (все 0), возвращает выбранные размеры матрицы.
 */
export function getEffectiveDisplaySizes(matrix?: OrderSizeMatrix | null): string[] {
  if (!matrix || !Array.isArray(matrix.sizes)) return [];
  const populated = getPopulatedSizes(matrix);
  return populated.length > 0 ? populated : matrix.sizes;
}

export function recalcLedgerRowFromMatrix(row: FactoryLedgerRow, matrix?: OrderSizeMatrix | null): FactoryLedgerRow {
  let qtyOrder = row.qtyOrder || 0;
  let qtyCut = row.qtyCut || 0;
  let qtyDistribution = row.qtyDistribution || 0;
  let qtySewing = row.qtySewing || 0;
  let qtyPackaging = row.qtyPackaging || 0;
  let qtyDefect = row.qtyDefect || 0;

  if (matrix && Array.isArray(matrix.sizes) && matrix.sizes.length > 0) {
    qtyOrder = 0;
    qtyCut = 0;
    qtyDistribution = 0;
    qtySewing = 0;
    qtyPackaging = 0;
    matrix.sizes.forEach(sz => {
      const c = matrix.values?.[sz];
      if (!c) return;
      qtyOrder += Number(c.order) || 0;
      qtyCut += Number(c.cut) || 0;
      qtyDistribution += Number(c.dist) || 0;
      qtySewing += Number(c.sew) || 0;
      qtyPackaging += Number(c.pack) || 0;
    });
    qtyDefect = Number(matrix.defect) || 0;
  }

  const ship = Number(row.qtyShipped) || 0;
  const qtyTotalPack = qtyPackaging + qtyDefect;
  const difference = qtyDistribution - qtyTotalPack;
  const qtyStock = Math.max(0, qtyPackaging - ship);
  const percent = qtyDistribution > 0 ? Math.round((qtyTotalPack / qtyDistribution) * 100) : 0;

  return {
    ...row,
    brand: row.brand || '',
    colorCode: row.colorCode || '',
    rost: row.rost || '',
    qtyOrder,
    qtyCut,
    qtyDistribution,
    qtySewing,
    qtyPackaging,
    qtyDefect,
    qtyTotalPack,
    difference,
    qtyStock,
    percent
  };
}

export function loadOrdersAndMatrices(): {
  rows: FactoryLedgerRow[];
  matrices: Record<string, OrderSizeMatrix>;
} {
  try {
    const alreadyWiped = localStorage.getItem(DEMO_WIPED_FLAG_KEY) === 'true';
    const rawRowsStr = localStorage.getItem(STORAGE_ROWS_KEY);
    const rawMatricesStr = localStorage.getItem(STORAGE_MATRICES_KEY);

    let rows: FactoryLedgerRow[] = rawRowsStr ? JSON.parse(rawRowsStr) : [];
    let matrices: Record<string, OrderSizeMatrix> = rawMatricesStr ? JSON.parse(rawMatricesStr) : {};

    if (!Array.isArray(rows)) rows = [];
    if (!matrices || typeof matrices !== 'object') matrices = {};

    // Единоразовая очистка старых захардкоженных демо-строк (r-1 .. r-34)
    if (!alreadyWiped) {
      const hasOnlyOldDemoRows = rows.length > 0 && rows.every(r => typeof r.id === 'string' && /^r-\d+$/.test(r.id));
      if (hasOnlyOldDemoRows) {
        rows = [];
        matrices = {};
        localStorage.removeItem(STORAGE_ROWS_KEY);
        localStorage.removeItem(STORAGE_MATRICES_KEY);
      } else {
        const filtered = rows.filter(r => !(typeof r.id === 'string' && /^r-\d+$/.test(r.id)));
        if (filtered.length !== rows.length) {
          rows = filtered;
          localStorage.setItem(STORAGE_ROWS_KEY, JSON.stringify(rows));
        }
      }
      localStorage.setItem(DEMO_WIPED_FLAG_KEY, 'true');
    }

    // Нормализация старых presetId в матрицах
    const normalizedMatrices: Record<string, OrderSizeMatrix> = {};
    Object.entries(matrices).forEach(([k, m]) => {
      if (!m || !Array.isArray(m.sizes)) return;
      normalizedMatrices[k] = {
        ...m,
        presetId: normalizePresetId(m.presetId)
      };
    });

    const syncedRows = rows.map(r =>
      recalcLedgerRowFromMatrix(
        {
          ...r,
          brand: r.brand || '',
          colorCode: r.colorCode || '',
          rost: r.rost || '',
          month: r.month || DEFAULT_MONTHS[0],
          notes: r.notes || ''
        },
        normalizedMatrices[r.id]
      )
    );

    return { rows: syncedRows, matrices: normalizedMatrices };
  } catch (e) {
    console.warn('Error loading order size store:', e);
    return { rows: [], matrices: {} };
  }
}

export function loadBrandsList(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_BRANDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set([...DEFAULT_BRANDS, ...parsed.map(String).filter(Boolean)]));
      }
    }
  } catch (e) {
    console.warn('Error loading brands list:', e);
  }
  return [...DEFAULT_BRANDS];
}

export function ledgerRowsToAppOrders(
  rows: FactoryLedgerRow[],
  matrices: Record<string, OrderSizeMatrix>
): Order[] {
  return rows.map(row => {
    const m = matrices[row.id];
    const sizesObj: Record<string, number> = {};
    if (m && Array.isArray(m.sizes)) {
      m.sizes.forEach(sz => {
        const val = m.values?.[sz]?.order || 0;
        if (val > 0) sizesObj[sz] = val;
      });
    }

    const closeRatio = row.qtyOrder > 0 ? row.qtyPackaging / row.qtyOrder : 0;
    let status: Order['status'] = 'yangi';
    if (row.qtyOrder > 0 && row.qtyShipped >= row.qtyOrder) status = 'yakunlandi';
    else if (row.qtyPackaging > 0) status = 'qadoqlash';
    else if (row.qtySewing > 0 || row.qtyDistribution > 0) status = 'tikuv';
    else if (row.qtyCut > 0) status = 'bichuv';

    const shipmentPlanStatus: Order['shipmentPlanStatus'] =
      row.qtyShipped >= row.qtyPackaging && row.qtyPackaging > 0
        ? 'otgruzka_qilindi'
        : closeRatio >= 0.99 && row.qtyPackaging > 0
        ? 'tayyor'
        : row.qtyDistribution > 0 || row.qtyCut > 0
        ? 'jarayonda'
        : 'rejalashtirilgan';

    return {
      id: row.id,
      orderNumber: row.orderNo,
      mosCode: row.orderNo,
      modelCode: row.model,
      brandName: row.brand || row.orderNo,
      customerName: row.month || DEFAULT_MONTHS[0],
      customerPhone: '',
      productType: row.rost ? `${row.model} (рост ${row.rost})` : row.model,
      fabricType: row.notes || '—',
      color: row.rost ? `${row.color} • ${row.rost}` : row.color,
      colorCode: row.colorCode || '',
      sizes: sizesObj,
      totalQuantity: row.qtyOrder,
      priority: 'normal',
      qtyOrder: row.qtyOrder,
      qtyCut: row.qtyCut,
      qtyPotok: row.qtySewing,
      qtyPackaging: row.qtyPackaging,
      qtyDefect: row.qtyDefect,
      qtyRemaining: row.qtyStock,
      createdAt: new Date().toISOString().split('T')[0],
      deadline: row.month || '',
      status,
      inShipmentPlan: true,
      shipmentPlanStatus,
      notes: row.notes,
      productionLogs: []
    };
  });
}

export function notifyOrdersStoreUpdated() {
  window.dispatchEvent(new CustomEvent(TEX_ORDERS_UPDATED_EVENT));
}
