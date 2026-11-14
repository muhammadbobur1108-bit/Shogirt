import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  BarChart3,
  Table as TableIcon,
  Sliders,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Info,
  Calendar,
  ArrowUp,
  ArrowDown,
  Lock,
  X,
  Copy,
  Maximize2,
  Minimize2,
  Ruler,
  Image as ImageIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  Pencil,
  Tag,
  ArrowLeftRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Order, Customer, AppUser, WarehouseBox } from '../types';
import { Language } from '../locales';
import RazdachaUpakovkaDiffTab from './RazdachaUpakovkaDiffTab';
import {
  FactoryLedgerRow,
  SizePresetId,
  SizeCellValues,
  OrderSizeMatrix,
  DEFAULT_MONTHS,
  DEFAULT_BRANDS,
  ROST_OPTIONS,
  COMMON_COLORS,
  SIZE_PRESETS,
  INITIAL_FACTORY_DATA,
  STORAGE_MONTHS_KEY,
  STORAGE_BRANDS_KEY,
  STORAGE_ROWS_KEY,
  STORAGE_MATRICES_KEY,
  STORAGE_IMAGES_KEY,
  detectSizePresetForRow,
  normalizePresetId,
  getPopulatedSizes,
  getEffectiveDisplaySizes,
  loadBrandsList,
  recalcLedgerRowFromMatrix,
  loadOrdersAndMatrices,
  ledgerRowsToAppOrders,
  notifyOrdersStoreUpdated
} from '../lib/ordersSizeStore';

export type { FactoryLedgerRow, SizePresetId, SizeCellValues, OrderSizeMatrix };
export { DEFAULT_MONTHS, INITIAL_FACTORY_DATA };

const RUSSIAN_MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

type GridColKey =
  | 'month'
  | 'brand'
  | 'orderNo'
  | 'model'
  | 'color'
  | 'rost'
  | 'qtyOrder'
  | 'qtyCut'
  | 'cutPercent'
  | 'qtyDistribution'
  | 'qtySewing'
  | 'qtyPackaging'
  | 'qtyDefect'
  | 'defectPercent'
  | 'qtyTotalPack'
  | 'difference'
  | 'qtyShipped'
  | 'qtyStock'
  | 'stockPercent'
  | 'percent'
  | 'notes';

interface GridColDef {
  key: GridColKey;
  label: string;
  align: 'left' | 'right' | 'center';
  type: 'text' | 'number' | 'select' | 'computed';
  minWidth: string;
  formula?: string;
}

const GRID_COLUMNS: GridColDef[] = [
  { key: 'month', label: 'Месяц', align: 'left', type: 'select', minWidth: '124px' },
  { key: 'brand', label: 'Бренд', align: 'left', type: 'text', minWidth: '120px' },
  { key: 'orderNo', label: 'Заказ№', align: 'left', type: 'text', minWidth: '115px' },
  { key: 'model', label: 'Модель', align: 'left', type: 'text', minWidth: '185px' },
  { key: 'color', label: 'Цвет', align: 'left', type: 'text', minWidth: '140px' },
  { key: 'rost', label: 'Рост', align: 'center', type: 'text', minWidth: '92px' },
  { key: 'qtyOrder', label: 'Заказ кол-во', align: 'right', type: 'number', minWidth: '95px' },
  { key: 'qtyCut', label: 'Крой кол-во', align: 'right', type: 'number', minWidth: '95px' },
  { key: 'cutPercent', label: 'Крой %', align: 'center', type: 'computed', minWidth: '78px', formula: '= Крой кол-во / Заказ кол-во * 100%' },
  { key: 'qtyDistribution', label: 'Раздача кол-во', align: 'right', type: 'number', minWidth: '105px' },
  { key: 'qtySewing', label: 'Пошив кол-во', align: 'right', type: 'number', minWidth: '95px' },
  { key: 'qtyPackaging', label: 'Упаковка кол-во', align: 'right', type: 'number', minWidth: '105px' },
  { key: 'qtyDefect', label: 'Брак', align: 'right', type: 'number', minWidth: '75px' },
  { key: 'defectPercent', label: 'Брак %', align: 'center', type: 'computed', minWidth: '75px', formula: '= Брак / Раздача кол-во * 100%' },
  { key: 'qtyTotalPack', label: 'Общ-упак', align: 'right', type: 'computed', minWidth: '90px', formula: '= Упаковка кол-во + Брак' },
  { key: 'difference', label: 'Разница', align: 'right', type: 'computed', minWidth: '85px', formula: '= Раздача кол-во - Общ-упак' },
  { key: 'qtyShipped', label: 'Отгрузка', align: 'right', type: 'number', minWidth: '85px' },
  { key: 'qtyStock', label: 'Остаток на складе', align: 'right', type: 'computed', minWidth: '115px', formula: '= Упаковка кол-во - Отгрузка' },
  { key: 'stockPercent', label: 'Остаток %', align: 'center', type: 'computed', minWidth: '85px', formula: '= Остаток на складе / Упаковка кол-во * 100%' },
  { key: 'percent', label: 'Закрытие %', align: 'center', type: 'computed', minWidth: '90px', formula: '= Общ-упак / Раздача кол-во * 100%' },
  { key: 'notes', label: 'Примечание', align: 'left', type: 'text', minWidth: '170px' }
];

const EXCEL_COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'];

// =========================================================================
// АДАПТИВНЫЕ РАЗМЕРНЫЕ СЕТКИ ПО ЗАКАЗАМ (XS-3XL, 88-112, 44-64, 116-164)
// =========================================================================

function distributeQtyAcrossSizes(total: number, sizes: string[], activeSlots: number): number[] {
  const count = sizes.length;
  const result = new Array(count).fill(0);
  if (total <= 0 || count === 0) return result;

  const usable = Math.max(1, Math.min(count, activeSlots));
  // Веса по колоколообразной кривой (середина размерного ряда больше)
  const weights: number[] = [];
  const mid = (usable - 1) / 2;
  for (let i = 0; i < usable; i++) {
    const distFromMid = Math.abs(i - mid);
    weights.push(Math.max(0.45, 1.45 - distFromMid * 0.25));
  }
  const weightSum = weights.reduce((s, w) => s + w, 0);
  const raw = weights.map(w => (total * w) / weightSum);
  const floored = raw.map(v => Math.floor(v));
  let remainder = total - floored.reduce((s, v) => s + v, 0);

  const remainders = raw.map((v, idx) => ({ idx, frac: v - floored[idx] })).sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) {
    floored[remainders[i % remainders.length].idx] += 1;
  }

  for (let i = 0; i < usable; i++) {
    result[i] = floored[i];
  }
  return result;
}

function buildDefaultSizeMatrixForRow(row: FactoryLedgerRow, presetOverride?: Exclude<SizePresetId, 'custom'>): OrderSizeMatrix {
  const presetId = presetOverride || detectSizePresetForRow(row);
  const sizes = [...SIZE_PRESETS[presetId].sizes];
  // Если в линейке >= 7 размеров (напр. XS..3XL или 88..112), оставляем последние 2 размера пустыми при небольших/средних заказах как в образце фабрики, или заполняем все при крупных
  const activeSlots = sizes.length >= 7 && row.qtyOrder < 6000 ? sizes.length - 2 : sizes.length;

  const ordArr = distributeQtyAcrossSizes(row.qtyOrder, sizes, activeSlots);
  const cutArr = distributeQtyAcrossSizes(row.qtyCut, sizes, activeSlots);
  const distArr = distributeQtyAcrossSizes(row.qtyDistribution, sizes, activeSlots);
  const sewArr = distributeQtyAcrossSizes(row.qtySewing, sizes, activeSlots);
  const packArr = distributeQtyAcrossSizes(row.qtyPackaging, sizes, activeSlots);

  const values: Record<string, SizeCellValues> = {};
  sizes.forEach((sz, idx) => {
    values[sz] = {
      order: ordArr[idx],
      cut: cutArr[idx],
      dist: distArr[idx],
      sew: sewArr[idx],
      pack: packArr[idx]
    };
  });

  return {
    rowId: row.id,
    presetId,
    sizes,
    values,
    defect: row.qtyDefect || 0
  };
}

// Helper for Cyrillic PDF fonts
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function registerCyrillicFonts(doc: jsPDF): Promise<string> {
  try {
    const [resReg, resBold] = await Promise.all([
      fetch('/fonts/LiberationSans-Regular.ttf'),
      fetch('/fonts/LiberationSans-Bold.ttf')
    ]);
    if (resReg.ok) {
      const regB64 = arrayBufferToBase64(await resReg.arrayBuffer());
      doc.addFileToVFS('LiberationSans-Regular.ttf', regB64);
      doc.addFont('LiberationSans-Regular.ttf', 'LiberationSans', 'normal');
    }
    if (resBold.ok) {
      const boldB64 = arrayBufferToBase64(await resBold.arrayBuffer());
      doc.addFileToVFS('LiberationSans-Bold.ttf', boldB64);
      doc.addFont('LiberationSans-Bold.ttf', 'LiberationSans', 'bold');
    }
    if (resReg.ok || resBold.ok) {
      doc.setFont('LiberationSans', 'normal');
      return 'LiberationSans';
    }
  } catch (e) {
    console.warn('PDF font load warning:', e);
  }
  return 'helvetica';
}

// High-contrast Recharts tooltip component (fixes dark-on-dark unreadable text)
function DashboardChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-950 border border-cyan-500/50 rounded-xl px-3 py-2 shadow-2xl text-xs">
      {label && <p className="font-bold text-cyan-300 mb-1 border-b border-slate-800 pb-1">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-slate-100 font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: entry.color || entry.payload?.fill || '#38bdf8' }} />
            <span className="text-slate-200">{entry.name || entry.payload?.name || 'Значение'}:</span>
          </span>
          <span className="font-mono font-black text-white">
            {Number(entry.value || 0).toLocaleString()} шт
          </span>
        </div>
      ))}
    </div>
  );
}

interface OrdersViewProps {
  orders?: Order[];
  customers?: Customer[];
  boxes?: WarehouseBox[];
  onUpdateBoxes?: (updatedBoxes: WarehouseBox[]) => void;
  onAddOrder?: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
  onDeleteOrder?: (id: string) => void;
  onSyncOrdersFromLedger?: (orders: Order[], rows: FactoryLedgerRow[], matrices: Record<string, OrderSizeMatrix>) => void;
  selectedOrderFromDashboard?: Order | null;
  onClearSelectedOrder?: () => void;
  currentUser?: AppUser | null;
  lang?: Language;
  onNavigateToTab?: (tab: string) => void;
}

