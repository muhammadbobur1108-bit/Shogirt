import React, { useState, useEffect } from 'react';
import { Order, OrderSizes, OrderColorVariant, OrderIssue, AppUser } from '../types';
import { 
  X, 
  Scissors, 
  Send, 
  Layers as LayersIcon, 
  Archive, 
  AlertTriangle, 
  QrCode, 
  ShieldCheck, 
  Printer, 
  Sparkles, 
  User, 
  Save, 
  RotateCcw,
  Plus,
  Minus,
  CheckCircle,
  TrendingUp,
  Trash2,
  Maximize2,
  Minimize2,
  ShoppingBag,
  Palette,
  MessageSquare,
  Image as ImageIcon,
  Upload,
  Check,
  AlertCircle,
  Camera
} from 'lucide-react';

import { Language } from '../locales';
import ExcelStageImportModal from './ExcelStageImportModal';

interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  onDeleteOrder?: (id: string) => void;
  currentUser?: AppUser | null;
  lang: Language;
}

const ADULT_SIZES = ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL', '11XL', '12XL', '13XL', '14XL', '15XL', '16XL'];
const KIDS_SIZES_1 = ['116', '122', '128', '134', '140', '146', '152', '158', '164'];
const KIDS_SIZES_2 = ['24', '26', '28', '30', '32', '34', '36', '38', '40', '42'];

type ActiveTab = 
  | 'zakaz_razmer'
  | 'raskroy' 
  | 'razdacha' 
  | 'poshiv' 
  | 'upakovka' 
  | 'brak' 
  | 'stiker' 
  | 'otk' 
  | 'print' 
  | 'vishivka' 
  | 'vladelets'
  | 'raznitsa'
  | 'muammolar';

const handleExcelKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  rIdx: number,
  cIdx: number,
  totalRows: number,
  totalCols: number,
  gridId: string = 'excel-grid'
) => {
  if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
    if (cIdx < totalCols - 1) {
      e.preventDefault();
      const nextInput = document.querySelector<HTMLInputElement>(`[data-grid="${gridId}"][data-row="${rIdx}"][data-col="${cIdx + 1}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
    if (cIdx > 0) {
      e.preventDefault();
      const prevInput = document.querySelector<HTMLInputElement>(`[data-grid="${gridId}"][data-row="${rIdx}"][data-col="${cIdx - 1}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
    if (rIdx < totalRows - 1) {
      e.preventDefault();
      const downInput = document.querySelector<HTMLInputElement>(`[data-grid="${gridId}"][data-row="${rIdx + 1}"][data-col="${cIdx}"]`);
      if (downInput) {
        downInput.focus();
        downInput.select();
      }
    }
  } else if (e.key === 'ArrowUp') {
    if (rIdx > 0) {
      e.preventDefault();
      const upInput = document.querySelector<HTMLInputElement>(`[data-grid="${gridId}"][data-row="${rIdx - 1}"][data-col="${cIdx}"]`);
      if (upInput) {
        upInput.focus();
        upInput.select();
      }
    }
  }
};

const handleExcelPaste = (
  e: React.ClipboardEvent<HTMLInputElement>,
  startRIdx: number,
  startCIdx: number,
  sizeKeysList: string[],
  onCellSet: (rIdx: number, szKey: string, value: number) => void
) => {
  const pasteData = e.clipboardData.getData('text');
  if (!pasteData) return;

  const lines = pasteData.trim().split(/\r?\n/);
  if (lines.length === 0) return;

  e.preventDefault();

  lines.forEach((lineText, rOffset) => {
    const curRIdx = startRIdx + rOffset;
    const tokens = lineText.split(/\t/);
    tokens.forEach((token, cOffset) => {
      const curCIdx = startCIdx + cOffset;
      if (curCIdx < sizeKeysList.length) {
        const cleaned = token.replace(/[^\d-]/g, '');
        if (cleaned !== '') {
          const numVal = Math.max(0, parseInt(cleaned, 10) || 0);
          onCellSet(curRIdx, sizeKeysList[curCIdx], numVal);
        }
      }
    });
  });
};

interface HorizontalExcelStageGridProps {
  gridId: string;
  sizeKeys: string[];
  refLabel: string;
  refValues: { [size: string]: number };
  refTotal: number;
  inputLabel: string;
  inputValues: { [size: string]: number };
  inputTotal: number;
  onValueChange: (sizeKey: string, val: number) => void;
  inputColorClass?: string;
  lang: Language;
}

const HorizontalExcelStageGrid: React.FC<HorizontalExcelStageGridProps> = ({
  gridId,
  sizeKeys,
  refLabel,
  refValues,
  refTotal,
  inputLabel,
  inputValues,
  inputTotal,
  onValueChange,
  inputColorClass = 'text-indigo-400',
  lang
}) => {
  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
      <table className="w-full text-xs text-center border-collapse border border-slate-800">
        <thead>
          <tr className="bg-slate-900 text-slate-400 font-extrabold uppercase border-b border-slate-800">
            <th className="p-3 text-left w-36 min-w-[140px] border-r border-slate-800">
              {lang === 'uz' ? 'Босқич' : 'Этап'}
            </th>
            {sizeKeys.map((sz) => (
              <th key={sz} className="p-2.5 min-w-[55px] font-mono text-amber-400 text-xs border-r border-slate-800 bg-slate-900/80">
                {sz}
              </th>
            ))}
            <th className="p-3 min-w-[80px] text-amber-300 border-l border-slate-800 bg-slate-900/90">
              {lang === 'uz' ? 'ЖАМИ' : 'ИТОГО'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {/* Row 1: Plan / Reference values */}
          <tr className="bg-slate-900/40 text-slate-400">
            <td className="p-2.5 text-left font-bold text-xs border-r border-slate-800 text-slate-400">
              {refLabel}
            </td>
            {sizeKeys.map(sz => (
              <td key={sz} className="p-2 font-mono font-bold text-slate-400 border-r border-slate-800 bg-slate-900/20">
                {(refValues[sz] || 0).toLocaleString()}
              </td>
            ))}
            <td className="p-2.5 font-mono font-extrabold text-slate-300 border-l border-slate-800 bg-slate-900/40">
              {refTotal.toLocaleString()}
            </td>
          </tr>

          {/* Row 2: Editable Fact values */}
          <tr className="bg-slate-950">
            <td className={`p-2.5 text-left font-extrabold text-xs border-r border-slate-800 ${inputColorClass}`}>
              {inputLabel}
            </td>
            {sizeKeys.map((sz, colIdx) => (
              <td key={sz} className="p-1 border-r border-slate-800">
                <input
                  type="number"
                  min="0"
                  data-grid={gridId}
                  data-row={0}
                  data-col={colIdx}
                  value={inputValues[sz] !== undefined && inputValues[sz] > 0 ? inputValues[sz] : ''}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleExcelKeyDown(e, 0, colIdx, 1, sizeKeys.length, gridId)}
                  onPaste={(e) => handleExcelPaste(e, 0, colIdx, sizeKeys, (_r, szKey, val) => onValueChange(szKey, val))}
                  onChange={(e) => onValueChange(sz, Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full text-center bg-slate-900 border border-slate-700/80 ${inputColorClass} font-mono font-black text-xs py-2 rounded-md outline-none focus:border-2 focus:border-amber-400 focus:bg-slate-800 transition-all shadow-inner`}
                />
              </td>
            ))}
            <td className={`p-2.5 font-mono font-black text-sm border-l border-slate-800 bg-slate-900/40 ${inputColorClass}`}>
              {inputTotal.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdateOrder,
  onDeleteOrder,
  currentUser,
  lang
}: OrderDetailModalProps) {
  // Active Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('zakaz_razmer');

  // Order quantities state by size
  const [orderSizes, setOrderSizes] = useState<OrderSizes>({});
  const [activeOrderSizeCategory, setActiveOrderSizeCategory] = useState<'adult' | 'kids1' | 'kids2'>('adult');

  // Color Variants state - must be declared before getOrderedSizeKeys!
  const [colorVariants, setColorVariants] = useState<OrderColorVariant[]>(order.colorVariants || []);
  const [newColorName, setNewColorName] = useState('');
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [newColorSizes, setNewColorSizes] = useState<OrderSizes>({});

  // Size-by-size metrics states, initialized from the order or defaulted to 0
  const [raskroy, setRaskroy] = useState<OrderSizes>({});
  const [razdacha, setRazdacha] = useState<OrderSizes>({});
  const [poshiv, setPoshiv] = useState<OrderSizes>({});
  const [upakovka, setUpakovka] = useState<OrderSizes>({});
  const [brak, setBrak] = useState<OrderSizes>({});
  const [brakMixQty, setBrakMixQty] = useState<number>(0);
  const [otk, setOtk] = useState<OrderSizes>({});
  const [otkIsReady, setOtkIsReady] = useState<boolean>(false);

  // Excel Import Stage Modal state ('zakaz' | 'raskroy' | 'razdacha' | 'upakovka' | null)
  const [importStageModal, setImportStageModal] = useState<'zakaz' | 'raskroy' | 'razdacha' | 'upakovka' | null>(null);

  // Dynamic size keys - strictly filter only sizes with ordered quantity > 0
  const getOrderedSizeKeys = (): string[] => {
    const sizeMap = new Map<string, number>();

    // 1. From orderSizes state
    if (orderSizes) {
      Object.entries(orderSizes).forEach(([sz, q]) => {
        const val = Number(q) || 0;
        if (val > 0) sizeMap.set(sz, (sizeMap.get(sz) || 0) + val);
      });
    }

    // 2. From order.sizes prop
    if (order?.sizes) {
      Object.entries(order.sizes).forEach(([sz, q]) => {
        const val = Number(q) || 0;
        if (val > 0) sizeMap.set(sz, (sizeMap.get(sz) || 0) + val);
      });
    }

    // 3. From colorVariants
    if (colorVariants && colorVariants.length > 0) {
      colorVariants.forEach(v => {
        if (v && v.sizes) {
          Object.entries(v.sizes).forEach(([sz, q]) => {
            const val = Number(q) || 0;
            if (val > 0) sizeMap.set(sz, (sizeMap.get(sz) || 0) + val);
          });
        }
      });
    }

    // 4. From raskroy / upakovka
    if (raskroy) {
      Object.entries(raskroy).forEach(([sz, q]) => {
        const val = Number(q) || 0;
        if (val > 0) sizeMap.set(sz, (sizeMap.get(sz) || 0) + val);
      });
    }
    if (upakovka) {
      Object.entries(upakovka).forEach(([sz, q]) => {
        const val = Number(q) || 0;
        if (val > 0) sizeMap.set(sz, (sizeMap.get(sz) || 0) + val);
      });
    }

    const orderedKeys = Array.from(sizeMap.keys());
    if (orderedKeys.length > 0) {
      return orderedKeys;
    }

    // Default fallback if no order quantity is entered yet
    return ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
  };

  const sizeKeys = getOrderedSizeKeys();

  // 1C Verification States
  const [testArticleInput, setTestArticleInput] = useState<string>('');
  const [testBarcodeInput, setTestBarcodeInput] = useState<string>('');
  const [testArticleResult, setTestArticleResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [testBarcodeResult, setTestBarcodeResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // Additional settings
  const [upakovkaType, setUpakovkaType] = useState('korobka'); // "korobka" | "meshok"
  const [upakovkaPackage, setUpakovkaPackage] = useState('paket_standart'); // "paket"
  const [upakovkaTypeDetails, setUpakovkaTypeDetails] = useState('Standart qadoq'); // "tip upakovki"

  const [printRequired, setPrintRequired] = useState(order.printRequired || false);
  const [printName, setPrintName] = useState(order.printName || '');
  const [printDetails, setPrintDetails] = useState(order.printDetails || '');
  const [printStatus, setPrintStatus] = useState(order.printStatus || 'kutilmoqda');

  const [vishivkaName, setVishivkaName] = useState(order.vishivkaName || '');
  const [vishivkaDetails, setVishivkaDetails] = useState(order.vishivkaDetails || '');
  const [vishivkaStatus, setVishivkaStatus] = useState(order.vishivkaStatus || 'yoq');

  const [otkStatus, setOtkStatus] = useState(order.otkStatus || 'tekshirilmoqda');
  const [otkConfirmedBy, setOtkConfirmedBy] = useState(order.otkConfirmedBy || '');
  const [otkConfirmedAt, setOtkConfirmedAt] = useState(order.otkConfirmedAt || '');
  const [otkSizeMDetails, setOtkSizeMDetails] = useState(order.otkSizeMDetails || '');

  const [projectOwnerName, setProjectOwnerName] = useState(order.projectOwnerName || order.customerName || '');
  const [projectOwnerPhone, setProjectOwnerPhone] = useState(order.projectOwnerPhone || order.customerPhone || '');
  const [oneCOrderEmission, setOneCOrderEmission] = useState(order.oneCOrderEmission || '');

  // Sticker simulation states
  const [selectedSizeForSticker, setSelectedSizeForSticker] = useState<string>(sizeKeys[0] || 'M');
  const [stickerPrintQty, setStickerPrintQty] = useState<number>(10);
  const [stickerQuantities, setStickerQuantities] = useState<{ [size: string]: number }>({});
  const [showStickerPrintSuccess, setShowStickerPrintSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // Issue / Problem states
  const [orderIssues, setOrderIssues] = useState<OrderIssue[]>(order.issues || []);
  const [newIssueText, setNewIssueText] = useState('');
  const [newIssueImage, setNewIssueImage] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const handleIssueImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewIssueImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddIssue = () => {
    if (!newIssueText.trim() && !newIssueImage) return;
    const newIssue: OrderIssue = {
      id: `issue-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      mosCode: order.mosCode,
      authorName: currentUser?.fullName || 'Foydalanuvchi',
      authorRole: currentUser?.role || 'operator',
      createdAt: new Date().toLocaleString(),
      text: newIssueText.trim(),
      imageUrl: newIssueImage || undefined,
      status: 'open'
    };
    setOrderIssues(prev => [newIssue, ...prev]);
    setNewIssueText('');
    setNewIssueImage(null);
  };

  const handleToggleIssueStatus = (id: string) => {
    setOrderIssues(prev => prev.map(iss => {
      if (iss.id === id) {
        return { ...iss, status: iss.status === 'open' ? 'resolved' : 'open' };
      }
      return iss;
    }));
  };

  const handleDeleteIssue = (id: string) => {
    setOrderIssues(prev => prev.filter(iss => iss.id !== id));
  };

  const handleUpdateColorName = (variantIdx: number, newName: string) => {
    setColorVariants(prev => prev.map((v, idx) => {
      if (idx !== variantIdx) return v;
      return { ...v, color: newName };
    }));
  };

  const handleAddEmptyColorVariant = () => {
    const newVar: OrderColorVariant = {
      color: `Rang ${colorVariants.length + 1}`,
      sizes: {},
      qtyOrder: 0,
      qtyCut: 0,
      qtyPotok: 0,
      qtyPackaging: 0
    };
    setColorVariants(prev => [...prev, newVar]);
  };

  const handleAddColorVariant = () => {
    if (!newColorName.trim()) return;
    const qty = Object.values(newColorSizes).reduce<number>((a, b) => a + (Number(b) || 0), 0);
    const newVar: OrderColorVariant = {
      color: newColorName.trim(),
      sizes: { ...newColorSizes },
      qtyOrder: qty,
      qtyCut: 0,
      qtyPotok: 0,
      qtyPackaging: 0
    };
    setColorVariants(prev => [...prev, newVar]);
    setNewColorName('');
    setNewColorSizes({});
    setShowAddColorModal(false);
  };

  const handleDeleteColorVariant = (idx: number) => {
    setColorVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuickSplitColors = () => {
    const colors = order.color.split(/[,;\/]/).map(c => c.trim()).filter(Boolean);
    if (colors.length === 0) return;
    const perColorSizes: OrderSizes = {};
    Object.keys(orderSizes).forEach(sz => {
      perColorSizes[sz] = Math.floor((orderSizes[sz] || 0) / colors.length);
    });
    const newVariants: OrderColorVariant[] = colors.map(cName => ({
      color: cName,
      sizes: { ...perColorSizes },
      qtyOrder: Object.values(perColorSizes).reduce<number>((a, b) => a + (Number(b) || 0), 0),
      qtyCut: 0,
      qtyPotok: 0,
      qtyPackaging: 0
    }));
    setColorVariants(newVariants);
  };

  const handleColorVariantQtyChange = (variantIdx: number, sizeKey: string, val: number) => {
    setColorVariants(prev => prev.map((v, idx) => {
      if (idx !== variantIdx) return v;
      const updatedSizes = { ...v.sizes, [sizeKey]: Math.max(0, val) };
      const newQtyOrder = Object.values(updatedSizes).reduce<number>((a, b) => a + (Number(b) || 0), 0);
      return {
        ...v,
        sizes: updatedSizes,
        qtyOrder: newQtyOrder
      };
    }));
  };

  const handleApplyStageImport = (parsedSizes: { [size: string]: number }, targetColorIdx: number = 0) => {
    if (importStageModal === 'zakaz') {
      if (colorVariants && colorVariants.length > 0) {
        setColorVariants(prev => prev.map((v, idx) => {
          if (idx !== targetColorIdx) return v;
          const mergedSizes = { ...v.sizes, ...parsedSizes };
          const newQtyOrder = Object.values(mergedSizes).reduce<number>((a, b) => a + (Number(b) || 0), 0);
          return { ...v, sizes: mergedSizes, qtyOrder: newQtyOrder };
        }));
      } else {
        setOrderSizes(prev => ({ ...prev, ...parsedSizes }));
      }
    } else if (importStageModal === 'raskroy') {
      setRaskroy(prev => ({ ...prev, ...parsedSizes }));
    } else if (importStageModal === 'razdacha') {
      setRazdacha(prev => ({ ...prev, ...parsedSizes }));
    } else if (importStageModal === 'upakovka') {
      setUpakovka(prev => ({ ...prev, ...parsedSizes }));
    }
  };

  // Initialize and load size states from order
  useEffect(() => {
    setOrderSizes(order.sizes ? { ...order.sizes } : {});
    setOrderIssues(order.issues ? [...order.issues] : []);

    if (order.colorVariants && order.colorVariants.length > 0) {
      setColorVariants([...order.colorVariants]);
    } else {
      const colors = (order.color || 'Standart').split(/[,;\/]/).map(c => c.trim()).filter(Boolean);
      const initialVariants: OrderColorVariant[] = (colors.length > 0 ? colors : ['Standart']).map((cName, idx) => {
        const vSizes = idx === 0 ? (order.sizes ? { ...order.sizes } : {}) : {};
        const qTotal = Object.values(vSizes).reduce((a, b) => a + (b || 0), 0);
        return {
          color: cName,
          sizes: vSizes,
          qtyOrder: qTotal,
          qtyCut: 0,
          qtyPotok: 0,
          qtyPackaging: 0
        };
      });
      setColorVariants(initialVariants);
    }

    const initSizes = (saved: { [size: string]: number } | undefined, defaultValue: number = 0) => {
      const res: OrderSizes = {};
      sizeKeys.forEach(s => {
        res[s] = saved && saved[s] !== undefined ? saved[s] : defaultValue;
      });
      return res;
    };

    setRaskroy(initSizes(order.raskroySizes, 0));
    setRazdacha(initSizes(order.razdachaSizes, 0));
    setPoshiv(initSizes(order.poshivSizes, 0));
    setUpakovka(initSizes(order.upakovkaSizes, 0));
    setBrak(initSizes(order.brakSizes, 0));
    setBrakMixQty(order.qtyDefect || 0);
    setOtk(initSizes(order.otkSizes, 0));
    setOtkIsReady(order.otkIsReady || false);

    // Initialize sticker quantities list from packed sizes
    const initialStickers: { [size: string]: number } = {};
    sizeKeys.forEach(s => {
      const packed = order.upakovkaSizes && order.upakovkaSizes[s] !== undefined ? order.upakovkaSizes[s] : 0;
      initialStickers[s] = packed > 0 ? packed : 10;
    });
    setStickerQuantities(initialStickers);

    setUpakovkaType(order.upakovkaType || 'korobka');
    setUpakovkaPackage(order.upakovkaPackage || 'paket_standart');
    setUpakovkaTypeDetails(order.upakovkaTypeDetails || 'Standart guruhli');

    setPrintRequired(order.printRequired || false);
    setPrintName(order.printName || '');
    setPrintDetails(order.printDetails || '');
    setPrintStatus(order.printStatus || 'kutilmoqda');

    setVishivkaName(order.vishivkaName || '');
    setVishivkaDetails(order.vishivkaDetails || '');
    setVishivkaStatus(order.vishivkaStatus || 'yoq');

    setOtkStatus(order.otkStatus || 'tekshirilmoqda');
    setOtkConfirmedBy(order.otkConfirmedBy || '');
    setOtkConfirmedAt(order.otkConfirmedAt || '');
    setOtkSizeMDetails(order.otkSizeMDetails || '');

    setProjectOwnerName(order.projectOwnerName || order.customerName || '');
    setProjectOwnerPhone(order.projectOwnerPhone || order.customerPhone || '');
    setOneCOrderEmission(order.oneCOrderEmission || '');
  }, [order, isOpen]);

  if (!isOpen) return null;

  // Calculating overall sums based on current inputs
  const sumZakazSizes = Object.values(orderSizes).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
  const effectiveQtyOrder = sumZakazSizes > 0 ? sumZakazSizes : (order.qtyOrder || 0);

  const sumRaskroy = Object.values(raskroy).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
  const sumRazdacha = Object.values(razdacha).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
  const sumPoshiv = Object.values(poshiv).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
  const sumUpakovka = Object.values(upakovka).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number;
  const sumBrak = brakMixQty;
  const sumOtk = Object.values(otk).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number;

  // Dynamic Metrics
  const completionPercent = effectiveQtyOrder > 0 ? Math.min(100, Math.round((sumUpakovka / effectiveQtyOrder) * 100)) : 0;
  const defectPercent = effectiveQtyOrder > 0 ? ((sumBrak / effectiveQtyOrder) * 100).toFixed(1) : '0.0';
  const calculatedRemaining = Math.max(0, effectiveQtyOrder - sumUpakovka);

  // Translations
  const t = {
    uz: {
      title: 'БУЮРТМА ТАФСИЛОТЛАРИ ВА НАЗОРАТИ',
      model: 'Модель коди',
      brand: 'Бренд',
      color: 'Ранг',
      qtyOrder: 'Буюртма сони',
      qtyRemaining: 'Остаток (Қолдиқ)',
      closingRate: 'Заказ ёпилиш фоизи',
      defectRate: 'Брак фоизи',
      resetAll: 'Ҳамма маълумотни ноллаштириш (0)',
      saveBtn: 'Маълумотларни сақлаш',
      closeBtn: 'Ёпиш',
      sizes: 'Ўлчамлар',
      qty: 'Миқдор',
      sum: 'Жами',
      subtextReset: 'Тизим барча маълумотларни 0 га тушириб, фақат киритилган маълумотни қайта ҳисоблайди.',
      actions: 'Амаллар',
      
      // Tabs
      zakaz_razmer: 'Заказ сони (Размер бўйича)',
      raskroy: 'Раскрой (Бичув)',
      razdacha: 'Раздача',
      poshiv: 'Пошив (Поток)',
      upakovka: 'Упаковка (Қадоқ)',
      brak: 'Брак',
      stiker: 'Стикер & 1С (QR код)',
      otk: 'ОТК',
      print: 'Принт (Печат)',
      vishivka: 'Вышивка (Кашта)',
      vladelets: 'Лойиҳадош (Эга)',
      raznitsa: 'Разница (Таҳлил)',

      // Upakovka specific
      upakovkaType: 'Кор ёки Меш (Қути / Қоп)',
      upakovkaPackage: 'Пакет тури',
      upakovkaTypeDetails: 'Қадоқлаш тури (Тавсифи)',
      box: 'Коробка (Картон қути)',
      bag: 'Мешок (Полиэтилен қоп)',
      none: 'Мавжуд эмас',

      // Sticker specific
      printStickers: 'Стикер чоп этиш',
      selectSize: 'Ўлчамни танланг',
      printQty: 'Чоп этиладиган сони',
      stickerPreview: 'Стикер намунаси (Preview)',
      stickerSuccess: 'Стикерлар принтерга юборилди!',

      // OTK
      otkStatus: 'ОТК ҳолати',
      otkPassed: 'Соғлом миқдор (ОТКдан ўтди)',
      underInspection: 'Текширилмоқда',
      accepted: 'Қабул қилинди',
      rejected: 'Рад этилди',

      // Print & Embroidery
      required: 'Керакми / Борми?',
      details: 'Тафсилотлар',
      status: 'Ҳолат',
      status_kutilmoqda: 'Кутилмоқда',
      status_bajarilmoqda: 'Жараёнда',
      status_yakunlandi: 'Якунланди',
      status_yoq: 'Мавжуд эмас',

      // Project Owner
      ownerName: 'Лойиҳа раҳбари / Мижоз исми',
      ownerPhone: 'Телефон рақами',
      emission: '1С Эмиссия буюртма рақами'
    },
    ru: {
      title: 'ДЕТАЛИ И КОНТРОЛЬ ЗАКАЗА',
      model: 'Код модели',
      brand: 'Бренд',
      color: 'Цвет',
      qtyOrder: 'Количество заказа',
      qtyRemaining: 'Остаток',
      closingRate: '% Закрытия заказа',
      defectRate: '% Брака',
      resetAll: 'Сбросить все показатели в 0',
      saveBtn: 'Сохранить данные',
      closeBtn: 'Закрыть',
      sizes: 'Размеры',
      qty: 'Кол-во',
      sum: 'Итого',
      subtextReset: 'Система обнулит все данные и рассчитает показатели исключительно на основе введенных значений.',
      actions: 'Действия',
      
      // Tabs
      zakaz_razmer: 'Заказ (по размерам)',
      raskroy: 'Раскрой (Крой)',
      razdacha: 'Раздача',
      poshiv: 'Пошив (Поток)',
      upakovka: 'Упаковка',
      brak: 'Брак',
      stiker: 'Стикер & 1C (QR)',
      otk: 'ОТК',
      print: 'Принт',
      vishivka: 'Вышивка',
      vladelets: 'Владелец проекта',
      raznitsa: 'Разница (Анализ)',

      // Upakovka specific
      upakovkaType: 'Кор или Меш (Коробка/Мешок)',
      upakovkaPackage: 'Тип пакета',
      upakovkaTypeDetails: 'Тип упаковки (Детали)',
      box: 'Коробка',
      bag: 'Мешок / Меш',
      none: 'Нет упаковки',

      // Sticker specific
      printStickers: 'Печать стикеров',
      selectSize: 'Выберите размер',
      printQty: 'Кол-во для печати',
      stickerPreview: 'Предпросмотр стикера',
      stickerSuccess: 'Стикеры успешно отправлены на печать!',

      // OTK
      otkStatus: 'Статус ОТК',
      otkPassed: 'Прошло ОТК (Здоровое кол-во)',
      underInspection: 'Проверяется',
      accepted: 'Принято',
      rejected: 'Брак / Отклонено',

      // Print & Embroidery
      required: 'Требуется ли?',
      details: 'Детали / Описание',
      status: 'Статус',
      status_kutilmoqda: 'В ожидании',
      status_bajarilmoqda: 'В процессе',
      status_yakunlandi: 'Завершено',
      status_yoq: 'Отсутствует',

      // Project Owner
      ownerName: 'Руководитель проекта / ФИО Клиента',
      ownerPhone: 'Номер телефона',
      emission: '1C Номер заказа эмиссии'
    }
  };

  const curr = lang === 'uz' ? t.uz : t.ru;

  // Handle individual size changes
  const handleSizeChange = (
    stage: ActiveTab, 
    size: string, 
    value: string
  ) => {
    const numericVal = Math.max(0, parseInt(value) || 0);
    if (stage === 'raskroy') {
      setRaskroy(prev => ({ ...prev, [size]: numericVal }));
    } else if (stage === 'razdacha') {
      setRazdacha(prev => ({ ...prev, [size]: numericVal }));
    } else if (stage === 'poshiv') {
      setPoshiv(prev => ({ ...prev, [size]: numericVal }));
    } else if (stage === 'upakovka') {
      setUpakovka(prev => ({ ...prev, [size]: numericVal }));
    } else if (stage === 'brak') {
      setBrak(prev => ({ ...prev, [size]: numericVal }));
    } else if (stage === 'otk') {
      setOtk(prev => ({ ...prev, [size]: numericVal }));
    }
  };

  // Handle order sizes changes
  const handleOrderSizeChange = (size: string, value: string) => {
    const numericVal = Math.max(0, parseInt(value) || 0);
    setOrderSizes(prev => ({ ...prev, [size]: numericVal }));
  };

  const adjustOrderSize = (size: string, increment: boolean, step: number = 1) => {
    const currentVal = orderSizes[size] || 0;
    const newVal = Math.max(0, currentVal + (increment ? step : -step));
    setOrderSizes(prev => ({ ...prev, [size]: newVal }));
  };

  const handleCopyToCut = () => {
    setRaskroy({ ...orderSizes });
  };

  const handleClearOrderSizes = () => {
    setOrderSizes({});
  };

  // Set all current tab sizes to 0 or even all stages to 0
  const handleResetAllToZero = () => {
    const resetMap: OrderSizes = {};
    sizeKeys.forEach(s => { resetMap[s] = 0; });
    setOrderSizes({});
    setRaskroy(resetMap);
    setRazdacha(resetMap);
    setPoshiv(resetMap);
    setUpakovka(resetMap);
    setBrak(resetMap);
    setBrakMixQty(0);
    setOtk(resetMap);
    setOtkIsReady(false);
  };

  // Increment/Decrement helper
  const adjustValue = (stage: ActiveTab, size: string, increment: boolean) => {
    let currentMap: OrderSizes = {};
    let setter: React.Dispatch<React.SetStateAction<OrderSizes>> = () => {};

    if (stage === 'raskroy') { currentMap = raskroy; setter = setRaskroy; }
    else if (stage === 'razdacha') { currentMap = razdacha; setter = setRazdacha; }
    else if (stage === 'poshiv') { currentMap = poshiv; setter = setPoshiv; }
    else if (stage === 'upakovka') { currentMap = upakovka; setter = setUpakovka; }
    else if (stage === 'brak') { currentMap = brak; setter = setBrak; }
    else if (stage === 'otk') { currentMap = otk; setter = setOtk; }

    const currentVal = currentMap[size] || 0;
    const newVal = Math.max(0, currentVal + (increment ? 1 : -1));
    setter(prev => ({ ...prev, [size]: newVal }));
  };

  // Save changes
  const handleSaveAndSubmit = () => {
    let finalOrderSizes = Object.keys(orderSizes).length > 0 ? orderSizes : order.sizes;
    let finalColorString = order.color;

    if (colorVariants && colorVariants.length > 0) {
      finalColorString = colorVariants.map(v => v.color).join(', ');
      const variantSumSizes: OrderSizes = {};
      colorVariants.forEach(v => {
        Object.entries(v.sizes || {}).forEach(([sz, q]) => {
          variantSumSizes[sz] = (variantSumSizes[sz] || 0) + (Number(q) || 0);
        });
      });
      if (Object.keys(variantSumSizes).length > 0) {
        finalOrderSizes = variantSumSizes;
      }
    }

    const updatedOrder: Order = {
      ...order,
      color: finalColorString,
      colorVariants: colorVariants,
      sizes: finalOrderSizes,
      qtyOrder: effectiveQtyOrder,
      qtyCut: sumRaskroy,
      qtyPotok: sumRazdacha,
      qtyPackaging: sumUpakovka,
      qtyDefect: sumBrak,
      qtyRemaining: calculatedRemaining,
      
      // Detailed metrics
      raskroySizes: raskroy,
      razdachaSizes: razdacha,
      poshivSizes: poshiv,
      upakovkaSizes: upakovka,
      brakSizes: brak,
      otkSizes: otk,
      otkIsReady,

      // Settings
      upakovkaType,
      upakovkaPackage,
      upakovkaTypeDetails,

      printRequired,
      printName: printName.trim(),
      printDetails,
      printStatus: printStatus as any,

      vishivkaName: vishivkaName.trim(),
      vishivkaDetails,
      vishivkaStatus,

      otkStatus,
      otkConfirmedBy: otkConfirmedBy.trim(),
      otkConfirmedAt: otkConfirmedAt.trim(),
      otkSizeMDetails: otkSizeMDetails.trim(),

      projectOwnerName,
      projectOwnerPhone,
      oneCOrderEmission: oneCOrderEmission.trim(),
      issues: orderIssues
    };

    onUpdateOrder(updatedOrder);
    onClose();
  };

  // Resizable Modal State
  const [modalSize, setModalSize] = useState<{ width: number; height: number }>({ width: 1024, height: 750 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<'se' | 'e' | 's' | null>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const startPosRef = React.useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 1024, h: 750 });

  const handleMouseDownResize = (e: React.MouseEvent, dir: 'se' | 'e' | 's') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDir(dir);
    const w = modalRef.current ? modalRef.current.offsetWidth : modalSize.width;
    const h = modalRef.current ? modalRef.current.offsetHeight : modalSize.height;
    startPosRef.current = { x: e.clientX, y: e.clientY, w, h };
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 32;
      setModalSize(prev => {
        let newW = prev.width;
        let newH = prev.height;
        if (resizeDir === 'se' || resizeDir === 'e') {
          newW = Math.max(480, Math.min(maxW, startPosRef.current.w + dx));
        }
        if (resizeDir === 'se' || resizeDir === 's') {
          newH = Math.max(400, Math.min(maxH, startPosRef.current.h + dy));
        }
        return { width: newW, height: newH };
      });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDir(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDir]);

  // Sticker simulation trigger
  const triggerStickerPrint = (size: string, qty: number) => {
    setSelectedSizeForSticker(size);
    setStickerPrintQty(qty);
    setShowStickerPrintSuccess(true);
    setTimeout(() => {
      setShowStickerPrintSuccess(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-auto" id="order-details-advanced-modal">
      <div 
        ref={modalRef}
        style={
          isMaximized 
            ? { width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', borderRadius: 0 } 
            : { width: `${modalSize.width}px`, height: `${modalSize.height}px`, maxWidth: '98vw', maxHeight: '96vh' }
        }
        className="bg-[#0b0f19] border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200 relative transition-all duration-75"
      >
        
        {/* Header Block with Quick Meta */}
        <div className="p-4 sm:p-6 bg-slate-900/60 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-indigo-400 uppercase bg-indigo-950/50 px-2.5 py-0.5 rounded border border-indigo-900/30">
                {order.mosCode}
              </span>
              {oneCOrderEmission && (
                <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/50 px-2.5 py-0.5 rounded border border-emerald-900/30">
                  1C: {oneCOrderEmission}
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>{order.brandName}</span>
              <span className="text-slate-500 font-normal">|</span>
              <span className="text-sky-400 text-sm font-semibold">{order.modelCode}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleResetAllToZero}
              className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-extrabold text-xs px-3.5 py-2 rounded-xl border border-rose-900/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={curr.subtextReset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {curr.resetAll}
            </button>

            <button 
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-colors cursor-pointer"
              title={isMaximized ? "Restore size" : "Maximize window"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button 
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Metrics Bar (Exact user metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5 p-3 sm:p-4 bg-slate-950/50 border-b border-slate-800 text-center font-black">
          {/* 1. Buyurtma */}
          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-[9px] text-slate-500 block uppercase tracking-wider truncate">{curr.qtyOrder}</span>
            <span className="text-xs sm:text-sm text-amber-400 font-extrabold block truncate">{effectiveQtyOrder.toLocaleString()}</span>
          </div>

          {/* 2. Kroy (Cut) */}
          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-[9px] text-slate-400 block uppercase tracking-wider truncate">{lang === 'uz' ? 'Kesim' : 'КРОЙ'}</span>
            <span className="text-xs sm:text-sm text-slate-200 block truncate">{sumRaskroy.toLocaleString()}</span>
          </div>

          {/* 3. Razdacha */}
          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-[9px] text-emerald-500 block uppercase tracking-wider truncate">{lang === 'uz' ? 'Razdacha' : 'РАЗДАЧА'}</span>
            <span className="text-xs sm:text-sm text-emerald-400 block truncate">{sumRazdacha.toLocaleString()}</span>
          </div>

          {/* 4. Poshiv (Potok) */}
          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-[9px] text-cyan-400 block uppercase tracking-wider truncate">{lang === 'uz' ? 'Poshiv' : 'ПОШИВ'}</span>
            <span className="text-xs sm:text-sm text-cyan-400 block truncate">{sumPoshiv.toLocaleString()}</span>
          </div>

          {/* 5. Upakovka */}
          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-[9px] text-indigo-400 block uppercase tracking-wider truncate">{lang === 'uz' ? 'Upakovka' : 'УПАКОВКА'}</span>
            <span className="text-xs sm:text-sm text-indigo-300 block truncate">{sumUpakovka.toLocaleString()}</span>
          </div>

          {/* 6. Brak */}
          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-[9px] text-rose-500 block uppercase tracking-wider truncate">{lang === 'uz' ? 'Brak' : 'БРАК'}</span>
            <span className={`text-xs sm:text-sm block truncate ${sumBrak > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>{sumBrak.toLocaleString()}</span>
          </div>

          {/* 7. Berkilish % */}
          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-[9px] text-amber-500 block uppercase tracking-wider truncate">{curr.closingRate}</span>
            <span className="text-xs sm:text-sm text-amber-400 block truncate">{completionPercent}%</span>
          </div>

          {/* 8. Ostatok */}
          <div className="bg-slate-900/40 p-2 sm:p-2.5 rounded-xl border border-slate-800/60 min-w-0">
            <span className="text-[9px] text-sky-400 block uppercase tracking-wider truncate">{curr.qtyRemaining}</span>
            <span className="text-xs sm:text-sm text-sky-400 block truncate">{calculatedRemaining.toLocaleString()}</span>
          </div>
        </div>

        {/* Main Body - Tab Sidebar and Content Grid */}
        <div className="flex flex-1 overflow-hidden min-h-[350px]">
          
          {/* Left Navigation Sidebar */}
          <div className="w-48 sm:w-56 md:w-60 shrink-0 bg-slate-950/40 border-r border-slate-800 overflow-y-auto p-2 sm:p-3 space-y-1">
            <div className="text-[10px] text-slate-500 font-extrabold px-2.5 py-1 uppercase tracking-widest truncate">{lang === 'uz' ? 'MENYULAR' : 'МЕНЮ'}</div>
            
            <button
              onClick={() => setActiveTab('zakaz_razmer')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'zakaz_razmer' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black' : 'text-amber-400 hover:bg-slate-900 hover:text-amber-300'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.zakaz_razmer}</span>
            </button>

            <button
              onClick={() => setActiveTab('raskroy')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'raskroy' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.raskroy}</span>
            </button>

            <button
              onClick={() => setActiveTab('razdacha')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'razdacha' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.razdacha}</span>
            </button>

            <button
              onClick={() => setActiveTab('poshiv')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'poshiv' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <LayersIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.poshiv}</span>
            </button>

            <button
              onClick={() => setActiveTab('upakovka')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'upakovka' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.upakovka}</span>
            </button>

            <button
              onClick={() => setActiveTab('brak')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'brak' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.brak}</span>
            </button>

            <button
              onClick={() => setActiveTab('stiker')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'stiker' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.stiker}</span>
            </button>

            <button
              onClick={() => setActiveTab('otk')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'otk' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.otk}</span>
            </button>

            <button
              onClick={() => setActiveTab('print')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'print' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.print}</span>
            </button>

            <button
              onClick={() => setActiveTab('vishivka')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'vishivka' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.vishivka}</span>
            </button>

            <button
              onClick={() => setActiveTab('vladelets')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'vladelets' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.vladelets}</span>
            </button>

            <button
              onClick={() => setActiveTab('raznitsa')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'raznitsa' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{curr.raznitsa}</span>
            </button>

            <button
              onClick={() => setActiveTab('muammolar')}
              className={`w-full text-left px-2.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                activeTab === 'muammolar' ? 'bg-rose-600 text-white shadow-lg font-black' : 'text-rose-400 hover:bg-slate-900 hover:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{lang === 'uz' ? 'Muammolar & Rasm' : 'Проблемы & Чат'}</span>
              </div>
              {orderIssues.length > 0 && (
                <span className="bg-rose-500/30 text-rose-200 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full border border-rose-500/40 shrink-0">
                  {orderIssues.length}
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-[#0c1220] p-6 overflow-y-auto">
            
            {/* 0. ZAKAZ RAZMER TAB (Horizontal Per-Color Table) */}
            {activeTab === 'zakaz_razmer' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-amber-400" />
                      {curr.zakaz_razmer}
                    </h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {lang === 'uz' ? 'Буюртмадаги ҳар бир ранг ва ўлчамлар миқдорини горизонтал жадвалда киритиш' : 'Ввод количества заказа по цветам и размерам в горизонтальной таблице'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImportStageModal('zakaz')}
                      className="bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{lang === 'uz' ? 'Excel Import' : 'Импорт из Excel'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyToCut}
                      className="bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 text-indigo-300 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      title={lang === 'uz' ? 'Кесим (Крой) бўлимига нусхалаш' : 'Скопировать в Крой'}
                    >
                      <Scissors className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{lang === 'uz' ? 'Кройга нусхалаш' : 'Скопировать в Крой'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddEmptyColorVariant}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'uz' ? 'Янги ранг қўшиш' : 'Добавить цвет'}</span>
                    </button>
                  </div>
                </div>

                {/* Size Category Selector */}
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-400 px-2">{lang === 'uz' ? 'Ўлчам тоифаси:' : 'Категория размеров:'}</span>
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1">
                    <button 
                      type="button"
                      onClick={() => setActiveOrderSizeCategory('adult')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${activeOrderSizeCategory === 'adult' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      {lang === 'uz' ? 'Катталар (XS-16XL)' : 'Взрослые (XS-16XL)'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveOrderSizeCategory('kids1')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${activeOrderSizeCategory === 'kids1' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      {lang === 'uz' ? 'Болалар (116-164)' : 'Дети (116-164)'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveOrderSizeCategory('kids2')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${activeOrderSizeCategory === 'kids2' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      {lang === 'uz' ? 'Болалар (24-42)' : 'Дети (24-42)'}
                    </button>
                  </div>
                </div>

                {/* Horizontal Per-Color Table */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
                  {(() => {
                    const currentCategorySizes = activeOrderSizeCategory === 'adult' 
                      ? ADULT_SIZES.slice(0, 14) 
                      : activeOrderSizeCategory === 'kids1' 
                        ? KIDS_SIZES_1 
                        : KIDS_SIZES_2;

                    return (
                      <table className="w-full text-xs text-center border-collapse">
                        <thead>
                          <tr className="bg-slate-900/90 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                            <th className="p-3 text-left w-40 min-w-[150px]">{lang === 'uz' ? 'Ранг (Цвет)' : 'Цвет'}</th>
                            {currentCategorySizes.map(sz => (
                              <th key={sz} className="p-2 min-w-[50px] font-mono text-amber-400 text-xs">{sz}</th>
                            ))}
                            <th className="p-3 min-w-[80px] text-amber-300">{lang === 'uz' ? 'Жами' : 'Итого'}</th>
                            <th className="p-3 w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {colorVariants.map((variant, vIdx) => {
                            const rowSum = currentCategorySizes.reduce((sum, sz) => sum + (Number(variant.sizes?.[sz]) || 0), 0);

                            return (
                              <tr key={vIdx} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-2 text-left">
                                  <input
                                    type="text"
                                    value={variant.color}
                                    onChange={(e) => handleUpdateColorName(vIdx, e.target.value)}
                                    placeholder={lang === 'uz' ? 'Ранг номи' : 'Название цвета'}
                                    className="w-full bg-slate-900 border border-slate-700 text-white font-extrabold px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-amber-400"
                                  />
                                </td>

                                {currentCategorySizes.map((sz, colIdx) => (
                                  <td key={sz} className="p-1">
                                    <input
                                      type="number"
                                      min="0"
                                      data-grid="zakaz-grid"
                                      data-row={vIdx}
                                      data-col={colIdx}
                                      value={variant.sizes?.[sz] !== undefined && variant.sizes[sz] > 0 ? variant.sizes[sz] : ''}
                                      placeholder="0"
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => handleExcelKeyDown(e, vIdx, colIdx, colorVariants.length, currentCategorySizes.length, 'zakaz-grid')}
                                      onPaste={(e) => handleExcelPaste(e, vIdx, colIdx, currentCategorySizes, (rIdx, szKey, val) => handleColorVariantQtyChange(rIdx, szKey, val))}
                                      onChange={(e) => handleColorVariantQtyChange(vIdx, sz, parseInt(e.target.value) || 0)}
                                      className="w-full text-center bg-slate-900 border border-slate-700/80 text-amber-400 font-mono font-bold text-xs py-1.5 rounded-md outline-none focus:border-2 focus:border-amber-400 focus:bg-slate-850 transition-all shadow-inner"
                                    />
                                  </td>
                                ))}

                                <td className="p-2 font-mono font-extrabold text-amber-400 text-sm">
                                  {rowSum.toLocaleString()}
                                </td>

                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteColorVariant(vIdx)}
                                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                                    title={lang === 'uz' ? 'Рангни ўчириш' : 'Удалить цвет'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Column Totals Row */}
                          <tr className="bg-slate-900 font-extrabold text-white border-t-2 border-slate-700">
                            <td className="p-3 text-left uppercase text-amber-400 text-xs">
                              {lang === 'uz' ? 'ЖАМИ (ИТОГО)' : 'ИТОГО'}
                            </td>

                            {currentCategorySizes.map(sz => {
                              const colSum = colorVariants.reduce((sum, v) => sum + (Number(v.sizes?.[sz]) || 0), 0);
                              return (
                                <td key={sz} className="p-2 font-mono text-amber-300 text-xs font-black">
                                  {colSum > 0 ? colSum.toLocaleString() : '-'}
                                </td>
                              );
                            })}

                            <td className="p-3 font-mono text-amber-400 text-base font-black">
                              {colorVariants.reduce((sum, v) => {
                                return sum + Object.values(v.sizes || {}).reduce<number>((a, b) => a + (Number(b) || 0), 0);
                              }, 0).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  <span>
                    {lang === 'uz' ? 'Ҳар бир ранг ва ўлчам алоҳида сақланади ҳамда барча бўлимларда мос тушади.' : 'Каждый цвет и размер сохраняются отдельно и синхронизируются по всем разделам.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEmptyColorVariant}
                    className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold text-xs px-3 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'uz' ? 'Яна ранг қўшиш' : 'Еще цвет'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 1. RASKROY TAB */}
            {activeTab === 'raskroy' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-indigo-400" />
                      {curr.raskroy}
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? 'Бичилган андозалар миқдори' : 'Количество раскроенных деталей'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportStageModal('raskroy')}
                    className="bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'uz' ? 'Excel Import' : 'Импорт из Excel'}</span>
                  </button>
                </div>

                <HorizontalExcelStageGrid
                  gridId="raskroy-grid"
                  sizeKeys={sizeKeys}
                  refLabel={lang === 'uz' ? 'Буюртма (Заказ)' : 'Заказ'}
                  refValues={order.sizes || {}}
                  refTotal={order.qtyOrder || 0}
                  inputLabel={curr.raskroy}
                  inputValues={raskroy}
                  inputTotal={sumRaskroy}
                  onValueChange={(sz, val) => handleSizeChange('raskroy', sz, val.toString())}
                  inputColorClass="text-indigo-400"
                  lang={lang}
                />
              </div>
            )}

            {/* 2. RAZDACHA TAB */}
            {activeTab === 'razdacha' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-400" />
                      {curr.razdacha}
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? 'Tikuvchilarga tarqatilgan andozalar' : 'Количество распределенных кроев'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportStageModal('razdacha')}
                    className="bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'uz' ? 'Excel Import' : 'Импорт из Excel'}</span>
                  </button>
                </div>

                <HorizontalExcelStageGrid
                  gridId="razdacha-grid"
                  sizeKeys={sizeKeys}
                  refLabel={lang === 'uz' ? 'Кройда (Раскрой)' : 'В Крое'}
                  refValues={raskroy}
                  refTotal={sumRaskroy}
                  inputLabel={curr.razdacha}
                  inputValues={razdacha}
                  inputTotal={sumRazdacha}
                  onValueChange={(sz, val) => handleSizeChange('razdacha', sz, val.toString())}
                  inputColorClass="text-emerald-400"
                  lang={lang}
                />
              </div>
            )}

            {/* 3. POSHIV TAB */}
            {activeTab === 'poshiv' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <LayersIcon className="w-4 h-4 text-cyan-400" />
                    {curr.poshiv}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? 'Tikuv jarayonidan o\'tgan tayyor kiyimlar' : 'Количество пошитых изделий в потоке'}</p>
                </div>

                <HorizontalExcelStageGrid
                  gridId="poshiv-grid"
                  sizeKeys={sizeKeys}
                  refLabel={lang === 'uz' ? 'Тарқатилган (Раздача)' : 'Раздача'}
                  refValues={razdacha}
                  refTotal={sumRazdacha}
                  inputLabel={curr.poshiv}
                  inputValues={poshiv}
                  inputTotal={sumPoshiv}
                  onValueChange={(sz, val) => handleSizeChange('poshiv', sz, val.toString())}
                  inputColorClass="text-cyan-400"
                  lang={lang}
                />
              </div>
            )}

            {/* 4. UPAKOVKA TAB */}
            {activeTab === 'upakovka' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Archive className="w-4 h-4 text-indigo-400" />
                      {curr.upakovka}
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? 'Qadoqlangan mahsulotlarni har bir o\'lcham bo\'yicha (korobka, meshok, paket) qo\'lda kiritish' : 'Учет упаковки готовых изделий вручную по размерам (коробка, мешок, пакет)'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportStageModal('upakovka')}
                    className="bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'uz' ? 'Excel Import' : 'Импорт из Excel'}</span>
                  </button>
                </div>

                {/* Packaging details settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {lang === 'uz' ? 'Korobka o\'lchami (Box dimensions)' : 'Размер коробки'}
                    </label>
                    <input 
                      type="text"
                      placeholder={lang === 'uz' ? "Masalan: 60x40x40 cm" : "Например: 60x40x40 см"}
                      value={upakovkaTypeDetails}
                      onChange={(e) => setUpakovkaTypeDetails(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {lang === 'uz' ? 'Paket o\'lchami (Packet dimensions)' : 'Размер пакета'}
                    </label>
                    <input 
                      type="text"
                      placeholder={lang === 'uz' ? "Masalan: 30x40 cm" : "Например: 30x40 см"}
                      value={upakovkaPackage}
                      onChange={(e) => setUpakovkaPackage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <HorizontalExcelStageGrid
                  gridId="upakovka-grid"
                  sizeKeys={sizeKeys}
                  refLabel={lang === 'uz' ? 'Пошивда (Пошито)' : 'Пошито'}
                  refValues={poshiv}
                  refTotal={sumPoshiv}
                  inputLabel={curr.upakovka}
                  inputValues={upakovka}
                  inputTotal={sumUpakovka}
                  onValueChange={(sz, val) => setUpakovka(prev => ({ ...prev, [sz]: val }))}
                  inputColorClass="text-indigo-300"
                  lang={lang}
                />
              </div>
            )}

            {/* 5. BRAK TAB */}
            {activeTab === 'brak' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    {curr.brak}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? "Umumiy yaroqsiz (brak) mahsulotlar sonini kiriting (o'lchamsiz / mix holda)" : 'Введите общее количество бракованных изделий (вразнобой, без деления по размерам)'}</p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">{lang === 'uz' ? "Umumiy brak soni" : "Общее кол-vo брака (MIX)"}</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        value={brakMixQty}
                        onChange={(e) => setBrakMixQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-40 px-4 py-3 bg-slate-900 border border-slate-700 text-lg text-white font-mono rounded-xl focus:border-indigo-500 focus:outline-hidden"
                      />
                      <div className="inline-flex space-x-1.5">
                        <button onClick={() => setBrakMixQty(prev => Math.max(0, prev - 1))} className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"><Minus className="w-4 h-4 text-slate-400" /></button>
                        <button onClick={() => setBrakMixQty(prev => prev + 1)} className="p-2.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/30 rounded-xl cursor-pointer"><Plus className="w-4 h-4 text-rose-400" /></button>
                        <button onClick={() => setBrakMixQty(0)} className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-rose-400 font-bold cursor-pointer">{lang === 'uz' ? 'Tozalash' : 'Очистить'}</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="text-xs text-rose-300">
                    <span className="font-bold">{lang === 'uz' ? 'Brak darajasi:' : 'Уровень брака:'}</span> {defectPercent}% {lang === 'uz' ? 'umumiy buyurtma hajmidan' : 'от общего объема заказа'}.
                  </div>
                </div>
              </div>
            )}

            {/* 6. STIKER & 1C TAB */}
            {activeTab === 'stiker' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    {curr.stiker}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? '1C shtrix-kod, artikul tekshirish va QR kodli stiker tizimi' : 'Печать стикеров 1С, проверка штрих-кодов и артикулов'}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  
                  {/* Sticker controls */}
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-xs text-white uppercase tracking-wider">{curr.printStickers}</h5>
                        <button
                          onClick={() => {
                            sizeKeys.forEach(s => {
                              const qty = stickerQuantities[s] || 0;
                              if (qty > 0) {
                                // print!
                              }
                            });
                            setShowStickerPrintSuccess(true);
                            setTimeout(() => setShowStickerPrintSuccess(false), 4000);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          {lang === 'uz' ? "Barchasini Chop Etish" : "Печать всех"}
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-extrabold uppercase">
                              <th className="pb-2 text-center">{curr.sizes}</th>
                              <th className="pb-2 text-center">{lang === 'uz' ? 'Qadoq' : 'Упак.'}</th>
                              <th className="pb-2 text-center">{lang === 'uz' ? 'Soni' : 'Кол-vo'}</th>
                              <th className="pb-2 text-right">{curr.actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {sizeKeys.map(size => {
                              const packed = upakovka[size] || 0;
                              return (
                                <tr key={size} className="hover:bg-slate-900/30">
                                  <td className="py-2 font-bold font-mono text-center text-white">{size}</td>
                                  <td className="py-2 font-mono text-center text-slate-500">{packed}</td>
                                  <td className="py-2 text-center">
                                    <input 
                                      type="number"
                                      value={stickerQuantities[size] !== undefined ? stickerQuantities[size] : 10}
                                      onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                        setStickerQuantities(prev => ({ ...prev, [size]: val }));
                                      }}
                                      className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-800 text-center text-white font-mono rounded focus:border-indigo-500 focus:outline-hidden"
                                    />
                                  </td>
                                  <td className="py-2 text-right">
                                    <button 
                                      onClick={() => triggerStickerPrint(size, stickerQuantities[size] || 10)}
                                      className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900/30 rounded font-bold text-[10px] cursor-pointer transition-colors"
                                      title={lang === 'uz' ? "Stiker chop etish" : "Печать стикера"}
                                    >
                                      {lang === 'uz' ? "Chop" : "Печать"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {showStickerPrintSuccess && (
                        <div className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>{curr.stickerSuccess} (Size: {selectedSizeForSticker}, Qty: {stickerPrintQty})</span>
                        </div>
                      )}
                    </div>

                    {/* Virtual Sticker Layout Preview */}
                    <div className="bg-white text-slate-900 p-5 rounded-2xl border-2 border-dashed border-slate-300 shadow-lg font-mono flex flex-col justify-between max-w-[320px] mx-auto min-h-[260px]">
                      <div className="border-b pb-2 border-slate-200">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase">
                          <span>STARK COTTON ERP</span>
                          <span>1C: {oneCOrderEmission || 'EM-4790'}</span>
                        </div>
                        <h4 className="text-sm font-black tracking-tight text-slate-900 mt-1">{order.brandName}</h4>
                      </div>

                      <div className="space-y-1.5 py-4 text-[11px]">
                        <div><strong className="text-slate-500 uppercase text-[9px] block">MOS CODE:</strong> <span className="font-bold text-slate-900">{order.mosCode}</span></div>
                        <div><strong className="text-slate-500 uppercase text-[9px] block">MODEL:</strong> <span className="font-semibold text-slate-800">{order.modelCode}</span></div>
                        <div className="flex justify-between">
                          <div><strong className="text-slate-500 uppercase text-[9px] block">SIZE:</strong> <span className="font-extrabold text-xs text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">{selectedSizeForSticker}</span></div>
                          <div><strong className="text-slate-500 uppercase text-[9px] block">COLOR:</strong> <span className="font-bold text-slate-800">{order.color.split(' ')[0]}</span></div>
                          <div><strong className="text-slate-500 uppercase text-[9px] block">QTY:</strong> <span className="font-bold text-slate-800">{stickerPrintQty} {lang === 'uz' ? 'dona' : 'шт'}</span></div>
                        </div>
                      </div>

                      {/* QR Code Graphic Mockup */}
                      <div className="border-t pt-3 border-slate-200 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[7px] text-slate-400 block font-bold">1C BARCODE</span>
                          <div className="flex space-x-0.5 h-6 items-center">
                            <span className="bg-slate-950 w-1 h-full"></span>
                            <span className="bg-slate-950 w-0.5 h-full"></span>
                            <span className="bg-slate-950 w-1.5 h-full"></span>
                            <span className="bg-slate-950 w-0.5 h-full"></span>
                            <span className="bg-slate-950 w-1 h-full"></span>
                            <span className="bg-slate-950 w-2 h-full"></span>
                            <span className="bg-slate-950 w-0.5 h-full"></span>
                            <span className="bg-slate-950 w-1 h-full"></span>
                          </div>
                          <span className="text-[8px] font-bold text-slate-600 block tracking-widest">1C*{order.mosCode.replace(/ /g, '')}*</span>
                        </div>

                        {/* Mock dynamic QR SVG */}
                        <div className="w-12 h-12 bg-slate-100 p-1 rounded-sm border flex items-center justify-center shrink-0">
                          <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                            <rect width="100" height="100" fill="none" />
                            <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                            <rect x="5" y="5" width="20" height="20" fill="white" />
                            <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                            <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                            <rect x="75" y="5" width="20" height="20" fill="white" />
                            <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                            <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                            <rect x="5" y="75" width="20" height="20" fill="white" />
                            <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                            <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                            <rect x="80" y="80" width="20" height="20" fill="currentColor" />
                            <rect x="45" y="15" width="10" height="15" fill="currentColor" />
                            <rect x="15" y="45" width="15" height="10" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1C Barcode Verification Area */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h5 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      {lang === 'uz' ? '1C BARCODE VA ARTIKUL TEKSHIRUVI (VERIFIER)' : 'ПРОВЕРКА ШТРИХ-КОДОВ И АРТИКУЛОВ 1С'}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'uz' 
                        ? "Stikerdagi shtrix-kod va artikullarni 1C ma'lumotlar bazasiga solishtirib to'g'riligini tekshiring." 
                        : "Сравните штрих-коды и артикулы на этикетках с базой данных 1С для проверки на корректность."}
                    </p>

                    {/* Article Verifier */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-2.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'uz' ? 'Artikul Tekshirish (1C 30 ta artikul)' : 'Проверить артикул (30 артикулов 1С)'}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Masalan: ART-005"
                          value={testArticleInput}
                          onChange={(e) => {
                            setTestArticleInput(e.target.value);
                            setTestArticleResult('idle');
                          }}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                        <button 
                          onClick={() => {
                            const isCorrect = Array.from({ length: 30 }, (_, i) => `ART-${(i + 1).toString().padStart(3, '0')}`).includes(testArticleInput.trim().toUpperCase());
                            setTestArticleResult(isCorrect ? 'correct' : 'incorrect');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                        >
                          {lang === 'uz' ? 'Solishtirish' : 'Проверить'}
                        </button>
                      </div>

                      {/* Display article result */}
                      {testArticleResult !== 'idle' && (
                        <div className={`text-xs font-bold p-2.5 rounded-lg flex items-center gap-2 ${
                          testArticleResult === 'correct' ? 'bg-emerald-950/40 border border-emerald-900/30 text-emerald-400' : 'bg-rose-950/40 border border-rose-900/30 text-rose-400'
                        }`}>
                          {testArticleResult === 'correct' ? (
                            <>
                              <span className="inline-block bg-emerald-500 text-slate-950 font-black rounded-full text-[9px] w-4 h-4 text-center leading-4">✓</span>
                              <span>{lang === 'uz' ? "TO'G'RI: Artikul 1C bazasida tasdiqlandi!" : 'ВЕРНО: Артикул подтвержден в 1С!'}</span>
                            </>
                          ) : (
                            <>
                              <span className="inline-block bg-rose-500 text-slate-950 font-black rounded-full text-[9px] w-4 h-4 text-center leading-4">✗</span>
                              <span>{lang === 'uz' ? "XATO! Artikul 1C bazasida topilmadi!" : 'ОШИБКА! Артикул не найден в базе 1С!'}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Barcode Verifier */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-2.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'uz' ? 'Shtrix-Kod Tekshirish (1C 200 ta shtrix-kod)' : 'Проверить штрих-код (200 штрих-кодов 1С)'}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Masalan: BC-100015"
                          value={testBarcodeInput}
                          onChange={(e) => {
                            setTestBarcodeInput(e.target.value);
                            setTestBarcodeResult('idle');
                          }}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                        <button 
                          onClick={() => {
                            const isCorrect = Array.from({ length: 200 }, (_, i) => `BC-${(100000 + i).toString()}`).includes(testBarcodeInput.trim().toUpperCase());
                            setTestBarcodeResult(isCorrect ? 'correct' : 'incorrect');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                        >
                          {lang === 'uz' ? 'Solishtirish' : 'Проверить'}
                        </button>
                      </div>

                      {/* Display barcode result */}
                      {testBarcodeResult !== 'idle' && (
                        <div className={`text-xs font-bold p-2.5 rounded-lg flex items-center gap-2 ${
                          testBarcodeResult === 'correct' ? 'bg-emerald-950/40 border border-emerald-900/30 text-emerald-400' : 'bg-rose-950/40 border border-rose-900/30 text-rose-400'
                        }`}>
                          {testBarcodeResult === 'correct' ? (
                            <>
                              <span className="inline-block bg-emerald-500 text-slate-950 font-black rounded-full text-[9px] w-4 h-4 text-center leading-4">✓</span>
                              <span>{lang === 'uz' ? "TO'G'RI: Shtrix-kod 1C stikeri bilan to'liq mos keldi!" : 'ВЕРНО: Штрих-код полностью совпал со стикером 1С!'}</span>
                            </>
                          ) : (
                            <>
                              <span className="inline-block bg-rose-500 text-slate-950 font-black rounded-full text-[9px] w-4 h-4 text-center leading-4">✗</span>
                              <span>{lang === 'uz' ? "XATO! Shtrix-kod stikeri xato yoki 1C da ro'yxatda yo'q!" : 'ОШИБКА! Неверный код либо отсутствует в 1С!'}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sample tester helpers */}
                    <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-900/30 space-y-1.5">
                      <span className="block text-[9px] font-black uppercase text-indigo-400 tracking-widest">{lang === 'uz' ? 'TEST LOBBY (NAMUNAVIY KODLAR)' : 'ТЕСТОВЫЕ КОДЫ ДЛЯ ПРОВЕРКИ'}</span>
                      <div className="text-[10px] text-slate-300 space-y-1">
                        <div>• {lang === 'uz' ? 'Tasdiqlangan Artikul namunalari:' : 'Примеры верных артикулов:'} <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 font-mono">ART-001</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 font-mono">ART-015</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 font-mono">ART-030</code></div>
                        <div>• {lang === 'uz' ? 'Shtrix-kod namunalari (BC-100000 dan BC-100199 gacha):' : 'Примеры верных штрих-кодов (от BC-100000 до BC-100199):'} <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono">BC-100000</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono">BC-100100</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono">BC-100199</code></div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* 7. OTK TAB */}
            {activeTab === 'otk' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      {curr.otk}
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? 'Texnik nazorat bo\'limidan o\'tgan mahsulotlar' : 'Контроль качества отдела ОТК по размерам'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">{curr.otkStatus}:</span>
                    <select
                      value={otkStatus}
                      onChange={(e) => setOtkStatus(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
                    >
                      <option value="tekshirilmoqda">{curr.underInspection}</option>
                      <option value="tayyor">{curr.accepted}</option>
                      <option value="brak">{curr.rejected}</option>
                    </select>
                  </div>
                </div>

                {/* OTK Shipment Readiness Indicator */}
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <input 
                    type="checkbox"
                    id="otkIsReady"
                    checked={otkIsReady}
                    onChange={(e) => setOtkIsReady(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="otkIsReady" className="text-sm font-black text-white cursor-pointer block">
                      {lang === 'uz' ? 'YUKLASHGA TAYYOR (OTK ruxsati)' : 'ГОТОВ К ОТГРУЗКЕ (Разрешение ОТК)'}
                    </label>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {lang === 'uz' 
                        ? 'Ushbu buyurtma barcha bosqichlardan muvaffaqiyatli o\'tdi va mijozga yuklab yuborishga tayyor.' 
                        : 'Этот заказ успешно прошел все этапы контроля и готов к передаче клиенту.'}
                    </span>
                  </div>
                </div>

                {/* OTK Confirmation & Details fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {lang === 'uz' ? 'Tasdiqlovchi shaxs (Kim yuklashni tasdiqladi)' : 'Кто подтвердил отгрузку'}
                    </label>
                    <input 
                      type="text"
                      placeholder={lang === 'uz' ? "Ism sharif" : "ФИО сотрудника"}
                      value={otkConfirmedBy}
                      onChange={(e) => setOtkConfirmedBy(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {lang === 'uz' ? 'Tasdiqlash sanasi' : 'Дата подтверждения'}
                    </label>
                    <input 
                      type="text"
                      placeholder={lang === 'uz' ? "Masalan: 2026-07-21" : "Например: 2026-07-21"}
                      value={otkConfirmedAt}
                      onChange={(e) => setOtkConfirmedAt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {lang === 'uz' ? 'Tekshirilgan jami ish' : 'Всего проверено изделий'}
                    </label>
                    <div className="px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-indigo-400 font-black font-mono flex items-center justify-between">
                      <span>{sumOtk} dona</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{lang === 'uz' ? 'HISOBLANDI' : 'РАССЧИТАНО'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {lang === 'uz' ? 'M o\'lcham ma\'lumotlari' : 'Данные по размеру M'}
                    </label>
                    <input 
                      type="text"
                      placeholder={lang === 'uz' ? "Masalan: M razmer sog'lom" : "Например: размер М в порядке"}
                      value={otkSizeMDetails}
                      onChange={(e) => setOtkSizeMDetails(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <HorizontalExcelStageGrid
                  gridId="otk-grid"
                  sizeKeys={sizeKeys}
                  refLabel={lang === 'uz' ? 'Қадоқланган (Упаковано)' : 'Упаковано'}
                  refValues={upakovka}
                  refTotal={sumUpakovka}
                  inputLabel={curr.otkPassed}
                  inputValues={otk}
                  inputTotal={sumOtk}
                  onValueChange={(sz, val) => handleSizeChange('otk', sz, val.toString())}
                  inputColorClass="text-emerald-400"
                  lang={lang}
                />
              </div>
            )}

            {/* 8. PRINT TAB */}
            {activeTab === 'print' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Printer className="w-4 h-4 text-cyan-400" />
                    {curr.print}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? 'Mato ustiga pechat / rasm bosish talablari' : 'Параметры печати рисунков и логотипов'}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <input 
                      type="checkbox"
                      id="modalPrintReq"
                      checked={printRequired}
                      onChange={(e) => setPrintRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500"
                    />
                    <label htmlFor="modalPrintReq" className="text-xs font-bold text-white cursor-pointer">{lang === 'uz' ? 'Pechat (Print) kerak' : 'Требуется печать'}</label>
                  </div>

                  {printRequired && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] text-slate-400">{lang === 'uz' ? 'Print nomi / Dizayn nomi' : 'Название принта / дизайна'}</label>
                          <input
                            type="text"
                            placeholder={lang === 'uz' ? 'Masalan: Nike logo, Vintage print...' : 'Например: логотип Nike, Винтажный принт...'}
                            value={printName}
                            onChange={(e) => setPrintName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] text-slate-400">{curr.status}</label>
                          <select
                            value={printStatus}
                            onChange={(e) => setPrintStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                          >
                            <option value="kutilmoqda">{curr.status_kutilmoqda}</option>
                            <option value="bosilmoqda">{curr.status_bajarilmoqda}</option>
                            <option value="yakunlandi">{curr.status_yakunlandi}</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-slate-400">{curr.details}</label>
                        <textarea
                          placeholder={lang === 'uz' ? 'Dizayn nomi, ranglar, pechat uslubi...' : 'Название дизайна, цвета, способ печати...'}
                          value={printDetails}
                          onChange={(e) => setPrintDetails(e.target.value)}
                          className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 9. VISHIVKA TAB */}
            {activeTab === 'vishivka' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    {curr.vishivka}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? 'Vishivka (Kashtachilik) tafsilotlari' : 'Параметры вышивки эмблем и узоров'}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] text-slate-400">{lang === 'uz' ? 'Vishivka nomi / Dizayni' : 'Название вышивки / узора'}</label>
                      <input
                        type="text"
                        placeholder={lang === 'uz' ? 'Masalan: Stark emblem, Lion...' : 'Например: герб Stark, Лев...'}
                        value={vishivkaName}
                        onChange={(e) => setVishivkaName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] text-slate-400">{curr.status}</label>
                      <select
                        value={vishivkaStatus}
                        onChange={(e) => setVishivkaStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
                      >
                        <option value="yoq">{curr.status_yoq}</option>
                        <option value="kutilmoqda">{curr.status_kutilmoqda}</option>
                        <option value="bajarilmoqda">{curr.status_bajarilmoqda}</option>
                        <option value="yakunlandi">{curr.status_yakunlandi}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-400">{curr.details}</label>
                    <textarea
                      placeholder={lang === 'uz' ? 'Kashta iplari ranglari, chok soni va andoza...' : 'Цвета вышивальных нитей, количество стежков...'}
                      value={vishivkaDetails}
                      onChange={(e) => setVishivkaDetails(e.target.value)}
                      className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 10. VLADELETS PROEKT TAB */}
            {activeTab === 'vladelets' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    {curr.vladelets}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">{lang === 'uz' ? 'Ushbu loyihaga mas\'ul shaxs va mijoz ma\'lumotlari' : 'Ответственный руководитель проекта и контакты заказчика'}</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] text-slate-400">{curr.ownerName}</label>
                      <input 
                        type="text"
                        value={projectOwnerName}
                        onChange={(e) => setProjectOwnerName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] text-slate-400">{curr.ownerPhone}</label>
                      <input 
                        type="text"
                        value={projectOwnerPhone}
                        onChange={(e) => setProjectOwnerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-slate-400">{curr.emission}</label>
                    <input 
                      type="text"
                      placeholder="e.g. 1C-EM-5390"
                      value={oneCOrderEmission}
                      onChange={(e) => setOneCOrderEmission(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 11. RAZNITSA (DIFFERENCE / ANALYSIS) TAB */}
            {activeTab === 'raznitsa' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    {lang === 'uz' ? 'Buyurtma va ishlab chiqarish bosqichlari solishtiruv tahlili (Raznitsa)' : 'Сравнительный анализ этапов производства (Разница)'}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {lang === 'uz' 
                      ? 'Barcha ishlab chiqarish bosqichlaridagi miqdorlar, yo\'qotishlar va buyurtma yopilish ehtimoli.' 
                      : 'Сопоставление всех этапов производства, потерь и вероятности закрытия заказа.'}
                  </p>
                </div>

                {/* Analytical indicators row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* 1. Kroy buffer */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider">
                      {lang === 'uz' ? 'Kesim Zaxirasi (Cut Buffer)' : 'Запас Кроя'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-black text-white">
                        {order.qtyOrder > 0 ? ((sumRaskroy / order.qtyOrder) * 100).toFixed(1) : '0'}%
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({sumRaskroy} / {order.qtyOrder})
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-2">
                      {lang === 'uz' ? 'Buyurtma soniga nisbatan bichilgan miqdor.' : 'Количество раскроенных деталей к заказу.'}
                    </span>
                  </div>

                  {/* 2. Brak impact */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider">
                      {lang === 'uz' ? 'Yaroqsiz (Brak) ulushi' : 'Доля брака'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-black text-rose-500">
                        {sumRaskroy > 0 ? ((sumBrak / sumRaskroy) * 100).toFixed(1) : '0'}%
                      </span>
                      <span className="text-xs text-rose-400 font-mono">
                        ({sumBrak} {lang === 'uz' ? 'dona' : 'шт'})
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-2">
                      {lang === 'uz' ? 'Bichilgan matoga nisbatan brak foizi.' : 'Процент бракованных изделий от общего кроя.'}
                    </span>
                  </div>

                  {/* 3. Zakaz yopilish foizi */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider">
                      {lang === 'uz' ? 'Mijoz Buyurtma yopilish %' : '% Выполнения заказа'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-black text-amber-500">
                        {order.qtyOrder > 0 ? ((sumUpakovka / order.qtyOrder) * 100).toFixed(1) : '0'}%
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({sumUpakovka} / {order.qtyOrder})
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-2">
                      {lang === 'uz' ? 'Qadoqlangan mahsulotlarning buyurtmaga nisbati.' : 'Упакованная готовая продукция к заказу.'}
                    </span>
                  </div>

                  {/* 4. Cut Accountability */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider">
                      {lang === 'uz' ? 'Kroy hisobdorligi %' : '% Учета кроя'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-black text-indigo-400">
                        {sumRaskroy > 0 ? (((sumUpakovka + sumBrak) / sumRaskroy) * 100).toFixed(1) : '0'}%
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({sumUpakovka + sumBrak} / {sumRaskroy})
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-2">
                      {lang === 'uz' ? '(Qadoqlangan + Brak) / Kroy hisobi.' : '(Упаковано + Брак) от общего кроя.'}
                    </span>
                  </div>
                </div>

                {/* Fulfillment Probability Message Engine */}
                {(() => {
                  const maxPossiblePacked = sumRaskroy - sumBrak;
                  const isFullyClosed = sumUpakovka >= order.qtyOrder;
                  const isEnoughKroy = maxPossiblePacked >= order.qtyOrder;
                  
                  if (sumRaskroy === 0) {
                    return (
                      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-start gap-3.5">
                        <div className="p-2 bg-slate-950 rounded-xl text-slate-500 font-bold text-xs shrink-0 font-mono">N/A</div>
                        <div>
                          <h5 className="font-extrabold text-sm text-slate-300">
                            {lang === 'uz' ? 'KROY BOSQICHI KIRITILMAGAN' : 'КРОЙ НЕ ВВЕДЕН'}
                          </h5>
                          <p className="text-xs text-slate-400 mt-1">
                            {lang === 'uz' 
                              ? 'Buyurtmaning yopilish ehtimolini hisoblash uchun oldin kroy (bichuv) miqdorlarini kiriting.' 
                              : 'Пожалуйста, введите данные по раскрою, чтобы рассчитать вероятность успешного выполнения заказа.'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (isFullyClosed) {
                    return (
                      <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-2xl flex items-start gap-3.5">
                        <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl shrink-0"><CheckCircle className="w-5 h-5" /></div>
                        <div>
                          <h5 className="font-extrabold text-sm text-emerald-400">
                            {lang === 'uz' ? "BUYURTMA TO'LIQ VA MUVAFFAQIYATLI YOPILDI!" : 'ЗАКАЗ УСПЕШНО ВЫПОЛНЕН И ЗАКРЫТ!'}
                          </h5>
                          <p className="text-xs text-emerald-300/80 mt-1">
                            {lang === 'uz' 
                              ? `Mijoz buyurtmasi 100% yopildi. Jami qadoqlandi: ${sumUpakovka} ta (Buyurtma ${order.qtyOrder} ta). Ishlab chiqarish muvaffaqiyatli yakunlandi.` 
                              : `Заказ клиента полностью закрыт. Всего упаковано: ${sumUpakovka} шт. (Заказ ${order.qtyOrder} шт.). Производство успешно завершено.`}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (isEnoughKroy) {
                    return (
                      <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-2xl flex items-start gap-3.5">
                        <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl shrink-0"><TrendingUp className="w-5 h-5 animate-bounce" /></div>
                        <div>
                          <h5 className="font-extrabold text-sm text-indigo-400">
                            {lang === 'uz' ? 'BUYURTMANING YOPILISH EHTIMOLI YUQORI (Zaxira yetarli)' : 'ВЫСОКАЯ ВЕРОЯТНОСТЬ УСПЕШНОГО ЗАКРЫТИЯ'}
                          </h5>
                          <p className="text-xs text-indigo-300/80 mt-1">
                            {lang === 'uz' 
                              ? `Mavjud kroy miqdori kutilayotgan braklar bilan ham buyurtmani to'liq yopishga yetadi. Maksimal qadoqlash imkoniyati: ${maxPossiblePacked} ta (Buyurtma ${order.qtyOrder} ta).` 
                              : `Оставшегося кроя за вычетом брака достаточно для полного закрытия заказа. Максимальный потенциал упаковки: ${maxPossiblePacked} шт. (Заказ ${order.qtyOrder} шт.).`}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // Not enough kroy to close the order
                  const shortage = order.qtyOrder - maxPossiblePacked;
                  return (
                    <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-2xl flex items-start gap-3.5">
                      <div className="p-2 bg-rose-950 text-rose-500 rounded-xl shrink-0"><AlertTriangle className="w-5 h-5 animate-pulse" /></div>
                      <div>
                        <h5 className="font-extrabold text-sm text-rose-400 uppercase tracking-wide">
                          {lang === 'uz' ? 'KROY YETISHMOVCHILIGI (Bichuv kam kilingan yoki brak ko\'p)' : 'ДЕФИЦИТ КРОЯ (Недостаточно кроя или высокий брак)'}
                        </h5>
                        <p className="text-xs text-rose-300/80 mt-1">
                          {lang === 'uz' 
                            ? `DIQQAT! Mavjud barcha bichiqlar ishlatilganda ham buyurtmani to'liq yopib bo'lmaydi. Kamida ${shortage} ta qo'shimcha bichiq (re-cut) talab qilinadi!` 
                            : `ВНИМАНИЕ! Даже при использовании всего кроя заказ не может быть полностью выполнен. Требуется дополнительный раскрой (докроить) минимум ${shortage} шт!`}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Detailed Difference Table size-by-size */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 overflow-x-auto">
                  <h5 className="font-bold text-xs text-white uppercase tracking-wider mb-4">
                    {lang === 'uz' ? 'O\'lchamlar bo\'yicha batafsil taqqoslash va raznitsa' : 'Поразмерное сопоставление и разница'}
                  </h5>
                  
                  <table className="w-full text-xs text-left text-slate-300 min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-extrabold uppercase">
                        <th className="pb-3 text-center">{curr.sizes}</th>
                        <th className="pb-3 text-center text-slate-400">{lang === 'uz' ? 'Buyurtma (Order)' : 'Заказ'}</th>
                        <th className="pb-3 text-center text-indigo-400">{lang === 'uz' ? 'Kroy (Cut)' : 'Крой'}</th>
                        <th className="pb-3 text-center text-emerald-400">{lang === 'uz' ? 'Razdacha' : 'Раздача'}</th>
                        <th className="pb-3 text-center text-cyan-400">{lang === 'uz' ? 'Poshiv' : 'Пошив'}</th>
                        <th className="pb-3 text-center text-sky-400">{lang === 'uz' ? 'Upakovka (Ready)' : 'Упаковка'}</th>
                        <th className="pb-3 text-center text-rose-500">{lang === 'uz' ? 'Raznitsa (Kroy - Qadoq)' : 'Разница (Крой - Упак)'}</th>
                        <th className="pb-3 text-right">{lang === 'uz' ? 'Holat' : 'Статус'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {sizeKeys.map(size => {
                        const orderQty = order.sizes[size] || 0;
                        const cutQty = raskroy[size] || 0;
                        const distQty = razdacha[size] || 0;
                        const sewnQty = poshiv[size] || 0;
                        const packedQty = upakovka[size] || 0;
                        const diff = cutQty - packedQty;
                        
                        let statusColor = "text-slate-400";
                        let statusText = lang === 'uz' ? "Jarayonda" : "В процессе";
                        
                        if (packedQty >= orderQty && orderQty > 0) {
                          statusColor = "text-emerald-400 font-bold";
                          statusText = lang === 'uz' ? "✓ Yopildi" : "✓ Закрыт";
                        } else if (cutQty > 0 && packedQty === 0) {
                          statusColor = "text-amber-500";
                          statusText = lang === 'uz' ? "Boshlanmadi" : "Не начат";
                        } else if (packedQty > 0 && packedQty < orderQty) {
                          statusColor = "text-indigo-400 font-medium";
                          statusText = `${lang === 'uz' ? 'Tikilmoqda' : 'Шьется'} (${Math.round((packedQty/orderQty)*100)}%)`;
                        }

                        return (
                          <tr key={size} className="hover:bg-slate-900/30">
                            <td className="py-3 font-bold font-mono text-center text-white">{size}</td>
                            <td className="py-3 font-bold font-mono text-center text-slate-400">{orderQty.toLocaleString()}</td>
                            <td className="py-3 font-bold font-mono text-center text-indigo-400">{cutQty.toLocaleString()}</td>
                            <td className="py-3 font-bold font-mono text-center text-emerald-400">{distQty.toLocaleString()}</td>
                            <td className="py-3 font-bold font-mono text-center text-cyan-400">{sewnQty.toLocaleString()}</td>
                            <td className="py-3 font-bold font-mono text-center text-sky-400">{packedQty.toLocaleString()}</td>
                            <td className={`py-3 font-bold font-mono text-center ${diff > 0 ? 'text-amber-400' : diff < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                            <td className={`py-3 text-right text-[11px] ${statusColor}`}>
                              {statusText}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Total row */}
                      <tr className="font-extrabold text-white bg-slate-900/30">
                        <td className="py-3.5 text-center">{curr.sum}</td>
                        <td className="py-3.5 text-center font-mono text-slate-400">{order.qtyOrder.toLocaleString()}</td>
                        <td className="py-3.5 text-center font-mono text-indigo-400">{sumRaskroy.toLocaleString()}</td>
                        <td className="py-3.5 text-center font-mono text-emerald-400">{sumRazdacha.toLocaleString()}</td>
                        <td className="py-3.5 text-center font-mono text-cyan-400">{sumPoshiv.toLocaleString()}</td>
                        <td className="py-3.5 text-center font-mono text-sky-400">{sumUpakovka.toLocaleString()}</td>
                        <td className={`py-3.5 text-center font-mono ${(sumRaskroy - sumUpakovka) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {(sumRaskroy - sumUpakovka).toLocaleString()}
                        </td>
                        <td className="py-3.5 text-right font-mono text-indigo-300">
                          {order.qtyOrder > 0 ? Math.round((sumUpakovka / order.qtyOrder) * 100) : 0}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Additional user reminder */}
                <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-2xl text-xs text-indigo-300/90 leading-relaxed">
                  <p>
                    {lang === 'uz'
                      ? "💡 Maslahat: Kiyim tikish jarayonida kroy foizini 103%-105% atrofida ushlab turish kutilmagan braklar sababli buyurtmaning to'liq yopilmay qolish xavfini sezilarli darajada kamaytiradi."
                      : "💡 Совет: Удерживание процента кроя в диапазоне 103%-105% значительно снижает риски невыполнения заказа клиента из-за непредвиденного брака."}
                  </p>
                </div>
              </div>
            )}

            {/* 11. MUAMMOLAR & CHAT TAB */}
            {activeTab === 'muammolar' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-rose-400" />
                      {lang === 'uz' ? 'Буюртма бўйича муаммолар ва муҳокама' : 'Проблемы и чат по заказу'}
                    </h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {lang === 'uz' ? 'Барча фойдаланувчилар ушбу буюртмага тегишли муаммо, камчилик ёки расмларни қолдириши мумкин.' : 'Все пользователи могут оставлять сообщения, ошибки и прикреплять фото к этому заказу.'}
                    </p>
                  </div>

                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    {orderIssues.length} {lang === 'uz' ? 'та муаммо' : 'сообщений'}
                  </span>
                </div>

                {/* New Issue Input Form */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">
                    {lang === 'uz' ? 'Янги муаммо ёки хабар ёзиш:' : 'Написать новое сообщение или проблему:'}
                  </span>

                  <textarea
                    rows={3}
                    value={newIssueText}
                    onChange={(e) => setNewIssueText(e.target.value)}
                    placeholder={lang === 'uz' ? 'Муаммони батафсил тавсифлаб ёзинг (масалан: газламада дефект бор, ранг мос келмаяпти, размер етишмаяпти)...' : 'Опишите проблему (например: дефект ткани, несоответствие цвета, нехватка размера)...'}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 transition-all resize-none"
                  />

                  {/* Image preview before uploading */}
                  {newIssueImage && (
                    <div className="relative inline-block border-2 border-rose-500/50 rounded-xl overflow-hidden group">
                      <img src={newIssueImage} alt="Preview" className="w-24 h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewIssueImage(null)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 text-xs hover:bg-rose-700 cursor-pointer shadow-md"
                        title="O'chirish"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">
                      <Camera className="w-4 h-4 text-rose-400" />
                      <span>{newIssueImage ? (lang === 'uz' ? 'Расм алмаштириш' : 'Сменить фото') : (lang === 'uz' ? 'Расм бириктириш' : 'Прикрепить фото')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIssueImageUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleAddIssue}
                      disabled={!newIssueText.trim() && !newIssueImage}
                      className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{lang === 'uz' ? 'Юбориш' : 'Отправить'}</span>
                    </button>
                  </div>
                </div>

                {/* Issues List Feed */}
                <div className="space-y-3">
                  <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    {lang === 'uz' ? 'Муаммолар рўйхати:' : 'Список проблем:'}
                  </h5>

                  {orderIssues.length === 0 ? (
                    <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                      <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs font-bold">
                        {lang === 'uz' ? 'Ҳозирча ушбу буюртмада ҳеч қандай муаммо ёзилмаган.' : 'Пока по этому заказу нет зафиксированных проблем.'}
                      </p>
                    </div>
                  ) : (
                    orderIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`bg-slate-950 border rounded-2xl p-4 transition-all space-y-3 ${
                          issue.status === 'resolved'
                            ? 'border-emerald-900/40 opacity-75'
                            : 'border-rose-900/50 shadow-lg shadow-rose-950/20'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-900 text-white font-black text-xs px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-400" />
                              {issue.authorName}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded-md">
                              {issue.authorRole}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {issue.createdAt}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleIssueStatus(issue.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                issue.status === 'resolved'
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                  : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>
                                {issue.status === 'resolved'
                                  ? (lang === 'uz' ? 'Ҳал қилинди' : 'Решено')
                                  : (lang === 'uz' ? 'Очиқ муаммо' : 'Открыто')}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteIssue(issue.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                              title={lang === 'uz' ? 'Ўчириш' : 'Удалить'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Issue Body Text */}
                        {issue.text && (
                          <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                            {issue.text}
                          </p>
                        )}

                        {/* Issue Attached Image */}
                        {issue.imageUrl && (
                          <div>
                            <img
                              src={issue.imageUrl}
                              alt="Issue photo"
                              onClick={() => setPreviewImageModal(issue.imageUrl!)}
                              className="w-40 h-28 object-cover rounded-xl border border-slate-700 hover:border-rose-400 cursor-pointer transition-all hover:scale-105 shadow-md"
                            />
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {lang === 'uz' ? 'Катталаштириш учун устига босинг' : 'Нажмите, чтобы увеличить'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Image Lightbox Modal */}
        {previewImageModal && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setPreviewImageModal(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="absolute top-3 right-3 bg-rose-600 hover:bg-rose-700 text-white font-bold p-2 rounded-full cursor-pointer shadow-xl z-10 transition-transform hover:scale-110"
              >
                ✕
              </button>
              <img
                src={previewImageModal}
                alt="Full preview"
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-850 flex items-center justify-between gap-3 rounded-b-3xl">
          <div>
            {currentUser?.role === 'super_admin' && onDeleteOrder && (
              <button
                type="button"
                onClick={() => {
                  setDeletePassword('');
                  setDeletePasswordError('');
                  setShowDeleteConfirm(true);
                }}
                className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>{lang === 'uz' ? "Buyurtmani O'chirish" : "Удалить заказ"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 transition-colors cursor-pointer"
            >
              {curr.closeBtn}
            </button>
            
            <button
              onClick={handleSaveAndSubmit}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              <Save className="w-4 h-4" />
              {curr.saveBtn}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    {lang === 'uz' ? "Buyurtmani o'chirish" : "Удаление заказа"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{order.mosCode}</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {lang === 'uz' 
                  ? `Haqiqatan ham ushbu buyurtmani (${order.mosCode}) butunlay o'chirib tashlamoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.` 
                  : `Вы действительно хотите полностью удалить этот заказ (${order.mosCode})? Это действие нельзя отменить.`}
              </p>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  {lang === 'uz' ? "Super Admin paroli (harf/raqam):" : "Пароль Супер Админа (буквы/цифры):"}
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError('');
                  }}
                  placeholder={lang === 'uz' ? "Parolni kiriting..." : "Введите пароль..."}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-hidden focus:border-amber-500"
                  autoFocus
                />
                {deletePasswordError && (
                  <p className="text-rose-500 text-xs font-semibold">{deletePasswordError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const superAdminPin = currentUser?.pin || '0000';
                    if (deletePassword.trim() !== superAdminPin) {
                      setDeletePasswordError(lang === 'uz' ? "Noto'g'ri parol! Ma'lumot o'chirilmadi." : "Неверный пароль! Данные не удалены.");
                      return;
                    }
                    if (onDeleteOrder) {
                      onDeleteOrder(order.id);
                    }
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  {lang === 'uz' ? "Ha, o'chirish" : "Да, удалить"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXCEL IMPORT MODAL FOR ACTIVE STAGE */}
        {importStageModal && (
          <ExcelStageImportModal
            isOpen={!!importStageModal}
            onClose={() => setImportStageModal(null)}
            stageType={importStageModal}
            stageTitle={
              importStageModal === 'zakaz'
                ? (lang === 'uz' ? 'Буюртма (Заказ ўлчамлари)' : 'Заказ (по размерам)')
                : importStageModal === 'raskroy'
                ? (lang === 'uz' ? 'Раскрой (Крой ўлчамлари)' : 'Раскрой (Крой)')
                : importStageModal === 'razdacha'
                ? (lang === 'uz' ? 'Раздача (Тарқатиш ўлчамлари)' : 'Раздача')
                : (lang === 'uz' ? 'Упаковка (Қадоқ ўлчамлари)' : 'Упаковка')
            }
            availableSizes={
              importStageModal === 'zakaz'
                ? (activeOrderSizeCategory === 'adult' ? ADULT_SIZES.slice(0, 14) : activeOrderSizeCategory === 'kids1' ? KIDS_SIZES_1 : KIDS_SIZES_2)
                : sizeKeys
            }
            colorVariants={colorVariants}
            onApply={handleApplyStageImport}
            lang={lang}
          />
        )}

        {/* Resize handles */}
        {!isMaximized && (
          <>
            {/* Right edge */}
            <div 
              onMouseDown={(e) => handleMouseDownResize(e, 'e')} 
              className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-sky-500/20 transition-colors"
            />
            {/* Bottom edge */}
            <div 
              onMouseDown={(e) => handleMouseDownResize(e, 's')} 
              className="absolute bottom-0 left-0 h-2 w-full cursor-s-resize hover:bg-sky-500/20 transition-colors"
            />
            {/* Bottom-right corner */}
            <div 
              onMouseDown={(e) => handleMouseDownResize(e, 'se')} 
              className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-center justify-center group z-10"
              title="Sichqoncha bilan ushlab tortib kattalashtiring / Drag to resize"
            >
              <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-slate-500 group-hover:border-sky-400 transition-colors rounded-br-xs" />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
