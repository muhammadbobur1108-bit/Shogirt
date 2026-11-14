/**
 * Chust Textile ERP - Конструктор Ярлыков и Бирок (Product Label / Hangtag Designer & Printing Center)
 * 
 * 1-rasm: Mahsulot yorlig'i (birka/stiker) ko'rinishi
 * 2-rasm: 1C / Excel Mahsulotlar jadvali (o'lchamlar, shtrix-kodlar, artikullar)
 * 3-rasm: Parvarish belgilari kutubxonasi (ISO 3758) va CorelDRAW uslubidagi shtrix-kod boshqaruvi
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Tag,
  Printer,
  FileSpreadsheet,
  Download,
  Folder,
  FolderPlus,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Copy,
  Layers,
  Sparkles,
  Barcode as BarcodeIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  RefreshCw,
  Upload,
  X,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  HardDrive,
  CheckCheck,
  Package,
  FileUp,
  FileCode,
  ArrowRight,
  Sparkle,
  Maximize2,
  Settings
} from 'lucide-react';
import { generateEan13VectorData, formatToValidEan13, calculateEan13CheckDigit } from '../lib/barcode/ean13';
import {
  CareSymbol,
  DEFAULT_CARE_SYMBOLS,
  getAllCareSymbols,
  saveCustomCareSymbol,
  sortCareSymbolsISO
} from '../lib/textileCareSymbols';
import * as XLSX from 'xlsx';
import StickerFileExplorer from './label/StickerFileExplorer';
import PrintSettingsModal, { PrinterCalibrationSettings, DEFAULT_PRINTER_SETTINGS } from './label/PrintSettingsModal';
import BarcodeLabelsView from './BarcodeLabelsView';
import {
  ZoomIn,
  ZoomOut,
  Move,
  Grid,
  Type,
  Building2,
  Sliders,
  ChevronsRight,
  ChevronsLeft,
  MousePointer,
  UploadCloud
} from 'lucide-react';

// Mahsulot qatori interfeysi
export interface ProductRow {
  id: string;
  orderNumber: string; // Zakaz raqami (masalan: ZAK-2026-441)
  code: string;        // 00-024823
  name: string;        // Футболка мужская без рукавов 100% ХБ, 180гр хаки XS
  color: string;       // Хаки
  size: string;        // XS/88
  barcode: string;     // 4620336842646
  tnved: string;       // 6109100000
  artikul: string;     // 2342598
  orderQty: number;    // Mahsulot soni (Buyurtma miqdori)
  printedBagQty: number; // 1-paket uchun chop etilgani
  printedTagQty: number; // 2-birka uchun chop etilgani
}

// 1-rasmdagi to'liq yorliq sozlamalari
export interface LabelDesignData {
  sizeTitle: string;        // "Размер S" yoki "Размер XS/88"
  productName: string;      // "Футболка мужская SC"
  color: string;            // "Цвет: белый" yoki "Цвет: Хаки"
  artikul: string;          // "Арт. 02618" yoki "Арт. 2342598"
  composition: string;      // "Состав: 100% хлопок"
  compliance: string;       // "ТОВАР СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ ТР ТС 017/2011"
  shelfLife: string;        // "Срок годности: НЕ ОГРАНИЧЕН."
  manufactureDate: string;  // "ИЗГОТОВЛЕНО: декабрь 2025"
  manufacturer: string;     // 'ИЗГОТОВИТЕЛЬ: ООО "CHUST TEXTILE"\nУзбекистан, г. Чуст, ул. Гулзор, д.105'
  supplier: string;         // 'ПОСТАВЩИК: ООО “Престиж Плюс”...'
  tnved: string;            // "ТНВЭД: 6109100000"
  careSymbolIds: string[];  // Tanlangan belgilar (avto 1..5 tartib)
  barcode: string;          // "4620336807300"
  barcodeType: 'EAN13' | 'CODE128';
  showBarcodeText: boolean;
  barcodeWidthMm: number;   // 38 mm
  barcodeHeightMm: number;  // 17 mm
  barcodeModuleWidth: number; // 1.7
  guardExtraHeight: number; // 6 px
  barcodeFontSize: number;  // 11 px
  showEac: boolean;         // EAC belgisi
  eacSizeMm: number;        // 12 mm
  labelWidthMm: number;     // 40 mm
  labelHeightMm: number;    // 58 mm
  fontScale?: number;       // 70 to 140%
  fontWeight?: 'normal' | 'medium' | 'bold' | 'black';
  letterSpacing?: 'tight' | 'normal' | 'wide';
  selectedSupplierId?: string;
}

// 7. Поставщики / Предприятия (точно по ТЗ заказчика)
export interface PredefinedSupplier {
  id: string;
  name: string;
  shortLabel: string;
  address: string;
}

export const PREDEFINED_SUPPLIERS: PredefinedSupplier[] = [
  {
    id: 'prestige',
    name: 'ООО “Престиж Плюс”',
    shortLabel: '«Престиж плюс»',
    address: 'ПОСТАВЩИК: ООО “Престиж Плюс”, 111020, г. Москва, вн.тер.г. мун. окр. Лефортово, Сторожевая ул., д. 26, стр. 1, помещ. 2/1'
  },
  {
    id: 'sfera',
    name: 'ООО “Сфера”',
    shortLabel: '«Сфера»',
    address: 'ПОСТАВЩИК: OOO “Сфера”, 111020, г Москва, ул. Сторожевая, д.26, стр.1, этаж 4, помещение 414.'
  },
  {
    id: 'sab',
    name: 'Sab collection',
    shortLabel: '«Sab collection»',
    address: 'ПОСТАВЩИК: OOO “Сфера”, 111020, г Москва, ул. Сторожевая, д.26, стр.1, этаж 4, помещение 414.'
  }
];

// Tizimdagi saqlangan stikerlar va papkalar
export interface StickerProjectFolder {
  id: string;
  name: string;
  path: string;
  createdAt: string;
}

export interface SavedStickerTemplate {
  id: string;
  folderId: string;
  name: string;
  data: LabelDesignData;
  savedAt: string;
  fileSizeKb?: number;
  updatedAt?: string;
}

// Standart papkalar: Мужской, Женский, Детские, Другие
const INITIAL_FOLDERS: StickerProjectFolder[] = [
  { id: 'f-men', name: 'Мужской', path: 'ERP Xotirasi / Мужской', createdAt: '2026-01-01' },
  { id: 'f-women', name: 'Женский', path: 'ERP Xotirasi / Женский', createdAt: '2026-01-01' },
  { id: 'f-kids', name: 'Детские', path: 'ERP Xotirasi / Детские', createdAt: '2026-01-01' },
  { id: 'f-other', name: 'Другие', path: 'ERP Xotirasi / Другие', createdAt: '2026-01-01' }
];

// Standart toza mahsulotlar ro'yxati (Boshlang'ich holatda bo'sh, faqat exceldan qabul qilinganlar ko'rinadi)
const INITIAL_PRODUCTS: ProductRow[] = [];

// Standart termo stiker o'lchamlari (Termo qog'ozlar va birkalar)
export interface LabelSizePreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
  isPopular?: boolean;
}

export const LABEL_SIZE_PRESETS: LabelSizePreset[] = [
  { id: '40x58', name: '40 x 58 mm', widthMm: 40, heightMm: 58, description: 'Standart Termo Stiker', isPopular: true },
  { id: '58x40', name: '58 x 40 mm', widthMm: 58, heightMm: 40, description: 'Gorizontal Termo Stiker' },
  { id: '58x70', name: '58 x 70 mm', widthMm: 58, heightMm: 70, description: 'Katta Tekstil Birka' },
  { id: '50x80', name: '50 x 80 mm', widthMm: 50, heightMm: 80, description: 'Karton Quti / Korobka' },
  { id: '30x20', name: '30 x 20 mm', widthMm: 30, heightMm: 20, description: 'Kichik O\'lcham Stiker' }
];

// 1-rasmdagi aynan standart yorliq (40x58 mm termo qog'oz)
const DEFAULT_LABEL_DATA: LabelDesignData = {
  sizeTitle: 'Размер S',
  productName: 'Футболка мужская SC',
  color: 'Цвет: белый',
  artikul: 'Арт. 02618',
  composition: 'Состав: 100% хлопок',
  compliance: 'ТОВАР СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ ТР ТС 017/2011',
  shelfLife: 'Срок годности: НЕ ОГРАНИЧЕН.',
  manufactureDate: 'ИЗГОТОВЛЕНО: декабрь 2025',
  manufacturer: 'ИЗГОТОВИТЕЛЬ: ООО "CHUST TEXTILE"\nУзбекистан, г. Чуст, ул. Гулзор, д.105',
  supplier: 'ПОСТАВЩИК: ООО “Престиж Плюс”, 111020, г. Москва, вн.тер.г. мун. окр. Лефортово, Сторожевая ул., д. 26, стр. 1, помещ. 2/1',
  tnved: 'ТНВЭД: 6109100000',
  careSymbolIds: ['wash_30', 'bleach_not', 'dry_tumble_not', 'dry_drip_vertical', 'iron_low'],
  barcode: '4620336807300',
  barcodeType: 'EAN13',
  showBarcodeText: true,
  barcodeWidthMm: 34,
  barcodeHeightMm: 14,
  barcodeModuleWidth: 1.6,
  guardExtraHeight: 5,
  barcodeFontSize: 10,
  showEac: true,
  eacSizeMm: 11,
  labelWidthMm: 40,
  labelHeightMm: 58,
  fontScale: 100,
  fontWeight: 'bold',
  letterSpacing: 'normal',
  selectedSupplierId: 'prestige'
};

interface Props {
  orders?: any[];
  lang?: 'uz' | 'ru';
  currentUser?: any;
}

export default function LabelDesignerView({ orders = [], lang = 'uz', currentUser }: Props) {
  // Asosiy Bo'lim Tabi: "Стикеры"
  // 1. "Конструктор Стикеров", 2. "Штрих-коды и OCR" (интегрировано), 3. "Пакетный импорт (Excel)", 4. "Журнал печати"
  const [mainViewMode, setMainViewMode] = useState<'designer' | 'barcode_ocr' | 'bulk_import' | 'printcenter'>('designer');

  // 2. Mahsulotlar ro'yxati (Demo ma'lumotlarsiz, faqat exceldan qabul qilinadi)
  const [products, setProducts] = useState<ProductRow[]>(() => {
    try {
      const saved = localStorage.getItem('tex_erp_hangtag_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Eski demo zakazlarni tozalash
        if (Array.isArray(parsed) && parsed.some((p: any) => p.orderNumber === 'ZAK-2026-441')) {
          localStorage.removeItem('tex_erp_hangtag_products');
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [labelData, setLabelData] = useState<LabelDesignData>(() => {
    try {
      const saved = localStorage.getItem('tex_erp_hangtag_current_label');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_LABEL_DATA,
          ...parsed,
          careSymbolIds: Array.isArray(parsed.careSymbolIds) && parsed.careSymbolIds.length > 0 
            ? parsed.careSymbolIds 
            : DEFAULT_LABEL_DATA.careSymbolIds
        };
      }
      return DEFAULT_LABEL_DATA;
    } catch {
      return DEFAULT_LABEL_DATA;
    }
  });

  // 4. Asboblar paneli tablari (O'lcham 40x58mm, Postavshik/Shrift, Shtrix-kod, Belgilar)
  const [activeToolTab, setActiveToolTab] = useState<'size' | 'supplier' | 'barcode' | 'care'>('size');
  const [careSymbols, setCareSymbols] = useState<CareSymbol[]>(getAllCareSymbols());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showAddSymbolModal, setShowAddSymbolModal] = useState<boolean>(false);
  const [newSymbolName, setNewSymbolName] = useState<string>('');
  const [newSymbolCategory, setNewSymbolCategory] = useState<any>('wash');
  const [newSymbolSvgCode, setNewSymbolSvgCode] = useState<string>('');

  // 5. Papkalar (Мужской, Женский, Детские, Другие) - demo stikerlarsiz toza
  const [folders, setFolders] = useState<StickerProjectFolder[]>(() => {
    try {
      const saved = localStorage.getItem('tex_erp_hangtag_folders');
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch {
      return INITIAL_FOLDERS;
    }
  });
  const [activeFolderId, setActiveFolderId] = useState<string>(INITIAL_FOLDERS[0]?.id || 'f-men');
  const [savedTemplates, setSavedTemplates] = useState<SavedStickerTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('tex_erp_hangtag_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('');

  // 6. Ma'lumot qabul qilish modal dialogi (ERP, Excel, Word, PDF Gemini API)
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importSourceTab, setImportSourceTab] = useState<'erp' | 'excel' | 'word' | 'pdf'>('excel');
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [wordText, setWordText] = useState<string>('');

  // 7. Kompyuterdagi printerga chop etish sozlamalari
  const [printCopies, setPrintCopies] = useState<number>(100);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  // 8. Printer va Kalibratsiya Sozlamalari (localStorage'da saqlanadi)
  const [printerSettings, setPrinterSettings] = useState<PrinterCalibrationSettings>(() => {
    try {
      const saved = localStorage.getItem('tex_erp_printer_calibration_settings');
      if (saved) {
        return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load printer settings:', e);
    }
    return DEFAULT_PRINTER_SETTINGS;
  });
  const [showPrintSettingsModal, setShowPrintSettingsModal] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('tex_erp_printer_calibration_settings', JSON.stringify(printerSettings));
    } catch (e) {
      console.warn('Failed to save printer settings:', e);
    }
  }, [printerSettings]);

  // 9. Corel-like Workspace & Canvas Navigation (Zoom, Pan, Grid Guides, Direct Edit)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showGridGuides, setShowGridGuides] = useState<boolean>(false);
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeSelectedField, setActiveSelectedField] = useState<string | null>(null);

  // 10. Compact Collapsible Right Folder Panel ("Stikerlar Papkalari" - o'ng tarafda)
  const [isFolderSidebarOpen, setIsFolderSidebarOpen] = useState<boolean>(true);

  // 11. Excel Bulk Nomenclature Import State (per-size individual stickers & unique EAN-13 barcodes)
  const [bulkStickers, setBulkStickers] = useState<{
    id: string;
    modelName: string;
    artikul: string;
    color: string;
    size: string;
    composition: string;
    barcode: string;
    supplier: string;
    qty: number;
    checked: boolean;
  }[]>([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');

  // Matnlar sig'ishini avtomatik moslash (Auto-scale text helper)
  const getScaledText = (text: string, basePx: number, maxChars: number) => {
    const scale = (labelData.fontScale || 100) / 100;
    let px = basePx * scale;
    if (text && text.length > maxChars) {
      const factor = Math.max(0.68, maxChars / text.length);
      px = px * factor;
    }
    return {
      fontSize: `${Math.max(7.5, px).toFixed(1)}px`,
      lineHeight: px < basePx * 0.85 ? '1.1' : '1.2'
    };
  };

  // Excel orqali ommaviy yuklash va har bir razmer uchun alohida stiker + noyob EAN-13 yaratish
  const handleBulkExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert(lang === 'uz' ? "Excel faylda ma'lumot topilmadi!" : "В файле Excel нет данных!");
          return;
        }

        const generated: any[] = [];
        let seq = Math.floor(Math.random() * 8000) + 1000;

        data.forEach((row, rowIdx) => {
          const model = String(row['Модель (Наименование)'] || row['Model'] || row['Наименование'] || row['Nomi'] || 'Футболка мужская SC').trim();
          const color = String(row['Цвет'] || row['Rang'] || 'Белый').trim();
          const artikul = String(row['Артикул'] || row['Artikul'] || '02618').trim();
          const comp = String(row['Состав'] || row['Tarkibi'] || '100% хлопок').trim();
          const rawSizes = String(row['Размеры'] || row['Размер'] || row['O\'lchamlar'] || row['Razmer'] || 'XS, S, M, L, XL, 2XL').trim();
          const qty = parseInt(row['Количество'] || row['Soni'] || 100, 10) || 100;

          // Split multiple sizes if separated by commas, slashes, spaces
          const sizeList = rawSizes.includes(',') 
            ? rawSizes.split(',').map(s => s.trim()).filter(Boolean)
            : rawSizes.includes('/')
            ? rawSizes.split('/').map(s => s.trim()).filter(Boolean)
            : [rawSizes];

          sizeList.forEach((sz, sIdx) => {
            const base12 = `462033${String(600000 + seq).slice(-6)}`;
            const checkD = calculateEan13CheckDigit(base12);
            const validEan = `${base12}${checkD}`;

            generated.push({
              id: `bulk-${Date.now()}-${rowIdx}-${sIdx}`,
              modelName: model,
              artikul,
              color,
              size: sz,
              composition: comp,
              barcode: validEan,
              supplier: labelData.supplier,
              qty: Math.max(1, Math.round(qty / Math.max(1, sizeList.length))),
              checked: true
            });
            seq++;
          });
        });

        setBulkStickers(generated);
        setPrintNotice(
          lang === 'uz'
            ? `Exceldan ${generated.length} ta o'lcham bo'yicha noyob EAN-13 shtrix-kodli stikerlar yaratildi!`
            : `Сгенерировано ${generated.length} стикеров по размерам с уникальными кодами EAN-13!`
        );
        setTimeout(() => setPrintNotice(null), 3500);
      } catch (err: any) {
        console.error(err);
        alert("Excel faylini o'qishda xatolik: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Doimiy saqlash
  useEffect(() => {
    try {
      localStorage.setItem('tex_erp_hangtag_products', JSON.stringify(products));
    } catch (e) {
      console.warn(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('tex_erp_hangtag_current_label', JSON.stringify(labelData));
    } catch (e) {
      console.warn(e);
    }
  }, [labelData]);

  // EAN-13 Vektor hisoblash (CorelDRAW koordinatalari bilan, 1-rasm nusxasi)
  const ean13Data = useMemo(() => {
    return generateEan13VectorData(labelData.barcode, {
      moduleWidth: labelData.barcodeModuleWidth || 1.8,
      height: Math.max(50, (labelData.barcodeHeightMm || 17) * 3),
      guardExtraHeight: labelData.guardExtraHeight || 6,
      leftQuietZoneModules: 8,
      rightQuietZoneModules: 4
    });
  }, [
    labelData.barcode,
    labelData.barcodeModuleWidth,
    labelData.barcodeHeightMm,
    labelData.guardExtraHeight
  ]);

  // Papkada bor va tanlangan stiker razmerlari (5-rasm talabi: "faqat papkada bor va tanlangan stiker razmerlari ko'rinsin")
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();

    // 1. Joriy tanlangan stiker razmeri
    if (labelData.sizeTitle) {
      const cleanCurrent = labelData.sizeTitle.replace(/^(Размер|Size|O'lcham)\s*/i, '').trim();
      if (cleanCurrent) sizeSet.add(cleanCurrent);
    }

    // 2. Faol papkadagi saqlangan stikerlardan
    const folderTemplates = savedTemplates.filter(t => t.folderId === activeFolderId);
    folderTemplates.forEach(t => {
      if (t.data?.sizeTitle) {
        const clean = t.data.sizeTitle.replace(/^(Размер|Size|O'lcham)\s*/i, '').trim();
        if (clean) sizeSet.add(clean);
      }
    });

    // 3. Tizimda yuklangan mahsulotlardan (agar bo'lsa)
    products.forEach(p => {
      if (p.size) {
        const clean = p.size.replace(/^(Размер|Size|O'lcham)\s*/i, '').trim();
        if (clean) sizeSet.add(clean);
      }
    });

    // 4. Bulk import stikerlaridan (agar mavjud bo'lsa)
    bulkStickers.forEach(b => {
      if (b.size) {
        const clean = b.size.replace(/^(Размер|Size|O'lcham)\s*/i, '').trim();
        if (clean) sizeSet.add(clean);
      }
    });

    return Array.from(sizeSet);
  }, [savedTemplates, activeFolderId, products, bulkStickers, labelData.sizeTitle]);

  // Parvarish belgisini tanlash / o'chirish (avtomatik 1..5 tartiblash)
  const handleToggleCareSymbol = (symbolId: string) => {
    const current = [...labelData.careSymbolIds];
    const exists = current.includes(symbolId);
    let next: string[];
    if (exists) {
      next = current.filter(id => id !== symbolId);
    } else {
      if (current.length >= 7) {
        setPrintNotice(lang === 'uz' ? "Maksimal 6-7 ta parvarish belgisi qo'yish mumkin" : "Максимум 6-7 знаков ухода");
        setTimeout(() => setPrintNotice(null), 2500);
        return;
      }
      next = [...current, symbolId];
    }
    // Xalqaro ISO 3758 ketma-ketlik bo'yicha avtomatik tartiblash
    const sorted = sortCareSymbolsISO(next);
    setLabelData({ ...labelData, careSymbolIds: sorted });
  };

  // Mahsulot qatorini bosganda stikerga o'tkazish
  const handleSelectProduct = (item: ProductRow) => {
    setSelectedProductId(item.id);
    setLabelData(prev => ({
      ...prev,
      sizeTitle: `Размер ${item.size}`,
      productName: item.name,
      color: `Цвет: ${item.color}`,
      artikul: `Арт. ${item.artikul}`,
      barcode: item.barcode,
      tnved: `ТНВЭД: ${item.tnved}`
    }));
  };

  // Kompyuterdagi printerga chop etishni tasdiqlash
  const handleConfirmPrint = () => {
    setProducts(prev => prev.map(p => {
      if (p.id === selectedProductId) {
        return {
          ...p,
          printedTagQty: (p.printedTagQty || 0) + printCopies
        };
      }
      return p;
    }));

    setShowPrintModal(false);
    setPrintNotice(
      lang === 'uz'
        ? `"${labelData.sizeTitle}" uchun ${printCopies} ta stiker chop etildi va jurnalga qayd qilindi!`
        : `Напечатано ${printCopies} шт. для "${labelData.sizeTitle}". Запись внесена в журнал!`
    );
    setTimeout(() => setPrintNotice(null), 3500);

    // Kompyuterning lokal printer dialogini to'g'ridan-to'g'ri chaqirish
    window.print();
  };

  // Excel namuna faylini yuklab berish
  const handleDownloadSampleExcel = () => {
    const sampleRows = [
      {
        'Модель (Наименование)': 'Футболка мужская без рукавов 100% ХБ, 180гр хаки XS',
        'Цвет': 'Хаки',
        'Размер': 'XS/88',
        'Артикул': '2342598',
        'Штрихкод (EAN-13)': '4620336842646',
        'Количество (Заказ)': 250,
        'Состав': '100% хлопок',
        'ТНВЭД': '6109100000'
      },
      {
        'Модель (Наименование)': 'Футболка мужская без рукавов 100% ХБ, 180гр хаки S',
        'Цвет': 'Хаки',
        'Размер': 'S/92',
        'Артикул': '2342598',
        'Штрихкод (EAN-13)': '4620336842653',
        'Количество (Заказ)': 500,
        'Состав': '100% хлопок',
        'ТНВЭД': '6109100000'
      },
      {
        'Модель (Наименование)': 'Футболка мужская без рукавов 100% ХБ, 180гр хаки M',
        'Цвет': 'Хаки',
        'Размер': 'M/96',
        'Артикул': '2342598',
        'Штрихкод (EAN-13)': '4620336842660',
        'Количество (Заказ)': 1000,
        'Состав': '100% хлопок',
        'ТНВЭД': '6109100000'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Namuna_Stikerlar');
    XLSX.writeFile(wb, 'Chust_Textile_Stiker_Namuna.xlsx');
  };

  // Excel faylini yuklash (.xlsx / .xls)
  const handleUploadExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert("Excel faylda ma'lumot topilmadi.");
          return;
        }

        const newItems: ProductRow[] = data.map((row, idx) => {
          const name = row['Модель (Наименование)'] || row['Модель'] || row['Наименование'] || row['Nomi'] || `Model ${idx + 1}`;
          const color = row['Цвет'] || row['Rang'] || 'Standart';
          const size = row['Размер'] || row['O\'lcham'] || row['Size'] || 'M';
          const artikul = String(row['Артикул'] || row['Artikul'] || row['Art'] || '00000');
          const rawBc = String(row['Штрихкод (EAN-13)'] || row['Штрихкод'] || row['Barcode'] || row['Shtrixkod'] || '4620336800000');
          const barcode = formatToValidEan13(rawBc);
          const orderQty = parseInt(row['Количество (Заказ)'] || row['Количество'] || row['Soni'] || 100, 10) || 100;
          const tnved = String(row['ТНВЭД'] || '6109100000');

          return {
            id: `row-${Date.now()}-${idx}`,
            orderNumber: `ZAK-EXCEL-${idx + 1}`,
            code: `EX-${idx + 1}`,
            name,
            color,
            size,
            barcode,
            tnved,
            artikul,
            orderQty,
            printedBagQty: 0,
            printedTagQty: 0
          };
        });

        setProducts(newItems);
        if (newItems[0]) {
          handleSelectProduct(newItems[0]);
        }
        setShowImportModal(false);
        setPrintNotice(lang === 'uz' ? `Exceldan ${newItems.length} ta mahsulot muvaffaqiyatli qabul qilindi!` : `Успешно загружено ${newItems.length} строк из Excel!`);
        setTimeout(() => setPrintNotice(null), 3500);

      } catch (err: any) {
        console.error("Excel parse error:", err);
        alert("Excel faylini o'qishda xatolik yuz berdi: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // PDF orqali Gemini AI bilan tahlil qilish
  const handleUploadPdfAi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiParsing(true);
    setAiError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64Data = (evt.target?.result as string) || "";
        const res = await fetch("/api/labels/parse-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64Data,
            mimeType: file.type || "application/pdf",
            fileName: file.name
          })
        });

        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "AI tahlilida natija olinmadi");
        }

        const d = json.data;
        // 1. Label data yangilash
        setLabelData(prev => ({
          ...prev,
          productName: d.productName || prev.productName,
          color: d.color ? `Цвет: ${d.color}` : prev.color,
          artikul: d.artikul ? `Арт. ${d.artikul}` : prev.artikul,
          composition: d.composition ? `Состав: ${d.composition}` : prev.composition,
          manufacturer: d.manufacturer || prev.manufacturer,
          supplier: d.supplier || prev.supplier,
          tnved: d.tnved ? `ТНВЭД: ${d.tnved}` : prev.tnved,
          careSymbolIds: Array.isArray(d.careSymbols) && d.careSymbols.length > 0 ? d.careSymbols : prev.careSymbolIds
        }));

        // 2. Qatorlarni yangilash
        if (Array.isArray(d.items) && d.items.length > 0) {
          const newRows: ProductRow[] = d.items.map((it: any, idx: number) => ({
            id: `ai-row-${Date.now()}-${idx}`,
            orderNumber: `ZAK-AI-${idx + 1}`,
            code: `00-02482${idx + 3}`,
            name: `${d.productName || 'Mahsulot'} ${it.size || ''}`,
            color: d.color || 'Xaki',
            size: it.size || 'M',
            barcode: formatToValidEan13(it.barcode || '4620336842653'),
            tnved: d.tnved || '6109100000',
            artikul: d.artikul || '2342598',
            orderQty: parseInt(it.orderQty || 500, 10) || 500,
            printedBagQty: 0,
            printedTagQty: 0
          }));
          setProducts(newRows);
          if (newRows[0]) {
            handleSelectProduct(newRows[0]);
          }
        }

        setShowImportModal(false);
        setPrintNotice(lang === 'uz' ? "Gemini AI orqali PDF spetsifikatsiya tahlil qilindi va stikerlar yaratildi!" : "Спецификация успешно распознана с помощью Gemini AI!");
        setTimeout(() => setPrintNotice(null), 4000);

      } catch (err: any) {
        console.error("AI Parse error:", err);
        setAiError(err.message || "Xatolik yuz berdi");
      } finally {
        setIsAiParsing(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Word yoki matn orqali import qilish
  const handleImportWordText = () => {
    if (!wordText.trim()) return;
    const lines = wordText.split('\n').filter(l => l.trim().length > 0);
    // Simple fast parser
    const sizes = ['XS/88', 'S/92', 'M/96', 'L/100', 'XL/104', '2XL/108', '3XL/112'];
    const newItems: ProductRow[] = sizes.map((sz, idx) => ({
      id: `word-row-${Date.now()}-${idx}`,
      orderNumber: `ZAK-WORD-${idx + 1}`,
      code: `00-02482${idx + 3}`,
      name: lines[0] || 'Футболка мужская',
      color: lines[1] ? lines[1].replace(/^(Цвет|Rang):?/i, '').trim() : 'Хаки',
      size: sz,
      barcode: `46203368426${4 + idx}`,
      tnved: '6109100000',
      artikul: '2342598',
      orderQty: 500,
      printedBagQty: 0,
      printedTagQty: 0
    }));

    setProducts(newItems);
    setShowImportModal(false);
    setWordText('');
    setPrintNotice(lang === 'uz' ? "Word matnidan ma'lumotlar qabul qilindi!" : "Данные из Word успешно приняты!");
    setTimeout(() => setPrintNotice(null), 3000);
  };

  // ERP tizimidagi mavjud buyurtmalardan qabul qilish
  const handleImportFromErpOrders = (order: any) => {
    const brand = order.brandName || order.modelCode || 'Futbolka';
    const color = order.color || 'Standart';
    const sizes = order.sizes || ['S', 'M', 'L', 'XL'];
    const totalQty = order.totalQuantity || order.qtyOrder || 1000;
    const qtyPerSize = Math.max(50, Math.round(totalQty / sizes.length));

    const newRows: ProductRow[] = sizes.map((sz: string, idx: number) => ({
      id: `erp-row-${Date.now()}-${idx}`,
      orderNumber: order.orderNumber || order.mosCode || `ZAK-${idx + 1}`,
      code: `00-02482${idx + 3}`,
      name: `${brand} 100% Paxta ${color} ${sz}`,
      color,
      size: sz,
      barcode: formatToValidEan13(`46203368426${4 + idx}`),
      tnved: '6109100000',
      artikul: order.modelCode || '2342598',
      orderQty: qtyPerSize,
      printedBagQty: 0,
      printedTagQty: 0
    }));

    setProducts(newRows);
    if (newRows[0]) {
      handleSelectProduct(newRows[0]);
    }
    setShowImportModal(false);
    setPrintNotice(lang === 'uz' ? `"${brand}" buyurtmasi stikerlar uchun yuklandi!` : `Заказ "${brand}" загружен для печати бирок!`);
    setTimeout(() => setPrintNotice(null), 3000);
  };

  // Stikerlar hisobot Excel jadvalini yuklab olish
  const handleExportAccountingExcel = () => {
    const exportData = products.map((item, index) => {
      const buyurtma = item.orderQty || 0;
      const chopEtilgan = item.printedTagQty || 0;
      const qoldiq = Math.max(0, buyurtma - chopEtilgan);
      const foiz = buyurtma > 0 ? Math.min(100, Math.round((chopEtilgan / buyurtma) * 100)) : 100;

      return {
        '№': index + 1,
        'Заказ №': item.orderNumber,
        'Код 1С': item.code,
        'Модель / Наименование': item.name,
        'Цвет': item.color,
        'Размер': item.size,
        'Артикул': item.artikul,
        'Штрихкод (EAN-13)': item.barcode,
        'Количество (Заказ)': buyurtma,
        'Напечатано': chopEtilgan,
        'Остаток': qoldiq,
        'Готовность (%)': `${foiz}%`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stiker_Hisoboti');
    XLSX.writeFile(workbook, `Chust_Stiker_Hisoboti_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Stikerni xotiraga saqlash
  const handleSaveStickerToFolder = () => {
    const activeFolder = folders.find(f => f.id === activeFolderId) || folders[0];
    const newTemplate: SavedStickerTemplate = {
      id: `tmpl-${Date.now()}`,
      folderId: activeFolder.id,
      name: `${labelData.productName} (${labelData.sizeTitle}).lbl`,
      data: { ...labelData },
      savedAt: new Date().toLocaleString()
    };

    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    try {
      localStorage.setItem('tex_erp_hangtag_templates', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    setPrintNotice(lang === 'uz' ? `Stiker "${activeFolder.name}" papkasiga saqlandi!` : `Этикетка сохранена в папку "${activeFolder.name}"!`);
    setTimeout(() => setPrintNotice(null), 3000);
  };

  // Yangi parvarish belgisini qo'shish
  const handleAddNewCareSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbolName.trim()) return;

    let svgToSave = newSymbolSvgCode.trim();
    if (!svgToSave) {
      svgToSave = `
        <rect x="6" y="6" width="36" height="36" rx="6" fill="none" stroke="currentColor" stroke-width="2.5"/>
        <text x="24" y="28" font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="currentColor">
          ${newSymbolName.slice(0, 4)}
        </text>
      `;
    }

    const orderMap: Record<string, number> = {
      wash: 1, bleach: 2, dry: 3, iron: 4, clean: 5, cert: 6
    };

    const customSym: CareSymbol = {
      id: `custom_${Date.now()}`,
      category: newSymbolCategory,
      order: orderMap[newSymbolCategory] || 3,
      nameUz: newSymbolName,
      nameRu: newSymbolName,
      svgPath: svgToSave,
      isCustom: true
    };

    saveCustomCareSymbol(customSym);
    setCareSymbols(getAllCareSymbols());
    setShowAddSymbolModal(false);
    setNewSymbolName('');
    setNewSymbolSvgCode('');
    setPrintNotice(lang === 'uz' ? "Yangi parvarish belgisi muvaffaqiyatli qo'shildi!" : "Новый знак ухода добавлен!");
    setTimeout(() => setPrintNotice(null), 3000);
  };

  // Hisob-kitoblar (Oddiy to'g'ridan-to'g'ri chop etish hisobi)
  const totalProductsCount = products.reduce((sum, p) => sum + (p.orderQty || 0), 0);
  const totalPrintedCount = products.reduce((sum, p) => sum + (p.printedTagQty || 0), 0);
  const totalRemainingCount = Math.max(0, totalProductsCount - totalPrintedCount);

  return (
    <div className="space-y-4 text-slate-100" id="label-designer-root">
      
      {/* 1. TOP HEADER - Стикеры / Stikerlar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Chap tomon: Neon badge va sarlavha */}
        <div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-950 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2.5 text-cyan-400 font-bold tracking-wide">
              <Tag className="w-5 h-5 text-cyan-400" />
              <span className="text-sm md:text-base font-extrabold text-cyan-300">
                {lang === 'uz' ? 'Stikerlar' : 'Стикеры'}
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono font-bold">
              {labelData.labelWidthMm || 40} x {labelData.labelHeightMm || 58} mm
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            {lang === 'uz' 
              ? "Termo stiker konstruktori (40x58 mm), OCR shtrix-kod skaneri va ommaviy Excel generatori"
              : "Конструктор термо-этикеток (40x58 мм), сканер штрих-кодов и пакетный генератор"}
          </p>
        </div>

        {/* O'ng tomon: 4 ta Asosiy Bo'lim Tabi */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setMainViewMode('designer')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mainViewMode === 'designer'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              <span>{lang === 'uz' ? '1. Konstruktor' : '1. Конструктор'}</span>
            </button>

            <button
              onClick={() => setMainViewMode('barcode_ocr')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mainViewMode === 'barcode_ocr'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarcodeIcon className="w-4 h-4" />
              <span>{lang === 'uz' ? '2. Shtrix-kod & OCR' : '2. Штрих-коды и OCR'}</span>
            </button>

            <button
              onClick={() => setMainViewMode('bulk_import')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mainViewMode === 'bulk_import'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{lang === 'uz' ? '3. Excel Import' : '3. Пакетный импорт'}</span>
            </button>

            <button
              onClick={() => setMainViewMode('printcenter')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                mainViewMode === 'printcenter'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'uz' ? '4. Jurnal' : '4. Журнал'}</span>
            </button>
          </div>

          {/* Asosiy Tezkor Chop Etish Tugmasi (2X degan so'zlar olib tashlangan) */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/60 cursor-pointer border border-emerald-400/50 hover:scale-102 active:scale-95"
            title="Stikerni kompyuterdagi printerga chop etish oynasini ochish"
          >
            <Printer className="w-4 h-4 text-emerald-100" />
            <span>{lang === 'uz' ? 'PRINTERGA CHOP ETISH' : 'ПЕЧАТЬ НА ПРИНТЕР'}</span>
          </button>

          {/* Chop Etish Sozlamalari (Print Settings & Calibration Modal) */}
          <button
            onClick={() => setShowPrintSettingsModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Printer sozlamalari, kalibratsiya (X/Y) va stiker o'lchamlari"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{lang === 'uz' ? 'Sozlamalar' : 'Настройки'}</span>
          </button>

          {/* Papkalar o'ng panelini ochish/yopish tugmasi */}
          <button
            onClick={() => setIsFolderSidebarOpen(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isFolderSidebarOpen
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
            }`}
            title="O'ng tarafdagi stikerlar papkasini ochish yoki yopish"
          >
            <Folder className="w-4 h-4 text-amber-400" />
            <span>{lang === 'uz' ? 'Papkalar' : 'Папки'}</span>
            <span className="px-1.5 py-0.2 bg-slate-950 text-cyan-400 rounded-full text-[10px] font-mono border border-slate-700">
              {savedTemplates.length}
            </span>
          </button>
        </div>
      </div>

      {/* Xabarnoma / Muvaffaqiyat statusi */}
      {printNotice && (
        <div className="p-3 bg-cyan-950/70 border border-cyan-500/40 rounded-xl flex items-center gap-2.5 text-cyan-300 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{printNotice}</span>
        </div>
      )}

      {/* =========================================================================
          REJIM 1: STIKER KONSTRUKTORI (3-USTUNLI TIZIM: FORMA | STIKER | PAPKALAR)
         ========================================================================= */}
      {mainViewMode === 'designer' && (
        <div className="flex flex-col xl:flex-row gap-4 items-start w-full">
          
          {/* 1-USTUN (Left): STIKER TAYYORLASH MAYDONI (Forma va Sozlamalar) */}
          <div className="w-full xl:w-[410px] 2xl:w-[450px] shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5 max-h-[88vh] overflow-y-auto pr-1">
            
            {/* Sarlavha va Katta Yashil Chop Etish Tugmasi */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Stiker Tayyorlash Maydoni</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-lg text-xs shadow-md shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer border border-emerald-400/40"
                title="Kompyuterdagi printerga to'g'ridan-to'g'ri chop etish"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-200" />
                <span>Chop Etish</span>
              </button>
            </div>

            {/* Subtabs: Razmer & Matn / Поставщик & Шрифт / Shtrix-kod / Belgilar */}
            <div className="grid grid-cols-4 bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveToolTab('size')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer truncate ${
                  activeToolTab === 'size' ? 'bg-cyan-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Razmer va mahsulot parametrlari"
              >
                <Tag className="w-3 h-3 shrink-0" />
                <span>Razmer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('supplier')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer truncate ${
                  activeToolTab === 'supplier' ? 'bg-cyan-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Yetkazib beruvchi korxona va shrift sozlamalari"
              >
                <Building2 className="w-3 h-3 shrink-0" />
                <span>Korxona</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('barcode')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer truncate ${
                  activeToolTab === 'barcode' ? 'bg-cyan-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="EAN-13 shtrix-kod va EAC belgisi"
              >
                <BarcodeIcon className="w-3 h-3 shrink-0" />
                <span>Shtrix-kod</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('care')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer truncate ${
                  activeToolTab === 'care' ? 'bg-cyan-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="ISO 3758 parvarish belgilari"
              >
                <span>🧺 Belgilar</span>
              </button>
            </div>

            {/* TAB 1: RAZMER, O'LCHAM VA MATNLAR (5-rasmdagi aynan talab) */}
            {activeToolTab === 'size' && (
              <div className="space-y-3 text-xs animate-fadeIn">
                
                {/* 1. KIYIM RAZMERINI QO'LDA KIRITISH (5-rasm) */}
                <div className="p-3 bg-slate-950 border border-amber-800/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kiyim razmeri (qo'lda kiritish):</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Stikerdagi katta yozuv</span>
                  </div>

                  <input
                    type="text"
                    value={labelData.sizeTitle}
                    onChange={(e) => setLabelData({ ...labelData, sizeTitle: e.target.value })}
                    placeholder="Masalan: Размер XS yoki Размер 48-50"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-sm focus:border-amber-400 focus:outline-none"
                  />

                  {/* Papkada bor va tanlangan stiker razmerlari (5-rasm talabi) */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Papkada bor va tanlangan stiker razmerlari:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {availableSizes.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setLabelData({ ...labelData, sizeTitle: `Размер ${sz}` })}
                          className={`px-2 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                            labelData.sizeTitle === `Размер ${sz}` || labelData.sizeTitle === sz
                              ? 'bg-amber-400 text-slate-950 shadow-sm scale-105'
                              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. STIKER O'LCHAMINI QO'LDA KIRITISH (MILLIMETRDA) */}
                <div className="p-3 bg-slate-950 border border-cyan-800/60 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Stiker o'lchami (qo'lda kiritish):</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Eni x Bo'yi (mm)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Eni (mm):</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={labelData.labelWidthMm || 40}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setLabelData({ ...labelData, labelWidthMm: isNaN(val) ? 0 : val });
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center text-sm font-black text-cyan-300 font-mono"
                      />
                    </div>

                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <label className="text-[10px] font-bold text-slate-300 block mb-0.5">Bo'yi (mm):</label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={labelData.labelHeightMm || 58}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setLabelData({ ...labelData, labelHeightMm: isNaN(val) ? 0 : val });
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center text-sm font-black text-cyan-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* Tezkor andaza tugmalari */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {[
                      { name: '40x58 mm ⭐', w: 40, h: 58 },
                      { name: '58x40 mm', w: 58, h: 40 },
                      { name: '58x70 mm', w: 58, h: 70 },
                      { name: '50x80 mm', w: 50, h: 80 }
                    ].map(sz => (
                      <button
                        key={sz.name}
                        type="button"
                        onClick={() => setLabelData({ ...labelData, labelWidthMm: sz.w, labelHeightMm: sz.h })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          labelData.labelWidthMm === sz.w && labelData.labelHeightMm === sz.h
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {sz.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. MAHSULOTNING MATNLI MA'LUMOTLARI */}
                <div className="space-y-2">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Mahsulot nomi (Модель):</label>
                    <input
                      type="text"
                      value={labelData.productName}
                      onChange={(e) => setLabelData({ ...labelData, productName: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      placeholder="Футболка мужская SC"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Rang:</label>
                      <input
                        type="text"
                        value={labelData.color}
                        onChange={(e) => setLabelData({ ...labelData, color: e.target.value })}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                        placeholder="Цвет: белый"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Artikul:</label>
                      <input
                        type="text"
                        value={labelData.artikul}
                        onChange={(e) => setLabelData({ ...labelData, artikul: e.target.value })}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                        placeholder="Арт. 02618"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Tarkibi (Состав):</label>
                    <input
                      type="text"
                      value={labelData.composition}
                      onChange={(e) => setLabelData({ ...labelData, composition: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      placeholder="Состав: 100% хлопок"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: YETKAZIB BERUVCHI VA SHRIFT SOZLAMALARI */}
            {activeToolTab === 'supplier' && (
              <div className="space-y-3.5 text-xs animate-fadeIn">
                
                {/* 1. YETKAZIB BERUVCHINI TANLASH (ТЗ TALABI: «Сфера», «Престиж плюс», «Sab collection») */}
                <div className="p-3 bg-slate-950 border border-indigo-800/60 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Yetkazib beruvchi korxona (Поставщик):</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Avto-manzil</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {PREDEFINED_SUPPLIERS.map(sup => {
                      const isSelected = labelData.selectedSupplierId === sup.id || labelData.supplier === sup.address;
                      return (
                        <button
                          key={sup.id}
                          type="button"
                          onClick={() => {
                            setLabelData(prev => ({
                              ...prev,
                              selectedSupplierId: sup.id,
                              supplier: sup.address
                            }));
                            setPrintNotice(lang === 'uz' ? `"${sup.shortLabel}" manzili o'rnatildi!` : `Адрес "${sup.shortLabel}" установлен!`);
                            setTimeout(() => setPrintNotice(null), 2500);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-xs block text-cyan-300">{sup.shortLabel}</span>
                            <span className="text-[10.5px] text-slate-400 block truncate max-w-[280px] mt-0.5">{sup.address}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1">
                    <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                      Stikerdagi to'liq matn (tahrirlash mumkin):
                    </label>
                    <textarea
                      rows={3}
                      value={labelData.supplier}
                      onChange={(e) => setLabelData({ ...labelData, supplier: e.target.value, selectedSupplierId: 'custom' })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px] font-mono leading-tight"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                      Ishlab chiqaruvchi korxona (Изготовитель):
                    </label>
                    <textarea
                      rows={2}
                      value={labelData.manufacturer}
                      onChange={(e) => setLabelData({ ...labelData, manufacturer: e.target.value })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px] font-mono leading-tight"
                    />
                  </div>
                </div>

                {/* 2. SHRIFT VA MASSHTAB BOSHQARUVI (CONSTRUCTOR FONT CONTROLS & SCALING) */}
                <div className="p-3 bg-slate-950 border border-cyan-800/60 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Shrift va Masshtab Boshqaruvi:</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">{labelData.fontScale || 100}%</span>
                  </div>

                  {/* Masshtab (Font Scaling) */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
                      <span>Shrift o'lchami masshtabi:</span>
                      <span className="font-mono text-cyan-300 font-bold">{labelData.fontScale || 100}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="70"
                        max="140"
                        step="5"
                        value={labelData.fontScale || 100}
                        onChange={(e) => setLabelData({ ...labelData, fontScale: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-cyan-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between gap-1 mt-1.5">
                      {[80, 90, 100, 110, 125].map(sc => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => setLabelData({ ...labelData, fontScale: sc })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                            (labelData.fontScale || 100) === sc
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sc}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shrift qalinligi (Font Weight) */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Shrift qalinligi (Weight):</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'normal', label: 'Oddiy (500)' },
                        { id: 'bold', label: 'Qalin (700)' },
                        { id: 'black', label: 'Ultra (900)' }
                      ].map(w => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setLabelData({ ...labelData, fontWeight: w.id as any })}
                          className={`py-1 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                            (labelData.fontWeight || 'bold') === w.id
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Harflar oralig'i (Letter Spacing) */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Harflar oralig'i (Spacing):</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'tight', label: 'Qisqa' },
                        { id: 'normal', label: 'Standart' },
                        { id: 'wide', label: 'Keng' }
                      ].map(sp => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => setLabelData({ ...labelData, letterSpacing: sp.id as any })}
                          className={`py-1 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                            (labelData.letterSpacing || 'normal') === sp.id
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {sp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 bg-cyan-950/40 rounded-lg border border-cyan-800/40 text-[10.5px] text-cyan-300 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      Avtomatik moslashuv: agar mahsulot nomi yoki ranglar uzun bo'lsa, stiker chegarasiga moslab shrift o'lchami avtomatik ixchamlashadi.
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: SHTRIX-KOD VA EAC SOZLAMALARI */}
            {activeToolTab === 'barcode' && (
              <div className="space-y-3.5 text-xs animate-fadeIn">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Shtrix-kod Raqami (EAN-13):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={labelData.barcode}
                      onChange={(e) => setLabelData({ ...labelData, barcode: e.target.value })}
                      className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const base12 = labelData.barcode.replace(/\D/g, '').slice(0, 12);
                        if (base12.length === 12) {
                          const check = calculateEan13CheckDigit(base12);
                          setLabelData({ ...labelData, barcode: base12 + check });
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                      title="Nazorat sonini hisoblash"
                    >
                      Nazorat soni
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Shtrix-kod balandligi:</span>
                    <span className="font-mono text-cyan-400 font-bold">{labelData.barcodeHeightMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={labelData.barcodeHeightMm}
                    onChange={(e) => setLabelData({ ...labelData, barcodeHeightMm: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Chiziq qalinligi (Corel Module Width):</span>
                    <span className="font-mono text-cyan-400 font-bold">{labelData.barcodeModuleWidth}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="2.5"
                    step="0.1"
                    value={labelData.barcodeModuleWidth}
                    onChange={(e) => setLabelData({ ...labelData, barcodeModuleWidth: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={labelData.showBarcodeText}
                      onChange={(e) => setLabelData({ ...labelData, showBarcodeText: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Ostida raqamlarni ko'rsatish (EAN-13)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={labelData.showEac}
                      onChange={(e) => setLabelData({ ...labelData, showEac: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>EAC muvofiqlik belgisini yoniga qo'yish</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: PARVARISH BELGILARI */}
            {activeToolTab === 'care' && (
              <div className="space-y-3 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Parvarish Belgilari (ISO 3758)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSymbolModal(true)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Yangi belgi qo'shish</span>
                  </button>
                </div>

                {/* Kategoriyalar */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'Barchasi' },
                    { id: 'wash', label: 'Yuvish' },
                    { id: 'bleach', label: 'Oqartirish' },
                    { id: 'dry', label: 'Quritish' },
                    { id: 'iron', label: 'Dazmol' },
                    { id: 'clean', label: 'Kimyoviy' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(c.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer ${
                        selectedCategoryFilter === c.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Belgilar paneli */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {careSymbols
                    .filter(s => selectedCategoryFilter === 'all' || s.category === selectedCategoryFilter)
                    .map(symbol => {
                      const isSelected = labelData.careSymbolIds.includes(symbol.id);
                      return (
                        <button
                          key={symbol.id}
                          type="button"
                          onClick={() => handleToggleCareSymbol(symbol.id)}
                          className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer relative group ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                          title={`${symbol.nameRu} (${symbol.nameUz})`}
                        >
                          <div className="w-7 h-7">
                            <svg 
                              viewBox={symbol.viewBox || "0 0 48 48"} 
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ __html: symbol.svgPath }}
                            />
                          </div>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-cyan-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Pastki Harakatlar Paneli */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs shadow-xl shadow-emerald-950/70 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 border border-emerald-400/50"
              >
                <Printer className="w-4 h-4 text-emerald-100" />
                <span>🖨️ KOMPYUTERDAGI PRINTERGA CHOP ETISH</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveStickerToFolder}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>💾 Joriy Stikerni Saqlash</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLabelData(DEFAULT_LABEL_DATA);
                    setPrintNotice("Standart andaza tiklandi!");
                    setTimeout(() => setPrintNotice(null), 2500);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Standart andazaga qaytarish"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Qaytarish</span>
                </button>
              </div>
            </div>

          </div>

          {/* 2-USTUN: COREL-LIKE KATTA ISHCHI CANVAS MAYDONI (ZOOM, PAN, GRID, DIRECT EDIT) */}
          <div className="flex-1 min-w-0 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[720px]">
            
            {/* Dinamik Printer Kalibratsiyasi va O'lcham Stili (@media print) */}
            <style>
              {`
                @media print {
                  @page {
                    size: ${printerSettings.labelWidthMm || labelData.labelWidthMm || 40}mm ${printerSettings.labelHeightMm || labelData.labelHeightMm || 58}mm !important;
                    margin: 0 !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-product-label, #printable-product-label * {
                    visibility: visible !important;
                  }
                  #printable-product-label {
                    position: fixed !important;
                    left: ${printerSettings.offsetXmm || 0}mm !important;
                    top: ${printerSettings.offsetYmm || 0}mm !important;
                    width: ${printerSettings.labelWidthMm || labelData.labelWidthMm || 40}mm !important;
                    height: ${printerSettings.labelHeightMm || labelData.labelHeightMm || 58}mm !important;
                    max-width: ${printerSettings.labelWidthMm || labelData.labelWidthMm || 40}mm !important;
                    max-height: ${printerSettings.labelHeightMm || labelData.labelHeightMm || 58}mm !important;
                    margin: 0 !important;
                    padding: ${printerSettings.paddingMm ?? 2}mm !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                    z-index: 999999 !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    transform: none !important;
                    filter: ${
                      printerSettings.darknessContrast === 'ultra'
                        ? 'contrast(200%) grayscale(100%)'
                        : printerSettings.darknessContrast === 'high'
                        ? 'contrast(140%) grayscale(100%)'
                        : 'grayscale(100%)'
                    } !important;
                  }
                }
              `}
            </style>

            {/* Corel-like Toolbar: Zoom, Pan, Grid, Direct Edit Tooltips */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.15))}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Kichiklashtirish (Zoom Out)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="px-2 font-mono font-bold text-cyan-300 text-[11px] min-w-[50px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(2.2, prev + 0.15))}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Kattalashtirish (Zoom In)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setZoomLevel(1.0); setPanOffset({ x: 0, y: 0 }); }}
                    className="px-2 py-1 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer font-semibold border-l border-slate-800"
                    title="100% masshtabga qaytarish"
                  >
                    100%
                  </button>

                  <button
                    type="button"
                    onClick={() => { setZoomLevel(1.25); setPanOffset({ x: 0, y: 0 }); }}
                    className="px-2 py-1 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer font-bold border-l border-slate-800"
                    title="Ekranga moslash"
                  >
                    Moslash
                  </button>
                </div>

                {/* Grid Guides Toggle */}
                <button
                  type="button"
                  onClick={() => setShowGridGuides(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                    showGridGuides
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Millimetr chizg'ich va setkani ko'rsatish/yashirish"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Setka</span>
                </button>

                {/* Pan Tool Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPanMode(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                    isPanMode
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Qo'l vositasi (Canvasni siljitish)"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Qo'l</span>
                </button>
              </div>

              {/* Status and Dimensions Badge */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
                  Hajmi: <strong className="text-white">{labelData.labelWidthMm || 40}x{labelData.labelHeightMm || 58} mm</strong>
                </span>

                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Termo Standart</span>
                </span>
              </div>
            </div>

            {/* Canvas Viewport (CorelDRAW uslubidagi maydon) */}
            <div 
              className={`flex-1 relative overflow-auto p-8 flex items-center justify-center min-h-[580px] bg-slate-950/90 select-none ${
                isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              } ${showGridGuides ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]' : ''}`}
              onMouseDown={(e) => {
                if (isPanMode) {
                  setIsDraggingCanvas(true);
                  dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
                }
              }}
              onMouseMove={(e) => {
                if (isDraggingCanvas && isPanMode) {
                  setPanOffset({
                    x: e.clientX - dragStartRef.current.x,
                    y: e.clientY - dragStartRef.current.y
                  });
                }
              }}
              onMouseUp={() => setIsDraggingCanvas(false)}
              onMouseLeave={() => setIsDraggingCanvas(false)}
            >

              {/* Millimetr chizg'ich ko'rsatkichi (showGridGuides yoqilganida) */}
              {showGridGuides && (
                <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400/80 bg-slate-900/90 border border-cyan-800/40 px-2 py-1 rounded pointer-events-none">
                  X: {panOffset.x}px | Y: {panOffset.y}px | Scale: {Math.round(zoomLevel * 100)}%
                </div>
              )}

              {/* OQ TERMOQOG'OZ STIKER - KATTA, TOZA VA BEVOSITA TAHRIRLANADIGAN ELEMENTLAR */}
              <div 
                id="printable-product-label"
                className="bg-white text-black shadow-2xl p-4 flex flex-col justify-between relative transition-transform duration-75 ease-out"
                style={{
                  width: `${Math.round((printerSettings.labelWidthMm || labelData.labelWidthMm || 40) * 7.4)}px`,
                  minHeight: `${Math.round((printerSettings.labelHeightMm || labelData.labelHeightMm || 58) * 7.4)}px`,
                  borderRadius: '2px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  padding: `${(printerSettings.paddingMm ?? 2) * 4}px`,
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* 1. Yuqori qism: Katta O'lcham, Model, Rang, Artikul, Tarkib */}
                <div className="text-center space-y-1">
                  
                  {/* Katta O'lcham (Click to edit) */}
                  <div 
                    onClick={() => { setActiveToolTab('size'); setActiveSelectedField('size'); }}
                    className="cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-cyan-500 rounded px-1 transition-all group relative"
                    title="Bosing: Kiyim razmerini tahrirlash"
                  >
                    <h1 
                      style={getScaledText(labelData.sizeTitle, 24, 12)}
                      className="font-black text-black tracking-tight leading-none mb-1 text-center"
                    >
                      {labelData.sizeTitle}
                    </h1>
                  </div>

                  {/* Mahsulot nomi (Click to edit & auto-scale) */}
                  <div 
                    onClick={() => { setActiveToolTab('size'); setActiveSelectedField('name'); }}
                    className="cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-cyan-500 rounded px-1 transition-all group relative"
                    title="Bosing: Mahsulot nomini tahrirlash"
                  >
                    <h2 
                      style={getScaledText(labelData.productName, 15, 24)}
                      className="font-extrabold text-black text-center"
                    >
                      {labelData.productName}
                    </h2>
                  </div>

                  {/* Rang (Click to edit) */}
                  <div 
                    onClick={() => { setActiveToolTab('size'); setActiveSelectedField('color'); }}
                    className="cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-cyan-500 rounded px-1 transition-all text-center"
                    title="Bosing: Rangni tahrirlash"
                  >
                    <span 
                      style={getScaledText(labelData.color, 13.5, 18)} 
                      className="font-extrabold text-black"
                    >
                      {labelData.color}
                    </span>
                  </div>

                  {/* Artikul (Click to edit) */}
                  <div 
                    onClick={() => { setActiveToolTab('size'); setActiveSelectedField('artikul'); }}
                    className="cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-cyan-500 rounded px-1 transition-all text-center"
                    title="Bosing: Artikulni tahrirlash"
                  >
                    <span 
                      style={getScaledText(labelData.artikul, 15.5, 14)} 
                      className="font-black text-black"
                    >
                      {labelData.artikul}
                    </span>
                  </div>

                  {/* Tarkibi (Click to edit) */}
                  <div 
                    onClick={() => { setActiveToolTab('size'); setActiveSelectedField('comp'); }}
                    className="cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-cyan-500 rounded px-1 transition-all text-center"
                    title="Bosing: Tarkibni tahrirlash"
                  >
                    <span 
                      style={getScaledText(labelData.composition, 11.5, 26)} 
                      className="font-semibold text-black"
                    >
                      {labelData.composition}
                    </span>
                  </div>
                </div>

                {/* 2. O'rta qism: Standartlar, Ishlab chiqaruvchi, Yetkazib beruvchi */}
                <div 
                  onClick={() => { setActiveToolTab('supplier'); setActiveSelectedField('supplier'); }}
                  className="text-center space-y-0.5 my-1.5 cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-indigo-500 rounded px-1 transition-all"
                  title="Bosing: Yetkazib beruvchi va korxona ma'lumotlarini tahrirlash"
                >
                  <div 
                    style={getScaledText(labelData.compliance, 9.5, 45)} 
                    className="font-black uppercase tracking-tight text-black leading-tight"
                  >
                    {labelData.compliance}
                  </div>

                  <div 
                    style={getScaledText(labelData.shelfLife, 9, 32)} 
                    className="font-semibold text-black leading-tight"
                  >
                    {labelData.shelfLife}
                  </div>

                  <div 
                    style={getScaledText(labelData.manufactureDate, 9, 32)} 
                    className="font-semibold text-black leading-tight"
                  >
                    {labelData.manufactureDate}
                  </div>

                  <div 
                    style={getScaledText(labelData.manufacturer, 8.5, 65)} 
                    className="font-semibold text-black leading-tight whitespace-pre-line pt-0.5"
                  >
                    {labelData.manufacturer}
                  </div>

                  <div 
                    style={getScaledText(labelData.supplier, 8.5, 75)} 
                    className="font-bold text-black leading-tight whitespace-pre-line pt-0.5"
                  >
                    {labelData.supplier}
                  </div>
                </div>

                {/* 3. Parvarish belgilari: ketma-ket ISO belgilari (Click to edit) */}
                <div 
                  onClick={() => setActiveToolTab('care')}
                  className="py-2 flex items-center justify-center gap-3 sm:gap-4 cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-cyan-500 rounded transition-all"
                  title="Bosing: Parvarish belgilarini tahrirlash"
                >
                  {labelData.careSymbolIds.map(symId => {
                    const sym = careSymbols.find(s => s.id === symId);
                    if (!sym) return null;
                    return (
                      <div 
                        key={symId} 
                        className="w-8 h-8 sm:w-9 sm:h-9 text-black shrink-0 flex items-center justify-center"
                        title={sym.nameRu}
                      >
                        <svg 
                          viewBox={sym.viewBox || "0 0 48 48"} 
                          className="w-full h-full overflow-visible"
                          dangerouslySetInnerHTML={{ __html: sym.svgPath }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* 4. CorelDRAW Uslubidagi EAN-13 Shtrix-kod va EAC Logotipi */}
                <div 
                  onClick={() => setActiveToolTab('barcode')}
                  className="pt-1.5 flex items-start justify-between gap-2 px-0.5 cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-cyan-500 rounded transition-all"
                  title="Bosing: Shtrix-kod va EAC parametrlarini tahrirlash"
                >
                  
                  {/* Vector SVG EAN-13 Barcode */}
                  <div className="flex-1 flex flex-col items-center">
                    <svg 
                      width={ean13Data.totalWidth} 
                      height={ean13Data.totalHeight}
                      className="overflow-visible"
                    >
                      {/* Bars */}
                      {ean13Data.bars.map((bar, idx) => (
                        <rect
                          key={idx}
                          x={bar.x}
                          y={0}
                          width={bar.width}
                          height={bar.height}
                          fill="#000000"
                        />
                      ))}

                      {/* Ostidagi raqamlar */}
                      {labelData.showBarcodeText && ean13Data.digitsList.map((d, dIdx) => (
                        <text
                          key={dIdx}
                          x={d.x}
                          y={d.y}
                          fontFamily="Arial, Helvetica, sans-serif"
                          fontSize={labelData.barcodeFontSize || 11}
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="#000000"
                        >
                          {d.char}
                        </text>
                      ))}
                    </svg>
                  </div>

                  {/* EAC belgisi */}
                  {labelData.showEac && (
                    <div 
                      className="text-black flex flex-col items-center justify-start shrink-0 pt-0.5"
                      style={{ 
                        width: `${Math.round(ean13Data.dataBottomY * 0.88)}px`,
                        height: `${ean13Data.dataBottomY}px`
                      }}
                      title="Знак соответствия ЕАС (Евразийское соответствие)"
                    >
                      <svg 
                        viewBox="0 0 54 60" 
                        className="w-full h-full select-none overflow-visible"
                      >
                        <g fill="#000000">
                          {/* E */}
                          <path d="M0 0 h16 v6 h-10 v21 h9 v6 h-9 v21 h10 v6 h-16 Z" />
                          {/* A */}
                          <path d="M19 0 h16 v60 h-6 v-27 h-4 v27 h-6 Z M25 6 h4 v15 h-4 Z" />
                          {/* C */}
                          <path d="M38 0 h16 v6 h-10 v48 h10 v6 h-16 Z" />
                        </g>
                      </svg>
                    </div>
                  )}

                </div>

              </div>
            </div>

            {/* Pastki Katta Tezkor Tugmalar Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveStickerToFolder}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Stikerni Saqlash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLabelData(DEFAULT_LABEL_DATA);
                    setPrintNotice("Standart andaza tiklandi!");
                    setTimeout(() => setPrintNotice(null), 2500);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-semibold flex items-center gap-1 cursor-pointer"
                  title="Standart andazaga qaytarish"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Qaytarish</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintSettingsModal(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <span>Printer Sozlamalari</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer border border-emerald-400/40"
                >
                  <Printer className="w-4 h-4 text-emerald-100" />
                  <span>PRINTERGA CHOP ETISH</span>
                </button>
              </div>
            </div>

          </div>

          {/* 3-USTUN: O'NG CHEKKA IXCHAM PAPKALAR SIDEBARI ("Stikerlar Papkalari") */}
          {isFolderSidebarOpen && (
            <div className="w-full xl:w-84 2xl:w-88 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl flex flex-col h-[750px] animate-fadeIn">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">Stikerlar Papkalari</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFolderSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Papkalar panelini yopish"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <StickerFileExplorer
                  folders={folders}
                  setFolders={setFolders}
                  savedTemplates={savedTemplates}
                  setSavedTemplates={setSavedTemplates}
                  activeFolderId={activeFolderId}
                  setActiveFolderId={setActiveFolderId}
                  currentLabelData={labelData}
                  onLoadTemplate={(template) => {
                    setLabelData({ ...template.data });
                    setActiveTemplateId(template.id);
                    setActiveFileName(template.name);
                    setPrintNotice(lang === 'uz' ? `"${template.name}" stikeri ochildi!` : `Этикетка "${template.name}" открыта!`);
                    setTimeout(() => setPrintNotice(null), 3000);
                  }}
                  activeTemplateId={activeTemplateId}
                  lang={lang}
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          REJIM 2: SHTRIX-KODLAR VA OCR SKANER MODULI (INTEGRATSIYA QILINGAN)
         ========================================================================= */}
      {mainViewMode === 'barcode_ocr' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <BarcodeIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  {lang === 'uz' ? 'GS1-128 / SSCC Shtrix-kod va OCR Etiketkalar Markazi' : 'Центр штрих-кодов и OCR этикеток (GS1-128 / SSCC)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'uz' ? 'Kamera yoki rasm yuklash orqali shtrix-kodlarni avtomatik aniqlash va PDF generatsiya qilish' : 'Автоматическое распознавание через камеру/фото и генерация этикеток'}
                </p>
              </div>
            </div>
          </div>

          <BarcodeLabelsView />
        </div>
      )}

      {/* =========================================================================
          REJIM 3: EXCEL ORQALI OMMAVIY YUKLASH VA HAR BIR RAZMERGA NOYOB EAN-13 GENERATSIYA
         ========================================================================= */}
      {mainViewMode === 'bulk_import' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top Banner Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ommaviy Nomenklatura Importi (.xlsx / .xls)</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {lang === 'uz' ? "Barcha Razmerlarni Bir Vaqtda Yuklash va Noyob EAN-13 Yaratish" : "Пакетная загрузка номенклатуры и генерация уникальных EAN-13"}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {lang === 'uz'
                    ? "Excel fayldan barcha razmerlar (XS, S, M, L, XL, 2XL) birdaniga yuklanganda, tizim har bir o'lcham uchun alohida stiker yaratadi va har biriga standart bo'yicha nazorat soni hisoblangan noyob EAN-13 shtrix-kodini biriktiradi."
                    : "При загрузке строки с размерами из Excel система автоматически генерирует индивидуальный стикер на каждый размер с уникальным валидным кодом EAN-13."}
                </p>
              </div>

              {/* Upload and Sample Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  title="Namunaviy Excel shablonini yuklab olish"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'uz' ? 'Excel Namuna' : 'Шаблон Excel'}</span>
                </button>

                <label className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-950/60 flex items-center gap-2 cursor-pointer transition-transform active:scale-95 border border-cyan-400/50">
                  <UploadCloud className="w-4 h-4" />
                  <span>{lang === 'uz' ? 'Excel Yuklash (.xlsx)' : 'Загрузить Excel (.xlsx)'}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBulkExcelUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Generated Stickers List */}
          {bulkStickers.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  {lang === 'uz' ? "Hozircha ommaviy stikerlar generatsiya qilinmagan" : "Пока нет сгенерированных пакетных стикеров"}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {lang === 'uz'
                    ? "Yuqoridagi 'Excel Yuklash' tugmasi orqali nomenklatura jadvalini yuklang yoki namunani sinab ko'ring."
                    : "Загрузите файл Excel через кнопку выше, чтобы сгенерировать стикеры для каждого размера."}
                </p>
              </div>

              {/* Demo test button */}
              <button
                type="button"
                onClick={() => {
                  const demoSizes = ['XS/88', 'S/92', 'M/96', 'L/100', 'XL/104', '2XL/108', '3XL/112'];
                  const generated = demoSizes.map((sz, idx) => {
                    const base12 = `462033${String(614200 + idx)}`;
                    const checkD = calculateEan13CheckDigit(base12);
                    return {
                      id: `demo-bulk-${idx}`,
                      modelName: 'Футболка мужская SC 100% ХБ',
                      artikul: '02618',
                      color: 'Белый / Хаки',
                      size: sz,
                      composition: '100% хлопок',
                      barcode: `${base12}${checkD}`,
                      supplier: labelData.supplier,
                      qty: 250,
                      checked: true
                    };
                  });
                  setBulkStickers(generated);
                  setPrintNotice(lang === 'uz' ? "Namunaviy razmerlar to'plami yaratildi!" : "Демонстрационный набор размеров создан!");
                  setTimeout(() => setPrintNotice(null), 3000);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>{lang === 'uz' ? "Namunaviy to'plamni sinash (Demo)" : "Протестировать демо-набор"}</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">
                    {lang === 'uz' ? "Yaratilgan stikerlar:" : "Сгенерировано стикеров:"} <strong className="text-cyan-400 font-mono text-sm">{bulkStickers.length} ta</strong>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({bulkStickers.filter(s => s.checked).length} ta tanlangan)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Select All / Deselect */}
                  <button
                    type="button"
                    onClick={() => {
                      const allChecked = bulkStickers.every(s => s.checked);
                      setBulkStickers(prev => prev.map(s => ({ ...s, checked: !allChecked })));
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {bulkStickers.every(s => s.checked) 
                      ? (lang === 'uz' ? 'Barchasini bekor qilish' : 'Снять выбор') 
                      : (lang === 'uz' ? 'Barchasini tanlash' : 'Выбрать все')}
                  </button>

                  {/* Print Selected */}
                  <button
                    type="button"
                    onClick={() => {
                      const selected = bulkStickers.filter(s => s.checked);
                      if (selected.length === 0) {
                        alert(lang === 'uz' ? "Chop etish uchun stiker tanlanmagan!" : "Не выбрано ни одного стикера!");
                        return;
                      }
                      if (selected[0]) {
                        setLabelData(prev => ({
                          ...prev,
                          sizeTitle: `Размер ${selected[0].size}`,
                          productName: selected[0].modelName,
                          color: `Цвет: ${selected[0].color}`,
                          artikul: `Арт. ${selected[0].artikul}`,
                          barcode: selected[0].barcode
                        }));
                        setShowPrintModal(true);
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer border border-emerald-400/40"
                  >
                    <Printer className="w-4 h-4 text-emerald-100" />
                    <span>{lang === 'uz' ? "Tanlanganlarni chop etish" : "Печать выбранных"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkStickers([])}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    title="Tozalash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {bulkStickers.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                      item.checked
                        ? 'bg-slate-950/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setBulkStickers(prev => prev.map(s => s.id === item.id ? { ...s, checked } : s));
                          }}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                        />
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-xs font-mono">
                          {item.size}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.qty} dona
                      </span>
                    </div>

                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-white truncate" title={item.modelName}>{item.modelName}</div>
                      <div className="text-[11px] text-slate-300">Rang: <strong>{item.color}</strong> • Арт: <strong>{item.artikul}</strong></div>
                      <div className="text-[11px] text-cyan-300 font-mono font-bold tracking-wider pt-1">{item.barcode}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLabelData(prev => ({
                            ...prev,
                            sizeTitle: `Размер ${item.size}`,
                            productName: item.modelName,
                            color: `Цвет: ${item.color}`,
                            artikul: `Арт. ${item.artikul}`,
                            barcode: item.barcode,
                            composition: item.composition ? `Состав: ${item.composition}` : prev.composition
                          }));
                          setMainViewMode('designer');
                          setPrintNotice(lang === 'uz' ? `"${item.size}" o'lchamli stiker konstruktorga ochildi!` : `Этикетка "${item.size}" открыта в конструкторе!`);
                          setTimeout(() => setPrintNotice(null), 2500);
                        }}
                        className="text-[10.5px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{lang === 'uz' ? 'Konstruktorga ochish' : 'В конструктор'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLabelData(prev => ({
                            ...prev,
                            sizeTitle: `Размер ${item.size}`,
                            productName: item.modelName,
                            color: `Цвет: ${item.color}`,
                            artikul: `Арт. ${item.artikul}`,
                            barcode: item.barcode,
                            composition: item.composition ? `Состав: ${item.composition}` : prev.composition
                          }));
                          setShowPrintModal(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Chop</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          REJIM 4: CHOP ETILGAN STIKERLAR VA QOLDIQLAR JURNALI
         ========================================================================= */}
      {mainViewMode === 'printcenter' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <span className="text-slate-400 block text-[11px] font-semibold">Jami Mahsulotlar (Buyurtma)</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">{totalProductsCount.toLocaleString()} dona</span>
            </div>

            <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl shadow-lg bg-emerald-950/10">
              <span className="text-emerald-400 block text-[11px] font-semibold">Jami Chop Etilgan Stikerlar</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{totalPrintedCount.toLocaleString()} ta</span>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-lg bg-amber-950/10">
              <span className="text-amber-400 block text-[11px] font-semibold">Qoldiq Stikerlar</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{totalRemainingCount.toLocaleString()} ta</span>
            </div>
          </div>

          {/* CHOP ETISH VA HISOB JADVALI */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70">
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-tight flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Stikerlar Chop Etish va Qoldiqlar Jurnali</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mahsulotlar bo'yicha buyurtma miqdori, chop etilgan stikerlar va qoldiqlar hisobi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSampleExcel}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Excel namunaviy shablonini yuklab olish"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Excel Namuna</span>
                </button>

                <button
                  onClick={handleExportAccountingExcel}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel Jurnalni Yuklash</span>
                </button>
              </div>
            </div>

            {/* Jadval */}
            {products.length === 0 ? (
              <div className="p-10 text-center space-y-3 bg-slate-950/50">
                <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="text-white font-bold text-sm">Hozircha mahsulotlar mavjud emas</div>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Stikerlarni chop etish va jurnalda hisobini yuritish uchun Excel, Word yoki PDF orqali ma'lumotlarni qabul qiling.
                </p>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Ma'lumot Qabul Qilish (Excel / PDF / ERP)</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="p-3 text-center">№</th>
                      <th className="p-3">Model va O'lcham</th>
                      <th className="p-3">Rang</th>
                      <th className="p-3">Artikul</th>
                      <th className="p-3">Shtrix-kod (EAN-13)</th>
                      <th className="p-3 text-right">Buyurtma soni</th>
                      <th className="p-3 text-right text-emerald-400">Chop etilgan</th>
                      <th className="p-3 text-right text-amber-400">Qoldiq</th>
                      <th className="p-3 text-center">Holat</th>
                      <th className="p-3 text-center">Chop etish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {products.map((item, idx) => {
                      const buyurtma = item.orderQty || 0;
                      const chopEtildi = item.printedTagQty || 0;
                      const qoldiq = Math.max(0, buyurtma - chopEtildi);
                      const isFullyDone = chopEtildi >= buyurtma && buyurtma > 0;
                      const isSelected = item.id === selectedProductId;

                      return (
                        <tr 
                          key={item.id} 
                          className={`transition-colors ${
                            isSelected ? 'bg-cyan-500/10' : 'hover:bg-slate-800/50 bg-slate-900/40'
                          }`}
                        >
                          <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 rounded font-mono text-[10px]">
                                {item.size}
                              </span>
                              <span className="truncate max-w-[220px]" title={item.name}>{item.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{item.code} • {item.orderNumber}</span>
                          </td>
                          <td className="p-3 text-slate-300">{item.color}</td>
                          <td className="p-3 text-slate-300 font-mono">{item.artikul}</td>
                          <td className="p-3 font-mono text-cyan-300 font-semibold">{item.barcode}</td>
                          <td className="p-3 text-right font-bold text-white font-mono">{buyurtma}</td>
                          <td className="p-3 text-right font-black text-emerald-400 font-mono">{chopEtildi}</td>
                          <td className={`p-3 text-right font-bold font-mono ${qoldiq > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {qoldiq}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isFullyDone
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : chopEtildi > 0
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {isFullyDone ? 'Bajarildi' : chopEtildi > 0 ? 'Jarayonda' : 'Chop etilmagan'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                handleSelectProduct(item);
                                setShowPrintModal(true);
                              }}
                              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                            >
                              Pechat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}


      {/* =========================================================================
          MODAL: MA'LUMOT QABUL QILISH (ERP, EXCEL, WORD, PDF GEMINI AI)
         ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-cyan-400" />
                  <span>Ma'lumotlarni Tizimga Qabul Qilish</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ERP tizimidan, Excel, Word yoki PDF (Gemini AI orqali)
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Toggles */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-xs font-semibold">
              <button
                onClick={() => setImportSourceTab('excel')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  importSourceTab === 'excel' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>1. Excel orqali (.xlsx)</span>
              </button>

              <button
                onClick={() => setImportSourceTab('pdf')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  importSourceTab === 'pdf' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>2. PDF orqali (Gemini AI)</span>
              </button>

              <button
                onClick={() => setImportSourceTab('erp')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  importSourceTab === 'erp' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>3. ERP Tizimidan</span>
              </button>

              <button
                onClick={() => setImportSourceTab('word')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  importSourceTab === 'word' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>4. Word / Matn</span>
              </button>
            </div>

            {/* TAB 1: EXCEL QABUL QILISH */}
            {importSourceTab === 'excel' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Excel Jadvali Namuna Holati:</span>
                    <button
                      onClick={handleDownloadSampleExcel}
                      className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Namuna Faylni Yuklab Olish</span>
                    </button>
                  </div>

                  {/* Namuna table */}
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-900 text-slate-300">
                        <tr>
                          <th className="p-1.5">Модель (Наименование)</th>
                          <th className="p-1.5">Цвет</th>
                          <th className="p-1.5">Размер</th>
                          <th className="p-1.5">Артикул</th>
                          <th className="p-1.5">Штрихкод (EAN-13)</th>
                          <th className="p-1.5">Количество</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-400">
                        <tr>
                          <td className="p-1.5 text-white">Футболка мужская SC</td>
                          <td className="p-1.5">Хаки</td>
                          <td className="p-1.5 font-bold text-cyan-300">S/92</td>
                          <td className="p-1.5">2342598</td>
                          <td className="p-1.5 font-mono">4620336842653</td>
                          <td className="p-1.5 font-bold text-white">500</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-white">Футболка мужская SC</td>
                          <td className="p-1.5">Хаки</td>
                          <td className="p-1.5 font-bold text-cyan-300">M/96</td>
                          <td className="p-1.5">2342598</td>
                          <td className="p-1.5 font-mono">4620336842660</td>
                          <td className="p-1.5 font-bold text-white">1000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <div className="font-bold text-white text-sm">Tayyor Excel faylni yuklang (.xlsx / .xls)</div>
                  <p className="text-slate-400 text-xs mt-1 mb-3">Faylni tanlang, u avtomatik ravishda stikerlar jadvaliga o'tadi</p>
                  
                  <label className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Faylni tanlash</span>
                    <input type="file" accept=".xlsx,.xls" onChange={handleUploadExcelFile} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: PDF ORQALI (GEMINI AI API) */}
            {importSourceTab === 'pdf' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-purple-200 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-purple-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini 3.8 Flash AI Hujjat Tahlilchisi</span>
                  </div>
                  Buyurtmachi shartnomasi, techpack yoki PDF spetsifikatsiyasini yuklang. Gemini AI mahsulot nomi, o'lchamlar, artikul, shtrix-kod va to'qimachilik parvarish belgilarini avtomatik ajratib oladi.
                </div>

                <div className="border-2 border-dashed border-purple-700/60 hover:border-purple-400 rounded-2xl p-6 text-center transition-colors">
                  {isAiParsing ? (
                    <div className="py-4 space-y-3">
                      <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
                      <div className="font-bold text-white text-sm">Gemini AI PDF hujjatni tahlil qilmoqda...</div>
                      <p className="text-slate-400 text-xs">O'lchamlar, artikul va shtrix-kodlar ajratilmoqda</p>
                    </div>
                  ) : (
                    <>
                      <FileUp className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                      <div className="font-bold text-white text-sm">PDF Spetsifikatsiya yoki Shartnoma fayli</div>
                      <p className="text-slate-400 text-xs mt-1 mb-3">Har qanday PDF faylni yuklang</p>
                      
                      <label className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>PDF Faylni Yuklash (AI Tahlil)</span>
                        <input type="file" accept=".pdf" onChange={handleUploadPdfAi} className="hidden" />
                      </label>
                    </>
                  )}
                </div>

                {aiError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                    {aiError}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ERP TIZIMIDAGI MAVJUD BUYURTMALAR */}
            {importSourceTab === 'erp' && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-slate-300 block">ERP tizimidagi faol buyurtmalardan birini tanlang:</span>
                
                {orders && orders.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {orders.map(ord => (
                      <div
                        key={ord.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700"
                      >
                        <div>
                          <div className="font-bold text-white">{ord.brandName || ord.modelCode}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {ord.orderNumber || ord.mosCode} • {ord.totalQuantity || ord.qtyOrder} dona • Rang: {ord.color || 'Standart'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleImportFromErpOrders(ord)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Stikerlarga o'tkazish
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    ERP tizimida hozircha buyurtmalar ro'yxati bo'sh. Excel yoki PDF orqali yuklang.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WORD / MATN ORQALI */}
            {importSourceTab === 'word' && (
              <div className="space-y-3 text-xs">
                <label className="font-semibold text-slate-300 block">
                  Word yoki spetsifikatsiya matnini nusxalab joylashtiring:
                </label>
                <textarea
                  rows={6}
                  placeholder="Futbolka erkaklar 100% paxta&#10;Rang: Xaki&#10;Artikul: 2342598..."
                  value={wordText}
                  onChange={(e) => setWordText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleImportWordText}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Matndan stikerlarni shakllantirish
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {/* =========================================================================
          MODAL: KOMPYUTERDAGI PRINTERGA CHOP ETISH VA KALIBRATSIYA
         ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <span>Kompyuterdagi Printerga Chop Etish</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Termo printerga to'g'ridan-to'g'ri chop etish va kalibratsiya sozlamalari
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Tanlangan Stiker Ma'lumoti */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">{labelData.productName}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-mono font-bold">
                    {printerSettings.labelWidthMm || labelData.labelWidthMm || 40} x {printerSettings.labelHeightMm || labelData.labelHeightMm || 58} mm Termo
                  </span>
                </div>
                <div className="text-cyan-300 font-bold">{labelData.sizeTitle} | {labelData.color}</div>
                <div className="text-slate-400 font-mono text-[11px] flex items-center justify-between pt-0.5">
                  <span>{labelData.artikul}</span>
                  <span>EAN-13: {labelData.barcode}</span>
                </div>
              </div>

              {/* Chop etiladigan nusxalar soni */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <label className="font-bold text-slate-300 block">
                  Chop etiladigan nusxalar soni (dona):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="flex-1 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xl font-black text-cyan-300 font-mono text-center focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400 font-mono">dona</span>
                </div>

                {/* Tezkor tanlash tugmalari */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[50, 100, 250, 500].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setPrintCopies(cnt)}
                      className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        printCopies === cnt
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750'
                      }`}
                    >
                      {cnt} ta
                    </button>
                  ))}
                </div>
              </div>

              {/* PRINTER KALIBRATSIYASI VA SILJISH SOZLAMALARI ("kolibratsiya va boshqa sozlamarni chop etishga joylashtir") */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                    <span>Printer Kalibratsiyasi va Siljish (X/Y)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">mm aniqlikda</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">X gorizontal siljish (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="-20"
                      max="20"
                      value={printerSettings.offsetXmm}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPrinterSettings({ ...printerSettings, offsetXmm: val });
                      }}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-center text-xs font-mono text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Y vertikal siljish (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="-20"
                      max="20"
                      value={printerSettings.offsetYmm}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPrinterSettings({ ...printerSettings, offsetYmm: val });
                      }}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-center text-xs font-mono text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Chetdan bo'sh joy (Padding mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={printerSettings.paddingMm}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPrinterSettings({ ...printerSettings, paddingMm: val });
                      }}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-center text-xs font-mono text-white"
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Termo qorayish / Kontrast:</label>
                    <select
                      value={printerSettings.darknessContrast}
                      onChange={(e) => setPrinterSettings({ ...printerSettings, darknessContrast: e.target.value as any })}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                    >
                      <option value="normal">Normal (Standart)</option>
                      <option value="high">Yuqori qorayish</option>
                      <option value="ultra">Ultra (Eng to'q qora)</option>
                    </select>
                  </div>
                </div>

              </div>

            </div>

            {/* Pastki tugmalar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={handleConfirmPrint}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/70 flex items-center gap-2 cursor-pointer transition-transform active:scale-95 border border-emerald-400/50"
              >
                <Printer className="w-4 h-4 text-emerald-100" />
                <span>🖨️ KOMPYUTERDAGI PRINTERGA CHOP ETISH</span>
              </button>
            </div>

          </div>
        </div>
      )}


      {/* =========================================================================
          MODAL: YANGI PARVARISH BELGISINI QO'SHISH
         ========================================================================= */}
      {showAddSymbolModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Yangi Parvarish Belgisini Qo'shish</span>
              </h3>
              <button
                onClick={() => setShowAddSymbolModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewCareSymbol} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Belgi nomi / tavsifi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Maxsus nozik ipak yuvish"
                  value={newSymbolName}
                  onChange={(e) => setNewSymbolName(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Kategoriya</label>
                <select
                  value={newSymbolCategory}
                  onChange={(e) => setNewSymbolCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="wash">Yuvish (Washing)</option>
                  <option value="bleach">Oqartirish (Bleaching)</option>
                  <option value="dry">Quritish (Drying)</option>
                  <option value="iron">Dazmollash (Ironing)</option>
                  <option value="clean">Kimyoviy tozalash (Dry cleaning)</option>
                  <option value="cert">Sertifikat / Marka (Certs)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">SVG kodi (Ixtiyoriy)</label>
                <textarea
                  rows={3}
                  placeholder="<circle cx='24' cy='24' r='16' fill='none' stroke='currentColor' stroke-width='2'/>"
                  value={newSymbolSvgCode}
                  onChange={(e) => setNewSymbolSvgCode(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSymbolModal(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Kutubxonaga qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PRINTER VA CHOP ETISH SOZLAMALARI & KALIBRATSIYA (localStorage)
         ========================================================================= */}
      <PrintSettingsModal
        isOpen={showPrintSettingsModal}
        onClose={() => setShowPrintSettingsModal(false)}
        settings={printerSettings}
        onSave={(newSettings) => {
          setPrinterSettings(newSettings);
          setLabelData(prev => ({
            ...prev,
            labelWidthMm: newSettings.labelWidthMm,
            labelHeightMm: newSettings.labelHeightMm
          }));
          setPrintNotice(
            lang === 'uz'
              ? `Printer sozlamalari (${newSettings.labelWidthMm}x${newSettings.labelHeightMm} mm, X:${newSettings.offsetXmm}mm, Y:${newSettings.offsetYmm}mm) saqlandi!`
              : `Настройки принтера сохранены!`
          );
          setTimeout(() => setPrintNotice(null), 3000);
        }}
        lang={lang}
      />

    </div>
  );
}