export default function OrdersView(props: OrdersViewProps) {
  const { onSyncOrdersFromLedger, selectedOrderFromDashboard, onClearSelectedOrder } = props;

  // Главный рабочий экран — «Размеры по заказу» (отсюда питаются все остальные таблицы и Дашборд)
  const [activeTabMode, setActiveTabMode] = useState<
    'size_matrix' | 'table_photo1' | 'diff_razd_upak' | 'dashboard_photo2' | 'summary_photo3' | 'colors_photo4' | 'settings_photo5'
  >('size_matrix');

  // Полноэкранный режим таблицы производства
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);

  // Месяцы (сохраняются в localStorage, можно добавлять новые)
  const [monthsList, setMonthsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MONTHS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_MONTHS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MONTHS_KEY, JSON.stringify(monthsList));
    } catch (e) {
      console.warn(e);
    }
  }, [monthsList]);

  // Бренды (Texnoavia, Stark Cotton, Sab collection, TodoModa + пользовательские)
  const [brandsList, setBrandsList] = useState<string[]>(() => loadBrandsList());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BRANDS_KEY, JSON.stringify(brandsList));
    } catch (e) {
      console.warn(e);
    }
  }, [brandsList]);

  // Единоразовая загрузка данных с автоочисткой старых демо-строк r-1..r-34
  const initialStore = useMemo(() => loadOrdersAndMatrices(), []);

  // Строки производства + матрицы размеров
  const [ledgerRows, setLedgerRows] = useState<FactoryLedgerRow[]>(initialStore.rows);
  const [sizeMatrices, setSizeMatrices] = useState<Record<string, OrderSizeMatrix>>(initialStore.matrices);

  // Все показатели этапов автоматически рассчитываются из «Размеры по заказу»
  const derivedLedgerRows = useMemo(
    () => ledgerRows.map(row => recalcLedgerRowFromMatrix(row, sizeMatrices[row.id])),
    [ledgerRows, sizeMatrices]
  );

  // Фильтры
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedOrderNo, setSelectedOrderNo] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');

  // Сортировка по столбцам
  const [sortConfig, setSortConfig] = useState<{ key: GridColKey | null; dir: 'asc' | 'desc' }>({
    key: null,
    dir: 'asc'
  });

  // Добавление нового месяца и нового бренда
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);
  const [newMonthName, setNewMonthName] = useState('Декабрь');
  const [newMonthYear, setNewMonthYear] = useState('2026');
  const [customMonthInput, setCustomMonthInput] = useState('');

  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');

  // Создание нового заказа прямо в «Размеры по заказу»
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState<{
    month: string;
    brand: string;
    customBrandInput: string;
    orderNo: string;
    model: string;
    color: string;
    colorCode: string;
    rost: string;
    createAll4Rosts: boolean;
    presetId: SizePresetId;
    selectedSizes: string[];
    customSizesText: string;
    notes: string;
  }>({
    month: DEFAULT_MONTHS[0],
    brand: DEFAULT_BRANDS[0],
    customBrandInput: '',
    orderNo: '',
    model: '',
    color: '',
    colorCode: '',
    rost: '',
    createAll4Rosts: false,
    presetId: 'alpha_xs_3xl',
    selectedSizes: [...SIZE_PRESETS.alpha_xs_3xl.sizes],
    customSizesText: 'XS, S, M, L, XL, 2XL, 3XL',
    notes: ''
  });

  // Добавление дополнительного Цвета / Роста к текущему заказу
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [variantForm, setVariantForm] = useState<{
    color: string;
    colorCode: string;
    rost: string;
    createAll4Rosts: boolean;
  }>({
    color: '',
    colorCode: '',
    rost: '',
    createAll4Rosts: false
  });

  // Модал удаления или полной очистки с паролем 1111
  const [rowToDelete, setRowToDelete] = useState<FactoryLedgerRow | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // Excel-подобная интерактивность таблицы
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editDraft, setEditDraft] = useState<string>('');
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);

  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const modelImageInputRef = useRef<HTMLInputElement>(null);

  // Фотографии / эскизы моделей по заказу или модели
  const [modelImages, setModelImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_IMAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_IMAGES_KEY, JSON.stringify(modelImages));
    } catch (e) {
      console.warn(e);
    }
  }, [modelImages]);

  const [selectedSizeRowId, setSelectedSizeRowId] = useState<string>(() => initialStore.rows[0]?.id || '');
  const [newCustomSizeInput, setNewCustomSizeInput] = useState<string>('');
  const [bulkSizeInput, setBulkSizeInput] = useState<string>('');
  const [showCustomSizeEditor, setShowCustomSizeEditor] = useState(false);
  const [hideEmptyMatrixSizes, setHideEmptyMatrixSizes] = useState(false);
  const [editingSizeCol, setEditingSizeCol] = useState<string | null>(null);
  const [editingSizeColDraft, setEditingSizeColDraft] = useState<string>('');
  const [sizeMatrixActiveCell, setSizeMatrixActiveCell] = useState<{ row: number; col: number } | null>(null);
  const sizeMatrixManualCaretRef = useRef(false);

  // Автосохранение и глобальная синхронизация в Дашборд и остальные вкладки
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ROWS_KEY, JSON.stringify(derivedLedgerRows));
      localStorage.setItem(STORAGE_MATRICES_KEY, JSON.stringify(sizeMatrices));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
    notifyOrdersStoreUpdated();
    if (onSyncOrdersFromLedger) {
      onSyncOrdersFromLedger(
        ledgerRowsToAppOrders(derivedLedgerRows, sizeMatrices),
        derivedLedgerRows,
        sizeMatrices
      );
    }
  }, [derivedLedgerRows, sizeMatrices, onSyncOrdersFromLedger]);

  // Переход из Дашборда к конкретному заказу в «Размеры по заказу»
  useEffect(() => {
    if (selectedOrderFromDashboard) {
      const exists = ledgerRows.find(r => r.id === selectedOrderFromDashboard.id);
      if (exists) {
        setSelectedSizeRowId(exists.id);
        setActiveTabMode('size_matrix');
      }
      onClearSelectedOrder?.();
    }
  }, [selectedOrderFromDashboard, ledgerRows, onClearSelectedOrder]);

  // Уведомления
  const [notification, setNotification] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Завершение выделения мышкой при отпускании кнопки в любом месте окна
  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSelection(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Выход из полноэкранного режима по Escape
  useEffect(() => {
    const handleEscFullscreen = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTableFullscreen && !editingCell && !rowToDelete && !isClearAllConfirmOpen && !isAddMonthOpen) {
        setIsTableFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEscFullscreen);
    return () => window.removeEventListener('keydown', handleEscFullscreen);
  }, [isTableFullscreen, editingCell, rowToDelete, isClearAllConfirmOpen, isAddMonthOpen]);

  // Фокус на активный input при входе в режим редактирования
  useEffect(() => {
    if (editingCell && activeInputRef.current) {
      activeInputRef.current.focus();
    }
  }, [editingCell]);

  // Уникальные значения для фильтров (строго из derivedLedgerRows)
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>(monthsList);
    derivedLedgerRows.forEach(r => {
      if (r.month) set.add(r.month);
    });
    return Array.from(set);
  }, [monthsList, derivedLedgerRows]);

  const uniqueBrands = useMemo(() => {
    const set = new Set<string>(brandsList);
    derivedLedgerRows.forEach(r => {
      if (r.brand) set.add(r.brand);
    });
    return Array.from(set);
  }, [brandsList, derivedLedgerRows]);

  const uniqueOrderNos = useMemo(() => Array.from(new Set(derivedLedgerRows.map(r => r.orderNo))), [derivedLedgerRows]);
  const uniqueModels = useMemo(() => Array.from(new Set(derivedLedgerRows.map(r => r.model))), [derivedLedgerRows]);
  const uniqueColors = useMemo(() => Array.from(new Set(derivedLedgerRows.map(r => r.color))), [derivedLedgerRows]);

  // Вычисление процента кроя к заказу, брака, остатка и закрытия для строки
  const getRowMetrics = useCallback((r: FactoryLedgerRow) => {
    const cutPct = r.qtyOrder > 0 ? (r.qtyCut / r.qtyOrder) * 100 : 0;
    const defectPct = r.qtyDistribution > 0 ? (r.qtyDefect / r.qtyDistribution) * 100 : 0;
    const stockPct = r.qtyPackaging > 0 ? (r.qtyStock / r.qtyPackaging) * 100 : 0;
    const closePct = r.qtyDistribution > 0 ? (r.qtyTotalPack / r.qtyDistribution) * 100 : 0;
    const diffPure = (r.qtyDistribution || 0) - (r.qtyPackaging || 0);
    const diffPurePct = r.qtyDistribution > 0 ? (diffPure / r.qtyDistribution) * 100 : 0;
    return { cutPct, defectPct, stockPct, closePct, diffPure, diffPurePct };
  }, []);

  // Фильтрация + сортировка
  const filteredRows = useMemo(() => {
    const base = derivedLedgerRows.filter(row => {
      const q = searchFilter.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (row.brand || '').toLowerCase().includes(q) ||
        row.orderNo.toLowerCase().includes(q) ||
        row.model.toLowerCase().includes(q) ||
        row.color.toLowerCase().includes(q) ||
        (row.rost || '').toLowerCase().includes(q) ||
        (row.notes || '').toLowerCase().includes(q) ||
        (row.month || '').toLowerCase().includes(q);

      const matchesMonth = selectedMonth === 'all' || (row.month || DEFAULT_MONTHS[0]) === selectedMonth;
      const matchesBrand = selectedBrand === 'all' || (row.brand || '') === selectedBrand;
      const matchesOrderNo = selectedOrderNo === 'all' || row.orderNo === selectedOrderNo;
      const matchesModel = selectedModel === 'all' || row.model === selectedModel;
      const matchesColor = selectedColor === 'all' || row.color === selectedColor;

      return matchesSearch && matchesMonth && matchesBrand && matchesOrderNo && matchesModel && matchesColor;
    });

    if (!sortConfig.key) return base;

    const k = sortConfig.key;
    const dir = sortConfig.dir === 'asc' ? 1 : -1;

    return [...base].sort((a, b) => {
      if (k === 'cutPercent') {
        const av = a.qtyOrder > 0 ? a.qtyCut / a.qtyOrder : 0;
        const bv = b.qtyOrder > 0 ? b.qtyCut / b.qtyOrder : 0;
        return (av - bv) * dir;
      }
      if (k === 'defectPercent') {
        const av = a.qtyDistribution > 0 ? a.qtyDefect / a.qtyDistribution : 0;
        const bv = b.qtyDistribution > 0 ? b.qtyDefect / b.qtyDistribution : 0;
        return (av - bv) * dir;
      }
      if (k === 'stockPercent') {
        const av = a.qtyPackaging > 0 ? a.qtyStock / a.qtyPackaging : 0;
        const bv = b.qtyPackaging > 0 ? b.qtyStock / b.qtyPackaging : 0;
        return (av - bv) * dir;
      }
      const valA = a[k as keyof FactoryLedgerRow];
      const valB = b[k as keyof FactoryLedgerRow];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * dir;
      }
      return String(valA || '').localeCompare(String(valB || ''), 'ru') * dir;
    });
  }, [derivedLedgerRows, searchFilter, selectedMonth, selectedBrand, selectedOrderNo, selectedModel, selectedColor, sortConfig]);

  // Итоговые показатели по таблице
  const totals = useMemo(() => {
    let orderQty = 0;
    let cutQty = 0;
    let distQty = 0;
    let sewQty = 0;
    let packQty = 0;
    let defectQty = 0;
    let totalPackQty = 0;
    let diffQty = 0;
    let shipQty = 0;
    let stockQty = 0;

    filteredRows.forEach(r => {
      orderQty += r.qtyOrder || 0;
      cutQty += r.qtyCut || 0;
      distQty += r.qtyDistribution || 0;
      sewQty += r.qtySewing || 0;
      packQty += r.qtyPackaging || 0;
      defectQty += r.qtyDefect || 0;
      totalPackQty += r.qtyTotalPack || 0;
      diffQty += r.difference || 0;
      shipQty += r.qtyShipped || 0;
      stockQty += r.qtyStock || 0;
    });

    const cutRatePercentNum = orderQty > 0 ? (cutQty / orderQty) * 100 : 0;
    const overallPercent = distQty > 0 ? (totalPackQty / distQty) * 100 : 0;
    const defectRatePercent = distQty > 0 ? (defectQty / distQty) * 100 : 0;
    const stockRatePercent = packQty > 0 ? (stockQty / packQty) * 100 : 0;
    const diffPureQty = distQty - packQty;
    const diffPurePct = distQty > 0 ? (diffPureQty / distQty) * 100 : 0;
    const distinctOrdersCount = new Set(filteredRows.map(r => r.orderNo)).size;
    const distinctModelsCount = new Set(filteredRows.map(r => r.model)).size;

    return {
      orderQty,
      cutQty,
      cutRatePercent: cutRatePercentNum.toFixed(1),
      distQty,
      sewQty,
      packQty,
      defectQty,
      totalPackQty,
      diffQty,
      diffPureQty,
      diffPurePct: diffPurePct.toFixed(1),
      shipQty,
      stockQty,
      overallPercent: overallPercent.toFixed(1),
      overallPercentNum: Math.round(overallPercent),
      defectRatePercent: defectRatePercent.toFixed(1),
      stockRatePercent: stockRatePercent.toFixed(1),
      distinctOrdersCount,
      distinctModelsCount,
      rowsCount: filteredRows.length
    };
  }, [filteredRows]);

  // Пересчет зависимых формул строки
  const recalcRow = (row: FactoryLedgerRow): FactoryLedgerRow => {
    const pack = Number(row.qtyPackaging) || 0;
    const defect = Number(row.qtyDefect) || 0;
    const dist = Number(row.qtyDistribution) || 0;
    const ship = Number(row.qtyShipped) || 0;

    const totalPack = pack + defect;
    const difference = dist - totalPack;
    const stock = Math.max(0, pack - ship);
    const percent = dist > 0 ? Math.round((totalPack / dist) * 100) : 0;

    return {
      ...row,
      qtyTotalPack: totalPack,
      difference,
      qtyStock: stock,
      percent
    };
  };

  // Обновление значения ячейки по id и ключу
  const updateCellValue = useCallback((id: string, key: GridColKey, rawVal: string) => {
    const colDef = GRID_COLUMNS.find(c => c.key === key);
    if (!colDef || colDef.type === 'computed') return;

    setLedgerRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const nextVal =
          colDef.type === 'number'
            ? Math.max(0, parseInt(String(rawVal || '0').replace(/[^\d]/g, ''), 10) || 0)
            : String(rawVal);

        const updated: FactoryLedgerRow = {
          ...row,
          [key]: nextVal
        };
        return recalcRow(updated);
      })
    );
  }, []);

  // Получить отображаемое/текстовое значение ячейки (для копирования, fx-строки и редактирования)
  const getCellRawValue = useCallback(
    (row: FactoryLedgerRow, key: GridColKey): string | number => {
      if (key === 'cutPercent') {
        return `${getRowMetrics(row).cutPct.toFixed(1)}%`;
      }
      if (key === 'defectPercent') {
        return `${getRowMetrics(row).defectPct.toFixed(1)}%`;
      }
      if (key === 'stockPercent') {
        return `${getRowMetrics(row).stockPct.toFixed(1)}%`;
      }
      if (key === 'percent') {
        return `${getRowMetrics(row).closePct.toFixed(1)}%`;
      }
      return row[key as keyof FactoryLedgerRow] ?? '';
    },
    [getRowMetrics]
  );

  // Нормализация границ выделения
  const normalizedSelection = useMemo(() => {
    if (!selectionRange) return null;
    return {
      minR: Math.min(selectionRange.startRow, selectionRange.endRow),
      maxR: Math.max(selectionRange.startRow, selectionRange.endRow),
      minC: Math.min(selectionRange.startCol, selectionRange.endCol),
      maxC: Math.max(selectionRange.startCol, selectionRange.endCol)
    };
  }, [selectionRange]);

  // Статистика по выделенным ячейкам (как в нижней панели Excel)
  const selectionStats = useMemo(() => {
    if (!normalizedSelection) return null;
    let count = 0;
    let numericCount = 0;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    for (let r = normalizedSelection.minR; r <= normalizedSelection.maxR; r++) {
      const row = filteredRows[r];
      if (!row) continue;
      for (let c = normalizedSelection.minC; c <= normalizedSelection.maxC; c++) {
        count++;
        const colDef = GRID_COLUMNS[c];
        if (!colDef) continue;
        if (colDef.type === 'number' || colDef.key === 'qtyTotalPack' || colDef.key === 'difference' || colDef.key === 'qtyStock') {
          const v = Number(row[colDef.key as keyof FactoryLedgerRow]) || 0;
          numericCount++;
          sum += v;
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }

    return {
      count,
      numericCount,
      sum,
      avg: numericCount > 0 ? sum / numericCount : 0,
      min: numericCount > 0 ? min : 0,
      max: numericCount > 0 ? max : 0
    };
  }, [normalizedSelection, filteredRows]);

  // Переход к конкретной ячейке и фокусировка
  const moveToCell = useCallback(
    (nextRow: number, nextCol: number, extendSelection = false) => {
      if (filteredRows.length === 0) return;
      const clampedRow = Math.max(0, Math.min(filteredRows.length - 1, nextRow));
      const clampedCol = Math.max(0, Math.min(GRID_COLUMNS.length - 1, nextCol));

      setActiveCell({ row: clampedRow, col: clampedCol });
      if (extendSelection && selectionRange) {
        setSelectionRange({
          ...selectionRange,
          endRow: clampedRow,
          endCol: clampedCol
        });
      } else {
        setSelectionRange({
          startRow: clampedRow,
          startCol: clampedCol,
          endRow: clampedRow,
          endCol: clampedCol
        });
      }

      const cellEl = cellRefs.current[`${clampedRow}:${clampedCol}`];
      if (cellEl) {
        cellEl.focus();
        cellEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    },
    [filteredRows.length, selectionRange]
  );

  // Сохранить текущее редактирование ячейки
  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const row = filteredRows[editingCell.row];
    const colDef = GRID_COLUMNS[editingCell.col];
    if (row && colDef && colDef.type !== 'computed') {
      updateCellValue(row.id, colDef.key, editDraft);
    }
    setEditingCell(null);
  }, [editingCell, editDraft, filteredRows, updateCellValue]);

  // Копирование выделенных ячеек (Ctrl+C)
  const handleCopySelection = useCallback(async () => {
    if (!normalizedSelection) return;
    const lines: string[] = [];
    for (let r = normalizedSelection.minR; r <= normalizedSelection.maxR; r++) {
      const row = filteredRows[r];
      if (!row) continue;
      const vals: string[] = [];
      for (let c = normalizedSelection.minC; c <= normalizedSelection.maxC; c++) {
        const col = GRID_COLUMNS[c];
        vals.push(String(getCellRawValue(row, col.key)));
      }
      lines.push(vals.join('\t'));
    }
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showNotice(`Скопировано ячеек: ${selectionStats?.count || 1}`);
    } catch {
      showNotice('Готово к вставке');
    }
  }, [normalizedSelection, filteredRows, getCellRawValue, selectionStats]);

  // Вставка из буфера Excel (Ctrl+V) прямо в ячейки таблицы
  const handlePasteAtActiveCell = useCallback(
    (pastedText: string) => {
      if (!activeCell || !pastedText.trim()) return;
      const lines = pastedText.replace(/\r/g, '').split('\n').filter(l => l.length > 0);
      if (lines.length === 0) return;

      const matrix = lines.map(l => l.split('\t'));
      const startR = activeCell.row;
      const startC = activeCell.col;

      setLedgerRows(prev => {
        const next = [...prev];
        // Массив индексов в ledgerRows, соответствующих filteredRows
        const rowIdToIdx = new Map<string, number>();
        next.forEach((item, idx) => rowIdToIdx.set(item.id, idx));

        matrix.forEach((rowVals, rOffset) => {
          const targetFilteredRow = filteredRows[startR + rOffset];
          if (targetFilteredRow) {
            const actualIdx = rowIdToIdx.get(targetFilteredRow.id);
            if (actualIdx === undefined) return;
            let updated = { ...next[actualIdx] };
            rowVals.forEach((cellVal, cOffset) => {
              const colDef = GRID_COLUMNS[startC + cOffset];
              if (!colDef || colDef.type === 'computed') return;
              if (colDef.type === 'number') {
                (updated as any)[colDef.key] = Math.max(0, parseInt(cellVal.replace(/[^\d]/g, ''), 10) || 0);
              } else {
                (updated as any)[colDef.key] = cellVal.trim();
                if (colDef.key === 'month' && cellVal.trim() && !monthsList.includes(cellVal.trim())) {
                  setMonthsList(m => (m.includes(cellVal.trim()) ? m : [...m, cellVal.trim()]));
                }
              }
            });
            next[actualIdx] = recalcRow(updated);
          } else {
            // Если вставка выходит за пределы строк — автоматически добавляем новую строку!
            let newRow: FactoryLedgerRow = {
              id: `row-paste-${Date.now()}-${rOffset}`,
              orderNo: `MOS-NEW-${next.length + 1}`,
              model: '',
              color: '',
              qtyOrder: 0,
              qtyCut: 0,
              qtyDistribution: 0,
              qtySewing: 0,
              qtyPackaging: 0,
              qtyDefect: 0,
              qtyTotalPack: 0,
              difference: 0,
              qtyShipped: 0,
              qtyStock: 0,
              percent: 0,
              month: selectedMonth === 'all' ? (monthsList[0] || 'Сентябрь 2026') : selectedMonth,
              notes: ''
            };
            rowVals.forEach((cellVal, cOffset) => {
              const colDef = GRID_COLUMNS[startC + cOffset];
              if (!colDef || colDef.type === 'computed') return;
              if (colDef.type === 'number') {
                (newRow as any)[colDef.key] = Math.max(0, parseInt(cellVal.replace(/[^\d]/g, ''), 10) || 0);
              } else {
                (newRow as any)[colDef.key] = cellVal.trim();
              }
            });
            next.push(recalcRow(newRow));
          }
        });
        return next;
      });

      showNotice(`Вставлено строк из буфера: ${matrix.length}`);
    },
    [activeCell, filteredRows, monthsList, selectedMonth]
  );

  // Обработка клавиш в режиме выделенной ячейки
  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>, rIdx: number, cIdx: number) => {
    if (editingCell && editingCell.row === rIdx && editingCell.col === cIdx) {
      return; // Обрабатывается внутри input
    }

    const row = filteredRows[rIdx];
    const colDef = GRID_COLUMNS[cIdx];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveToCell(rIdx + 1, cIdx, e.shiftKey);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveToCell(rIdx - 1, cIdx, e.shiftKey);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveToCell(rIdx, cIdx + 1, e.shiftKey);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveToCell(rIdx, cIdx - 1, e.shiftKey);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (cIdx > 0) moveToCell(rIdx, cIdx - 1);
        else if (rIdx > 0) moveToCell(rIdx - 1, GRID_COLUMNS.length - 1);
      } else {
        if (cIdx < GRID_COLUMNS.length - 1) moveToCell(rIdx, cIdx + 1);
        else if (rIdx < filteredRows.length - 1) moveToCell(rIdx + 1, 0);
      }
      return;
    }
    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      if (row && colDef && colDef.type !== 'computed' && colDef.type !== 'select') {
        setEditingCell({ row: rIdx, col: cIdx });
        setEditDraft(String(row[colDef.key as keyof FactoryLedgerRow] ?? ''));
      } else if (e.key === 'Enter') {
        moveToCell(rIdx + 1, cIdx);
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'с' || e.key === 'С')) {
      e.preventDefault();
      handleCopySelection();
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (normalizedSelection) {
        for (let r = normalizedSelection.minR; r <= normalizedSelection.maxR; r++) {
          const targetRow = filteredRows[r];
          if (!targetRow) continue;
          for (let c = normalizedSelection.minC; c <= normalizedSelection.maxC; c++) {
            const targetCol = GRID_COLUMNS[c];
            if (targetCol && targetCol.type !== 'computed' && targetCol.type !== 'select') {
              updateCellValue(targetRow.id, targetCol.key, targetCol.type === 'number' ? '0' : '');
            }
          }
        }
      }
      return;
    }
    // Прямой ввод текста или цифры сразу активирует ячейку как в Excel!
    if (
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      row &&
      colDef &&
      (colDef.type === 'text' || colDef.type === 'number')
    ) {
      if (colDef.type === 'number' && !/^\d$/.test(e.key)) {
        return;
      }
      e.preventDefault();
      setEditingCell({ row: rIdx, col: cIdx });
      setEditDraft(e.key);
    }
  };

  // Обработка клавиш внутри активного input ячейки
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rIdx: number, cIdx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
      moveToCell(rIdx + 1, cIdx);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
      if (e.shiftKey) {
        if (cIdx > 0) moveToCell(rIdx, cIdx - 1);
        else if (rIdx > 0) moveToCell(rIdx - 1, GRID_COLUMNS.length - 1);
      } else {
        if (cIdx < GRID_COLUMNS.length - 1) moveToCell(rIdx, cIdx + 1);
        else if (rIdx < filteredRows.length - 1) moveToCell(rIdx + 1, 0);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitEdit();
      moveToCell(rIdx + 1, cIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitEdit();
      moveToCell(rIdx - 1, cIdx);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
      cellRefs.current[`${rIdx}:${cIdx}`]?.focus();
    }
  };

  // Добавить новый бренд
  const handleCreateNewBrand = (rawName?: string) => {
    const label = (rawName ?? newBrandInput).trim();
    if (!label) return '';
    if (!brandsList.includes(label)) {
      setBrandsList(prev => [...prev, label]);
    }
    setNewBrandInput('');
    setIsAddBrandOpen(false);
    showNotice(`Бренд «${label}» добавлен!`);
    return label;
  };

  // Добавить новый месяц
  const handleCreateNewMonth = () => {
    const label = customMonthInput.trim() || `${newMonthName} ${newMonthYear}`;
    if (!label) return;
    if (!monthsList.includes(label)) {
      setMonthsList(prev => [...prev, label]);
    }
    setSelectedMonth(label);
    setCustomMonthInput('');
    setIsAddMonthOpen(false);
    showNotice(`Месяц «${label}» добавлен и выбран!`);
  };

  // Открыть создание нового заказа прямо в «Размеры по заказу»
  const handleAddBlankRow = () => {
    const targetMonth = selectedMonth === 'all' ? (monthsList[0] || DEFAULT_MONTHS[0]) : selectedMonth;
    const targetBrand = selectedBrand === 'all' ? (brandsList[0] || DEFAULT_BRANDS[0]) : selectedBrand;
    setNewOrderForm({
      month: targetMonth,
      brand: targetBrand,
      customBrandInput: '',
      orderNo: '',
      model: '',
      color: '',
      colorCode: '',
      rost: '',
      createAll4Rosts: false,
      presetId: 'alpha_xs_3xl',
      selectedSizes: [...SIZE_PRESETS.alpha_xs_3xl.sizes],
      customSizesText: 'XS, S, M, L, XL, 2XL, 3XL',
      notes: ''
    });
    setIsTableFullscreen(false);
    setActiveTabMode('size_matrix');
    setIsNewOrderModalOpen(true);
  };

  // Создать заказ + чистую матрицу размеров в «Размеры по заказу» (поддерживает все 4 роста)
  const handleCreateOrderInSizeMatrix = () => {
    const orderNo = newOrderForm.orderNo.trim();
    const model = newOrderForm.model.trim();
    const color = newOrderForm.color.trim() || 'Стандарт';
    const customBrand = newOrderForm.customBrandInput.trim();
    const brand = customBrand || newOrderForm.brand || brandsList[0] || DEFAULT_BRANDS[0];
    if (customBrand && !brandsList.includes(customBrand)) {
      setBrandsList(prev => [...prev, customBrand]);
    }

    if (!orderNo || !model) {
      showNotice('Укажите номер заказа (Заказ №) и модель!');
      return;
    }

    let sizes: string[];
    const presetId: SizePresetId = newOrderForm.presetId;
    if (presetId === 'custom') {
      const parsed = newOrderForm.customSizesText
        .split(/[,;\s\t]+/)
        .map(s => s.trim())
        .filter(Boolean);
      const unique = Array.from<string>(new Set(parsed));
      sizes = unique.length > 0 ? unique : ['XS', 'S', 'M', 'L', 'XL'];
    } else {
      sizes = newOrderForm.selectedSizes.length > 0
        ? [...newOrderForm.selectedSizes]
        : [...SIZE_PRESETS[presetId].sizes];
    }

    const rostsToCreate = newOrderForm.createAll4Rosts ? ROST_OPTIONS : [newOrderForm.rost.trim()];
    const createdRows: FactoryLedgerRow[] = [];
    const createdMatrices: Record<string, OrderSizeMatrix> = {};

    rostsToCreate.forEach((rostVal, idx) => {
      const rowId = `ord-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      const values: Record<string, SizeCellValues> = {};
      sizes.forEach(sz => {
        values[sz] = { order: 0, cut: 0, dist: 0, sew: 0, pack: 0 };
      });

      createdMatrices[rowId] = {
        rowId,
        presetId,
        sizes: [...sizes],
        values,
        defect: 0
      };

      createdRows.push({
        id: rowId,
        brand,
        orderNo,
        model,
        color,
        colorCode: newOrderForm.colorCode.trim(),
        rost: rostVal,
        qtyOrder: 0,
        qtyCut: 0,
        qtyDistribution: 0,
        qtySewing: 0,
        qtyPackaging: 0,
        qtyDefect: 0,
        qtyTotalPack: 0,
        difference: 0,
        qtyShipped: 0,
        qtyStock: 0,
        percent: 0,
        month: newOrderForm.month || DEFAULT_MONTHS[0],
        notes: newOrderForm.notes.trim()
      });
    });

    setSizeMatrices(prev => ({ ...prev, ...createdMatrices }));
    setLedgerRows(prev => [...createdRows, ...prev]);
    setSelectedSizeRowId(createdRows[0].id);
    setSelectedMonth('all');
    setSelectedBrand('all');
    setSelectedOrderNo('all');
    setSelectedModel('all');
    setSelectedColor('all');
    setSearchFilter('');
    setIsNewOrderModalOpen(false);
    setActiveTabMode('size_matrix');
    showNotice(
      newOrderForm.createAll4Rosts
        ? `Создан заказ «${orderNo}» (${brand}) для цвета «${color}» с 4 ростовками!`
        : `Заказ «${orderNo} — ${color}${newOrderForm.rost ? ' (' + newOrderForm.rost + ')' : ''}» создан! Введите количества по размерам.`
    );
  };

  // Добавить новый Цвет / Рост к текущему заказу прямо в «Размеры по заказу»
  const handleAddVariantToActiveOrder = () => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    const color = variantForm.color.trim() || activeSizeRow.color || 'Новый цвет';
    const rostsToCreate = variantForm.createAll4Rosts ? ROST_OPTIONS : [variantForm.rost.trim()];

    const createdRows: FactoryLedgerRow[] = [];
    const createdMatrices: Record<string, OrderSizeMatrix> = {};

    rostsToCreate.forEach((rostVal, idx) => {
      const rowId = `var-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      const values: Record<string, SizeCellValues> = {};
      activeSizeMatrix.sizes.forEach(sz => {
        values[sz] = { order: 0, cut: 0, dist: 0, sew: 0, pack: 0 };
      });
      createdMatrices[rowId] = {
        rowId,
        presetId: activeSizeMatrix.presetId,
        sizes: [...activeSizeMatrix.sizes],
        values,
        defect: 0
      };
      createdRows.push({
        id: rowId,
        brand: activeSizeRow.brand || '',
        orderNo: activeSizeRow.orderNo,
        model: activeSizeRow.model,
        color,
        colorCode: variantForm.colorCode.trim() || activeSizeRow.colorCode || '',
        rost: rostVal,
        qtyOrder: 0,
        qtyCut: 0,
        qtyDistribution: 0,
        qtySewing: 0,
        qtyPackaging: 0,
        qtyDefect: 0,
        qtyTotalPack: 0,
        difference: 0,
        qtyShipped: 0,
        qtyStock: 0,
        percent: 0,
        month: activeSizeRow.month || DEFAULT_MONTHS[0],
        notes: activeSizeRow.notes || ''
      });
    });

    setSizeMatrices(prev => ({ ...prev, ...createdMatrices }));
    setLedgerRows(prev => {
      const idx = prev.findIndex(r => r.id === activeSizeRow.id);
      if (idx === -1) return [...createdRows, ...prev];
      const next = [...prev];
      next.splice(idx + 1, 0, ...createdRows);
      return next;
    });
    setSelectedSizeRowId(createdRows[0].id);
    setVariantForm({ color: '', colorCode: '', rost: '', createAll4Rosts: false });
    setIsAddVariantOpen(false);
    showNotice(
      variantForm.createAll4Rosts
        ? `Добавлено 4 ростовки для цвета «${color}» в заказ ${activeSizeRow.orderNo}!`
        : `Добавлен вариант «${color}${variantForm.rost ? ' • ' + variantForm.rost : ''}» в заказ ${activeSizeRow.orderNo}!`
    );
  };

  // Обновление метаданных/отгрузки активного заказа прямо в «Размеры по заказу»
  const updateActiveRowMeta = (
    field: 'brand' | 'orderNo' | 'model' | 'color' | 'colorCode' | 'rost' | 'month' | 'notes' | 'qtyShipped',
    rawVal: string
  ) => {
    if (!activeSizeRow) return;
    setLedgerRows(prev =>
      prev.map(r => {
        if (r.id !== activeSizeRow.id) return r;
        const val =
          field === 'qtyShipped'
            ? Math.max(0, parseInt(rawVal.replace(/[^\d]/g, ''), 10) || 0)
            : rawVal;
        return recalcLedgerRowFromMatrix({ ...r, [field]: val }, sizeMatrices[r.id]);
      })
    );
  };

  // Удаление строки или полная очистка с проверкой пароля 1111
  const handleConfirmDeleteRow = () => {
    if (deletePassword.trim() !== '1111') {
      setDeletePasswordError('Неверный пароль! Для удаления введите 1111');
      return;
    }

    if (isClearAllConfirmOpen) {
      setLedgerRows([]);
      setSizeMatrices({});
      setSelectedSizeRowId('');
      setIsClearAllConfirmOpen(false);
      setDeletePassword('');
      setDeletePasswordError('');
      showNotice('Все заказы полностью очищены (0 строк)!');
      return;
    }

    if (!rowToDelete) return;
    const deletedId = rowToDelete.id;
    setLedgerRows(prev => {
      const next = prev.filter(r => r.id !== deletedId);
      if (selectedSizeRowId === deletedId) {
        setSelectedSizeRowId(next[0]?.id || '');
      }
      return next;
    });
    setSizeMatrices(prev => {
      const next = { ...prev };
      delete next[deletedId];
      return next;
    });
    setRowToDelete(null);
    setDeletePassword('');
    setDeletePasswordError('');
    showNotice('Заказ успешно удален!');
  };

  // Запрос полной очистки раздела Заказы (пароль 1111)
  const handleResetToDefault = () => {
    setRowToDelete(null);
    setIsClearAllConfirmOpen(true);
    setDeletePassword('');
    setDeletePasswordError('');
  };

  // Сортировка при клике по заголовку колонки
  const toggleSort = (key: GridColKey) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null, dir: 'asc' };
    });
  };

  // =========================================================================
  // ИМПОРТ EXCEL (.xlsx, .xls, .csv)
  // =========================================================================
  const handleImportExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetImportMonth =
      selectedMonth === 'all' ? (monthsList[0] || 'Сентябрь 2026') : selectedMonth;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rawRows || rawRows.length < 2) {
          alert('В загруженном файле не найдены данные!');
          return;
        }

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const rowText = rawRows[i].map(c => String(c).toLowerCase().trim()).join(' ');
          if (
            rowText.includes('заказ') ||
            rowText.includes('модель') ||
            rowText.includes('крой') ||
            rowText.includes('раздача') ||
            rowText.includes('упаковка')
          ) {
            headerRowIdx = i;
            break;
          }
        }

        const importedRows: FactoryLedgerRow[] = [];
        const importedMatrices: Record<string, OrderSizeMatrix> = {};
        const discoveredMonths = new Set<string>();

        const KNOWN_SIZE_TOKENS = new Set([
          '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl', '10xl', '11xl', '12xl',
          '80', '84', '88', '92', '96', '100', '104', '108', '112', '116', '120', '124', '128', '132', '136', '140', '144', '148', '152', '156', '160', '168',
          '24-26', '28-30', '32-34', '36-38', '40-42',
          '44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64',
          '122', '134', '146', '158', '164',
          '158-164', '170-176', '182-188', '194-200'
        ]);

        if (headerRowIdx !== -1) {
          let activeHeadersRaw = rawRows[headerRowIdx];
          let activeHeaders = activeHeadersRaw.map(h => String(h).toLowerCase().trim());

          const resolveColumnIndexes = (hdrs: string[], hdrsRaw: any[]) => {
            const colBrand = hdrs.findIndex(h => h.includes('бренд') || h.includes('brand'));
            let colOrder = hdrs.findIndex(h => h.includes('заказ№') || (h.includes('заказ') && !h.includes('кол')));
            let colModel = hdrs.findIndex(h => h.includes('модель'));
            let colColor = hdrs.findIndex(h => h.includes('цвет') || h.includes('rang'));
            const colRost = hdrs.findIndex(h => h === 'рост' || h.includes('ростов'));
            let colQtyOrder = hdrs.findIndex(h => h.includes('заказ кол') || (h.includes('заказ') && h.includes('кол')) || h === 'всего');
            let colCut = hdrs.findIndex(h => h.includes('крой') && !h.includes('%'));
            let colDist = hdrs.findIndex(h => h.includes('раздача'));
            let colSew = hdrs.findIndex(h => h.includes('пошив'));
            let colPack = hdrs.findIndex(h => h.includes('упаковка') && !h.includes('общ'));
            let colDefect = hdrs.findIndex(h => h === 'брак' || (h.includes('брак') && !h.includes('%')));
            let colShip = hdrs.findIndex(h => h.includes('отгрузка'));
            const colMonth = hdrs.findIndex(h => h.includes('месяц') || h.includes('oy'));
            const colNotes = hdrs.findIndex(h => h.includes('примеч') || h.includes('izoh') || h.includes('коммент'));

            const sizeCols: { idx: number; label: string }[] = [];
            hdrs.forEach((h, i) => {
              const token = h.replace(/\s*\(.*?\)\s*/g, '').replace(/\+$/, '').trim();
              if (KNOWN_SIZE_TOKENS.has(h) || KNOWN_SIZE_TOKENS.has(token)) {
                sizeCols.push({ idx: i, label: String(hdrsRaw[i]).trim() });
              }
            });

            if (colOrder === -1) colOrder = 0;
            if (colModel === -1) colModel = 1;
            if (colColor === -1) colColor = 2;
            if (colQtyOrder === -1) colQtyOrder = sizeCols.length > 0 ? -1 : 3;
            if (colCut === -1) colCut = 4;
            if (colDist === -1) colDist = 5;
            if (colSew === -1) colSew = 6;
            if (colPack === -1) colPack = 7;
            if (colDefect === -1) colDefect = 8;
            if (colShip === -1) colShip = 11;

            return { colBrand, colOrder, colModel, colColor, colRost, colQtyOrder, colCut, colDist, colSew, colPack, colDefect, colShip, colMonth, colNotes, sizeCols };
          };

          let cols = resolveColumnIndexes(activeHeaders, activeHeadersRaw);
          const dataRows = rawRows.slice(headerRowIdx + 1);

          dataRows.forEach((row, idx) => {
            if (!row || row.length === 0 || row.every(c => c === '' || c === null || c === undefined)) return;

            const rowLower = row.map(c => String(c).toLowerCase().trim());
            // Поддержка многосекционных Excel-листов с разными размерными шапками
            if (
              rowLower.some(c => c === 'заказ' || c === 'заказ№') &&
              rowLower.some(c => c === 'модель')
            ) {
              activeHeadersRaw = row;
              activeHeaders = rowLower;
              cols = resolveColumnIndexes(activeHeaders, activeHeadersRaw);
              return;
            }

            const rowBrand = cols.colBrand !== -1 ? String(row[cols.colBrand] || '').trim() : '';
            const orderNo = String(row[cols.colOrder] || '').trim();
            const model = String(row[cols.colModel] || '').trim();
            const color = String(row[cols.colColor] || '').trim() || 'Черный';
            const rowRost = cols.colRost !== -1 ? String(row[cols.colRost] || '').trim() : '';
            if (!orderNo && !model) return;
            if (orderNo.toLowerCase().includes('итого')) return;

            const parseNum = (v: any) => Math.max(0, parseInt(String(v || 0).replace(/[^\d]/g, ''), 10) || 0);

            let sizeSum = 0;
            const sizeOrderVals: Record<string, number> = {};
            const activeImportedSizes: string[] = [];
            if (cols.sizeCols.length > 0) {
              cols.sizeCols.forEach(sc => {
                const v = parseNum(row[sc.idx]);
                if (v > 0) {
                  sizeOrderVals[sc.label] = v;
                  activeImportedSizes.push(sc.label);
                  sizeSum += v;
                }
              });
            }

            const qtyOrder = cols.colQtyOrder !== -1 ? parseNum(row[cols.colQtyOrder]) || sizeSum : sizeSum;
            const qtyCut = cols.sizeCols.length > 0 ? qtyOrder : (parseNum(row[cols.colCut]) || qtyOrder);
            const qtyDistribution = cols.sizeCols.length > 0 ? qtyOrder : (parseNum(row[cols.colDist]) || qtyCut);
            const qtySewing = cols.sizeCols.length > 0 ? qtyOrder : (parseNum(row[cols.colSew]) || qtyDistribution);
            const qtyPackaging = cols.sizeCols.length > 0 ? 0 : parseNum(row[cols.colPack]);
            const qtyDefect = cols.sizeCols.length > 0 ? 0 : parseNum(row[cols.colDefect]);
            const qtyShipped = cols.sizeCols.length > 0 ? 0 : parseNum(row[cols.colShip]);
            const rowMonth = cols.colMonth !== -1 && String(row[cols.colMonth] || '').trim()
              ? String(row[cols.colMonth]).trim()
              : targetImportMonth;
            const notes = cols.colNotes !== -1 ? String(row[cols.colNotes] || '').trim() : '';

            discoveredMonths.add(rowMonth);

            const qtyTotalPack = qtyPackaging + qtyDefect;
            const difference = qtyDistribution - qtyTotalPack;
            const qtyStock = Math.max(0, qtyPackaging - qtyShipped);
            const percent = qtyDistribution > 0 ? Math.round((qtyTotalPack / qtyDistribution) * 100) : 0;
            const rowId = `imp-${Date.now()}-${idx}`;

            importedRows.push({
              id: rowId,
              brand: rowBrand,
              orderNo: orderNo || `MOS-${String(500 + idx)}`,
              model: model || 'SM-OW-1111/160-TA.LMP.OE',
              color,
              rost: rowRost,
              qtyOrder,
              qtyCut,
              qtyDistribution,
              qtySewing,
              qtyPackaging,
              qtyDefect,
              qtyTotalPack,
              difference,
              qtyShipped,
              qtyStock,
              percent,
              month: rowMonth,
              notes
            });

            if (cols.sizeCols.length > 0) {
              const szLabels = activeImportedSizes.length > 0 ? activeImportedSizes : cols.sizeCols.map(s => s.label);
              const values: Record<string, SizeCellValues> = {};
              szLabels.forEach(lbl => {
                const v = sizeOrderVals[lbl] || 0;
                values[lbl] = { order: v, cut: v, dist: v, sew: v, pack: 0 };
              });
              importedMatrices[rowId] = {
                rowId,
                presetId: 'custom',
                sizes: szLabels,
                values,
                defect: qtyDefect
              };
            }
          });
        } else {
          rawRows.forEach((row, idx) => {
            if (!row || row.length < 3) return;
            const parseNum = (v: any) => Math.max(0, parseInt(String(v || 0).replace(/[^\d]/g, ''), 10) || 0);

            const orderNo = String(row[0] || '').trim();
            const model = String(row[1] || '').trim();
            const color = String(row[2] || '').trim();
            const qtyOrder = parseNum(row[3]);
            const qtyCut = parseNum(row[4]);
            const qtyDistribution = parseNum(row[5]);
            const qtySewing = parseNum(row[6]);
            const qtyPackaging = parseNum(row[7]);
            const qtyDefect = parseNum(row[8]);
            const qtyShipped = parseNum(row[11]);
            const notes = String(row[15] || row[16] || '').trim();

            if (!orderNo && !model) return;
            if (orderNo.toLowerCase().includes('итого')) return;

            const qtyTotalPack = qtyPackaging + qtyDefect;
            const difference = qtyDistribution - qtyTotalPack;
            const qtyStock = Math.max(0, qtyPackaging - qtyShipped);
            const percent = qtyDistribution > 0 ? Math.round((qtyTotalPack / qtyDistribution) * 100) : 0;

            importedRows.push({
              id: `imp-col-${Date.now()}-${idx}`,
              orderNo,
              model,
              color,
              qtyOrder,
              qtyCut,
              qtyDistribution,
              qtySewing,
              qtyPackaging,
              qtyDefect,
              qtyTotalPack,
              difference,
              qtyShipped,
              qtyStock,
              percent,
              month: targetImportMonth,
              notes
            });
          });
        }

        if (importedRows.length > 0) {
          if (discoveredMonths.size > 0) {
            setMonthsList(prev => Array.from(new Set([...prev, ...Array.from(discoveredMonths)])));
          }
          // Гарантируем, что у каждой импортированной строки есть матрица размеров в «Размеры по заказу»
          const allImportedMatrices: Record<string, OrderSizeMatrix> = { ...importedMatrices };
          importedRows.forEach(r => {
            if (!allImportedMatrices[r.id]) {
              allImportedMatrices[r.id] = buildDefaultSizeMatrixForRow(r);
            }
          });
          setSizeMatrices(prev => ({ ...prev, ...allImportedMatrices }));
          setLedgerRows(importedRows);
          setSelectedSizeRowId(importedRows[0].id);
          setActiveTabMode('size_matrix');
          showNotice(`Успешно импортировано ${importedRows.length} строк из Excel! Матрицы размеров открыты.`);
        } else {
          alert('Не удалось распознать строки заказов в файле!');
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        alert('Ошибка при чтении Excel файла!');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // =========================================================================
  // ЭКСПОРТ В EXCEL (.xlsx)
  // =========================================================================
  const handleExportExcel = () => {
    const headers = [
      'Месяц',
      'Бренд',
      'Заказ№',
      'Модель',
      'Цвет',
      'Рост',
      'заказ кол-во',
      'Крой кол-во',
      'Крой %',
      'Раздача кол-во',
      'Пошив кол-во',
      'Упаковка кол-во',
      'Брак',
      'Брак %',
      'Общ-упак',
      'Разница',
      'Отгрузка',
      'Остаток на складе',
      'Остаток %',
      'Закрытие %',
      'Примечание'
    ];

    const dataRows = filteredRows.map(r => {
      const m = getRowMetrics(r);
      return [
        r.month || DEFAULT_MONTHS[0],
        r.brand || '',
        r.orderNo,
        r.model,
        r.color,
        r.rost || '',
        r.qtyOrder,
        r.qtyCut,
        `${m.cutPct.toFixed(1)}%`,
        r.qtyDistribution,
        r.qtySewing,
        r.qtyPackaging,
        r.qtyDefect,
        `${m.defectPct.toFixed(1)}%`,
        r.qtyTotalPack,
        r.difference,
        r.qtyShipped,
        r.qtyStock,
        `${m.stockPct.toFixed(1)}%`,
        `${m.closePct.toFixed(1)}%`,
        r.notes || ''
      ];
    });

    const footerRow = [
      'ИТОГО:',
      '',
      '',
      '',
      '',
      '',
      totals.orderQty,
      totals.cutQty,
      `${totals.cutRatePercent}%`,
      totals.distQty,
      totals.sewQty,
      totals.packQty,
      totals.defectQty,
      `${totals.defectRatePercent}%`,
      totals.totalPackQty,
      totals.diffQty,
      totals.shipQty,
      totals.stockQty,
      `${totals.stockRatePercent}%`,
      `${totals.overallPercent}%`,
      ''
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows, footerRow]);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 14 },
      { wch: 24 },
      { wch: 18 },
      { wch: 11 },
      { wch: 13 },
      { wch: 13 },
      { wch: 10 },
      { wch: 15 },
      { wch: 13 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 11 },
      { wch: 12 },
      { wch: 16 },
      { wch: 11 },
      { wch: 12 },
      { wch: 26 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Производство');
    XLSX.writeFile(wb, `Заказы_Производство_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotice('Файл Excel успешно скачан!');
  };

  // =========================================================================
  // ЭКСПОРТ В PDF (с поддержкой кириллицы через LiberationSans)
  // =========================================================================
  const handleExportPdf = async () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const fontName = await registerCyrillicFonts(doc);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('ОТЧЕТ ПО ЗАКАЗАМ И ПРОИЗВОДСТВУ — CHUST TEXTILE', 12, 14);

      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const periodLabel = selectedMonth === 'all' ? 'Все месяцы' : selectedMonth;
      doc.text(
        `Отчетный месяц: ${periodLabel}   |   Дата: ${new Date().toLocaleDateString('ru-RU')}   |   Строк: ${filteredRows.length}   |   Крой%: ${totals.cutRatePercent}%   |   Закрытие: ${totals.overallPercent}%   |   Брак: ${totals.defectRatePercent}%`,
        12,
        20
      );

      const head = [[
        '№',
        'Месяц',
        'Бренд',
        'Заказ№',
        'Модель',
        'Цвет',
        'Рост',
        'Заказ',
        'Крой',
        'Крой%',
        'Разд.',
        'Пошив',
        'Упак.',
        'Брак',
        'Брак%',
        'Общ-уп',
        'Разн.',
        'Отгр.',
        'Остаток',
        'Закр.%'
      ]];

      const body = filteredRows.map((r, idx) => {
        const m = getRowMetrics(r);
        return [
          String(idx + 1),
          r.month || '',
          r.brand || '—',
          r.orderNo,
          r.model,
          r.color,
          r.rost || '—',
          r.qtyOrder.toLocaleString(),
          r.qtyCut.toLocaleString(),
          `${m.cutPct.toFixed(1)}%`,
          r.qtyDistribution.toLocaleString(),
          r.qtySewing.toLocaleString(),
          r.qtyPackaging.toLocaleString(),
          r.qtyDefect > 0 ? r.qtyDefect.toLocaleString() : '0',
          `${m.defectPct.toFixed(1)}%`,
          r.qtyTotalPack.toLocaleString(),
          String(r.difference),
          r.qtyShipped > 0 ? r.qtyShipped.toLocaleString() : '0',
          r.qtyStock.toLocaleString(),
          `${m.closePct.toFixed(1)}%`
        ];
      });

      const foot = [[
        '',
        'ИТОГО',
        '',
        '',
        '',
        '',
        '',
        totals.orderQty.toLocaleString(),
        totals.cutQty.toLocaleString(),
        `${totals.cutRatePercent}%`,
        totals.distQty.toLocaleString(),
        totals.sewQty.toLocaleString(),
        totals.packQty.toLocaleString(),
        totals.defectQty.toLocaleString(),
        `${totals.defectRatePercent}%`,
        totals.totalPackQty.toLocaleString(),
        totals.diffQty.toLocaleString(),
        totals.shipQty.toLocaleString(),
        totals.stockQty.toLocaleString(),
        `${totals.overallPercent}%`
      ]];

      autoTable(doc, {
        startY: 24,
        head,
        body,
        foot,
        theme: 'grid',
        styles: {
          font: fontName,
          fontSize: 6.2,
          cellPadding: 1.2,
          textColor: [15, 23, 42],
          lineColor: [203, 213, 225],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [254, 240, 138],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          halign: 'center'
        },
        footStyles: {
          fillColor: [254, 240, 138],
          textColor: [15, 23, 42],
          fontStyle: 'bold'
        },
        margin: { left: 8, right: 8 }
      });

      doc.save(`Заказы_Отчет_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotice('PDF отчет успешно создан и скачан!');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Ошибка при формировании PDF!');
    }
  };

  // Данные для графиков (Фото 2)
  const productionStagesData = useMemo(
    () => [
      { name: 'Заказ', value: totals.orderQty, fill: '#3b82f6' },
      { name: 'Крой', value: totals.cutQty, fill: '#06b6d4' },
      { name: 'Раздача', value: totals.distQty, fill: '#14b8a6' },
      { name: 'Пошив', value: totals.sewQty, fill: '#10b981' },
      { name: 'Упаковка', value: totals.packQty, fill: '#84cc16' },
      { name: 'Отгружено', value: totals.shipQty, fill: '#f59e0b' }
    ],
    [totals]
  );

  const topDefectsData = useMemo(() => {
    return [...filteredRows]
      .filter(r => r.qtyDefect > 0)
      .sort((a, b) => b.qtyDefect - a.qtyDefect)
      .slice(0, 10)
      .map(r => ({
        name: r.orderNo,
        defect: r.qtyDefect,
        model: r.model
      }));
  }, [filteredRows]);

  const topModelsPieData = useMemo(() => {
    const map: { [model: string]: number } = {};
    filteredRows.forEach(r => {
      map[r.model] = (map[r.model] || 0) + (r.qtyPackaging || 0);
    });

    const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a78bfa', '#64748b'];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, val], idx) => ({
        name: name.length > 22 ? name.substring(0, 20) + '...' : name,
        value: val,
        color: colors[idx % colors.length]
      }));
  }, [filteredRows]);

  // Активная ячейка для адресной строки Excel
  const activeCellInfo = useMemo(() => {
    if (!activeCell || !filteredRows[activeCell.row]) return null;
    const row = filteredRows[activeCell.row];
    const colDef = GRID_COLUMNS[activeCell.col];
    const colLetter = EXCEL_COL_LETTERS[activeCell.col] || 'Z';
    const address = `${colLetter}${activeCell.row + 1}`;
    const value = getCellRawValue(row, colDef.key);
    return { row, colDef, address, value };
  }, [activeCell, filteredRows, getCellRawValue]);

  // =========================================================================
  // ЛОГИКА РАЗМЕРНЫХ МАТРИЦ ПО ЗАКАЗАМ
  // =========================================================================
  const activeSizeRow = useMemo(() => {
    if (filteredRows.length === 0) return derivedLedgerRows[0] || null;
    const found = filteredRows.find(r => r.id === selectedSizeRowId) || derivedLedgerRows.find(r => r.id === selectedSizeRowId);
    return found || filteredRows[0];
  }, [filteredRows, derivedLedgerRows, selectedSizeRowId]);

  // Все цвета и ростовки, относящиеся к текущему выбранному Заказу №
  const activeOrderVariants = useMemo(() => {
    if (!activeSizeRow) return [];
    return derivedLedgerRows.filter(r => r.orderNo === activeSizeRow.orderNo);
  }, [activeSizeRow, derivedLedgerRows]);

  const activeSizeMatrix = useMemo<OrderSizeMatrix | null>(() => {
    if (!activeSizeRow) return null;
    const existing = sizeMatrices[activeSizeRow.id];
    if (existing && Array.isArray(existing.sizes) && existing.sizes.length > 0) {
      return existing;
    }
    return buildDefaultSizeMatrixForRow(activeSizeRow);
  }, [activeSizeRow, sizeMatrices]);

  // Отображаемые размеры в матрице ввода (учитывает режим «Только заполненные»)
  const visibleMatrixSizes = useMemo(() => {
    if (!activeSizeMatrix) return [];
    if (!hideEmptyMatrixSizes) return activeSizeMatrix.sizes;
    return getEffectiveDisplaySizes(activeSizeMatrix);
  }, [activeSizeMatrix, hideEmptyMatrixSizes]);

  // Заполненные размеры для сводной таблицы по заказу и для диаграммы / экспорта
  const reportMatrixSizes = useMemo(() => {
    return getEffectiveDisplaySizes(activeSizeMatrix);
  }, [activeSizeMatrix]);

  const activeOrderUnionPopulatedSizes = useMemo(() => {
    const unionSet = new Set<string>();
    const allSizesInOrder = new Set<string>();
    activeOrderVariants.forEach(v => {
      const m = sizeMatrices[v.id];
      if (!m) return;
      m.sizes.forEach(s => allSizesInOrder.add(s));
      getPopulatedSizes(m).forEach(s => unionSet.add(s));
    });
    if (unionSet.size > 0) return Array.from(unionSet);
    return Array.from(allSizesInOrder);
  }, [activeOrderVariants, sizeMatrices]);

  const activeSizeTotals = useMemo(() => {
    if (!activeSizeMatrix) {
      return { order: 0, cut: 0, cutPct: 0, dist: 0, sew: 0, pack: 0, remOrder: 0, remDist: 0, diffDistPackPct: 0, pct: 0 };
    }
    let order = 0;
    let cut = 0;
    let dist = 0;
    let sew = 0;
    let pack = 0;
    activeSizeMatrix.sizes.forEach(sz => {
      const c = activeSizeMatrix.values[sz];
      if (!c) return;
      order += Number(c.order) || 0;
      cut += Number(c.cut) || 0;
      dist += Number(c.dist) || 0;
      sew += Number(c.sew) || 0;
      pack += Number(c.pack) || 0;
    });
    const remOrder = order - pack;
    const remDist = dist - pack;
    const cutPct = order > 0 ? (cut / order) * 100 : 0;
    const diffDistPackPct = dist > 0 ? (remDist / dist) * 100 : 0;
    const pct = order > 0 ? (pack / order) * 100 : 0;
    return { order, cut, cutPct, dist, sew, pack, remOrder, remDist, diffDistPackPct, pct };
  }, [activeSizeMatrix]);

  const updateSizeCellValue = (sizeName: string, field: keyof SizeCellValues, rawVal: string) => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    const num = Math.max(0, parseInt(rawVal.replace(/[^\d]/g, ''), 10) || 0);
    const nextMatrix: OrderSizeMatrix = {
      ...activeSizeMatrix,
      values: {
        ...activeSizeMatrix.values,
        [sizeName]: {
          ...(activeSizeMatrix.values[sizeName] || { order: 0, cut: 0, dist: 0, sew: 0, pack: 0 }),
          [field]: num
        }
      }
    };
    setSizeMatrices(prev => ({ ...prev, [activeSizeRow.id]: nextMatrix }));
  };

  // Excel-навигация (стрелки, Tab, Shift+Tab, Enter, Shift+Enter, F2, Esc) внутри матрицы «Размеры по заказу»
  const handleSizeMatrixKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, stageIdx: number, colIdx: number) => {
    if (!activeSizeMatrix) return;
    const maxRow = 4; // 0:order, 1:cut, 2:dist, 3:sew, 4:pack
    const maxCol = Math.max(0, visibleMatrixSizes.length - 1);
    let nextR = stageIdx;
    let nextC = colIdx;

    if (e.key === 'F2') {
      e.preventDefault();
      sizeMatrixManualCaretRef.current = true;
      const len = e.currentTarget.value.length;
      e.currentTarget.setSelectionRange(len, len);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      sizeMatrixManualCaretRef.current = false;
      e.currentTarget.blur();
      setSizeMatrixActiveCell(null);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        if (stageIdx > 0) nextR = stageIdx - 1;
        else if (colIdx > 0) {
          nextR = maxRow;
          nextC = colIdx - 1;
        }
      } else {
        if (stageIdx < maxRow) nextR = stageIdx + 1;
        else if (colIdx < maxCol) {
          nextR = 0;
          nextC = colIdx + 1;
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (colIdx > 0) nextC = colIdx - 1;
        else if (stageIdx > 0) {
          nextR = stageIdx - 1;
          nextC = maxCol;
        }
      } else {
        if (colIdx < maxCol) nextC = colIdx + 1;
        else if (stageIdx < maxRow) {
          nextR = stageIdx + 1;
          nextC = 0;
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextR = Math.min(maxRow, stageIdx + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextR = Math.max(0, stageIdx - 1);
    } else if (e.key === 'ArrowRight') {
      const selAll = e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === e.currentTarget.value.length;
      const atEnd = e.currentTarget.selectionStart === e.currentTarget.value.length;
      if (!sizeMatrixManualCaretRef.current || selAll || atEnd) {
        e.preventDefault();
        if (colIdx < maxCol) nextC = colIdx + 1;
        else if (stageIdx < maxRow) {
          nextR = stageIdx + 1;
          nextC = 0;
        }
      } else {
        return;
      }
    } else if (e.key === 'ArrowLeft') {
      const selAll = e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === e.currentTarget.value.length;
      const atStart = e.currentTarget.selectionStart === 0;
      if (!sizeMatrixManualCaretRef.current || selAll || atStart) {
        e.preventDefault();
        if (colIdx > 0) nextC = colIdx - 1;
        else if (stageIdx > 0) {
          nextR = stageIdx - 1;
          nextC = maxCol;
        }
      } else {
        return;
      }
    } else {
      return;
    }

    sizeMatrixManualCaretRef.current = false;
    setSizeMatrixActiveCell({ row: nextR, col: nextC });
    const el = document.querySelector<HTMLInputElement>(`input[data-sz-r="${nextR}"][data-sz-c="${nextC}"]`);
    if (el) {
      el.focus();
      el.select();
    }
  };

  // Массовая вставка из Excel (Ctrl+V) прямо в ячейки матрицы «Размеры по заказу»
  const handleSizeMatrixPaste = (e: React.ClipboardEvent<HTMLInputElement>, startStageIdx: number, startColIdx: number) => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    const text = e.clipboardData?.getData('text') || '';
    if (!text.includes('\t') && !text.includes('\n')) return; // Одиночное число вставляется стандартно

    e.preventDefault();
    const stageFields: (keyof SizeCellValues)[] = ['order', 'cut', 'dist', 'sew', 'pack'];
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.length > 0);
    const nextValues = { ...activeSizeMatrix.values };

    lines.forEach((line, rOff) => {
      const stageField = stageFields[startStageIdx + rOff];
      if (!stageField) return;
      const cells = line.split('\t');
      cells.forEach((rawCell, cOff) => {
        const sz = visibleMatrixSizes[startColIdx + cOff];
        if (!sz) return;
        const num = Math.max(0, parseInt(rawCell.replace(/[^\d]/g, ''), 10) || 0);
        nextValues[sz] = {
          ...(nextValues[sz] || { order: 0, cut: 0, dist: 0, sew: 0, pack: 0 }),
          [stageField]: num
        };
      });
    });

    setSizeMatrices(prev => ({
      ...prev,
      [activeSizeRow.id]: {
        ...activeSizeMatrix,
        values: nextValues
      }
    }));
    showNotice(`Данные из Excel вставлены в матрицу размеров (${lines.length} стр.)!`);
  };

  const updateSizeDefect = (rawVal: string) => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    const num = Math.max(0, parseInt(rawVal.replace(/[^\d]/g, ''), 10) || 0);
    setSizeMatrices(prev => ({
      ...prev,
      [activeSizeRow.id]: { ...activeSizeMatrix, defect: num }
    }));
  };

  const changeSizePresetForRow = (presetId: Exclude<SizePresetId, 'custom'>) => {
    if (!activeSizeRow) return;
    const presetSizes = [...SIZE_PRESETS[presetId].sizes];
    const prevVals = activeSizeMatrix?.values || {};
    const newVals: Record<string, SizeCellValues> = {};
    presetSizes.forEach(sz => {
      newVals[sz] = prevVals[sz] || { order: 0, cut: 0, dist: 0, sew: 0, pack: 0 };
    });
    const nextMatrix: OrderSizeMatrix = {
      rowId: activeSizeRow.id,
      presetId,
      sizes: presetSizes,
      values: newVals,
      defect: activeSizeMatrix?.defect || 0
    };
    setHideEmptyMatrixSizes(false);
    setSizeMatrices(prev => ({ ...prev, [activeSizeRow.id]: nextMatrix }));
    showNotice(`Размерная сетка переключена на: ${SIZE_PRESETS[presetId].label}`);
  };

  // Редактировать название конкретного размера в матрице
  const handleCommitRenameSize = (oldName: string) => {
    const newName = editingSizeColDraft.trim();
    setEditingSizeCol(null);
    if (!activeSizeRow || !activeSizeMatrix || !newName || newName === oldName) return;
    if (activeSizeMatrix.sizes.includes(newName)) {
      showNotice(`Размер «${newName}» уже существует!`);
      return;
    }
    const nextSizes = activeSizeMatrix.sizes.map(s => (s === oldName ? newName : s));
    const nextValues: Record<string, SizeCellValues> = {};
    activeSizeMatrix.sizes.forEach(s => {
      const targetKey = s === oldName ? newName : s;
      nextValues[targetKey] = activeSizeMatrix.values[s] || { order: 0, cut: 0, dist: 0, sew: 0, pack: 0 };
    });
    setSizeMatrices(prev => ({
      ...prev,
      [activeSizeRow.id]: {
        ...activeSizeMatrix,
        presetId: 'custom',
        sizes: nextSizes,
        values: nextValues
      }
    }));
    showNotice(`Размер «${oldName}» переименован в «${newName}»`);
  };

  // Оставить в матрице ТОЛЬКО размеры с введенными данными (> 0)
  const handleTrimEmptySizeColumns = () => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    const populated = getPopulatedSizes(activeSizeMatrix);
    if (populated.length === 0) {
      showNotice('Сначала введите числа хотя бы в один размер!');
      return;
    }
    const nextValues: Record<string, SizeCellValues> = {};
    populated.forEach(sz => {
      nextValues[sz] = activeSizeMatrix.values[sz];
    });
    setSizeMatrices(prev => ({
      ...prev,
      [activeSizeRow.id]: {
        ...activeSizeMatrix,
        presetId: 'custom',
        sizes: populated,
        values: nextValues
      }
    }));
    showNotice(`Пустые размеры (0) удалены! Оставлены только активные: ${populated.join(', ')}`);
  };

  const handleRebuildSizeMatrixFromRow = () => {
    if (!activeSizeRow) return;
    const currentPreset =
      activeSizeMatrix && activeSizeMatrix.presetId !== 'custom'
        ? activeSizeMatrix.presetId
        : detectSizePresetForRow(activeSizeRow);
    const nextMatrix = buildDefaultSizeMatrixForRow(activeSizeRow, currentPreset);
    setSizeMatrices(prev => ({ ...prev, [activeSizeRow.id]: nextMatrix }));
    showNotice(`Размеры автоматически распределены по заказу ${activeSizeRow.orderNo}!`);
  };

  const handleAddCustomSizeColumn = () => {
    const label = newCustomSizeInput.trim();
    if (!label || !activeSizeRow || !activeSizeMatrix) return;
    if (activeSizeMatrix.sizes.includes(label)) {
      showNotice(`Размер «${label}» уже есть в таблице`);
      return;
    }
    const nextMatrix: OrderSizeMatrix = {
      ...activeSizeMatrix,
      presetId: 'custom',
      sizes: [...activeSizeMatrix.sizes, label],
      values: {
        ...activeSizeMatrix.values,
        [label]: { order: 0, cut: 0, dist: 0, sew: 0, pack: 0 }
      }
    };
    setSizeMatrices(prev => ({ ...prev, [activeSizeRow.id]: nextMatrix }));
    setNewCustomSizeInput('');
    showNotice(`Добавлен размер «${label}»`);
  };

  const handleApplyBulkSizes = () => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    const parsed: string[] = bulkSizeInput
      .split(/[,;\s\t]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const unique: string[] = Array.from<string>(new Set(parsed));
    if (unique.length === 0) return;

    const existingValues = activeSizeMatrix.values;
    const newValues: Record<string, SizeCellValues> = {};
    unique.forEach(sz => {
      newValues[sz] = existingValues[sz] || { order: 0, cut: 0, dist: 0, sew: 0, pack: 0 };
    });

    const hasAnyNumbers = unique.some(sz => (newValues[sz]?.order || 0) > 0 || (newValues[sz]?.pack || 0) > 0);
    let nextMatrix: OrderSizeMatrix = {
      ...activeSizeMatrix,
      presetId: 'custom',
      sizes: unique,
      values: newValues
    };

    if (!hasAnyNumbers && activeSizeRow.qtyOrder > 0) {
      const ordArr = distributeQtyAcrossSizes(activeSizeRow.qtyOrder, unique, unique.length);
      const cutArr = distributeQtyAcrossSizes(activeSizeRow.qtyCut, unique, unique.length);
      const distArr = distributeQtyAcrossSizes(activeSizeRow.qtyDistribution, unique, unique.length);
      const sewArr = distributeQtyAcrossSizes(activeSizeRow.qtySewing, unique, unique.length);
      const packArr = distributeQtyAcrossSizes(activeSizeRow.qtyPackaging, unique, unique.length);
      unique.forEach((sz, idx) => {
        nextMatrix.values[sz] = {
          order: ordArr[idx],
          cut: cutArr[idx],
          dist: distArr[idx],
          sew: sewArr[idx],
          pack: packArr[idx]
        };
      });
    }

    setSizeMatrices(prev => ({ ...prev, [activeSizeRow.id]: nextMatrix }));
    setBulkSizeInput('');
    setShowCustomSizeEditor(false);
    showNotice(`Применены размеры (${unique.length}): ${unique.join(', ')}`);
  };

  const handleRemoveSizeColumn = (sizeName: string) => {
    if (!activeSizeRow || !activeSizeMatrix || activeSizeMatrix.sizes.length <= 1) return;
    const nextSizes = activeSizeMatrix.sizes.filter(s => s !== sizeName);
    const nextValues = { ...activeSizeMatrix.values };
    delete nextValues[sizeName];
    setSizeMatrices(prev => ({
      ...prev,
      [activeSizeRow.id]: {
        ...activeSizeMatrix,
        presetId: 'custom',
        sizes: nextSizes,
        values: nextValues
      }
    }));
  };

  const handleSyncSizeMatrixToLedger = () => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    setLedgerRows(prev =>
      prev.map(r => {
        if (r.id !== activeSizeRow.id) return r;
        return recalcRow({
          ...r,
          qtyOrder: activeSizeTotals.order,
          qtyCut: activeSizeTotals.cut,
          qtyDistribution: activeSizeTotals.dist,
          qtySewing: activeSizeTotals.sew,
          qtyPackaging: activeSizeTotals.pack,
          qtyDefect: activeSizeMatrix.defect
        });
      })
    );
    showNotice(`Итоги по размерам синхронизированы в «Таблицу производства» для ${activeSizeRow.orderNo}!`);
  };

  const handleUploadModelImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSizeRow) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const dataUrl = String(evt.target?.result || '');
      if (!dataUrl) return;
      setModelImages(prev => ({
        ...prev,
        [activeSizeRow.model]: dataUrl,
        [activeSizeRow.id]: dataUrl
      }));
      showNotice('Фотография / эскиз модели загружены!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleExportSizeMatrixExcel = () => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    const sizes = reportMatrixSizes;
    const head = ['Бренд', 'Заказ', 'Модель', 'Цвет', 'Рост', 'Этап', ...sizes, 'ВСЕГО'];

    const stageRows = [
      ['Заказ', ...sizes.map(sz => activeSizeMatrix.values[sz]?.order || ''), activeSizeTotals.order],
      ['Крой', ...sizes.map(sz => activeSizeMatrix.values[sz]?.cut || ''), activeSizeTotals.cut],
      [
        'Крой % (к Заказу)',
        ...sizes.map(sz => {
          const c = activeSizeMatrix.values[sz];
          if (!c || c.order === 0) return '';
          return `${((c.cut / c.order) * 100).toFixed(1).replace('.', ',')}%`;
        }),
        `${activeSizeTotals.cutPct.toFixed(1).replace('.', ',')}%`
      ],
      ['Раздача', ...sizes.map(sz => activeSizeMatrix.values[sz]?.dist || ''), activeSizeTotals.dist],
      ['Пошив', ...sizes.map(sz => activeSizeMatrix.values[sz]?.sew || ''), activeSizeTotals.sew],
      ['Упаковка', ...sizes.map(sz => activeSizeMatrix.values[sz]?.pack || ''), activeSizeTotals.pack],
      [
        'Остаток',
        ...sizes.map(sz => {
          const c = activeSizeMatrix.values[sz];
          if (!c || (c.order === 0 && c.pack === 0)) return '';
          return c.order - c.pack;
        }),
        activeSizeTotals.remOrder
      ],
      [
        '%',
        ...sizes.map(sz => {
          const c = activeSizeMatrix.values[sz];
          if (!c || c.order === 0) return '';
          return `${((c.pack / c.order) * 100).toFixed(1).replace('.', ',')}%`;
        }),
        `${activeSizeTotals.pct.toFixed(1).replace('.', ',')}%`
      ]
    ].map((arr, i) => [
      i === 0 ? (activeSizeRow.brand || '') : '',
      i === 0 ? activeSizeRow.orderNo : '',
      i === 0 ? activeSizeRow.model : '',
      i === 0 ? activeSizeRow.color : '',
      i === 0 ? (activeSizeRow.rost || '') : '',
      ...arr
    ]);

    const summaryHead = ['', '', '', '', '', '', '', '', ''];
    const summaryTitles = [
      'Всего заказа',
      'Всего крой',
      'Крой %',
      'Всего Раздача',
      'Всего Пошив',
      'Всего Упаковка',
      'Брак',
      'Разница (Разд-Упак)',
      'Разница %'
    ];
    const summaryVals = [
      activeSizeTotals.order,
      activeSizeTotals.cut,
      `${activeSizeTotals.cutPct.toFixed(1).replace('.', ',')}%`,
      activeSizeTotals.dist,
      activeSizeTotals.sew,
      activeSizeTotals.pack,
      activeSizeMatrix.defect || 0,
      activeSizeTotals.remDist,
      `${activeSizeTotals.diffDistPackPct.toFixed(1).replace('.', ',')}%`
    ];

    const ws = XLSX.utils.aoa_to_sheet([head, ...stageRows, summaryHead, summaryTitles, summaryVals]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Размеры');
    XLSX.writeFile(wb, `Размеры_${activeSizeRow.orderNo}_${activeSizeRow.color}${activeSizeRow.rost ? '_' + activeSizeRow.rost : ''}.xlsx`);
    showNotice('Матрица размеров экспортирована в Excel!');
  };

  const handleExportSizeMatrixPdf = async () => {
    if (!activeSizeRow || !activeSizeMatrix) return;
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const fontName = await registerCyrillicFonts(doc);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `РАЗМЕРЫ ПО ЗАКАЗУ: ${activeSizeRow.orderNo} — ${activeSizeRow.model} (${activeSizeRow.color}${activeSizeRow.rost ? ', рост ' + activeSizeRow.rost : ''})`,
        12,
        14
      );

      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Бренд: ${activeSizeRow.brand || '—'}   |   Месяц: ${activeSizeRow.month || '—'}   |   Крой %: ${activeSizeTotals.cutPct.toFixed(1)}%   |   Дата: ${new Date().toLocaleDateString('ru-RU')}`,
        12,
        20
      );

      const sizes = reportMatrixSizes;
      const colorLabel = [
        activeSizeRow.color,
        activeSizeRow.colorCode ? `(${activeSizeRow.colorCode})` : '',
        activeSizeRow.rost ? `Рост: ${activeSizeRow.rost}` : ''
      ].filter(Boolean).join('\n');

      const head = [['Заказ', 'Модель', 'Цвет / Рост', 'Этап', ...sizes, 'ВСЕГО']];
      const stageRows = [
        [
          { content: `${activeSizeRow.orderNo}\n${activeSizeRow.brand || ''}`, rowSpan: 8, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
          { content: activeSizeRow.model, rowSpan: 8, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
          { content: colorLabel, rowSpan: 8, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
          'Заказ',
          ...sizes.map(sz => (activeSizeMatrix.values[sz]?.order ? String(activeSizeMatrix.values[sz].order) : '')),
          String(activeSizeTotals.order)
        ],
        ['Крой', ...sizes.map(sz => (activeSizeMatrix.values[sz]?.cut ? String(activeSizeMatrix.values[sz].cut) : '')), String(activeSizeTotals.cut)],
        [
          { content: 'Крой %', styles: { fillColor: [224, 242, 254], textColor: [3, 105, 161], fontStyle: 'bold' } },
          ...sizes.map(sz => {
            const c = activeSizeMatrix.values[sz];
            const pctStr = c && c.order > 0 ? `${((c.cut / c.order) * 100).toFixed(1).replace('.', ',')}%` : '';
            return {
              content: pctStr,
              styles: pctStr ? { fillColor: [224, 242, 254], textColor: [3, 105, 161], fontStyle: 'bold' } : {}
            };
          }),
          {
            content: `${activeSizeTotals.cutPct.toFixed(1).replace('.', ',')}%`,
            styles: { fillColor: [224, 242, 254], textColor: [3, 105, 161], fontStyle: 'bold' }
          }
        ],
        ['Раздача', ...sizes.map(sz => (activeSizeMatrix.values[sz]?.dist ? String(activeSizeMatrix.values[sz].dist) : '')), String(activeSizeTotals.dist)],
        ['Пошив', ...sizes.map(sz => (activeSizeMatrix.values[sz]?.sew ? String(activeSizeMatrix.values[sz].sew) : '')), String(activeSizeTotals.sew)],
        [
          { content: 'Упаковка', styles: { fillColor: [255, 255, 0], fontStyle: 'bold' } },
          ...sizes.map(sz => ({
            content: activeSizeMatrix.values[sz]?.pack ? String(activeSizeMatrix.values[sz].pack) : '',
            styles: { fillColor: [255, 255, 0], fontStyle: 'bold' }
          })),
          { content: String(activeSizeTotals.pack), styles: { fillColor: [255, 255, 0], fontStyle: 'bold' } }
        ],
        [
          'Остаток',
          ...sizes.map(sz => {
            const c = activeSizeMatrix.values[sz];
            return c && (c.order > 0 || c.pack > 0) ? String(c.order - c.pack) : '';
          }),
          String(activeSizeTotals.remOrder)
        ],
        [
          { content: 'Закр. %', styles: { textColor: [185, 28, 28], fontStyle: 'bold' } },
          ...sizes.map(sz => {
            const c = activeSizeMatrix.values[sz];
            const pctStr = c && c.order > 0 ? `${((c.pack / c.order) * 100).toFixed(1).replace('.', ',')}%` : '';
            return {
              content: pctStr,
              styles: pctStr ? { fillColor: [134, 239, 172], textColor: [153, 27, 27], fontStyle: 'bold' } : {}
            };
          }),
          {
            content: `${activeSizeTotals.pct.toFixed(1).replace('.', ',')}%`,
            styles: { fillColor: [134, 239, 172], textColor: [153, 27, 27], fontStyle: 'bold' }
          }
        ]
      ];

      autoTable(doc, {
        startY: 25,
        head,
        body: stageRows as any,
        theme: 'grid',
        styles: {
          font: fontName,
          fontSize: 8.2,
          halign: 'center',
          textColor: [15, 23, 42],
          lineColor: [51, 65, 85],
          lineWidth: 0.25
        },
        headStyles: {
          fillColor: [248, 203, 173],
          textColor: [15, 23, 42],
          fontStyle: 'bold'
        },
        margin: { left: 10, right: 10 }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 105;
      autoTable(doc, {
        startY: finalY + 8,
        head: [['Всего заказа', 'Всего крой', 'Крой %', 'Всего Раздача', 'Всего Пошив', 'Всего Упаковка', 'Брак', 'Разница (Разд-Упак)', 'Разница %']],
        body: [[
          String(activeSizeTotals.order),
          String(activeSizeTotals.cut),
          `${activeSizeTotals.cutPct.toFixed(1)}%`,
          String(activeSizeTotals.dist),
          String(activeSizeTotals.sew),
          String(activeSizeTotals.pack),
          activeSizeMatrix.defect > 0 ? String(activeSizeMatrix.defect) : '0',
          String(activeSizeTotals.remDist),
          `${activeSizeTotals.diffDistPackPct.toFixed(1)}%`
        ]],
        theme: 'grid',
        styles: {
          font: fontName,
          fontSize: 8.8,
          halign: 'center',
          fontStyle: 'bold',
          textColor: [15, 23, 42],
          lineColor: [51, 65, 85],
          lineWidth: 0.25
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42]
        },
        margin: { left: 10, right: 10 }
      });

      doc.save(`Размеры_${activeSizeRow.orderNo}_${activeSizeRow.color}${activeSizeRow.rost ? '_' + activeSizeRow.rost : ''}.pdf`);
      showNotice('PDF раскладка по размерам скачана!');
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании PDF раскладки!');
    }
  };

  return (
    <div
      className="space-y-4 animate-fadeIn"
      onPaste={e => {
        // Вставка многострочных данных из Excel при неактивном текстовом input
        if (editingCell) return;
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
        const pasted = e.clipboardData?.getData('text');
        if (pasted && activeCell) {
          e.preventDefault();
          handlePasteAtActiveCell(pasted);
        }
      }}
    >
      {/* Уведомление */}
      {notification && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl flex items-center gap-2.5 text-emerald-200 text-xs shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{notification}</span>
        </div>
      )}

      {/* =========================================================================
          ВЕРХНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ И ВКЛАДКИ
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!selectedSizeRowId && filteredRows[0]) {
                setSelectedSizeRowId(filteredRows[0].id);
              }
              setActiveTabMode('size_matrix');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all border ${
              activeTabMode === 'size_matrix'
                ? 'bg-orange-400 text-slate-950 border-orange-300 shadow-lg shadow-orange-950/40 font-bold'
                : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>Размеры по заказу (Ввод)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('table_photo1')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all border ${
              activeTabMode === 'table_photo1'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-950/40 font-bold'
                : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Таблица производства</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('diff_razd_upak')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all border ${
              activeTabMode === 'diff_razd_upak'
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-950/40 font-bold'
                : 'bg-slate-950 text-rose-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Разница: Раздача − Упаковка</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('dashboard_photo2')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${
              activeTabMode === 'dashboard_photo2'
                ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-950/40'
                : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Интерактивный дашборд</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('summary_photo3')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${
              activeTabMode === 'summary_photo3'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/40'
                : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Сводная по заказам</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('colors_photo4')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${
              activeTabMode === 'colors_photo4'
                ? 'bg-teal-600 text-white border-teal-400 shadow-lg shadow-teal-950/40'
                : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Строки по цветам</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('settings_photo5')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${
              activeTabMode === 'settings_photo5'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-950/40'
                : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Настройки, бренды и месяцы</span>
          </button>
        </div>

        {/* Кнопки Импорта / Экспорта Excel, PDF и Полноэкранного режима */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={excelFileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcelFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleAddBlankRow}
            className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
            title="Добавить новый заказ в «Размеры по заказу»"
          >
            <Plus className="w-4 h-4" />
            <span>Новый заказ</span>
          </button>

          {activeTabMode === 'table_photo1' && (
            <button
              type="button"
              onClick={() => setIsTableFullscreen(true)}
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
              title="Открыть Таблицу производства на весь экран"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Полный экран</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => excelFileInputRef.current?.click()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            title="Загрузить файл Excel (.xlsx, .xls, .csv)"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Импорт Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer border border-emerald-400/40 transition-all"
            title="Экспорт таблицы в Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-100" />
            <span>Скачать Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer border border-rose-400/40 transition-all"
            title="Скачать отчет в формате PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-100" />
            <span>Скачать PDF</span>
          </button>

          {derivedLedgerRows.length > 0 && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              title="Очистить все заказы (пароль 1111)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          ПАНЕЛЬ ФИЛЬТРОВ + ДОБАВЛЕНИЕ НОВОГО МЕСЯЦА
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md space-y-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Месяц + кнопка "+ Новый месяц" */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-cyan-500/40 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 font-bold">Месяц:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Все месяцы ({uniqueMonths.length})</option>
                {uniqueMonths.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsAddMonthOpen(v => !v)}
                className="ml-1 px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                title="Добавить новый месяц"
              >
                <Plus className="w-3 h-3" />
                <span>Новый месяц</span>
              </button>
            </div>

            {/* Бренд + кнопка "+ Новый бренд" */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-indigo-500/40 rounded-xl px-2.5 py-1">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-indigo-300 font-bold">Бренд:</span>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[140px]"
              >
                <option value="all" className="bg-slate-900 text-white">Все бренды</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b} className="bg-slate-900 text-white">
                    {b}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsAddBrandOpen(v => !v)}
                className="ml-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black flex items-center gap-0.5 cursor-pointer transition-colors"
                title="Добавить новый бренд"
              >
                <Plus className="w-3 h-3" />
                <span>Бренд</span>
              </button>
            </div>

            {/* Заказ № */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-slate-300 font-semibold">Заказ №:</span>
              <select
                value={selectedOrderNo}
                onChange={e => setSelectedOrderNo(e.target.value)}
                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer max-w-[140px]"
              >
                <option value="all" className="bg-slate-900 text-white">Все заказы</option>
                {uniqueOrderNos.map(o => (
                  <option key={o} value={o} className="bg-slate-900 text-white">
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Модель */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-slate-300 font-semibold">Модель:</span>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all" className="bg-slate-900 text-white">Все модели</option>
                {uniqueModels.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Цвет */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-slate-300 font-semibold">Цвет:</span>
              <select
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all" className="bg-slate-900 text-white">Все цвета</option>
                {uniqueColors.map(c => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {(selectedMonth !== 'all' || selectedBrand !== 'all' || selectedOrderNo !== 'all' || selectedModel !== 'all' || selectedColor !== 'all' || searchFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth('all');
                  setSelectedBrand('all');
                  setSelectedOrderNo('all');
                  setSelectedModel('all');
                  setSelectedColor('all');
                  setSearchFilter('');
                }}
                className="px-2.5 py-1 text-amber-300 hover:text-amber-200 bg-amber-500/15 rounded-lg border border-amber-500/40 text-[11px] font-bold cursor-pointer"
              >
                Сбросить фильтры
              </button>
            )}
          </div>

          {/* Быстрый поиск */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Поиск по бренду, заказу, модели..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>
        </div>

        {/* Форма добавления нового месяца */}
        {isAddMonthOpen && (
          <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-xl flex flex-wrap items-center gap-2.5 animate-fadeIn">
            <span className="text-cyan-300 font-bold">Добавить новый месяц:</span>
            <select
              value={newMonthName}
              onChange={e => setNewMonthName(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold"
            >
              {RUSSIAN_MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              value={newMonthYear}
              onChange={e => setNewMonthYear(e.target.value)}
              className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
              min="2024"
              max="2035"
            />
            <span className="text-slate-400">или вручную:</span>
            <input
              type="text"
              value={customMonthInput}
              onChange={e => setCustomMonthInput(e.target.value)}
              placeholder="Например: Февраль 2027"
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500"
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateNewMonth();
              }}
            />
            <button
              type="button"
              onClick={handleCreateNewMonth}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer"
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={() => setIsAddMonthOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Форма добавления нового бренда */}
        {isAddBrandOpen && (
          <div className="p-3 bg-slate-950 border border-indigo-500/40 rounded-xl flex flex-wrap items-center gap-2.5 animate-fadeIn">
            <span className="text-indigo-300 font-bold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Добавить новый бренд:</span>
            </span>
            <input
              type="text"
              value={newBrandInput}
              onChange={e => setNewBrandInput(e.target.value)}
              placeholder="Например: Gloria Jeans / LC Waikiki..."
              className="flex-1 min-w-[220px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const created = handleCreateNewBrand();
                  if (created) setSelectedBrand(created);
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                const created = handleCreateNewBrand();
                if (created) setSelectedBrand(created);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer"
            >
              Добавить бренд
            </button>
            <button
              type="button"
              onClick={() => setIsAddBrandOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          TAB 1: ИНТЕРАКТИВНАЯ EXCEL-ТАБЛИЦА ПРОИЗВОДСТВА
         ========================================================================= */}
      {activeTabMode === 'table_photo1' && (
        <div
          className={
            isTableFullscreen
              ? 'fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden animate-fadeIn'
              : 'bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-2xl animate-fadeIn flex flex-col'
          }
        >
          {/* Панель полноэкранного режима (когда таблица открыта на весь экран) */}
          {isTableFullscreen && (
            <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-sm md:text-base tracking-tight">Таблица производства</span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-cyan-200 font-bold text-sm rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="all">Все месяцы ({uniqueMonths.length})</option>
                  {uniqueMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Поиск по заказу, модели, цвету..."
                    className="w-full pl-8 pr-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Импорт Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTableFullscreen(false)}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  title="Выйти из полноэкранного режима (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Свернуть (Esc)</span>
                </button>
              </div>
            </div>
          )}

          {/* Верхняя информационная полоса с периодом и быстрой панелью */}
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-900 shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-amber-200 text-slate-950 font-black border border-amber-400 text-xs md:text-sm">
                Период: {selectedMonth === 'all' ? 'Все месяцы' : selectedMonth}
              </span>
              <span className="text-slate-700 font-semibold hidden md:inline text-xs">
                Excel-навигация: ↑↓←→, Tab, Enter, двойной клик или ввод цифр, выделение мышкой, Ctrl+C / Ctrl+V
              </span>
            </div>

            {/* Показатели сводки + кнопка полного экрана */}
            <div className="flex items-center gap-3 font-mono text-xs md:text-sm font-bold flex-wrap">
              <span className="text-slate-800">
                Крой %: <strong className="text-sky-700">{totals.cutRatePercent}%</strong>
              </span>
              <span className="text-slate-800">
                Закрытие: <strong className="text-emerald-700">{totals.overallPercent}%</strong>
              </span>
              <span className="text-slate-800">
                Брак: <strong className="text-rose-700">{totals.defectRatePercent}%</strong>
              </span>
              <span className="text-slate-800">
                Остаток: <strong className="text-indigo-700">{totals.stockRatePercent}%</strong>
              </span>
              {!isTableFullscreen && (
                <button
                  type="button"
                  onClick={() => setIsTableFullscreen(true)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Развернуть таблицу на весь экран"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>На весь экран</span>
                </button>
              )}
            </div>
          </div>

          {/* Excel Строка адреса и формул (fx) */}
          <div className="bg-slate-50 border-b border-slate-300 px-3 py-2 flex items-center gap-2 text-sm shrink-0">
            <span className="px-2.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-slate-900 min-w-[58px] text-center text-xs md:text-sm">
              {activeCellInfo ? activeCellInfo.address : '—'}
            </span>
            <span className="font-serif italic font-bold text-slate-600 px-1 text-base">fx</span>
            <div className="flex-1 flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 py-1 min-h-[30px]">
              {activeCellInfo ? (
                <>
                  <span className="text-xs font-bold text-slate-600 shrink-0">
                    [{activeCellInfo.colDef.label}]
                  </span>
                  {activeCellInfo.colDef.type === 'computed' ? (
                    <span className="font-mono text-slate-950 font-bold text-sm">
                      {activeCellInfo.value}{' '}
                      <span className="text-slate-500 font-normal ml-2 text-xs">{activeCellInfo.colDef.formula}</span>
                    </span>
                  ) : activeCellInfo.colDef.type === 'select' ? (
                    <span className="font-bold text-slate-950 text-sm">{activeCellInfo.value}</span>
                  ) : (
                    <input
                      type="text"
                      value={String(activeCellInfo.row[activeCellInfo.colDef.key as keyof FactoryLedgerRow] ?? '')}
                      onChange={e => updateCellValue(activeCellInfo.row.id, activeCellInfo.colDef.key, e.target.value)}
                      className="w-full bg-transparent text-slate-950 font-mono text-sm font-semibold focus:outline-none"
                    />
                  )}
                </>
              ) : (
                <span className="text-slate-500 text-xs md:text-sm">
                  Кликните по любой ячейке таблицы для редактирования или выделите диапазон
                </span>
              )}
            </div>

            {normalizedSelection && (
              <button
                type="button"
                onClick={handleCopySelection}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
                title="Копировать выделенные ячейки (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Копировать</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddBlankRow}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 rounded text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Строка</span>
            </button>
          </div>

          {/* ТАБЛИЦА (увеличенные и четкие шрифты, скролл во весь экран) */}
          <div className={`overflow-auto select-none ${isTableFullscreen ? 'flex-1' : 'max-h-[75vh]'}`}>
            <table
              className={`w-full text-left border-collapse text-slate-950 font-sans ${
                isTableFullscreen ? 'text-[15px]' : 'text-[13px] md:text-[14px]'
              }`}
            >
              <thead
                className={`sticky top-0 z-20 bg-[#fef9c3] border-b-2 border-slate-500 text-slate-950 font-black tracking-tight shadow-sm ${
                  isTableFullscreen ? 'text-[14px]' : 'text-[13px]'
                }`}
              >
                {/* Строка букв Excel A, B, C... */}
                <tr className="bg-slate-200 text-slate-700 text-[11px] font-mono">
                  <th className="p-1 border border-slate-300 text-center w-10"></th>
                  {GRID_COLUMNS.map((col, cIdx) => (
                    <th key={`col-letter-${col.key}`} className="p-1 border border-slate-300 text-center font-bold">
                      {EXCEL_COL_LETTERS[cIdx]}
                    </th>
                  ))}
                  <th className="p-1 border border-slate-300 text-center w-24"></th>
                </tr>

                {/* Заголовки колонок с сортировкой */}
                <tr>
                  <th className="px-2.5 py-2.5 border border-slate-400 text-center w-10 bg-[#fef08a]">№</th>
                  {GRID_COLUMNS.map(col => {
                    const isSorted = sortConfig.key === col.key;
                    const headerBg =
                      col.key === 'qtyTotalPack'
                        ? 'bg-[#fde047]'
                        : col.key === 'cutPercent'
                        ? 'bg-sky-100'
                        : col.key === 'percent'
                        ? 'bg-[#d9f99d]'
                        : col.key === 'defectPercent'
                        ? 'bg-rose-100'
                        : col.key === 'stockPercent'
                        ? 'bg-indigo-100'
                        : '';
                    return (
                      <th
                        key={col.key}
                        style={{ minWidth: col.minWidth }}
                        onClick={() => toggleSort(col.key)}
                        className={`px-2.5 py-2.5 border border-slate-400 cursor-pointer hover:bg-amber-200/80 transition-colors whitespace-nowrap ${headerBg}`}
                        title={col.formula ? `${col.label} (${col.formula}) — нажмите для сортировки` : 'Нажмите для сортировки'}
                      >
                        <div
                          className={`flex items-center gap-1.5 ${
                            col.align === 'right'
                              ? 'justify-end'
                              : col.align === 'center'
                              ? 'justify-center'
                              : 'justify-between'
                          }`}
                        >
                          <span>{col.label}</span>
                          <span className="text-xs text-slate-700 shrink-0">
                            {isSorted ? (
                              sortConfig.dir === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-blue-700 inline" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-blue-700 inline" />
                              )
                            ) : (
                              '▾'
                            )}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-2 py-2.5 border border-slate-400 text-center w-24 bg-orange-100 whitespace-nowrap">
                    Размеры / 🗑️
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={GRID_COLUMNS.length + 2} className="p-12 text-center text-slate-700 font-bold text-base bg-slate-50">
                      <div className="space-y-3">
                        <p>
                          {derivedLedgerRows.length === 0
                            ? 'Список заказов пуст. Введите первый заказ в разделе «Размеры по заказу» или загрузите Excel.'
                            : 'По выбранным фильтрам данные не найдены'}
                        </p>
                        {derivedLedgerRows.length === 0 && (
                          <button
                            type="button"
                            onClick={handleAddBlankRow}
                            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Создать заказ в «Размеры по заказу»</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rIdx) => {
                    const m = getRowMetrics(row);
                    const isDiffNegative = row.difference < 0;
                    const isHighPerformance = m.closePct >= 97;
                    const isHighDefect = m.defectPct > 3.5;

                    return (
                      <tr key={row.id} className="hover:bg-amber-50/70 transition-colors border-b border-slate-300">
                        {/* Номер строки */}
                        <td
                          onClick={() => {
                            setActiveCell({ row: rIdx, col: 0 });
                            setSelectionRange({
                              startRow: rIdx,
                              startCol: 0,
                              endRow: rIdx,
                              endCol: GRID_COLUMNS.length - 1
                            });
                          }}
                          className={`px-2 py-2 text-center text-xs md:text-sm border border-slate-300 font-mono font-bold cursor-pointer ${
                            activeCell?.row === rIdx ? 'bg-blue-200 text-blue-950 font-black' : 'bg-slate-100 text-slate-700'
                          }`}
                          title="Кликните, чтобы выделить всю строку"
                        >
                          {rIdx + 1}
                        </td>

                        {/* Ячейки строки */}
                        {GRID_COLUMNS.map((col, cIdx) => {
                          const isActive = activeCell?.row === rIdx && activeCell?.col === cIdx;
                          const isEditing = editingCell?.row === rIdx && editingCell?.col === cIdx;
                          const isSizeDrivenCol =
                            col.key === 'qtyOrder' ||
                            col.key === 'qtyCut' ||
                            col.key === 'qtyDistribution' ||
                            col.key === 'qtySewing' ||
                            col.key === 'qtyPackaging' ||
                            col.key === 'qtyDefect';
                          const isInSelection =
                            normalizedSelection !== null &&
                            rIdx >= normalizedSelection.minR &&
                            rIdx <= normalizedSelection.maxR &&
                            cIdx >= normalizedSelection.minC &&
                            cIdx <= normalizedSelection.maxC;

                          let cellBg = '';
                          if (col.key === 'month' || col.key === 'brand' || col.key === 'orderNo' || col.key === 'model' || col.key === 'color' || col.key === 'rost') {
                            cellBg = 'bg-[#fefce8]/80';
                          } else if (col.key === 'cutPercent') {
                            cellBg = 'bg-sky-50 text-sky-900 font-black';
                          } else if (col.key === 'qtyTotalPack') {
                            cellBg = 'bg-amber-100/75 font-black text-slate-950';
                          } else if (col.key === 'difference') {
                            cellBg = isDiffNegative ? 'bg-[#fca5a5] text-[#991b1b] font-black' : 'text-slate-950 font-bold';
                          } else if (col.key === 'percent') {
                            cellBg = isHighPerformance ? 'bg-[#86efac] text-slate-950 font-black' : 'text-slate-950 font-bold';
                          } else if (col.key === 'defectPercent') {
                            cellBg = isHighDefect ? 'bg-rose-200 text-rose-950 font-black' : 'bg-rose-50/60 text-slate-900 font-bold';
                          } else if (col.key === 'stockPercent') {
                            cellBg = m.stockPct > 0 ? 'bg-indigo-50 text-indigo-950 font-bold' : 'bg-slate-50 text-slate-600';
                          } else if (col.key === 'qtyStock') {
                            cellBg = 'bg-slate-50 font-bold text-slate-950';
                          }

                          const selectionClass = isActive
                            ? 'ring-2 ring-inset ring-blue-600 z-10 relative'
                            : isInSelection
                            ? 'bg-sky-200/65 ring-1 ring-inset ring-sky-400'
                            : '';

                          const cellKey = `${rIdx}:${cIdx}`;

                          return (
                            <td
                              key={col.key}
                              ref={el => {
                                cellRefs.current[cellKey] = el;
                              }}
                              tabIndex={0}
                              title={isSizeDrivenCol ? 'Данные берутся из «Размеры по заказу» — двойной клик для редактирования' : undefined}
                              onMouseDown={e => {
                                if (isEditing) return;
                                if (e.shiftKey && activeCell) {
                                  setSelectionRange({
                                    startRow: activeCell.row,
                                    startCol: activeCell.col,
                                    endRow: rIdx,
                                    endCol: cIdx
                                  });
                                } else {
                                  setEditingCell(null);
                                  setActiveCell({ row: rIdx, col: cIdx });
                                  setSelectionRange({
                                    startRow: rIdx,
                                    startCol: cIdx,
                                    endRow: rIdx,
                                    endCol: cIdx
                                  });
                                  setIsDraggingSelection(true);
                                }
                              }}
                              onMouseEnter={() => {
                                if (isDraggingSelection && selectionRange) {
                                  setSelectionRange({
                                    ...selectionRange,
                                    endRow: rIdx,
                                    endCol: cIdx
                                  });
                                }
                              }}
                              onDoubleClick={() => {
                                if (isSizeDrivenCol) {
                                  setSelectedSizeRowId(row.id);
                                  setIsTableFullscreen(false);
                                  setActiveTabMode('size_matrix');
                                  showNotice(`Открыта матрица размеров для ${row.orderNo} (${row.color}) для редактирования`);
                                  return;
                                }
                                if (col.type !== 'computed' && col.type !== 'select') {
                                  setEditingCell({ row: rIdx, col: cIdx });
                                  setEditDraft(String(row[col.key as keyof FactoryLedgerRow] ?? ''));
                                }
                              }}
                              onKeyDown={e => handleCellKeyDown(e, rIdx, cIdx)}
                              className={`${isTableFullscreen ? 'px-3 py-2.5' : 'px-2.5 py-2'} border border-slate-300 outline-none cursor-cell ${
                                col.align === 'right'
                                  ? 'text-right font-mono tabular-nums'
                                  : col.align === 'center'
                                  ? 'text-center font-mono tabular-nums'
                                  : 'text-left'
                              } ${cellBg} ${selectionClass}`}
                            >
                              {isEditing ? (
                                <input
                                  ref={activeInputRef}
                                  type="text"
                                  value={editDraft}
                                  onChange={e => {
                                    const val =
                                      col.type === 'number'
                                        ? e.target.value.replace(/[^\d]/g, '')
                                        : e.target.value;
                                    setEditDraft(val);
                                    updateCellValue(row.id, col.key, val);
                                  }}
                                  onBlur={commitEdit}
                                  onKeyDown={e => handleInputKeyDown(e, rIdx, cIdx)}
                                  className={`w-full px-1.5 py-0.5 bg-white text-slate-950 font-bold outline-none border-2 border-blue-500 rounded-xs ${
                                    isTableFullscreen ? 'text-[15px]' : 'text-[14px]'
                                  } ${col.align === 'right' ? 'text-right font-mono' : 'text-left'}`}
                                />
                              ) : col.key === 'month' ? (
                                <select
                                  value={row.month || DEFAULT_MONTHS[0]}
                                  onChange={e => updateCellValue(row.id, 'month', e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  className="w-full bg-transparent font-bold text-cyan-950 focus:outline-none cursor-pointer"
                                >
                                  {uniqueMonths.map(mName => (
                                    <option key={mName} value={mName}>
                                      {mName}
                                    </option>
                                  ))}
                                </select>
                              ) : col.key === 'cutPercent' ? (
                                <span>{m.cutPct.toFixed(1)}%</span>
                              ) : col.key === 'defectPercent' ? (
                                <span>{m.defectPct.toFixed(1)}%</span>
                              ) : col.key === 'stockPercent' ? (
                                <span>{m.stockPct.toFixed(1)}%</span>
                              ) : col.key === 'percent' ? (
                                <span>{m.closePct.toFixed(1)}%</span>
                              ) : col.key === 'qtyTotalPack' ? (
                                <span>{row.qtyTotalPack.toLocaleString()}</span>
                              ) : col.key === 'difference' ? (
                                <span>{row.difference}</span>
                              ) : col.key === 'qtyStock' ? (
                                <span>{row.qtyStock.toLocaleString()}</span>
                              ) : col.type === 'number' ? (
                                <span
                                  className={
                                    col.key === 'qtyDefect' && row.qtyDefect > 0
                                      ? 'font-bold text-rose-700'
                                      : col.key === 'qtyShipped' && row.qtyShipped > 0
                                      ? 'font-bold text-emerald-800'
                                      : col.key === 'qtyPackaging'
                                      ? 'font-black text-slate-950'
                                      : 'font-bold text-slate-900'
                                  }
                                >
                                  {Number(row[col.key as keyof FactoryLedgerRow]) > 0
                                    ? Number(row[col.key as keyof FactoryLedgerRow]).toLocaleString()
                                    : col.key === 'qtyDefect' || col.key === 'qtyShipped'
                                    ? ''
                                    : '0'}
                                </span>
                              ) : (
                                <span
                                  className={`block truncate max-w-[230px] ${
                                    col.key === 'orderNo'
                                      ? 'font-black text-slate-950'
                                      : col.key === 'model'
                                      ? 'font-bold text-slate-900'
                                      : col.key === 'notes'
                                      ? 'text-slate-800 italic'
                                      : 'font-semibold text-slate-900'
                                  }`}
                                  title={String(row[col.key as keyof FactoryLedgerRow] || '')}
                                >
                                  {String(row[col.key as keyof FactoryLedgerRow] || '') || (
                                    col.key === 'notes' ? <span className="text-slate-400 not-italic text-xs">+ примечание</span> : ''
                                  )}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Кнопки: Открыть размеры по заказу + Удалить (пароль 1111) */}
                        <td className="px-1.5 py-1.5 border border-slate-300 text-center bg-slate-50">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSizeRowId(row.id);
                                setIsTableFullscreen(false);
                                setActiveTabMode('size_matrix');
                              }}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-300 text-amber-950 border border-amber-400 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors max-w-[125px] truncate"
                              title={(() => {
                                const eff = getEffectiveDisplaySizes(sizeMatrices[row.id]);
                                return eff.length > 0 ? `Размеры (${eff.length}): ${eff.join(', ')}` : 'Открыть размерную сетку заказа';
                              })()}
                            >
                              <Ruler className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {(() => {
                                  const mat = sizeMatrices[row.id];
                                  const eff = getEffectiveDisplaySizes(mat);
                                  if (eff.length > 0 && eff.length <= 3) return eff.join(',');
                                  if (eff.length > 3) return `${eff[0]}..${eff[eff.length - 1]} (${eff.length})`;
                                  const norm = mat ? normalizePresetId(mat.presetId) : detectSizePresetForRow(row);
                                  const safePreset = norm === 'custom' ? detectSizePresetForRow(row) : norm;
                                  return SIZE_PRESETS[safePreset].shortLabel;
                                })()}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsClearAllConfirmOpen(false);
                                setRowToDelete(row);
                                setDeletePassword('');
                                setDeletePasswordError('');
                              }}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Удалить заказ (требуется пароль 1111)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Строка быстрого добавления */}
                <tr
                  onClick={handleAddBlankRow}
                  className="bg-slate-50 hover:bg-amber-100/70 border-t-2 border-dashed border-slate-300 transition-colors cursor-pointer text-slate-700 group"
                >
                  <td className="p-2.5 text-center text-amber-700 font-mono text-sm border border-slate-300 font-bold">+</td>
                  <td colSpan={GRID_COLUMNS.length + 1} className="p-2.5 text-sm font-bold text-slate-800 group-hover:text-amber-950 border border-slate-300">
                    <span className="inline-flex items-center gap-2">
                      <Plus className="w-4 h-4 text-amber-600" />
                      <span>Нажмите сюда, чтобы добавить новый заказ в «Размеры по заказу»...</span>
                    </span>
                  </td>
                </tr>
              </tbody>

              {/* ИТОГО */}
              <tfoot className={`bg-[#fef08a] border-t-2 border-slate-600 font-black text-slate-950 ${isTableFullscreen ? 'text-[15px]' : 'text-[13px] md:text-[14px]'}`}>
                <tr>
                  <td colSpan={7} className="px-3 py-2.5 text-right border border-slate-400 font-black">
                    ИТОГО:
                  </td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums">{totals.orderQty.toLocaleString()}</td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums">{totals.cutQty.toLocaleString()}</td>
                  <td className="px-2.5 py-2.5 text-center border border-slate-400 font-mono tabular-nums bg-sky-200 text-sky-950">
                    {totals.cutRatePercent}%
                  </td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums">{totals.distQty.toLocaleString()}</td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums">{totals.sewQty.toLocaleString()}</td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums">{totals.packQty.toLocaleString()}</td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums text-rose-800">{totals.defectQty.toLocaleString()}</td>
                  <td className="px-2.5 py-2.5 text-center border border-slate-400 font-mono tabular-nums bg-rose-200 text-rose-950">
                    {totals.defectRatePercent}%
                  </td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums bg-[#fde047]">{totals.totalPackQty.toLocaleString()}</td>
                  <td className={`px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums ${totals.diffQty < 0 ? 'bg-[#fca5a5] text-[#991b1b]' : ''}`}>
                    {totals.diffQty.toLocaleString()}
                  </td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums text-emerald-950">{totals.shipQty.toLocaleString()}</td>
                  <td className="px-2.5 py-2.5 text-right border border-slate-400 font-mono tabular-nums">{totals.stockQty.toLocaleString()}</td>
                  <td className="px-2.5 py-2.5 text-center border border-slate-400 font-mono tabular-nums bg-indigo-200 text-indigo-950">
                    {totals.stockRatePercent}%
                  </td>
                  <td className="px-2.5 py-2.5 text-center border border-slate-400 font-mono tabular-nums bg-[#86efac]">
                    {totals.overallPercent}%
                  </td>
                  <td colSpan={2} className="border border-slate-400"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Нижняя строка статуса Excel (сумма / среднее / кол-во выделенных ячеек) */}
          <div className="bg-slate-100 border-t border-slate-300 p-2.5 px-4 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-slate-800 font-semibold shrink-0">
            <span>
              Всего строк: <strong className="text-slate-950">{filteredRows.length}</strong>
            </span>
            {selectionStats && selectionStats.count > 0 ? (
              <div className="flex flex-wrap items-center gap-4 font-mono text-xs md:text-sm bg-white px-3 py-1 rounded-lg border border-slate-300">
                <span>
                  Выбрано: <strong className="text-blue-700">{selectionStats.count}</strong>
                </span>
                {selectionStats.numericCount > 0 && (
                  <>
                    <span>
                      Сумма: <strong className="text-emerald-700">{selectionStats.sum.toLocaleString()}</strong>
                    </span>
                    <span>
                      Среднее: <strong className="text-slate-950">{Math.round(selectionStats.avg).toLocaleString()}</strong>
                    </span>
                    <span>
                      Мин/Макс: <strong className="text-slate-950">{selectionStats.min.toLocaleString()} / {selectionStats.max.toLocaleString()}</strong>
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-slate-600">Выберите ячейки мышкой для подсчета суммы</span>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: РАЗНИЦА РАЗДАЧА − УПАКОВКА (В ШТУКАХ И В ПРОЦЕНТАХ)
         ========================================================================= */}
      {activeTabMode === 'diff_razd_upak' && (
        <RazdachaUpakovkaDiffTab
          rows={filteredRows}
          sizeMatrices={sizeMatrices}
          selectedMonth={selectedMonth}
          registerCyrillicFonts={registerCyrillicFonts}
          onNotice={showNotice}
          onOpenInSizeMatrix={(rowId) => {
            setSelectedSizeRowId(rowId);
            setActiveTabMode('size_matrix');
          }}
        />
      )}

      {/* =========================================================================
          TAB 1.5: РАЗМЕРНАЯ МАТРИЦА ПО ЗАКАЗУ (ЕДИНЫЙ ЦЕНТР ВВОДА ДАННЫХ)
         ========================================================================= */}
      {activeTabMode === 'size_matrix' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Панель выбора заказа, создания нового заказа и адаптивной размерной сетки */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddBlankRow}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Новый заказ</span>
                </button>

                {filteredRows.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeSizeRow || filteredRows.length === 0) return;
                        const idx = filteredRows.findIndex(r => r.id === activeSizeRow.id);
                        const prevIdx = idx > 0 ? idx - 1 : filteredRows.length - 1;
                        setSelectedSizeRowId(filteredRows[prevIdx].id);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 cursor-pointer"
                      title="Предыдущий заказ"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <select
                      value={activeSizeRow?.id || ''}
                      onChange={e => setSelectedSizeRowId(e.target.value)}
                      className="bg-slate-950 border border-amber-400/50 text-white font-bold text-xs md:text-sm rounded-xl px-3 py-2 focus:outline-none cursor-pointer max-w-lg"
                    >
                      {filteredRows.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.brand ? `[${r.brand}] ` : ''}{r.orderNo} — {r.model} — {r.color}{r.rost ? ` (${r.rost})` : ''} ({r.month})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        if (!activeSizeRow || filteredRows.length === 0) return;
                        const idx = filteredRows.findIndex(r => r.id === activeSizeRow.id);
                        const nextIdx = idx < filteredRows.length - 1 ? idx + 1 : 0;
                        setSelectedSizeRowId(filteredRows[nextIdx].id);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 cursor-pointer"
                      title="Следующий заказ"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Быстрые действия по матрице размеров */}
              {activeSizeRow && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Автосинхронизация с Таблицей и Дашбордом</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleExportSizeMatrixExcel}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSizeMatrixPdf}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsClearAllConfirmOpen(false);
                      setRowToDelete(activeSizeRow);
                      setDeletePassword('');
                      setDeletePasswordError('');
                    }}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Удалить текущий заказ (пароль 1111)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                </div>
              )}
            </div>

            {/* Переключатель цветов и ростовок внутри текущего Заказа № + кнопка "+ Добавить цвет / рост" */}
            {activeSizeRow && (
              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-bold mr-1">
                      Цвета и ростовки заказа <strong className="text-cyan-300 font-mono">{activeSizeRow.orderNo}</strong> ({activeOrderVariants.length}):
                    </span>
                    {activeOrderVariants.map(v => {
                      const isCur = v.id === activeSizeRow.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedSizeRowId(v.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isCur
                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                              : 'bg-slate-950 text-slate-200 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          <span>{v.color}</span>
                          {v.colorCode && <span className={`font-mono text-[10px] ${isCur ? 'text-slate-800' : 'text-slate-400'}`}>{v.colorCode}</span>}
                          {v.rost && (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isCur ? 'bg-slate-900 text-amber-300' : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'}`}>
                              {v.rost}
                            </span>
                          )}
                          <span className={`font-mono text-[10px] ${isCur ? 'text-slate-900 font-black' : 'text-emerald-400'}`}>
                            ({v.qtyOrder})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setVariantForm({
                        color: activeSizeRow.color || '',
                        colorCode: activeSizeRow.colorCode || '',
                        rost: ROST_OPTIONS.find(ro => !activeOrderVariants.some(v => v.rost === ro)) || '170-176',
                        createAll4Rosts: false
                      });
                      setIsAddVariantOpen(v => !v);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Добавить цвет / рост</span>
                  </button>
                </div>

                {isAddVariantOpen && (
                  <div className="p-3 bg-slate-950 border border-indigo-500/40 rounded-xl flex flex-wrap items-end gap-2.5 animate-fadeIn">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Цвет</label>
                      <input
                        type="text"
                        list="common-colors-list"
                        value={variantForm.color}
                        onChange={e => setVariantForm(p => ({ ...p, color: e.target.value }))}
                        placeholder="Бирюзовый, Серый..."
                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold w-40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Код цвета</label>
                      <input
                        type="text"
                        value={variantForm.colorCode}
                        onChange={e => setVariantForm(p => ({ ...p, colorCode: e.target.value }))}
                        placeholder="TQ-C00218.9"
                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono w-32"
                      />
                    </div>
                    {!variantForm.createAll4Rosts && (
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Рост</label>
                        <select
                          value={variantForm.rost}
                          onChange={e => setVariantForm(p => ({ ...p, rost: e.target.value }))}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono font-bold"
                        >
                          <option value="">Без роста</option>
                          {ROST_OPTIONS.map(ro => (
                            <option key={ro} value={ro}>{ro}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer text-cyan-200 font-bold">
                      <input
                        type="checkbox"
                        checked={variantForm.createAll4Rosts}
                        onChange={e => setVariantForm(p => ({ ...p, createAll4Rosts: e.target.checked }))}
                      />
                      <span>Все 4 роста (158–200)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddVariantToActiveOrder}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg cursor-pointer"
                    >
                      Добавить
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddVariantOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <datalist id="common-colors-list">
              {COMMON_COLORS.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {/* Форма создания нового заказа (Бренд, Цвет, Код цвета, Рост, Выбор размеров) */}
            {isNewOrderModalOpen && (
              <div className="p-4 bg-slate-950 border border-amber-400/50 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-amber-300 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Создать новый заказ для ввода по размерам</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Месяц</label>
                    <select
                      value={newOrderForm.month}
                      onChange={e => setNewOrderForm(p => ({ ...p, month: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                    >
                      {uniqueMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-indigo-300 font-bold mb-1">Бренд *</label>
                    <select
                      value={newOrderForm.brand}
                      onChange={e => setNewOrderForm(p => ({ ...p, brand: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-indigo-500/40 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                    >
                      {uniqueBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="__custom__">+ Свой бренд...</option>
                    </select>
                    {newOrderForm.brand === '__custom__' && (
                      <input
                        type="text"
                        value={newOrderForm.customBrandInput}
                        onChange={e => setNewOrderForm(p => ({ ...p, customBrandInput: e.target.value }))}
                        placeholder="Введите название бренда..."
                        className="mt-1.5 w-full px-2.5 py-1.5 bg-slate-900 border border-indigo-400 rounded-lg text-white font-bold"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Заказ № *</label>
                    <input
                      type="text"
                      value={newOrderForm.orderNo}
                      onChange={e => setNewOrderForm(p => ({ ...p, orderNo: e.target.value }))}
                      placeholder="Напр.: MOS-454.6 / ZLL-363-714"
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Модель *</label>
                    <input
                      type="text"
                      value={newOrderForm.model}
                      onChange={e => setNewOrderForm(p => ({ ...p, model: e.target.value }))}
                      placeholder="Напр.: SM-OW-1311/145-SC"
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Цвет</label>
                    <input
                      type="text"
                      list="common-colors-list"
                      value={newOrderForm.color}
                      onChange={e => setNewOrderForm(p => ({ ...p, color: e.target.value }))}
                      placeholder="Бирюзовый, Серый, Белый..."
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Код цвета (необяз.)</label>
                    <input
                      type="text"
                      value={newOrderForm.colorCode}
                      onChange={e => setNewOrderForm(p => ({ ...p, colorCode: e.target.value }))}
                      placeholder="Напр.: TQ-C00218.9"
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Рост (Ростовка)</label>
                    <select
                      value={newOrderForm.rost}
                      disabled={newOrderForm.createAll4Rosts}
                      onChange={e => setNewOrderForm(p => ({ ...p, rost: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">— Без роста —</option>
                      {ROST_OPTIONS.map(ro => (
                        <option key={ro} value={ro}>{ro}</option>
                      ))}
                    </select>
                    <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-cyan-300 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newOrderForm.createAll4Rosts}
                        onChange={e => setNewOrderForm(p => ({ ...p, createAll4Rosts: e.target.checked }))}
                      />
                      <span>Создать все 4 роста (158–200)</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Размерная сетка</label>
                    <select
                      value={newOrderForm.presetId}
                      onChange={e => {
                        const nextPreset = e.target.value as SizePresetId;
                        setNewOrderForm(p => ({
                          ...p,
                          presetId: nextPreset,
                          selectedSizes: nextPreset === 'custom' ? p.selectedSizes : [...SIZE_PRESETS[nextPreset].sizes]
                        }));
                      }}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                    >
                      {(Object.keys(SIZE_PRESETS) as Exclude<SizePresetId, 'custom'>[]).map(k => (
                        <option key={k} value={k}>{SIZE_PRESETS[k].label}</option>
                      ))}
                      <option value="custom">Свои размеры (указать вручную)</option>
                    </select>
                  </div>
                </div>

                {newOrderForm.presetId === 'custom' ? (
                  <div className="text-xs">
                    <label className="block text-cyan-300 font-bold mb-1">Укажите размеры через запятую:</label>
                    <input
                      type="text"
                      value={newOrderForm.customSizesText}
                      onChange={e => setNewOrderForm(p => ({ ...p, customSizesText: e.target.value }))}
                      placeholder="Напр.: 80, 84, 88, 92, 96, 100"
                      className="w-full px-3 py-2 bg-slate-900 border border-cyan-500/40 rounded-xl text-white font-mono"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-slate-300 font-bold">
                        Выберите нужные размеры для заказа ({newOrderForm.selectedSizes.length} выбрано):
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setNewOrderForm(p => ({
                              ...p,
                              selectedSizes: [...SIZE_PRESETS[p.presetId as Exclude<SizePresetId, 'custom'>].sizes]
                            }))
                          }
                          className="text-[11px] text-cyan-300 hover:underline cursor-pointer font-bold"
                        >
                          Выбрать все
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewOrderForm(p => ({ ...p, selectedSizes: [] }))}
                          className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                        >
                          Очистить
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SIZE_PRESETS[newOrderForm.presetId].sizes.map(sz => {
                        const checked = newOrderForm.selectedSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              setNewOrderForm(p => {
                                const exists = p.selectedSizes.includes(sz);
                                const allPresetSizes = SIZE_PRESETS[p.presetId as Exclude<SizePresetId, 'custom'>].sizes;
                                const nextSet = exists
                                  ? p.selectedSizes.filter(s => s !== sz)
                                  : allPresetSizes.filter(s => s === sz || p.selectedSizes.includes(s));
                                return { ...p, selectedSizes: nextSet };
                              });
                            }}
                            className={`px-2 py-1 rounded-lg font-mono font-bold text-[11px] border cursor-pointer transition-all ${
                              checked
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <input
                    type="text"
                    value={newOrderForm.notes}
                    onChange={e => setNewOrderForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Примечание к заказу (необязательно)..."
                    className="flex-1 min-w-[220px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewOrderModalOpen(false)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateOrderInSizeMatrix}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Check className="w-4 h-4" />
                      <span>Создать и ввести размеры</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Редактируемые параметры активного заказа (Месяц, Бренд, Заказ №, Модель, Цвет, Код цвета, Рост, Отгрузка, Примечание) */}
            {activeSizeRow && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Месяц</label>
                  <select
                    value={activeSizeRow.month || DEFAULT_MONTHS[0]}
                    onChange={e => updateActiveRowMeta('month', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-bold focus:outline-none cursor-pointer"
                  >
                    {uniqueMonths.map(mName => (
                      <option key={mName} value={mName}>{mName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-indigo-300 uppercase block mb-0.5">Бренд</label>
                  <select
                    value={activeSizeRow.brand || ''}
                    onChange={e => {
                      if (e.target.value === '__add_new__') {
                        setIsAddBrandOpen(true);
                        return;
                      }
                      updateActiveRowMeta('brand', e.target.value);
                    }}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-indigo-500/40 rounded-lg text-indigo-200 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">— Бренд —</option>
                    {uniqueBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="__add_new__">+ Добавить бренд...</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Заказ №</label>
                  <input
                    type="text"
                    value={activeSizeRow.orderNo}
                    onChange={e => updateActiveRowMeta('orderNo', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Модель</label>
                  <input
                    type="text"
                    value={activeSizeRow.model}
                    onChange={e => updateActiveRowMeta('model', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Цвет</label>
                  <input
                    type="text"
                    list="common-colors-list"
                    value={activeSizeRow.color}
                    onChange={e => updateActiveRowMeta('color', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Код цвета</label>
                  <input
                    type="text"
                    value={activeSizeRow.colorCode || ''}
                    onChange={e => updateActiveRowMeta('colorCode', e.target.value)}
                    placeholder="TQ-..."
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-300 uppercase block mb-0.5">Рост</label>
                  <select
                    value={activeSizeRow.rost || ''}
                    onChange={e => updateActiveRowMeta('rost', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-mono font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">— Без роста —</option>
                    {ROST_OPTIONS.map(ro => (
                      <option key={ro} value={ro}>{ro}</option>
                    ))}
                    {activeSizeRow.rost && !ROST_OPTIONS.includes(activeSizeRow.rost) && (
                      <option value={activeSizeRow.rost}>{activeSizeRow.rost}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-0.5">Отгрузка (шт)</label>
                  <input
                    type="text"
                    value={activeSizeRow.qtyShipped > 0 ? String(activeSizeRow.qtyShipped) : ''}
                    onChange={e => updateActiveRowMeta('qtyShipped', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 bg-slate-950 border border-emerald-500/40 rounded-lg text-emerald-300 font-mono font-black focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Примечание</label>
                  <input
                    type="text"
                    value={activeSizeRow.notes || ''}
                    onChange={e => updateActiveRowMeta('notes', e.target.value)}
                    placeholder="Комментарий..."
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Переключатель размерных линеек + фильтр заполненных размеров */}
            {activeSizeRow && activeSizeMatrix && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5 mr-1">
                    <Ruler className="w-3.5 h-3.5 text-amber-400" />
                    <span>Линейка:</span>
                  </span>
                  {(Object.keys(SIZE_PRESETS) as Exclude<SizePresetId, 'custom'>[]).map(pKey => {
                    const isActivePreset = activeSizeMatrix.presetId === pKey;
                    return (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => changeSizePresetForRow(pKey)}
                        className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                          isActivePreset
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                            : 'bg-slate-950 text-slate-200 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {SIZE_PRESETS[pKey].shortLabel}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setBulkSizeInput(activeSizeMatrix.sizes.join(', '));
                      setShowCustomSizeEditor(v => !v);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer border ${
                      showCustomSizeEditor || activeSizeMatrix.presetId === 'custom'
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-950 text-cyan-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    + Редактор размеров
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHideEmptyMatrixSizes(v => !v)}
                    className={`px-2.5 py-1 rounded-lg font-bold border cursor-pointer transition-all ${
                      hideEmptyMatrixSizes
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                    title="Скрывать размеры с 0, показывать только заполненные"
                  >
                    {hideEmptyMatrixSizes ? 'Показаны только заполненные (>0)' : 'Только заполненные (>0)'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTrimEmptySizeColumns}
                    className="px-2.5 py-1 rounded-lg font-bold border bg-slate-950 hover:bg-rose-950 text-amber-300 hover:text-rose-200 border-slate-700 hover:border-rose-500/40 cursor-pointer transition-all"
                    title="Навсегда удалить пустые столбцы (0) из этой матрицы, оставив только введенные размеры"
                  >
                    Убрать пустые размеры
                  </button>
                </div>
              </div>
            )}

            {/* Редактор своих размеров */}
            {showCustomSizeEditor && activeSizeMatrix && (
              <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-xl flex flex-wrap items-center gap-2.5 text-xs animate-fadeIn">
                <span className="text-cyan-300 font-bold">Укажите размеры через запятую:</span>
                <input
                  type="text"
                  value={bulkSizeInput}
                  onChange={e => setBulkSizeInput(e.target.value)}
                  placeholder="Например: 80, 84, 88, 92, 96, 100, 104"
                  className="flex-1 min-w-[240px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleApplyBulkSizes();
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyBulkSizes}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Применить сетку
                </button>
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                  <input
                    type="text"
                    value={newCustomSizeInput}
                    onChange={e => setNewCustomSizeInput(e.target.value)}
                    placeholder="+ Размер (напр. 4XL)"
                    className="w-36 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCustomSizeColumn();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSizeColumn}
                    className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeSizeRow && activeSizeMatrix ? (
            <div className="bg-white border-2 border-slate-700 rounded-xl p-4 shadow-2xl text-slate-950 space-y-5">
              {/* Подсказка по Excel-навигации */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-semibold">
                <span>
                  Excel-ввод: клавиши <strong>← → ↑ ↓</strong>, <strong>Tab</strong>, <strong>Enter</strong>, <strong>F2</strong> (редактировать), <strong>Ctrl+V</strong> (вставка из Excel). Кликните <strong>✎</strong> в шапке, чтобы изменить название размера.
                </span>
                <span className="font-mono text-slate-700">
                  Показано размеров: <strong>{visibleMatrixSizes.length}</strong> из {activeSizeMatrix.sizes.length}
                </span>
              </div>

              {/* 1. ВЕРХНЯЯ МАТРИЦА ПО РАЗМЕРАМ */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center text-sm md:text-[15px] font-sans">
                  <thead>
                    <tr className="bg-[#f8cbad] text-slate-950 font-black">
                      <th className="px-3 py-2.5 border border-slate-700 min-w-[130px]">Заказ</th>
                      <th className="px-3 py-2.5 border border-slate-700 min-w-[155px]">Модель</th>
                      <th className="px-3 py-2.5 border border-slate-700 min-w-[140px]">Цвет / Рост</th>
                      <th className="px-3 py-2.5 border border-slate-700 min-w-[115px] bg-[#fbe5d6]">Этап</th>
                      {visibleMatrixSizes.map(sz => (
                        <th key={sz} className="px-2 py-2 border border-slate-700 min-w-[76px] font-black group relative">
                          {editingSizeCol === sz ? (
                            <input
                              type="text"
                              value={editingSizeColDraft}
                              onChange={e => setEditingSizeColDraft(e.target.value)}
                              onBlur={() => handleCommitRenameSize(sz)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleCommitRenameSize(sz);
                                if (e.key === 'Escape') setEditingSizeCol(null);
                              }}
                              autoFocus
                              className="w-16 px-1 py-0.5 text-center bg-white border-2 border-blue-600 rounded text-xs font-mono font-black text-slate-950 focus:outline-none"
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <span>{sz}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSizeCol(sz);
                                  setEditingSizeColDraft(sz);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-blue-700 cursor-pointer p-0.5"
                                title={`Переименовать размер ${sz}`}
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {activeSizeMatrix.sizes.length > 1 && editingSizeCol !== sz && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSizeColumn(sz)}
                              className="opacity-0 group-hover:opacity-100 absolute top-0.5 right-0.5 text-[11px] text-rose-700 hover:text-rose-950 font-black px-1 cursor-pointer"
                              title={`Удалить размер ${sz}`}
                            >
                              ×
                            </button>
                          )}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 border border-slate-700 min-w-[95px] font-black">ВСЕГО</th>
                    </tr>
                  </thead>

                  <tbody className="font-semibold">
                    {/* Строка 1: Заказ */}
                    <tr>
                      <td rowSpan={8} className="px-3 py-3 border border-slate-700 font-black text-base md:text-lg align-middle bg-white">
                        {activeSizeRow.brand && (
                          <div className="text-[11px] font-black uppercase text-indigo-700 mb-0.5">{activeSizeRow.brand}</div>
                        )}
                        <div>{activeSizeRow.orderNo}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">{activeSizeRow.month}</div>
                      </td>
                      <td rowSpan={8} className="px-3 py-3 border border-slate-700 font-black text-sm md:text-base align-middle bg-white">
                        {activeSizeRow.model}
                      </td>
                      <td rowSpan={8} className="px-3 py-3 border border-slate-700 font-black text-sm md:text-base align-middle bg-white">
                        <div>{activeSizeRow.color}</div>
                        {activeSizeRow.colorCode && (
                          <div className="text-xs font-mono text-slate-500 mt-0.5">{activeSizeRow.colorCode}</div>
                        )}
                        {activeSizeRow.rost && (
                          <div className="mt-1 inline-block px-2 py-0.5 rounded bg-amber-100 border border-amber-400 text-xs font-mono text-amber-950">
                            Рост: {activeSizeRow.rost}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 border border-slate-700 font-bold text-slate-900 bg-white">Заказ</td>
                      {visibleMatrixSizes.map((sz, cIdx) => {
                        const val = activeSizeMatrix.values[sz]?.order ?? 0;
                        const isCellActive = sizeMatrixActiveCell?.row === 0 && sizeMatrixActiveCell?.col === cIdx;
                        return (
                          <td key={`order-${sz}`} className={`p-0 border border-slate-700 ${isCellActive ? 'ring-2 ring-inset ring-blue-600' : ''}`}>
                            <input
                              type="text"
                              data-sz-r={0}
                              data-sz-c={cIdx}
                              value={val > 0 ? String(val) : ''}
                              onFocus={e => {
                                setSizeMatrixActiveCell({ row: 0, col: cIdx });
                                e.currentTarget.select();
                              }}
                              onDoubleClick={() => {
                                sizeMatrixManualCaretRef.current = true;
                              }}
                              onPaste={e => handleSizeMatrixPaste(e, 0, cIdx)}
                              onChange={e => updateSizeCellValue(sz, 'order', e.target.value)}
                              onKeyDown={e => handleSizeMatrixKeyDown(e, 0, cIdx)}
                              placeholder="0"
                              className="w-full px-2 py-2 text-center font-mono tabular-nums font-semibold text-slate-950 placeholder:text-slate-300 focus:bg-sky-50 focus:outline-none"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-slate-700 font-mono tabular-nums font-black">
                        {activeSizeTotals.order}
                      </td>
                    </tr>

                    {/* Строка 2: Крой */}
                    <tr>
                      <td className="px-3 py-2 border border-slate-700 font-bold text-slate-900 bg-white">Крой</td>
                      {visibleMatrixSizes.map((sz, cIdx) => {
                        const val = activeSizeMatrix.values[sz]?.cut ?? 0;
                        const isCellActive = sizeMatrixActiveCell?.row === 1 && sizeMatrixActiveCell?.col === cIdx;
                        return (
                          <td key={`cut-${sz}`} className={`p-0 border border-slate-700 ${isCellActive ? 'ring-2 ring-inset ring-blue-600' : ''}`}>
                            <input
                              type="text"
                              data-sz-r={1}
                              data-sz-c={cIdx}
                              value={val > 0 ? String(val) : ''}
                              onFocus={e => {
                                setSizeMatrixActiveCell({ row: 1, col: cIdx });
                                e.currentTarget.select();
                              }}
                              onDoubleClick={() => {
                                sizeMatrixManualCaretRef.current = true;
                              }}
                              onPaste={e => handleSizeMatrixPaste(e, 1, cIdx)}
                              onChange={e => updateSizeCellValue(sz, 'cut', e.target.value)}
                              onKeyDown={e => handleSizeMatrixKeyDown(e, 1, cIdx)}
                              placeholder="0"
                              className="w-full px-2 py-2 text-center font-mono tabular-nums font-semibold text-slate-950 placeholder:text-slate-300 focus:bg-sky-50 focus:outline-none"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-slate-700 font-mono tabular-nums font-black">
                        {activeSizeTotals.cut}
                      </td>
                    </tr>

                    {/* Строка 2.5: Крой % (к Заказу) */}
                    <tr className="bg-sky-50/90">
                      <td className="px-3 py-1.5 border border-slate-700 font-black text-sky-900 text-xs md:text-sm">Крой %</td>
                      {visibleMatrixSizes.map(sz => {
                        const cell = activeSizeMatrix.values[sz];
                        const hasOrder = cell && cell.order > 0;
                        const cutPctVal = hasOrder ? (cell.cut / cell.order) * 100 : 0;
                        return (
                          <td
                            key={`cutpct-${sz}`}
                            className={`px-2 py-1.5 border border-slate-700 font-mono tabular-nums font-bold text-xs md:text-sm ${
                              hasOrder
                                ? cutPctVal >= 100
                                  ? 'bg-sky-100 text-sky-900'
                                  : 'bg-amber-50 text-amber-900'
                                : 'bg-white'
                            }`}
                          >
                            {hasOrder ? `${cutPctVal.toFixed(1).replace('.', ',')}%` : ''}
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5 border border-slate-700 font-mono tabular-nums font-black bg-sky-200 text-sky-950">
                        {activeSizeTotals.cutPct.toFixed(1).replace('.', ',')}%
                      </td>
                    </tr>

                    {/* Строка 3: Раздача */}
                    <tr>
                      <td className="px-3 py-2 border border-slate-700 font-bold text-slate-900 bg-white">Раздача</td>
                      {visibleMatrixSizes.map((sz, cIdx) => {
                        const val = activeSizeMatrix.values[sz]?.dist ?? 0;
                        const isCellActive = sizeMatrixActiveCell?.row === 2 && sizeMatrixActiveCell?.col === cIdx;
                        return (
                          <td key={`dist-${sz}`} className={`p-0 border border-slate-700 ${isCellActive ? 'ring-2 ring-inset ring-blue-600' : ''}`}>
                            <input
                              type="text"
                              data-sz-r={2}
                              data-sz-c={cIdx}
                              value={val > 0 ? String(val) : ''}
                              onFocus={e => {
                                setSizeMatrixActiveCell({ row: 2, col: cIdx });
                                e.currentTarget.select();
                              }}
                              onDoubleClick={() => {
                                sizeMatrixManualCaretRef.current = true;
                              }}
                              onPaste={e => handleSizeMatrixPaste(e, 2, cIdx)}
                              onChange={e => updateSizeCellValue(sz, 'dist', e.target.value)}
                              onKeyDown={e => handleSizeMatrixKeyDown(e, 2, cIdx)}
                              placeholder="0"
                              className="w-full px-2 py-2 text-center font-mono tabular-nums font-semibold text-slate-950 placeholder:text-slate-300 focus:bg-sky-50 focus:outline-none"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-slate-700 font-mono tabular-nums font-black">
                        {activeSizeTotals.dist}
                      </td>
                    </tr>

                    {/* Строка 4: Пошив */}
                    <tr>
                      <td className="px-3 py-2 border border-slate-700 font-bold text-slate-900 bg-white">Пошив</td>
                      {visibleMatrixSizes.map((sz, cIdx) => {
                        const val = activeSizeMatrix.values[sz]?.sew ?? 0;
                        const isCellActive = sizeMatrixActiveCell?.row === 3 && sizeMatrixActiveCell?.col === cIdx;
                        return (
                          <td key={`sew-${sz}`} className={`p-0 border border-slate-700 ${isCellActive ? 'ring-2 ring-inset ring-blue-600' : ''}`}>
                            <input
                              type="text"
                              data-sz-r={3}
                              data-sz-c={cIdx}
                              value={val > 0 ? String(val) : ''}
                              onFocus={e => {
                                setSizeMatrixActiveCell({ row: 3, col: cIdx });
                                e.currentTarget.select();
                              }}
                              onDoubleClick={() => {
                                sizeMatrixManualCaretRef.current = true;
                              }}
                              onPaste={e => handleSizeMatrixPaste(e, 3, cIdx)}
                              onChange={e => updateSizeCellValue(sz, 'sew', e.target.value)}
                              onKeyDown={e => handleSizeMatrixKeyDown(e, 3, cIdx)}
                              placeholder="0"
                              className="w-full px-2 py-2 text-center font-mono tabular-nums font-semibold text-slate-950 placeholder:text-slate-300 focus:bg-sky-50 focus:outline-none"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-slate-700 font-mono tabular-nums font-black">
                        {activeSizeTotals.sew}
                      </td>
                    </tr>

                    {/* Строка 5: Упаковка */}
                    <tr className="bg-[#ffff00] font-black">
                      <td className="px-3 py-2 border border-slate-700 font-black text-slate-950">Упаковка</td>
                      {visibleMatrixSizes.map((sz, cIdx) => {
                        const val = activeSizeMatrix.values[sz]?.pack ?? 0;
                        const isCellActive = sizeMatrixActiveCell?.row === 4 && sizeMatrixActiveCell?.col === cIdx;
                        return (
                          <td key={`pack-${sz}`} className={`p-0 border border-slate-700 bg-[#ffff00] ${isCellActive ? 'ring-2 ring-inset ring-blue-700' : ''}`}>
                            <input
                              type="text"
                              data-sz-r={4}
                              data-sz-c={cIdx}
                              value={val > 0 ? String(val) : ''}
                              onFocus={e => {
                                setSizeMatrixActiveCell({ row: 4, col: cIdx });
                                e.currentTarget.select();
                              }}
                              onDoubleClick={() => {
                                sizeMatrixManualCaretRef.current = true;
                              }}
                              onPaste={e => handleSizeMatrixPaste(e, 4, cIdx)}
                              onChange={e => updateSizeCellValue(sz, 'pack', e.target.value)}
                              onKeyDown={e => handleSizeMatrixKeyDown(e, 4, cIdx)}
                              placeholder="0"
                              className="w-full px-2 py-2 text-center font-mono tabular-nums font-black text-slate-950 bg-[#ffff00] placeholder:text-amber-700/50 focus:bg-amber-200 focus:outline-none"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-slate-700 font-mono tabular-nums font-black bg-[#ffff00]">
                        {activeSizeTotals.pack}
                      </td>
                    </tr>

                    {/* Строка 6: Остаток (Заказ - Упаковка) */}
                    <tr>
                      <td className="px-3 py-2 border border-slate-700 font-bold text-slate-900 bg-white">Остаток</td>
                      {visibleMatrixSizes.map(sz => {
                        const cell = activeSizeMatrix.values[sz];
                        const hasData = cell && (cell.order > 0 || cell.pack > 0);
                        const rem = hasData ? cell.order - cell.pack : 0;
                        return (
                          <td
                            key={`rem-${sz}`}
                            className={`px-2 py-2 border border-slate-700 font-mono tabular-nums ${
                              rem < 0 ? 'bg-rose-100 text-rose-800 font-black' : ''
                            }`}
                          >
                            {hasData ? rem : ''}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-slate-700 font-mono tabular-nums font-black">
                        {activeSizeTotals.remOrder}
                      </td>
                    </tr>

                    {/* Строка 7: % выполнения */}
                    <tr>
                      <td className="px-3 py-2 border border-slate-700 font-black text-rose-700 bg-white">Закр. %</td>
                      {visibleMatrixSizes.map(sz => {
                        const cell = activeSizeMatrix.values[sz];
                        const hasOrder = cell && cell.order > 0;
                        const pctVal = hasOrder ? (cell.pack / cell.order) * 100 : 0;
                        return (
                          <td
                            key={`pct-${sz}`}
                            className={`px-2 py-2 border border-slate-700 font-mono tabular-nums font-black ${
                              hasOrder ? 'bg-[#86efac] text-[#991b1b]' : 'bg-white'
                            }`}
                          >
                            {hasOrder ? `${pctVal.toFixed(1).replace('.', ',')}%` : ''}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 border border-slate-700 font-mono tabular-nums font-black bg-[#86efac] text-[#991b1b]">
                        {activeSizeTotals.pct.toFixed(1).replace('.', ',')}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2. СРЕДНЯЯ СВОДНАЯ ПОЛОСА */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-950 font-black">
                      <th className="px-2.5 py-2 border border-slate-700">Всего заказа</th>
                      <th className="px-2.5 py-2 border border-slate-700">Всего крой</th>
                      <th className="px-2.5 py-2 border border-slate-700 text-sky-900 bg-sky-50">Крой %</th>
                      <th className="px-2.5 py-2 border border-slate-700">Всего Раздача</th>
                      <th className="px-2.5 py-2 border border-slate-700">Всего Пошив</th>
                      <th className="px-2.5 py-2 border border-slate-700">Всего Упаковка</th>
                      <th className="px-2.5 py-2 border border-slate-700 text-rose-800">Брак</th>
                      <th className="px-2.5 py-2 border border-slate-700 text-rose-900 bg-rose-50">Разница (Разд−Упак)</th>
                      <th className="px-2.5 py-2 border border-slate-700 text-emerald-800">Отгрузка</th>
                      <th className="px-2.5 py-2 border border-slate-700 text-indigo-800">Склад остаток</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-mono tabular-nums font-black text-sm md:text-base text-slate-950 bg-white">
                      <td className="px-2.5 py-2 border border-slate-700">{activeSizeTotals.order}</td>
                      <td className="px-2.5 py-2 border border-slate-700">{activeSizeTotals.cut}</td>
                      <td className="px-2.5 py-2 border border-slate-700 bg-sky-100 text-sky-900">
                        {activeSizeTotals.cutPct.toFixed(1)}%
                      </td>
                      <td className="px-2.5 py-2 border border-slate-700">{activeSizeTotals.dist}</td>
                      <td className="px-2.5 py-2 border border-slate-700">{activeSizeTotals.sew}</td>
                      <td className="px-2.5 py-2 border border-slate-700 bg-yellow-100">{activeSizeTotals.pack}</td>
                      <td className="p-0 border border-slate-700">
                        <input
                          type="text"
                          value={activeSizeMatrix.defect > 0 ? String(activeSizeMatrix.defect) : ''}
                          onChange={e => updateSizeDefect(e.target.value)}
                          placeholder="0"
                          className="w-20 px-2 py-2 text-center font-mono tabular-nums font-black text-rose-700 focus:bg-rose-50 focus:outline-none"
                        />
                      </td>
                      <td
                        className={`px-2.5 py-2 border border-slate-700 ${activeSizeTotals.remDist < 0 ? 'bg-rose-200 text-rose-950' : 'bg-rose-50 text-rose-900'}`}
                        title="Разница между Раздачей и Упаковкой (шт и %)"
                      >
                        {activeSizeTotals.remDist} <span className="text-xs font-bold">({activeSizeTotals.diffDistPackPct.toFixed(1)}%)</span>
                      </td>
                      <td className="p-0 border border-slate-700">
                        <input
                          type="text"
                          value={activeSizeRow.qtyShipped > 0 ? String(activeSizeRow.qtyShipped) : ''}
                          onChange={e => updateActiveRowMeta('qtyShipped', e.target.value)}
                          placeholder="0"
                          className="w-20 px-2 py-2 text-center font-mono tabular-nums font-black text-emerald-800 focus:bg-emerald-50 focus:outline-none"
                        />
                      </td>
                      <td className="px-2.5 py-2 border border-slate-700 bg-indigo-50 text-indigo-950">
                        {activeSizeRow.qtyStock}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2.5. СВОДНАЯ МАТРИЦА ПО ВСЕМ ЦВЕТАМ И РОСТАМ ЗАКАЗА (показываются только заполненные размеры) */}
              {activeOrderVariants.length > 0 && activeOrderUnionPopulatedSizes.length > 0 && (
                <div className="border border-slate-400 rounded-lg overflow-hidden">
                  <div className="bg-slate-200 border-b border-slate-400 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-black text-slate-900">
                    <span>
                      ОБЪЕМ ЗАКАЗА «{activeSizeRow.orderNo}» ПО ЦВЕТАМ И РОСТАМ (только активные размеры: {activeOrderUnionPopulatedSizes.join(', ')})
                    </span>
                    <span className="font-mono text-slate-700">Позиций: {activeOrderVariants.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-center text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-100 text-slate-950 font-black">
                          <th className="px-2.5 py-1.5 border border-slate-400 text-left">Цвет</th>
                          <th className="px-2 py-1.5 border border-slate-400">Код</th>
                          <th className="px-2 py-1.5 border border-slate-400">Рост</th>
                          {activeOrderUnionPopulatedSizes.map(sz => (
                            <th key={`ov-${sz}`} className="px-2 py-1.5 border border-slate-400 font-mono bg-amber-50">
                              {sz}
                            </th>
                          ))}
                          <th className="px-2.5 py-1.5 border border-slate-400 bg-yellow-100">Заказ</th>
                          <th className="px-2.5 py-1.5 border border-slate-400 bg-sky-50">Крой %</th>
                          <th className="px-2.5 py-1.5 border border-slate-400">Раздача</th>
                          <th className="px-2.5 py-1.5 border border-slate-400 bg-yellow-200">Упаковка</th>
                          <th className="px-2.5 py-1.5 border border-slate-400 bg-rose-50 text-rose-900">Разн. (шт / %)</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {activeOrderVariants.map(v => {
                          const vm = sizeMatrices[v.id];
                          const isCurrent = v.id === activeSizeRow.id;
                          const cutPct = v.qtyOrder > 0 ? (v.qtyCut / v.qtyOrder) * 100 : 0;
                          const diffPure = v.qtyDistribution - v.qtyPackaging;
                          const diffPurePct = v.qtyDistribution > 0 ? (diffPure / v.qtyDistribution) * 100 : 0;
                          return (
                            <tr
                              key={`ov-row-${v.id}`}
                              onClick={() => setSelectedSizeRowId(v.id)}
                              className={`cursor-pointer transition-colors ${isCurrent ? 'bg-amber-100 font-black' : 'hover:bg-slate-50 bg-white'}`}
                            >
                              <td className="px-2.5 py-1.5 border border-slate-400 text-left font-sans font-bold text-slate-900">
                                {v.color}
                              </td>
                              <td className="px-2 py-1.5 border border-slate-400 text-slate-700">{v.colorCode || '—'}</td>
                              <td className="px-2 py-1.5 border border-slate-400 font-bold text-indigo-900">{v.rost || '—'}</td>
                              {activeOrderUnionPopulatedSizes.map(sz => {
                                const q = vm?.values[sz]?.order || 0;
                                return (
                                  <td key={`ov-c-${v.id}-${sz}`} className="px-2 py-1.5 border border-slate-400">
                                    {q > 0 ? q : ''}
                                  </td>
                                );
                              })}
                              <td className="px-2.5 py-1.5 border border-slate-400 font-black bg-yellow-50">{v.qtyOrder}</td>
                              <td className="px-2.5 py-1.5 border border-slate-400 font-bold text-sky-900 bg-sky-50">{cutPct.toFixed(1)}%</td>
                              <td className="px-2.5 py-1.5 border border-slate-400">{v.qtyDistribution}</td>
                              <td className="px-2.5 py-1.5 border border-slate-400 font-black bg-yellow-100">{v.qtyPackaging}</td>
                              <td className={`px-2.5 py-1.5 border border-slate-400 font-bold ${diffPure < 0 ? 'bg-rose-100 text-rose-900' : 'text-slate-900'}`}>
                                {diffPure} ({diffPurePct.toFixed(1)}%)
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-yellow-200 font-mono font-black text-slate-950">
                        <tr>
                          <td colSpan={3} className="px-2.5 py-1.5 border border-slate-500 text-right font-sans">
                            ИТОГО ПО ЗАКАЗУ:
                          </td>
                          {activeOrderUnionPopulatedSizes.map(sz => {
                            const szSum = activeOrderVariants.reduce((s, v) => s + (sizeMatrices[v.id]?.values[sz]?.order || 0), 0);
                            return (
                              <td key={`ov-tot-${sz}`} className="px-2 py-1.5 border border-slate-500">
                                {szSum > 0 ? szSum : ''}
                              </td>
                            );
                          })}
                          {(() => {
                            const sumOrd = activeOrderVariants.reduce((s, v) => s + v.qtyOrder, 0);
                            const sumCut = activeOrderVariants.reduce((s, v) => s + v.qtyCut, 0);
                            const sumDist = activeOrderVariants.reduce((s, v) => s + v.qtyDistribution, 0);
                            const sumPack = activeOrderVariants.reduce((s, v) => s + v.qtyPackaging, 0);
                            const sumCutPct = sumOrd > 0 ? (sumCut / sumOrd) * 100 : 0;
                            const sumDiff = sumDist - sumPack;
                            const sumDiffPct = sumDist > 0 ? (sumDiff / sumDist) * 100 : 0;
                            return (
                              <>
                                <td className="px-2.5 py-1.5 border border-slate-500">{sumOrd}</td>
                                <td className="px-2.5 py-1.5 border border-slate-500 bg-sky-200 text-sky-950">{sumCutPct.toFixed(1)}%</td>
                                <td className="px-2.5 py-1.5 border border-slate-500">{sumDist}</td>
                                <td className="px-2.5 py-1.5 border border-slate-500">{sumPack}</td>
                                <td className="px-2.5 py-1.5 border border-slate-500">{sumDiff} ({sumDiffPct.toFixed(1)}%)</td>
                              </>
                            );
                          })()}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. НИЖНИЙ БЛОК: ДИАГРАММА УПАКОВКИ ПО РАЗМЕРАМ (ТОЛЬКО ЗАПОЛНЕННЫЕ) + ФОТО/ЭСКИЗ МОДЕЛИ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-7 border border-slate-400 rounded-lg p-4 bg-white flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-700 pb-4">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 inline-block bg-[#8db875] border border-[#6e9c55]" />
                      <span>
                        {activeSizeRow.orderNo} {activeSizeRow.model} {activeSizeRow.color}{activeSizeRow.rost ? ` (${activeSizeRow.rost})` : ''} Упаковка
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 inline-block bg-[#d2e3c8] border border-[#b4cca6]" />
                      <span>
                        {activeSizeRow.orderNo} {activeSizeRow.model} %
                      </span>
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-2 md:gap-4 h-72 pt-6 pb-2 border-b border-slate-400 px-2 overflow-x-auto">
                    {[...reportMatrixSizes, 'ВСЕГО'].map(label => {
                      const isTotalCol = label === 'ВСЕГО';
                      const packQty = isTotalCol
                        ? activeSizeTotals.pack
                        : activeSizeMatrix.values[label]?.pack || 0;
                      const ordQty = isTotalCol
                        ? activeSizeTotals.order
                        : activeSizeMatrix.values[label]?.order || 0;
                      const pct = ordQty > 0 ? Math.min(100, Math.max(0, (packQty / ordQty) * 100)) : 0;
                      const pctText = ordQty > 0 ? `${((packQty / ordQty) * 100).toFixed(2).replace('.', ',')}%` : '';
                      const showBar = ordQty > 0 || packQty > 0;

                      return (
                        <div key={`bar-${label}`} className="flex-1 flex flex-col items-center h-full justify-end min-w-[38px]">
                          {showBar ? (
                            <div className="w-full max-w-[54px] h-full flex flex-col justify-end relative">
                              <div
                                className="w-full bg-[#d2e3c8] transition-all duration-300 flex items-end justify-center pb-1"
                                style={{ height: `${Math.max(8, 100 - pct)}%` }}
                              >
                                <span className="text-[11px] font-bold text-slate-900 font-mono tabular-nums whitespace-nowrap">
                                  {pctText}
                                </span>
                              </div>
                              <div
                                className="w-full bg-[#8db875] transition-all duration-300 flex items-center justify-center border-t border-[#729d5b]"
                                style={{ height: `${Math.max(12, pct)}%` }}
                              >
                                <span className="text-xs font-black text-slate-950 font-mono tabular-nums">
                                  {packQty}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 md:gap-4 pt-2 px-2 overflow-x-auto">
                    {[...reportMatrixSizes, 'ВСЕГО'].map(label => (
                      <div key={`xlabel-${label}`} className="flex-1 text-center text-xs font-bold text-slate-900 min-w-[38px]">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Фотография / Технический эскиз модели */}
                <div className="lg:col-span-5 border border-slate-400 rounded-lg p-4 bg-white flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                        Фото / Эскиз модели
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {activeSizeRow.model} • {activeSizeRow.color}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={modelImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadModelImage}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => modelImageInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Загрузить фото</span>
                      </button>
                      {(modelImages[activeSizeRow.id] || modelImages[activeSizeRow.model]) && (
                        <button
                          type="button"
                          onClick={() => {
                            setModelImages(prev => {
                              const next = { ...prev };
                              delete next[activeSizeRow.id];
                              delete next[activeSizeRow.model];
                              return next;
                            });
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Удалить фото"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center py-4 min-h-[240px]">
                    {modelImages[activeSizeRow.id] || modelImages[activeSizeRow.model] ? (
                      <img
                        src={modelImages[activeSizeRow.id] || modelImages[activeSizeRow.model]}
                        alt={`${activeSizeRow.model} ${activeSizeRow.color}`}
                        className="max-h-64 w-auto object-contain rounded-lg border border-slate-200 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center space-y-3 w-full">
                        <svg viewBox="0 0 360 150" className="w-full max-w-[330px] h-auto">
                          {[
                            { x: 10, fill: '#f4f4f0', stroke: '#94a3b8' },
                            { x: 125, fill: '#f3e5b8', stroke: '#a16207' },
                            { x: 240, fill: '#5c4d42', stroke: '#334155' }
                          ].map((item, idx) => (
                            <g key={idx} transform={`translate(${item.x}, 10)`}>
                              <path
                                d="M25,10 L40,5 C46,12 58,12 64,5 L79,10 L102,32 L89,50 L76,40 L76,122 L28,122 L28,40 L15,50 L2,32 Z"
                                fill={item.fill}
                                stroke={item.stroke}
                                strokeWidth="1.8"
                              />
                              <path d="M40,5 C46,15 58,15 64,5" fill="none" stroke={item.stroke} strokeWidth="1.4" />
                              <rect x="38" y="34" width="28" height="32" rx="2" fill="#cbd5e1" opacity="0.55" stroke={item.stroke} strokeWidth="0.8" />
                            </g>
                          ))}
                        </svg>
                        <div className="text-xs text-slate-600 font-semibold">
                          Нажмите <strong>«Загрузить фото»</strong>, чтобы прикрепить эскиз или фото модели{' '}
                          <span className="font-mono font-bold text-slate-900">{activeSizeRow.model}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto">
                <Ruler className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-lg font-black text-white">Заказы еще не добавлены (демо-данные удалены)</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Все производственные данные вводятся здесь в «Размеры по заказу» и автоматически передаются в Таблицу производства, Сводную, Строки по цветам и Главный Дашборд.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddBlankRow}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить первый заказ</span>
                </button>
                <button
                  type="button"
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-slate-700 font-bold rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Импорт из Excel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ИНТЕРАКТИВНЫЙ ДАШБОРД ПРОИЗВОДСТВА (Контрастные шрифты и Tooltip!)
         ========================================================================= */}
      {activeTabMode === 'dashboard_photo2' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 shadow-xl text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <h1 className="text-lg font-black tracking-wider text-white">
                  ПРОИЗВОДСТВО — ИНТЕРАКТИВНЫЙ ДАШБОРД
                </h1>
                <p className="text-xs text-cyan-300 mt-0.5 font-semibold">
                  Chust Textile • Контроль производства и отгрузки по заказам • {selectedMonth === 'all' ? 'Все месяцы' : selectedMonth}
                </p>
              </div>
              <div className="text-xs text-slate-200 font-mono font-bold">
                Отчет на: {new Date().toLocaleDateString('ru-RU')}
              </div>
            </div>

            {/* 6 KPI карточек с 3 ключевыми процентами */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
              <div className="bg-[#0e1a38] border border-cyan-500/40 rounded-xl p-3 shadow-md">
                <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider block">
                  КОЛИЧЕСТВО ЗАКАЗОВ
                </span>
                <div className="text-2xl font-black text-white mt-1">{totals.distinctOrdersCount}</div>
                <div className="text-[11px] text-slate-200 mt-1">
                  Строк: {totals.rowsCount} | Моделей: {totals.distinctModelsCount}
                </div>
              </div>

              <div className="bg-[#0e1a38] border border-blue-500/40 rounded-xl p-3 shadow-md">
                <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider block">
                  ОБЪЕМ ЗАКАЗА / КРОЙ
                </span>
                <div className="text-2xl font-black text-white mt-1">{totals.orderQty.toLocaleString()}</div>
                <div className="text-[11px] text-sky-300 mt-1 font-bold">
                  Крой: {totals.cutQty.toLocaleString()} шт ({totals.cutRatePercent}%)
                </div>
              </div>

              <div className="bg-[#0e1a38] border border-emerald-500/40 rounded-xl p-3 shadow-md">
                <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider block">
                  ЗАКРЫТИЕ ЗАКАЗОВ
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">{totals.overallPercent}%</div>
                <div className="text-[11px] text-slate-200 mt-1">
                  Разница (Разд−Упак): {totals.diffPureQty.toLocaleString()} шт ({totals.diffPurePct}%)
                </div>
              </div>

              <div className="bg-[#0e1a38] border border-rose-500/40 rounded-xl p-3 shadow-md">
                <span className="text-[10px] font-black uppercase text-rose-300 tracking-wider block">
                  УРОВЕНЬ БРАКА
                </span>
                <div className="text-2xl font-black text-rose-400 mt-1">{totals.defectRatePercent}%</div>
                <div className="text-[11px] text-slate-200 mt-1">
                  Брак: {totals.defectQty.toLocaleString()} шт • норма 3.5%
                </div>
              </div>

              <div className="bg-[#0e1a38] border border-amber-500/40 rounded-xl p-3 shadow-md">
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                  ОТГРУЖЕНО
                </span>
                <div className="text-2xl font-black text-amber-400 mt-1">{totals.shipQty.toLocaleString()}</div>
                <div className="text-[11px] text-slate-200 mt-1">
                  От упаковки: {totals.packQty > 0 ? ((totals.shipQty / totals.packQty) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>

              <div className="bg-[#0e1a38] border border-purple-500/40 rounded-xl p-3 shadow-md">
                <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider block">
                  ОСТАТОК НА СКЛАДЕ
                </span>
                <div className="text-2xl font-black text-purple-300 mt-1">{totals.stockQty.toLocaleString()}</div>
                <div className="text-[11px] text-purple-200 mt-1 font-semibold">
                  Остаток %: {totals.stockRatePercent}% (от упак.)
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Этапы производства */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Этапы производства (шт)</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productionStagesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#cbd5e1" tick={{ fill: '#e2e8f0', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" stroke="#cbd5e1" tick={{ fill: '#f8fafc', fontSize: 12, fontWeight: 600 }} width={80} />
                    <Tooltip
                      cursor={{ fill: 'rgba(56, 189, 248, 0.12)' }}
                      content={<DashboardChartTooltip />}
                    />
                    <Bar dataKey="value" name="Количество" radius={[0, 4, 4, 0]}>
                      {productionStagesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Топ-10 заказов по браку */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Топ-10 заказов по количеству брака (шт)</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDefectsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#cbd5e1"
                      tick={{ fill: '#f1f5f9', fontSize: 10 }}
                      textAnchor="end"
                      angle={-25}
                      height={52}
                    />
                    <YAxis stroke="#cbd5e1" tick={{ fill: '#e2e8f0', fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(244, 63, 94, 0.12)' }}
                      content={<DashboardChartTooltip />}
                    />
                    <Bar dataKey="defect" name="Брак" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Топ-5 моделей по упаковке */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Топ-5 моделей по упаковке</span>
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topModelsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {topModelsPieData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DashboardChartTooltip />} />
                    <Legend wrapperStyle={{ color: '#f8fafc', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Предупреждения и контроль */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Предупреждения и контроль качества</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-sky-500/15 border border-sky-500/40 rounded-xl text-sky-100">
                  <div className="font-bold flex items-center gap-1.5 text-sky-300">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>Выполнение кроя к заказу: {totals.cutRatePercent}%</span>
                  </div>
                  <p className="text-[11px] text-slate-100 mt-1">
                    Раскроено <strong>{totals.cutQty.toLocaleString()} шт</strong> при объеме заказов {totals.orderQty.toLocaleString()} шт.
                  </p>
                </div>

                <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-100">
                  <div className="font-bold flex items-center gap-1.5 text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Разница Раздача − Упаковка: {totals.diffPureQty.toLocaleString()} шт ({totals.diffPurePct}%)</span>
                  </div>
                  <p className="text-[11px] text-slate-100 mt-1">
                    Уровень брака: <strong>{totals.defectRatePercent}%</strong> ({totals.defectQty.toLocaleString()} шт) • Остаток на складе: {totals.stockQty.toLocaleString()} шт ({totals.stockRatePercent}%).
                  </p>
                </div>

                <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-100">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Закрытие заказов (Общ-упак / Раздача): {totals.overallPercent}%</span>
                  </div>
                  <p className="text-[11px] text-slate-100 mt-1">
                    Разница с учетом брака: <strong>{totals.diffQty.toLocaleString()} шт</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: СВОДНАЯ ТАБЛИЦА ПО ЗАКАЗАМ
         ========================================================================= */}
      {activeTabMode === 'summary_photo3' && (
        <div className="bg-[#0b1329] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">
          <div className="p-3 bg-[#0e1a38] border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-black text-white tracking-wider">СВОДНАЯ ТАБЛИЦА ПО ЗАКАЗАМ</h2>
            <span className="text-xs text-slate-200 font-mono">Показано: {uniqueOrderNos.length} заказов</span>
          </div>

          <div className="overflow-x-auto max-h-[72vh]">
            <table className="w-full text-left text-xs text-slate-100 font-mono">
              <thead className="sticky top-0 bg-[#080e1d] text-slate-200 border-b border-slate-800 text-[11px] uppercase">
                <tr>
                  <th className="p-2.5 text-center">№</th>
                  <th className="p-2.5 text-cyan-300">Месяц</th>
                  <th className="p-2.5 text-indigo-300">Бренд</th>
                  <th className="p-2.5 text-cyan-400">Заказ</th>
                  <th className="p-2.5 text-slate-200">Модель</th>
                  <th className="p-2.5 text-amber-300">Активные размеры</th>
                  <th className="p-2.5 text-right">Заказ</th>
                  <th className="p-2.5 text-center text-sky-300">Крой %</th>
                  <th className="p-2.5 text-right">Раздача</th>
                  <th className="p-2.5 text-right text-emerald-400">Упаковка</th>
                  <th className="p-2.5 text-right text-rose-300">Разд−Упак (шт / %)</th>
                  <th className="p-2.5 text-right text-rose-400">Брак %</th>
                  <th className="p-2.5 text-center text-emerald-300">Закрытие %</th>
                  <th className="p-2.5 text-right text-amber-400">Отгружено</th>
                  <th className="p-2.5 text-right text-purple-300">Остаток</th>
                  <th className="p-2.5 text-center">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {uniqueOrderNos.map((ordNo, idx) => {
                  const rows = filteredRows.filter(r => r.orderNo === ordNo);
                  if (rows.length === 0) return null;
                  const model = rows[0]?.model || '';
                  const brand = rows.map(r => r.brand).filter(Boolean)[0] || '—';
                  const month = Array.from(new Set(rows.map(r => r.month))).join(', ');
                  const unionSizes = Array.from(
                    new Set(rows.flatMap(r => getEffectiveDisplaySizes(sizeMatrices[r.id])))
                  );
                  const ordQ = rows.reduce((s, r) => s + r.qtyOrder, 0);
                  const cutQ = rows.reduce((s, r) => s + r.qtyCut, 0);
                  const distQ = rows.reduce((s, r) => s + r.qtyDistribution, 0);
                  const packQ = rows.reduce((s, r) => s + r.qtyPackaging, 0);
                  const defectQ = rows.reduce((s, r) => s + r.qtyDefect, 0);
                  const totalPackQ = rows.reduce((s, r) => s + r.qtyTotalPack, 0);
                  const shipQ = rows.reduce((s, r) => s + r.qtyShipped, 0);
                  const stockQ = rows.reduce((s, r) => s + r.qtyStock, 0);

                  const cutRate = ordQ > 0 ? ((cutQ / ordQ) * 100).toFixed(1) : '0.0';
                  const diffPure = distQ - packQ;
                  const diffPurePct = distQ > 0 ? ((diffPure / distQ) * 100).toFixed(1) : '0.0';
                  const defectRate = distQ > 0 ? ((defectQ / distQ) * 100).toFixed(1) : '0.0';
                  const closeRate = distQ > 0 ? ((totalPackQ / distQ) * 100).toFixed(1) : '0.0';
                  const isDone = shipQ >= ordQ && ordQ > 0;

                  return (
                    <tr key={ordNo} className="hover:bg-slate-800/50 bg-[#0d162e]/60 transition-colors">
                      <td className="p-2 text-center text-slate-300">{idx + 1}</td>
                      <td className="p-2 text-cyan-200 font-sans">{month}</td>
                      <td className="p-2 text-indigo-200 font-sans font-bold">{brand}</td>
                      <td className="p-2 font-bold text-cyan-300">{ordNo}</td>
                      <td className="p-2 text-slate-100 font-sans truncate max-w-[160px]">{model}</td>
                      <td className="p-2 text-amber-200 text-[11px] max-w-[180px] truncate" title={unionSizes.join(', ')}>
                        {unionSizes.join(', ') || '—'}
                      </td>
                      <td className="p-2 text-right text-white">{ordQ.toLocaleString()}</td>
                      <td className="p-2 text-center font-bold text-sky-300">{cutRate}%</td>
                      <td className="p-2 text-right text-slate-100">{distQ.toLocaleString()}</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">{packQ.toLocaleString()}</td>
                      <td className={`p-2 text-right font-bold ${diffPure < 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                        {diffPure.toLocaleString()} ({diffPurePct}%)
                      </td>
                      <td className={`p-2 text-center font-bold ${Number(defectRate) > 3.5 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {defectRate}%
                      </td>
                      <td className="p-2 text-center font-bold text-emerald-300">{closeRate}%</td>
                      <td className="p-2 text-right text-amber-400 font-bold">{shipQ > 0 ? shipQ.toLocaleString() : '-'}</td>
                      <td className="p-2 text-right text-purple-300 font-bold">{stockQ > 0 ? stockQ.toLocaleString() : '-'}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isDone
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-cyan-950 text-cyan-200 border border-cyan-700'
                          }`}
                        >
                          {isDone ? 'Отгружен' : 'В работе'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: СТРОКИ ЗАКАЗА ПО ЦВЕТАМ И РОСТАМ
         ========================================================================= */}
      {activeTabMode === 'colors_photo4' && (
        <div className="bg-[#0b1329] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">
          <div className="p-3 bg-[#0e1a38] border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-black text-white tracking-wider">СТРОКИ ЗАКАЗА (по цветам, ростам и размерам)</h2>
            <span className="text-xs text-slate-200 font-mono">Показано: {filteredRows.length} строк</span>
          </div>

          <div className="overflow-x-auto max-h-[72vh]">
            <table className="w-full text-left text-xs text-slate-100 font-mono">
              <thead className="sticky top-0 bg-[#080e1d] text-slate-200 border-b border-slate-800 text-[11px] uppercase">
                <tr>
                  <th className="p-2 text-center">№</th>
                  <th className="p-2 text-indigo-300">Бренд</th>
                  <th className="p-2 text-cyan-400">Заказ</th>
                  <th className="p-2 text-amber-300">Цвет / Рост</th>
                  <th className="p-2 text-cyan-200">Размеры</th>
                  <th className="p-2 text-right">Заказ</th>
                  <th className="p-2 text-center text-sky-300">Крой %</th>
                  <th className="p-2 text-right">Раздача</th>
                  <th className="p-2 text-right text-emerald-400">Упаковка</th>
                  <th className="p-2 text-right text-rose-300">Разд−Упак</th>
                  <th className="p-2 text-center">Брак %</th>
                  <th className="p-2 text-right text-amber-400">Отгр.</th>
                  <th className="p-2 text-right text-purple-300">Остаток</th>
                  <th className="p-2 text-center text-emerald-300">Закрытие %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredRows.map((r, idx) => {
                  const m = getRowMetrics(r);
                  const effSizes = getEffectiveDisplaySizes(sizeMatrices[r.id]);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setSelectedSizeRowId(r.id);
                        setActiveTabMode('size_matrix');
                      }}
                      className="hover:bg-slate-800/60 bg-[#0d162e]/60 transition-colors cursor-pointer"
                    >
                      <td className="p-2 text-center text-slate-300">{idx + 1}</td>
                      <td className="p-2 text-indigo-200 font-sans font-bold">{r.brand || '—'}</td>
                      <td className="p-2 font-bold text-cyan-300">{r.orderNo}</td>
                      <td className="p-2 text-amber-200 font-sans">
                        <span>{r.color}</span>
                        {r.colorCode && <span className="text-slate-400 font-mono text-[10px] ml-1">({r.colorCode})</span>}
                        {r.rost && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200 font-mono text-[10px]">
                            {r.rost}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-cyan-200 text-[11px] max-w-[160px] truncate" title={effSizes.join(', ')}>
                        {effSizes.join(', ') || '—'}
                      </td>
                      <td className="p-2 text-right text-white">{r.qtyOrder.toLocaleString()}</td>
                      <td className="p-2 text-center font-bold text-sky-300">{m.cutPct.toFixed(1)}%</td>
                      <td className="p-2 text-right text-slate-100">{r.qtyDistribution.toLocaleString()}</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">{r.qtyPackaging.toLocaleString()}</td>
                      <td className={`p-2 text-right font-bold ${m.diffPure < 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                        {m.diffPure.toLocaleString()} ({m.diffPurePct.toFixed(1)}%)
                      </td>
                      <td className={`p-2 text-center font-bold ${m.defectPct > 3.5 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {m.defectPct.toFixed(1)}%
                      </td>
                      <td className="p-2 text-right text-amber-400 font-bold">{r.qtyShipped > 0 ? r.qtyShipped.toLocaleString() : '-'}</td>
                      <td className="p-2 text-right text-purple-300 font-bold">{r.qtyStock > 0 ? r.qtyStock.toLocaleString() : '-'}</td>
                      <td className="p-2 text-center font-bold text-emerald-300">{m.closePct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: НАСТРОЙКИ, БРЕНДЫ, МЕСЯЦЫ И НОРМАТИВЫ
         ========================================================================= */}
      {activeTabMode === 'settings_photo5' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>НАСТРОЙКИ, БРЕНДЫ, МЕСЯЦЫ И НОРМАТИВЫ ПРОИЗВОДСТВА</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Управление брендами, отчетными месяцами, ростовками и расчетными формулами фабрики.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddBrandOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить бренд</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddMonthOpen(true)}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить месяц</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1) Бренды */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>1) Бренды ({uniqueBrands.length})</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBrandInput}
                  onChange={e => setNewBrandInput(e.target.value)}
                  placeholder="Новый бренд..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateNewBrand();
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCreateNewBrand()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {uniqueBrands.map((bName, idx) => {
                  const bCount = derivedLedgerRows.filter(r => r.brand === bName).length;
                  return (
                    <div key={bName} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <span className="font-bold text-indigo-200">
                        {idx + 1}. {bName}
                      </span>
                      <span className="font-mono text-slate-400">{bCount} поз.</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2) Список месяцев */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>2) Отчетные месяцы ({uniqueMonths.length})</span>
              </h3>

              <table className="w-full text-left text-xs text-slate-200">
                <thead className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="pb-2">№</th>
                    <th className="pb-2">Месяц</th>
                    <th className="pb-2 text-right">Строк</th>
                    <th className="pb-2 text-right">Объем</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {uniqueMonths.map((mName, idx) => {
                    const mRows = derivedLedgerRows.filter(r => r.month === mName);
                    const mSum = mRows.reduce((s, r) => s + r.qtyOrder, 0);
                    return (
                      <tr key={mName} className="hover:bg-slate-900/70">
                        <td className="py-2 text-slate-400">{idx + 1}</td>
                        <td className="py-2 font-sans font-bold text-cyan-300">{mName}</td>
                        <td className="py-2 text-right text-white">{mRows.length}</td>
                        <td className="py-2 text-right text-emerald-400 font-bold">{mSum.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 3) Формулы и нормативы */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>3) Формулы и нормативы</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-200">Крой % к заказу:</span>
                  <span className="font-mono font-bold text-sky-400">Крой / Заказ × 100%</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-200">Разница Разд − Упак:</span>
                  <span className="font-mono font-bold text-rose-300">Раздача − Упаковка (шт и %)</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-200">Закрытие заказа (%):</span>
                  <span className="font-mono font-bold text-emerald-400">Общ-упак / Раздача × 100%</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-200">Процент брака (Брак %):</span>
                  <span className="font-mono font-bold text-rose-400">Брак / Раздача × 100% (норма 3.5%)</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-200">Остаток склада (%):</span>
                  <span className="font-mono font-bold text-indigo-300">Остаток / Упаковка × 100%</span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-200">Пароль для удаления заказа:</span>
                  <span className="font-mono font-bold text-amber-300">1111</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ИЛИ ОЧИСТКИ (ПАРОЛЬ: 1111)
         ========================================================================= */}
      {(rowToDelete || isClearAllConfirmOpen) && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-white text-base">
                {isClearAllConfirmOpen ? 'Очистить все заказы' : 'Удаление заказа'}
              </h3>
              {isClearAllConfirmOpen ? (
                <p className="text-xs text-slate-300">
                  Будут удалены все строки заказов и матрицы размеров ({derivedLedgerRows.length} шт.).
                </p>
              ) : (
                rowToDelete && (
                  <>
                    <p className="text-xs text-slate-300 font-mono">
                      {rowToDelete.orderNo} • {rowToDelete.color}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Месяц: {rowToDelete.month || DEFAULT_MONTHS[0]}
                    </p>
                  </>
                )
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5">
                Введите пароль для подтверждения:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={e => {
                  setDeletePassword(e.target.value);
                  setDeletePasswordError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmDeleteRow();
                  if (e.key === 'Escape') {
                    setRowToDelete(null);
                    setIsClearAllConfirmOpen(false);
                  }
                }}
                autoFocus
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-mono text-white focus:border-rose-500 focus:outline-none"
                placeholder="••••"
              />
              {deletePasswordError && (
                <span className="text-[11px] text-rose-400 block mt-1.5 text-center font-bold">
                  {deletePasswordError}
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRowToDelete(null);
                  setIsClearAllConfirmOpen(false);
                }}
                className="flex-1 py-2 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRow}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-md"
              >
                {isClearAllConfirmOpen ? 'Очистить всё' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
