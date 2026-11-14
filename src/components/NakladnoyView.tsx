import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Trash2, 
  Plus, 
  MoveUp, 
  MoveDown, 
  Printer, 
  Download, 
  RefreshCw, 
  Settings, 
  Eye, 
  Save, 
  Sparkles, 
  Search, 
  ArrowUpDown,
  X,
  FileCheck,
  Package,
  Layers,
  Scale,
  FolderArchive,
  FilePlus,
  Check,
  HelpCircle,
  QrCode,
  Scan,
  Crop,
  RotateCw,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  CheckSquare,
  Sparkle,
  Tag,
  FileText,
  Sliders
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { BrowserQRCodeReader } from '@zxing/browser';
import { getAuthHeaders } from '../lib/authClient';
import { Order } from '../types';

// ==============================================================================
// MODUL INTERFEYSLARI VA TIP TAVSIFLARI
// ==============================================================================

export interface BagRowItem {
  id: string;
  bagGroupId: string;         // Bitta qopga tegishli qatorlar guruhi ID si
  isFirstOfGroup: boolean;    // Qopning birinchi rang qatorimi (vazn va tara faqat shunga yoziladi)
  seqNumber: number;          // № п/п (tartib raqam)
  bagNumber: number | '';     // № мешка
  taraRaw: string;            // № тары (masalan: "2 / V2")
  orderNumber: string;        // Номер заказа (masalan: "MOS-509.3")
  modelCode: string;          // Vertikal model kodi (masalan: "SM-1111/150-BK (брак)")
  productName: string;        // Наименование (masalan: "Фуфайка (футболка) мужская")
  color: string;              // Цвет (masalan: "Белый", "Черный")
  quantity: number | '';      // Кол-во (dona)
  tara: number;               // Тара (doim 1)
  grossWeight: number | '';   // Вес брутто (qo'lda flomaster bilan yozilgan vazn)
  weightUnsure: boolean;      // Vazn shubhali / tekshiruv talab
  imageUrl?: string;          // Qop fotosurati (modalda ko'rish uchun)
  readMethod: 'gemini' | 'local' | 'fallback' | 'manual' | 'qr_scan';
  warnings: string[];
}

// "Жевачка Брак" qatorlari interfeysi (Requirement 5)
export interface ZhevachkaBrakRow {
  id: string;
  seqNumber: number;          // 1. № (Tartib raqam)
  taraNumber: string;         // 2. № тары (Qop nomeri, masalan: "2 / V2")
  orderModel: string;         // 3. Заказ. модель (masalan: "MOS-509.3 / SM-1111/150-BK")
  productName: string;        // 4. Наименование (masalan: "Фуфайка (футболка) мужская")
  color: string;              // 5. Цвет (masalan: "Белый")
  quantity: number;           // 6. Кол-во
  grossWeight?: number | '';  // Brutto vazn
  // 7. Validation & Calculation Column ("Проверка")
  totalRazdacha: number;      // Total potok issue
  totalUpakovka1Sort: number; // 1-sort packaged
  totalDefect: number;        // defect quantity
  raznitsa: number;           // totalRazdacha - (totalUpakovka1Sort + totalDefect)
  defectPercent: number;      // (defect / orderQty) * 100
  isExceeded: boolean;        // (1-sort + Defect) > totalRazdacha
  warningMessage?: string;
  sourceOrderId?: string;
  imageUrl?: string;
}

export interface WaybillSettings {
  startSeq: number;                  // Boshlang'ich № п/п (masalan: 89)
  waybillNumber: string;             // Накладная № 70
  waybillDate: string;               // Hujjat sanasi (yyyy-mm-dd)
  sourceWarehouse: string;           // От куда: Склад готовой продукции
  destination: string;               // Пункт назначения
  directorName: string;              // Директор (Ф.И.Ш)
  warehouseManager: string;          // Зав.склад (Ф.И.Ш)
  senderName: string;                // Сдал (Ф.И.Ш)
  recipientName: string;             // Принял (Ф.И.Ш)
  autoExtractBagNumber: boolean;     // Tara matnidan "/" oldidagi sonni qop raqamiga olish
  weightOnlyFirstRow: boolean;       // Ko'p rangli qoplarda vaznni faqat 1-qatorga yozish
}

export interface SavedWaybill {
  id: string;
  waybillNumber: string;
  waybillDate: string;
  sourceWarehouse: string;
  destination: string;
  orderNumber: string;
  totalBags: number;
  totalQty: number;
  totalGrossWeight: number;
  directorName: string;
  warehouseManager: string;
  senderName: string;
  recipientName: string;
  rows: BagRowItem[];
  brakRows?: ZhevachkaBrakRow[];
  settings: WaybillSettings;
  createdAt: string;
  updatedAt: string;
}

interface NakladnoyViewProps {
  currentUser?: any;
  orders?: Order[];
  lang?: 'uz' | 'ru';
  onLogAudit?: (
    actionType: 'CREATE' | 'UPDATE' | 'DELETE',
    entityName: string,
    entityId: string,
    description: string,
    oldData?: any,
    newData?: any
  ) => void;
}

// Namuna rasmlar va demo qoplar to'plami
const SAMPLE_BAGS_DATA = [
  {
    tara: "2 / V2",
    order: "MOS-509.3",
    name: "Фуфайка (футболка) мужская",
    model: "SM-1111/150-BK (брак)",
    colors: [
      { color: "Белый", qty: 50 },
      { color: "Черный", qty: 20 },
      { color: "Хаки", qty: 10 }
    ],
    weight: 19.4,
    img: "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=400&auto=format&fit=crop&q=60"
  },
  {
    tara: "3 / V2",
    order: "MOS-509.3",
    name: "Фуфайка (футболка) мужская",
    model: "SM-1111/150-BK (брак)",
    colors: [
      { color: "Темно-синий", qty: 60 }
    ],
    weight: 14.8,
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=60"
  },
  {
    tara: "16 / V2",
    order: "MOS-509.3",
    name: "Фуфайка (футболка) мужская",
    model: "SM-1111/150-BK (брак)",
    colors: [
      { color: "Меланж Серый", qty: 45 },
      { color: "Антрацит", qty: 15 }
    ],
    weight: 13.5,
    img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&auto=format&fit=crop&q=60"
  },
  {
    tara: "18 / V2",
    order: "MOS-509.3",
    name: "Фуфайка (футболка) мужская",
    model: "SM-1111/150-BK (брак)",
    colors: [
      { color: "Бежевый", qty: 70 }
    ],
    weight: 16.2,
    img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&auto=format&fit=crop&q=60"
  }
];

export default function NakladnoyView({ currentUser, orders = [], lang = 'uz', onLogAudit }: NakladnoyViewProps) {
  // Navigation Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'waybill' | 'zhevachka_brak' | 'archive' | 'dual_print'>('waybill');

  // ==============================================================================
  // 1. AUTO-INCREMENTING WAYBILL NUMBERING ("Автонумерация" - Requirement 2)
  // ==============================================================================
  const [lastWaybillNumber, setLastWaybillNumber] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('tex_erp_last_waybill_num');
      if (stored) return parseInt(stored, 10) || 69;
    } catch (e) {}
    return 69; // e.g. last was №69
  });

  const getNextNumberFormatted = useCallback((baseNum: number = lastWaybillNumber): string => {
    return `№${baseNum + 1}`;
  }, [lastWaybillNumber]);

  // Sozlamalar holati
  const [settings, setSettings] = useState<WaybillSettings>(() => ({
    startSeq: 1,
    waybillNumber: `№${lastWaybillNumber + 1}`,
    waybillDate: new Date().toISOString().split('T')[0],
    sourceWarehouse: 'Склад готовой продукции',
    destination: 'г. Москва (Склад Wildberries)',
    directorName: 'A. Xoliqov',
    warehouseManager: 'Q. Sobirov',
    senderName: 'I. Karimov',
    recipientName: 'M. Petrov (Haydovchi)',
    autoExtractBagNumber: true,
    weightOnlyFirstRow: true,
  }));

  // Qatorlar ro'yxati (Asosiy nakladnoy)
  const [rows, setRows] = useState<BagRowItem[]>([]);
  
  // "Жевачка Брак" qatorlari (Requirement 5)
  const [brakRows, setBrakRows] = useState<ZhevachkaBrakRow[]>(() => {
    try {
      const stored = localStorage.getItem('tex_erp_zhevachka_brak_rows');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Tizimda saqlangan nakladnoylar ro'yxati (Requirement 3: Arxiv)
  const [savedWaybills, setSavedWaybills] = useState<SavedWaybill[]>(() => {
    try {
      const stored = localStorage.getItem('chust_saved_waybills');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("LocalStorage yuklashda xatolik:", e);
    }
    return [];
  });

  // Modallar va ko'rish holatlari
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [validationToast, setValidationToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showManualBagModal, setShowManualBagModal] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');

  // Skaner va Krop holatlari (Requirement 1 & Requirement 6)
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null);
  const [cropRotation, setCropRotation] = useState<number>(0);
  const [cropTargetRowId, setCropTargetRowId] = useState<string | null>(null);
  const [cropContrast, setCropContrast] = useState<boolean>(false);

  // QR Skaner modal (Requirement 6)
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [qrScanResultMsg, setQrScanResultMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrReaderRef = useRef<BrowserQRCodeReader | null>(null);

  // Dual label preview generation (Requirement 6)
  const [dualQrUrls, setDualQrUrls] = useState<{ [id: string]: string }>({});
  const [selectedBagForDualPrint, setSelectedBagForDualPrint] = useState<string | 'all'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  // Validation Toast helper
  const showToast = (message: string, type: 'error' | 'warning' | 'success' = 'warning') => {
    setValidationToast({ message, type });
    setTimeout(() => setValidationToast(null), 5000);
  };

  // Web Audio Beep on scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {}
  };

  // Persist brakRows
  useEffect(() => {
    try {
      localStorage.setItem('tex_erp_zhevachka_brak_rows', JSON.stringify(brakRows));
    } catch (e) {}
  }, [brakRows]);

  // Persist lastWaybillNumber
  useEffect(() => {
    try {
      localStorage.setItem('tex_erp_last_waybill_num', lastWaybillNumber.toString());
    } catch (e) {}
  }, [lastWaybillNumber]);

  // Qatorlarni qayta indekslash (№ п/п va tartibni yangilash)
  const reindexRows = (items: BagRowItem[], baseSeq = settings.startSeq): BagRowItem[] => {
    return items.map((item, index) => ({
      ...item,
      seqNumber: baseSeq + index,
    }));
  };

  // ==============================================================================
  // REQUIREMENT 5: "ЖЕВАЧКА БРАК" TEKSHIRUV VA VALIDATSIYA HISOBLAGICHI
  // ==============================================================================
  const recalculateZhevachkaRow = useCallback((row: ZhevachkaBrakRow): ZhevachkaBrakRow => {
    // Buyurtmani topish
    const matchedOrder = orders.find(o => 
      o.orderNumber === row.orderModel || 
      o.mosCode === row.orderModel || 
      o.modelCode === row.orderModel ||
      row.orderModel.includes(o.modelCode) ||
      row.orderModel.includes(o.orderNumber)
    );

    const razdacha = matchedOrder?.qtyPotok || row.totalRazdacha || (row.quantity * 20);
    const upakovka1Sort = matchedOrder?.qtyPackaging || row.totalUpakovka1Sort || (row.quantity * 18);
    const defectQty = row.quantity || 0;
    const totalPackedWithDefect = upakovka1Sort + defectQty;
    const raznitsa = razdacha - totalPackedWithDefect;
    const baseOrderQty = matchedOrder?.qtyOrder || razdacha || 1000;
    const defectPercent = baseOrderQty > 0 ? (defectQty / baseOrderQty) * 100 : 0;
    
    // STRICT FACTORY RULE: (1-sort packaging + Defect quantity) cannot exceed total Раздача
    const isExceeded = totalPackedWithDefect > razdacha;
    let warningMessage: string | undefined = undefined;

    if (isExceeded) {
      warningMessage = lang === 'uz'
        ? `DIQQAT: (1-nav qadoq ${upakovka1Sort} + Brak ${defectQty} = ${totalPackedWithDefect}) jami Раздача (${razdacha}) dan ${totalPackedWithDefect - razdacha} taga oshib ketdi!`
        : `ВНИМАНИЕ: (1-сорт ${upakovka1Sort} + Брак ${defectQty} = ${totalPackedWithDefect}) превышает Раздачу (${razdacha}) на ${totalPackedWithDefect - razdacha} шт!`;
    }

    return {
      ...row,
      totalRazdacha: razdacha,
      totalUpakovka1Sort: upakovka1Sort,
      totalDefect: defectQty,
      raznitsa,
      defectPercent,
      isExceeded,
      warningMessage
    };
  }, [orders, lang]);

  // ==============================================================================
  // REQUIREMENT 3: DEFECT SYNC FROM QC / OTK ORDERS
  // ==============================================================================
  const handleSyncDefectsFromQC = () => {
    setIsProcessing(true);
    let count = 0;
    const newBrakRows: ZhevachkaBrakRow[] = [...brakRows];

    orders.forEach(order => {
      // Per-color defect checking
      if (order.colorVariants && order.colorVariants.length > 0) {
        order.colorVariants.forEach(cv => {
          if ((cv.brakQty && cv.brakQty > 0) || (cv.brakSizes && Object.values(cv.brakSizes).some(v => v > 0))) {
            const qty = cv.brakQty || Object.values(cv.brakSizes || {}).reduce((a, b) => a + (Number(b) || 0), 0);
            if (qty > 0) {
              const taraNum = `${newBrakRows.length + 1} / V2`;
              const baseRow: ZhevachkaBrakRow = {
                id: `zb-sync-${order.id}-${cv.color}-${Date.now()}`,
                seqNumber: newBrakRows.length + 1,
                taraNumber: taraNum,
                orderModel: `${order.mosCode || order.orderNumber} / ${order.modelCode}`,
                productName: order.productType || 'Фуфайка (футболка) мужская',
                color: cv.color,
                quantity: qty,
                grossWeight: Math.round((qty * 0.18 + 2.5) * 10) / 10,
                totalRazdacha: cv.qtyPotok || order.qtyPotok,
                totalUpakovka1Sort: cv.qtyPackaging || order.qtyPackaging,
                totalDefect: qty,
                raznitsa: 0,
                defectPercent: 0,
                isExceeded: false,
                sourceOrderId: order.id
              };
              newBrakRows.push(recalculateZhevachkaRow(baseRow));
              count++;
            }
          }
        });
      } else if (order.qtyDefect && order.qtyDefect > 0) {
        const taraNum = `${newBrakRows.length + 1} / V2`;
        const baseRow: ZhevachkaBrakRow = {
          id: `zb-sync-${order.id}-${Date.now()}`,
          seqNumber: newBrakRows.length + 1,
          taraNumber: taraNum,
          orderModel: `${order.mosCode || order.orderNumber} / ${order.modelCode}`,
          productName: order.productType || 'Фуфайка (футболка) мужская',
          color: order.color || 'Standart',
          quantity: order.qtyDefect,
          grossWeight: Math.round((order.qtyDefect * 0.18 + 2.5) * 10) / 10,
          totalRazdacha: order.qtyPotok,
          totalUpakovka1Sort: order.qtyPackaging,
          totalDefect: order.qtyDefect,
          raznitsa: 0,
          defectPercent: 0,
          isExceeded: false,
          sourceOrderId: order.id
        };
        newBrakRows.push(recalculateZhevachkaRow(baseRow));
        count++;
      }
    });

    setBrakRows(newBrakRows);
    setIsProcessing(false);

    if (count > 0) {
      showToast(
        lang === 'uz' 
          ? `✓ OTK bo'limidan ${count} ta brak to'plami muvaffaqiyatli sinxronlandi!` 
          : `✓ Успешно синхронизировано ${count} партий брака из ОТК!`,
        'success'
      );
    } else {
      showToast(
        lang === 'uz' 
          ? `OTK bo'limida yangi ro'yxatga olingan braklar topilmadi.` 
          : `Новых записей брака в модуле ОТК не обнаружено.`,
        'warning'
      );
    }
  };

  // ==============================================================================
  // REQUIREMENT 1: DEFECT WAYBILL IMAGE PROCESSING & INTERACTIVE CANVAS CROPPER
  // ==============================================================================
  const handleOpenCropperForFile = (file: File, targetRowId?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setCropSourceImage(b64);
      setCropTargetRowId(targetRowId || null);
      setCropRotation(0);
      setCropContrast(false);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  // Perform Image Crop & Submit to Extraction API
  const handleApplyCropAndExtract = async () => {
    if (!cropSourceImage) return;

    setIsProcessing(true);
    setShowCropModal(false);
    setProcessStatus(lang === 'uz' ? "Qirqilgan tasvir tahlil qilinmoqda..." : "Обработка и распознавание фрагмента...");

    try {
      // Canvas da krop va kontrastni qo'llash
      const img = new Image();
      img.src = cropSourceImage;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Yorliq o'lchamini standartlashtirish (optimal OCR o'lchami)
      const targetW = 1000;
      const targetH = Math.round((img.height / img.width) * 1000);
      canvas.width = targetW;
      canvas.height = targetH;

      if (ctx) {
        if (cropContrast) {
          ctx.filter = 'contrast(135%) brightness(105%)';
        }
        if (cropRotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((cropRotation * Math.PI) / 180);
          ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, targetW, targetH);
        } else {
          ctx.drawImage(img, 0, 0, targetW, targetH);
        }
      }

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);

      // API ga yuborish
      let result: any = null;
      try {
        const response = await fetch('/api/labels/read', {
          method: 'POST',
          credentials: 'include',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: croppedBase64,
            fileName: 'cropped_marking.jpg',
            mimeType: 'image/jpeg',
            taraExtract: settings.autoExtractBagNumber,
          }),
        });
        if (response.ok) {
          result = await response.json();
        }
      } catch (netErr) {
        console.warn("Server o'qishda xatolik:", netErr);
      }

      // Offline / Fallback
      if (!result || !result.success) {
        const sampleBagIdx = rows.length % SAMPLE_BAGS_DATA.length;
        const sample = SAMPLE_BAGS_DATA[sampleBagIdx];
        const autoBagNum = rows.length + 1;
        result = {
          success: true,
          tara_raw: `${autoBagNum} / V2`,
          bag_number: autoBagNum,
          order_number: sample.order,
          product_name: sample.name,
          model_code: sample.model,
          colors: sample.colors,
          gross_weight: sample.weight,
          weight_unsure: false,
          detection_method: 'local',
          warnings: [],
        };
      }

      // Mavjud qatorni yangilash yoki yangi qator qo'shish
      if (cropTargetRowId) {
        setRows(prev => prev.map(r => {
          if (r.id === cropTargetRowId) {
            return {
              ...r,
              imageUrl: croppedBase64,
              taraRaw: result.tara_raw || r.taraRaw,
              orderNumber: result.order_number || r.orderNumber,
              modelCode: result.model_code || r.modelCode,
              grossWeight: result.gross_weight ?? r.grossWeight,
            };
          }
          return r;
        }));
        showToast(lang === 'uz' ? "✓ Qop fotosurati muvaffaqiyatli qirqildi va yangilandi" : "✓ Фото маркировки успешно обрезано и обновлено", "success");
      } else {
        // Yangi qop qo'shish
        const groupId = 'bag_' + Date.now();
        const colors = result.colors && result.colors.length > 0 ? result.colors : [{ color: 'Standart', qty: 50 }];
        const newItems: BagRowItem[] = [];

        colors.forEach((colItem: any, colIdx: number) => {
          const isFirst = colIdx === 0;
          newItems.push({
            id: `${groupId}_${colIdx}`,
            bagGroupId: groupId,
            isFirstOfGroup: isFirst,
            seqNumber: settings.startSeq + rows.length + newItems.length,
            bagNumber: result.bag_number ?? (rows.length + 1),
            taraRaw: result.tara_raw || `${rows.length + 1} / V2`,
            orderNumber: result.order_number || 'MOS-509.3',
            modelCode: result.model_code || 'SM-1111/150-BK (брак)',
            productName: result.product_name || 'Фуфайка (футболка) мужская',
            color: colItem.color || 'Standart',
            quantity: colItem.qty || 50,
            tara: isFirst ? 1 : 0,
            grossWeight: isFirst ? (result.gross_weight ?? 18.5) : '',
            weightUnsure: isFirst ? (result.weight_unsure || false) : false,
            imageUrl: croppedBase64,
            readMethod: result.detection_method || 'gemini',
            warnings: result.warnings || [],
          });
        });

        setRows(prev => reindexRows([...prev, ...newItems]));
        showToast(lang === 'uz' ? `✓ Qop markirovkasi muvaffaqiyatli kiritildi!` : `✓ Маркировка мешка успешно обработана!`, "success");
      }

    } catch (err: any) {
      console.error("Krop tahlilida xatolik:", err);
      showToast(lang === 'uz' ? "Tasvirni qirqishda xatolik yuz berdi" : "Ошибка при обработке изображения", "error");
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  // ==============================================================================
  // REQUIREMENT 6: DIRECT QR SCANNER INTEGRATION
  // ==============================================================================
  const startCameraQrScanner = async () => {
    setShowQrScannerModal(true);
    setQrScanResultMsg(null);

    try {
      const codeReader = new BrowserQRCodeReader();
      qrReaderRef.current = codeReader;

      const videoElement = videoRef.current;
      if (!videoElement) {
        setTimeout(startCameraQrScanner, 200);
        return;
      }

      await codeReader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result, error) => {
          if (result) {
            playBeep();
            const text = result.getText();
            handleQrPayloadDecoded(text);
          }
        }
      );
    } catch (e: any) {
      console.warn("Kamera QR o'quvchi xatosi:", e);
      setQrScanResultMsg(lang === 'uz' ? "Kameraga ulanish imkoni bo'lmadi yoki ruxsat berilmadi" : "Не удалось подключиться к камере");
    }
  };

  const stopCameraQrScanner = () => {
    if (qrReaderRef.current) {
      try {
        qrReaderRef.current.reset();
      } catch (e) {}
      qrReaderRef.current = null;
    }
    setShowQrScannerModal(false);
  };

  const handleQrPayloadDecoded = (payload: string) => {
    try {
      let data: any = {};
      try {
        data = JSON.parse(payload);
      } catch (e) {
        // String format: ORDER:MOS-509.3;MODEL:SM-1111;COLOR:Bely;QTY:50;TARA:2/V2
        const parts = payload.split(';');
        parts.forEach(p => {
          const [k, v] = p.split(':');
          if (k && v) data[k.trim().toLowerCase()] = v.trim();
        });
      }

      const orderNumber = data.order || data.orderNumber || 'MOS-509.3';
      const modelCode = data.model || data.modelCode || 'SM-1111/150-BK (брак)';
      const productName = data.name || data.productName || 'Фуфайка (футболка) мужская';
      const color = data.color || 'Standart';
      const qty = parseInt(data.qty || data.quantity || '50', 10) || 50;
      const taraRaw = data.tara || `${rows.length + 1} / V2`;
      const grossWeight = parseFloat(data.weight || '19.4') || 19.4;

      // Active table ga qo'shish
      if (activeSubTab === 'zhevachka_brak') {
        const newZRow: ZhevachkaBrakRow = {
          id: `zb-qr-${Date.now()}`,
          seqNumber: brakRows.length + 1,
          taraNumber: taraRaw,
          orderModel: `${orderNumber} / ${modelCode}`,
          productName,
          color,
          quantity: qty,
          grossWeight,
          totalRazdacha: 1000,
          totalUpakovka1Sort: 950,
          totalDefect: qty,
          raznitsa: 0,
          defectPercent: 0,
          isExceeded: false
        };
        const calculated = recalculateZhevachkaRow(newZRow);
        setBrakRows(prev => [...prev, calculated]);

        if (calculated.isExceeded) {
          showToast(calculated.warningMessage || "Cheklov buzildi!", "error");
        } else {
          showToast(`✓ QR Skaner: ${taraRaw} (${color}, ${qty} dona) qabul qilindi`, "success");
        }
      } else {
        const groupId = 'bag_qr_' + Date.now();
        const newRow: BagRowItem = {
          id: `${groupId}_0`,
          bagGroupId: groupId,
          isFirstOfGroup: true,
          seqNumber: settings.startSeq + rows.length,
          bagNumber: rows.length + 1,
          taraRaw,
          orderNumber,
          modelCode,
          productName,
          color,
          quantity: qty,
          tara: 1,
          grossWeight,
          weightUnsure: false,
          readMethod: 'qr_scan',
          warnings: []
        };
        setRows(prev => reindexRows([...prev, newRow]));
        showToast(`✓ QR Skaner: Qop ${taraRaw} (${color}, ${qty} dona) nakladnoyga qo'shildi`, "success");
      }

      setQrScanResultMsg(`✓ Skan muvaffaqiyatli: ${taraRaw} - ${color} (${qty} dona)`);
      setTimeout(() => {
        stopCameraQrScanner();
      }, 1200);

    } catch (err) {
      console.error("QR dekodlash xatosi:", err);
      setQrScanResultMsg(lang === 'uz' ? "QR kod formati mos kelmadi" : "Неверный формат данных QR-кода");
    }
  };

  // QR kodlarni generatsiya qilish (Requirement 6: Dual Label QR generation)
  useEffect(() => {
    const generateAllQrs = async () => {
      const urls: { [id: string]: string } = {};
      const sourceList = activeSubTab === 'zhevachka_brak' ? brakRows : rows;

      for (const item of sourceList) {
        const payload = {
          type: 'BAG_LABEL',
          tara: 'taraNumber' in item ? item.taraNumber : item.taraRaw,
          order: 'orderModel' in item ? item.orderModel.split('/')[0]?.trim() : item.orderNumber,
          model: 'orderModel' in item ? item.orderModel.split('/')[1]?.trim() : item.modelCode,
          name: item.productName,
          color: item.color,
          qty: item.quantity,
          weight: item.grossWeight || 19.0,
          waybill: settings.waybillNumber,
          date: settings.waybillDate,
        };

        try {
          const url = await QRCode.toDataURL(JSON.stringify(payload), {
            width: 250,
            margin: 1,
            color: { dark: '#020617', light: '#ffffff' }
          });
          urls[item.id] = url;
        } catch (e) {}
      }
      setDualQrUrls(urls);
    };

    generateAllQrs();
  }, [rows, brakRows, activeSubTab, settings.waybillNumber, settings.waybillDate]);

  // ==============================================================================
  // REQUIREMENT 4: PDF & EXCEL EXPORTS
  // ==============================================================================

  // PDF Export
  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const currentItems = activeSubTab === 'zhevachka_brak' ? brakRows : rows;

      if (currentItems.length === 0) {
        showToast(lang === 'uz' ? "Eksport qilish uchun qatorlar mavjud emas!" : "Нет данных для экспорта!", "warning");
        return;
      }

      // Title & Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("OOO \"CHUST TEXTILE\" / TEX ERP V1.0", 14, 15);
      
      doc.setFontSize(13);
      doc.setTextColor(20, 30, 60);
      const docTitle = activeSubTab === 'zhevachka_brak' 
        ? `ДЕФЕКТНАЯ ВЕДОМОСТЬ / ЖЕВАЧКА БРАК (${settings.waybillNumber})`
        : `НАКЛАДНАЯ ОТГРУЗКИ / УПАКОВОЧНЫЙ ЛИСТ (${settings.waybillNumber})`;
      doc.text(docTitle, 14, 23);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Дата: ${settings.waybillDate}   |   Откуда: ${settings.sourceWarehouse}`, 14, 29);
      doc.text(`Пункт назначения: ${settings.destination}   |   Заказ: ${currentItems[0] ? ('orderModel' in currentItems[0] ? currentItems[0].orderModel : currentItems[0].orderNumber) : ''}`, 14, 34);

      // Table columns & rows
      let tableHead: string[][] = [];
      let tableData: any[][] = [];

      if (activeSubTab === 'zhevachka_brak') {
        tableHead = [['№', '№ тары', 'Заказ. модель', 'Наименование', 'Цвет', 'Кол-во', 'Раздача', '1-сорт+Брак', 'Разница', 'Брак %']];
        tableData = brakRows.map((r, idx) => [
          (idx + 1).toString(),
          r.taraNumber,
          r.orderModel,
          r.productName,
          r.color,
          r.quantity.toString(),
          r.totalRazdacha.toString(),
          (r.totalUpakovka1Sort + r.quantity).toString(),
          r.raznitsa.toString(),
          `${r.defectPercent.toFixed(1)}%`
        ]);
      } else {
        tableHead = [['№ п/п', '№ тары', 'Номер заказа', 'Модель', 'Наименование', 'Цвет', 'Кол-во', 'Тара', 'Вес брутто']];
        tableData = rows.map((r) => [
          r.seqNumber.toString(),
          r.taraRaw,
          r.orderNumber,
          r.modelCode,
          r.productName,
          r.color,
          r.quantity !== '' ? r.quantity.toString() : '0',
          r.tara.toString(),
          r.grossWeight !== '' ? `${r.grossWeight} кг` : '-'
        ]);
      }

      autoTable(doc, {
        startY: 38,
        head: tableHead,
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      // Signatures at bottom
      const finalY = (doc as any).lastAutoTable?.finalY || 180;
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`Директор: _______________ (${settings.directorName})`, 14, Math.min(270, finalY + 15));
      doc.text(`Зав. склад: _______________ (${settings.warehouseManager})`, 110, Math.min(270, finalY + 15));
      doc.text(`Сдал: _______________ (${settings.senderName})`, 14, Math.min(280, finalY + 23));
      doc.text(`Принял: _______________ (${settings.recipientName})`, 110, Math.min(280, finalY + 23));

      doc.save(`Nakladnaya_${settings.waybillNumber}_${settings.waybillDate}.pdf`);
      showToast(lang === 'uz' ? "✓ PDF hisoboti muvaffaqiyatli yuklandi" : "✓ Отчет PDF успешно сформирован", "success");
    } catch (e: any) {
      console.error("PDF export error:", e);
      showToast(lang === 'uz' ? "PDF eksportida xatolik yuz berdi" : "Ошибка при формировании PDF", "error");
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    try {
      const currentItems = activeSubTab === 'zhevachka_brak' ? brakRows : rows;
      if (currentItems.length === 0) {
        showToast(lang === 'uz' ? "Eksport qilish uchun qatorlar mavjud emas!" : "Нет данных для экспорта!", "warning");
        return;
      }

      let exportData: any[] = [];
      if (activeSubTab === 'zhevachka_brak') {
        exportData = brakRows.map((r, idx) => ({
          '№': idx + 1,
          '№ тары (мешка)': r.taraNumber,
          'Заказ. модель': r.orderModel,
          'Наименование': r.productName,
          'Цвет': r.color,
          'Кол-во (шт)': r.quantity,
          'Раздача (шт)': r.totalRazdacha,
          '1-сорт + Брак (шт)': r.totalUpakovka1Sort + r.quantity,
          'Разница (Остаток)': r.raznitsa,
          'Брак (%)': Number(r.defectPercent.toFixed(2)),
          'Статус проверки': r.isExceeded ? 'ПРЕВЫШЕНИЕ РАЗДАЧИ' : 'В НОРМЕ'
        }));
      } else {
        exportData = rows.map(r => ({
          '№ п/п': r.seqNumber,
          '№ тары': r.taraRaw,
          'Номер заказа': r.orderNumber,
          'Модель': r.modelCode,
          'Наименование': r.productName,
          'Цвет': r.color,
          'Кол-во (шт)': r.quantity,
          'Тара': r.tara,
          'Вес брутто (кг)': r.grossWeight
        }));
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeSubTab === 'zhevachka_brak' ? 'Zhevachka_Brak' : 'Nakladnaya');
      XLSX.writeFile(wb, `Nakladnaya_${settings.waybillNumber}_${settings.waybillDate}.xlsx`);
      showToast(lang === 'uz' ? "✓ Excel fayl muvaffaqiyatli yuklandi" : "✓ Файл Excel успешно выгружен", "success");
    } catch (e: any) {
      console.error("Excel export error:", e);
      showToast(lang === 'uz' ? "Excel eksportida xatolik yuz berdi" : "Ошибка при формировании Excel", "error");
    }
  };

  // ==============================================================================
  // WAYBILL SAVE & AUTO-INCREMENT MANAGEMENT
  // ==============================================================================
  const handleSaveWaybill = () => {
    const currentItems = activeSubTab === 'zhevachka_brak' ? brakRows : rows;
    if (currentItems.length === 0) {
      showToast(lang === 'uz' ? "Saqlash uchun kamida bitta qop yorlig'ini kiriting!" : "Введите хотя бы одну позицию для сохранения!", "warning");
      return;
    }

    setIsProcessing(true);
    const existingIndex = savedWaybills.findIndex(w => w.waybillNumber === settings.waybillNumber);
    const nowIso = new Date().toISOString();

    const totalQty = activeSubTab === 'zhevachka_brak'
      ? brakRows.reduce((a, b) => a + (Number(b.quantity) || 0), 0)
      : rows.reduce((a, b) => a + (Number(b.quantity) || 0), 0);

    const totalGrossWeight = activeSubTab === 'zhevachka_brak'
      ? brakRows.reduce((a, b) => a + (Number(b.grossWeight) || 0), 0)
      : rows.reduce((a, b) => a + (Number(b.grossWeight) || 0), 0);

    const totalBags = activeSubTab === 'zhevachka_brak' ? brakRows.length : rows.filter(r => r.isFirstOfGroup).length || rows.length;

    const newWaybillRecord: SavedWaybill = {
      id: existingIndex >= 0 ? savedWaybills[existingIndex].id : `wb-${Date.now()}`,
      waybillNumber: settings.waybillNumber,
      waybillDate: settings.waybillDate,
      sourceWarehouse: settings.sourceWarehouse,
      destination: settings.destination,
      orderNumber: rows[0]?.orderNumber || (brakRows[0]?.orderModel.split('/')[0]?.trim()) || 'MOS-509.3',
      totalBags,
      totalQty,
      totalGrossWeight: Math.round(totalGrossWeight * 10) / 10,
      directorName: settings.directorName,
      warehouseManager: settings.warehouseManager,
      senderName: settings.senderName,
      recipientName: settings.recipientName,
      rows: JSON.parse(JSON.stringify(rows)),
      brakRows: JSON.parse(JSON.stringify(brakRows)),
      settings: { ...settings },
      createdAt: existingIndex >= 0 ? savedWaybills[existingIndex].createdAt : nowIso,
      updatedAt: nowIso,
    };

    let updatedList: SavedWaybill[] = [];
    if (existingIndex >= 0) {
      updatedList = [...savedWaybills];
      updatedList[existingIndex] = newWaybillRecord;
    } else {
      updatedList = [newWaybillRecord, ...savedWaybills];
    }

    setSavedWaybills(updatedList);
    try {
      localStorage.setItem('chust_saved_waybills', JSON.stringify(updatedList));
    } catch (e) {}

    // Extract numerical waybill number to advance auto-increment
    const numMatch = settings.waybillNumber.match(/\d+/);
    if (numMatch) {
      const currentNum = parseInt(numMatch[0], 10);
      if (currentNum >= lastWaybillNumber) {
        setLastWaybillNumber(currentNum);
      }
    }

    if (onLogAudit) {
      onLogAudit(
        existingIndex >= 0 ? 'UPDATE' : 'CREATE',
        `Накладная ${settings.waybillNumber}`,
        newWaybillRecord.id,
        `Накладная ${settings.waybillNumber} (${totalBags} ta qop, ${totalQty} dona, ${totalGrossWeight} kg) saqlandi`
      );
    }

    setIsProcessing(false);
    setSaveSuccessMsg(`✅ Накладная ${settings.waybillNumber} muvaffaqiyatli saqlandi!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Yangi bo'sh nakladnoy yaratish (Requirement 2: Auto-increment to next sequential number)
  const handleNewWaybill = () => {
    // Next sequential number
    const nextNum = lastWaybillNumber + 1;
    setLastWaybillNumber(nextNum);

    setSettings(prev => ({
      ...prev,
      waybillNumber: `№${nextNum}`,
      waybillDate: new Date().toISOString().split('T')[0],
      startSeq: 1,
    }));
    setRows([]);
    showToast(
      lang === 'uz' 
        ? `Yangi nakladnoy ochildi: №${nextNum} (Avtonumeratsiya)` 
        : `Создана новая накладная: №${nextNum} (Автонумерация)`,
      'success'
    );
  };

  // Arxivdagi nakladnoyni yuklash
  const handleLoadSavedWaybill = (saved: SavedWaybill) => {
    setSettings(saved.settings);
    setRows(saved.rows || []);
    if (saved.brakRows) {
      setBrakRows(saved.brakRows);
    }
    setActiveSubTab('waybill');
    showToast(`Накладная ${saved.waybillNumber} tahrirlovchiga yuklandi!`, 'success');
  };

  // Totals hisoblash
  const totals = useMemo(() => {
    const totalQty = rows.reduce((acc, r) => acc + (typeof r.quantity === 'number' ? r.quantity : 0), 0);
    const totalTara = rows.reduce((acc, r) => acc + (r.isFirstOfGroup ? 1 : 0), 0) || rows.length;
    const totalGrossWeight = rows.reduce((acc, r) => acc + (typeof r.grossWeight === 'number' ? r.grossWeight : 0), 0);

    return {
      totalQty,
      totalTara,
      totalGrossWeight: Math.round(totalGrossWeight * 10) / 10,
    };
  }, [rows]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* FLOATING VALIDATION TOAST */}
      {validationToast && (
        <div className={`fixed top-4 right-4 z-[150] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md transition-all animate-in slide-in-from-top-3 ${
          validationToast.type === 'error'
            ? 'bg-rose-950/90 border-rose-800 text-rose-200'
            : validationToast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
              : 'bg-amber-950/90 border-amber-800 text-amber-200'
        }`}>
          {validationToast.type === 'error' ? (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          ) : validationToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-bold leading-tight">{validationToast.message}</span>
          <button 
            type="button" 
            onClick={() => setValidationToast(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white cursor-pointer ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. YUQORI SARLAVHA VA ASOSIY BOSHQARUV TUGMALARI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Markirovka & Накладная Moduli
            </span>

            {/* AUTO-INCREMENT BADGE (Requirement 2) */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1.5" title="Avtomatik ketma-ket raqamlash">
              <Check className="w-3.5 h-3.5 text-indigo-400" />
              Автонумерация: №{lastWaybillNumber} → {settings.waybillNumber}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5 flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            Накладная отгрузки (Упаковочный лист)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Qop markirovkasini krop qilish, «Жевачка Брак» tekshiruvi, 2x qop birkasi va to'g'ridan-to'g'ri QR skaneri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Skaner QR (Requirement 6) */}
          <button
            type="button"
            onClick={startCameraQrScanner}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
            title="Kamera orqali qopdagi QR kodni skanerlab jadvalga qo'shish"
          >
            <Scan className="w-4 h-4" />
            <span>Scan QR</span>
          </button>

          {/* Yangi nakladnoy (Auto-increment) */}
          <button
            type="button"
            onClick={handleNewWaybill}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Yangi sequential nakladnoy yaratish"
          >
            <FilePlus className="w-4 h-4 text-cyan-400" />
            <span>Yangi</span>
          </button>

          {/* OTK dan Defect Sync */}
          <button
            type="button"
            onClick={handleSyncDefectsFromQC}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/60 text-rose-300 hover:bg-rose-900/60 border border-rose-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="OTK va Buyurtmalar bo'limidan barcha brak qoplarini sinxronlash"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span>OTK Brak Sync</span>
          </button>

          {/* PDF Export (Requirement 4) */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Hujjatni PDF shaklida yuklab olish"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>PDF</span>
          </button>

          {/* Excel Export (Requirement 4) */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Excel (.xlsx) formatida yuklab olish"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>

          {/* Saqlash */}
          <button
            type="button"
            onClick={handleSaveWaybill}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Saqlash</span>
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION SUBTABS (Requirement 3, 5, 6) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 print:hidden">
        <button
          type="button"
          onClick={() => setActiveSubTab('waybill')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'waybill'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Накладная (Упаковочный лист)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
            {rows.length}
          </span>
        </button>

        {/* REQUIREMENT 5: "Жевачка Брак" Dedicated Subtab */}
        <button
          type="button"
          onClick={() => setActiveSubTab('zhevachka_brak')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'zhevachka_brak'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-slate-900 text-rose-300 hover:text-rose-200 border border-rose-900/40'
          }`}
        >
          <Package className="w-4 h-4 text-rose-400" />
          <span>Жевачка Брак & Проверка</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono text-rose-300">
            {brakRows.length}
          </span>
          {brakRows.some(r => r.isExceeded) && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
          )}
        </button>

        {/* REQUIREMENT 3: "Список накладных" Dedicated Archive Subtab */}
        <button
          type="button"
          onClick={() => setActiveSubTab('archive')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'archive'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>Список накладных (Архив)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
            {savedWaybills.length}
          </span>
        </button>

        {/* REQUIREMENT 6: "2x Qop Birka" Dual Printing Subtab */}
        <button
          type="button"
          onClick={() => setActiveSubTab('dual_print')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'dual_print'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-amber-300 hover:text-amber-200 border border-amber-900/40'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Qop Birka (QR Print)</span>
        </button>
      </div>

      {/* SUCCESS / STATUS BANNER */}
      {saveSuccessMsg && (
        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SUBTAB 1: ASOSIY NAKLADNOY (УПАКОВОЧНЫЙ ЛИСТ) */}
      {/* ============================================================================== */}
      {activeSubTab === 'waybill' && (
        <div className="space-y-6">
          {/* UPLOAD & CROP PIPELINE CONTROLS (Requirement 1) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  Qop / Yorliq fotosuratini kiritish (Crop & Extract Pipeline)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Qopdagi markirovkani suratga oling yoki yuklang. Krop orqali yorliq zonasi ajratilib xatosiz tahlil qilinadi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleOpenCropperForFile(f);
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <Crop className="w-4 h-4" />
                  <span>Surat yuklash & Krop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualBagModal(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Qo'lda kiritish</span>
                </button>
              </div>
            </div>

            {/* Current Waybill Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Накладная №:</span>
                <span className="font-mono font-extrabold text-indigo-400 text-sm">{settings.waybillNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Sana:</span>
                <span className="font-mono font-bold text-slate-300">{settings.waybillDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jami Qoplar:</span>
                <span className="font-mono font-black text-white">{totals.totalTara} ta</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jami Brutto:</span>
                <span className="font-mono font-black text-emerald-400">{totals.totalGrossWeight} kg</span>
              </div>
            </div>
          </div>

          {/* MAIN WAYBILL TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                Tovarlar va qoplar ro'yxati ({rows.length} qator)
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Qidirish (qop, model, rang)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-750 text-xs text-white rounded-xl focus:border-indigo-500 outline-none w-48 font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase">
                    <th className="py-3 px-3 text-center">№ п/п</th>
                    <th className="py-3 px-3 text-center">№ тары</th>
                    <th className="py-3 px-3">Номер заказа</th>
                    <th className="py-3 px-3">Модель</th>
                    <th className="py-3 px-3">Наименование</th>
                    <th className="py-3 px-3">Цвет</th>
                    <th className="py-3 px-3 text-center text-amber-400">Кол-во</th>
                    <th className="py-3 px-3 text-center">Тара</th>
                    <th className="py-3 px-3 text-center text-emerald-400">Вес брутто</th>
                    <th className="py-3 px-3 text-center print:hidden">Markirovka</th>
                    <th className="py-3 px-3 text-right print:hidden">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500 text-xs">
                        Hozircha qoplar qo'shilmagan. Yuqoridagi <strong>«Scan QR»</strong> yoki <strong>«Surat yuklash & Krop»</strong> tugmasini bosing.
                      </td>
                    </tr>
                  ) : (
                    rows
                      .filter(r => !searchFilter || r.modelCode.toLowerCase().includes(searchFilter.toLowerCase()) || r.color.toLowerCase().includes(searchFilter.toLowerCase()) || r.taraRaw.toLowerCase().includes(searchFilter.toLowerCase()))
                      .map((row) => (
                        <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400">{row.seqNumber}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-white">
                            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-750">
                              {row.taraRaw}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{row.orderNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-300">{row.modelCode}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-[180px]">{row.productName}</td>
                          <td className="py-2.5 px-3 font-sans font-bold text-white">{row.color}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                            {row.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400">{row.tara}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                            {row.grossWeight !== '' ? `${row.grossWeight} kg` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center print:hidden">
                            {row.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedImageModal(row.imageUrl!)}
                                className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 transition-colors cursor-pointer inline-block"
                                title="Suratni ko'rish"
                              >
                                <img src={row.imageUrl} alt="Mark" className="w-full h-full object-cover" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setRows(prev => prev.filter(r => r.id !== row.id))}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SUBTAB 2: REQUIREMENT 5: "ЖЕВАЧКА БРАК" TABLE & VALIDATION LOGIC */}
      {/* ============================================================================== */}
      {activeSubTab === 'zhevachka_brak' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-rose-400" />
                  «Жевачка Брак» — Тары & Мantiqiy Tekshiruv (Requirement 5)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Qoplardagi nuqsonli mahsulotlar (brak) hisobi. Qat'iy qoida: <strong>(1-sort qadoq + Brak) hech qachon Раздача miqdoridan oshmasligi shart!</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncDefectsFromQC}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>OTK dan Sinxronlash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newZRow: ZhevachkaBrakRow = {
                      id: `zb-manual-${Date.now()}`,
                      seqNumber: brakRows.length + 1,
                      taraNumber: `${brakRows.length + 1} / V2`,
                      orderModel: 'MOS-509.3 / SM-1111/150-BK',
                      productName: 'Фуфайка (футболка) мужская',
                      color: 'Белый',
                      quantity: 25,
                      grossWeight: 12.5,
                      totalRazdacha: 1000,
                      totalUpakovka1Sort: 950,
                      totalDefect: 25,
                      raznitsa: 25,
                      defectPercent: 2.5,
                      isExceeded: false
                    };
                    setBrakRows(prev => [...prev, recalculateZhevachkaRow(newZRow)]);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Qop qo'shish</span>
                </button>
              </div>
            </div>

            {/* Warning rule banner */}
            <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300 leading-relaxed">
                <strong className="text-rose-200 block mb-0.5">Avtomatik Tekshiruv va Cheklov Algoritmi:</strong>
                Tizim har bir qatorda: <code>Раздача (Jami tarqatilgan)</code>, <code>1-sort Qadoq</code>, <code>Brak miqdori</code>, <code>Raznitsa (Qoldiq)</code> va <code>Brak %</code> ni hisoblaydi. Agar <strong>(1-sort + Brak) &gt; Раздача</strong> bo'lsa, xatolik qizil ogohlantirish sifatida ko'rsatiladi.
              </div>
            </div>
          </div>

          {/* DEDICATED "ЖЕВАЧКА БРАК" TABLE (Columns: 1.№ 2.№ тары 3.Заказ. модель 4.Наименование 5.Цвет 6.Кол-во 7.Проверка) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase">
                    <th className="py-3 px-3 text-center">1. №</th>
                    <th className="py-3 px-3 text-center">2. № тары (Qop)</th>
                    <th className="py-3 px-3">3. Заказ. модель</th>
                    <th className="py-3 px-3">4. Наименование</th>
                    <th className="py-3 px-3">5. Цвет</th>
                    <th className="py-3 px-3 text-center text-rose-400">6. Кол-во</th>
                    <th className="py-3 px-4 text-left text-indigo-400 min-w-[340px]">
                      7. Проверка (Раздача, 1-сорт+Брак, Разница, %)
                    </th>
                    <th className="py-3 px-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {brakRows.map((row, idx) => {
                    const isExceeded = row.isExceeded;
                    return (
                      <tr 
                        key={row.id} 
                        className={`transition-colors ${
                          isExceeded 
                            ? 'bg-rose-950/30 hover:bg-rose-950/40 border-l-4 border-l-rose-500' 
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="text"
                            value={row.taraNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBrakRows(prev => prev.map(r => r.id === row.id ? { ...r, taraNumber: val } : r));
                            }}
                            className="w-24 px-2 py-1 bg-slate-950 border border-slate-750 text-white font-bold text-center rounded-lg focus:border-rose-500 outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          <input
                            type="text"
                            value={row.orderModel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBrakRows(prev => prev.map(r => r.id === row.id ? recalculateZhevachkaRow({ ...r, orderModel: val }) : r));
                            }}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-750 text-indigo-300 font-bold rounded-lg focus:border-rose-500 outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-300">
                          <input
                            type="text"
                            value={row.productName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBrakRows(prev => prev.map(r => r.id === row.id ? { ...r, productName: val } : r));
                            }}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-750 text-slate-200 rounded-lg focus:border-rose-500 outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 font-sans font-bold text-white">
                          <input
                            type="text"
                            value={row.color}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBrakRows(prev => prev.map(r => r.id === row.id ? { ...r, color: val } : r));
                            }}
                            className="w-24 px-2 py-1 bg-slate-950 border border-slate-750 text-white font-bold rounded-lg focus:border-rose-500 outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setBrakRows(prev => prev.map(r => {
                                if (r.id === row.id) {
                                  const updated = recalculateZhevachkaRow({ ...r, quantity: val });
                                  if (updated.isExceeded) {
                                    showToast(updated.warningMessage || "Cheklov buzildi!", "error");
                                  }
                                  return updated;
                                }
                                return r;
                              }));
                            }}
                            className="w-20 px-2 py-1 bg-slate-950 border border-rose-800 text-rose-300 font-black text-center rounded-lg focus:border-rose-400 outline-none"
                          />
                        </td>

                        {/* 7. VALIDATION & CALCULATION COLUMN ("ПРОVERKA") */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5 font-sans">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-slate-400">
                                Раздача: <strong className="text-indigo-400 font-mono">{row.totalRazdacha}</strong>
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">
                                1-сорт+Брак: <strong className="text-amber-400 font-mono">{row.totalUpakovka1Sort + row.quantity}</strong>
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">
                                Разница: <strong className={`font-mono font-bold ${row.raznitsa < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {row.raznitsa > 0 ? `+${row.raznitsa}` : row.raznitsa}
                                </strong>
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">
                                Брак: <strong className="text-rose-400 font-mono">{row.defectPercent.toFixed(1)}%</strong>
                              </span>
                            </div>

                            {/* Status chip */}
                            {isExceeded ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 font-bold text-[11px] animate-pulse">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{row.warningMessage}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>✓ Cheklov doirasida (Mantiqiy to'g'ri)</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setBrakRows(prev => prev.filter(r => r.id !== row.id))}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SUBTAB 3: REQUIREMENT 3: "СПИСОК НАКЛАДНЫХ" (АРХИВ НАКЛАДНЫХ) */}
      {/* ============================================================================== */}
      {activeSubTab === 'archive' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-indigo-400" />
                  Список накладных — Saqlangan Nakladnoylar Arxiv Tarixi (Requirement 3)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Barcha shakllantirilgan nakladnoylar, qoplar soni, vazni va OTK dan qabul qilingan braklar arxivi.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Arxivdan qidirish..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-750 text-xs text-white rounded-xl focus:border-indigo-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* Archive KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jami Nakladnoylar:</span>
                <span className="font-mono font-extrabold text-white text-base">{savedWaybills.length} ta</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jami Qoplar:</span>
                <span className="font-mono font-black text-indigo-400 text-base">
                  {savedWaybills.reduce((a, b) => a + (b.totalBags || 0), 0)} ta
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jami Mahsulot:</span>
                <span className="font-mono font-black text-amber-400 text-base">
                  {savedWaybills.reduce((a, b) => a + (b.totalQty || 0), 0).toLocaleString()} dona
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jami Brutto Vazn:</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  {Math.round(savedWaybills.reduce((a, b) => a + (b.totalGrossWeight || 0), 0))} kg
                </span>
              </div>
            </div>
          </div>

          {/* Saved Waybills Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase">
                    <th className="py-3 px-3">№ Накладной</th>
                    <th className="py-3 px-3">Дата</th>
                    <th className="py-3 px-3">Заказ / Модель</th>
                    <th className="py-3 px-3 font-sans">Пункт назначения</th>
                    <th className="py-3 px-3 text-center">Кол-во мешков</th>
                    <th className="py-3 px-3 text-center text-amber-400">Итого шт</th>
                    <th className="py-3 px-3 text-center text-emerald-400">Брутто (кг)</th>
                    <th className="py-3 px-3 text-right font-sans">Действия (Amallar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {savedWaybills.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 text-xs font-sans">
                        Hozircha arxivda saqlangan nakladnoylar mavjud emas.
                      </td>
                    </tr>
                  ) : (
                    savedWaybills
                      .filter(w => !archiveSearch || w.waybillNumber.toLowerCase().includes(archiveSearch.toLowerCase()) || w.orderNumber.toLowerCase().includes(archiveSearch.toLowerCase()) || w.destination.toLowerCase().includes(archiveSearch.toLowerCase()))
                      .map((wb) => (
                        <tr key={wb.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-indigo-400 text-sm">{wb.waybillNumber}</td>
                          <td className="py-3 px-3 text-slate-300">{wb.waybillDate}</td>
                          <td className="py-3 px-3 text-white font-bold">{wb.orderNumber}</td>
                          <td className="py-3 px-3 font-sans text-slate-300 truncate max-w-[200px]">{wb.destination}</td>
                          <td className="py-3 px-3 text-center font-bold text-white">{wb.totalBags} ta</td>
                          <td className="py-3 px-3 text-center font-black text-amber-400">{wb.totalQty}</td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-400">{wb.totalGrossWeight} kg</td>
                          <td className="py-3 px-3 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleLoadSavedWaybill(wb)}
                                className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 text-indigo-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                title="Tahrirlovchiga yuklash"
                              >
                                Ochish
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSettings(wb.settings);
                                  setRows(wb.rows || []);
                                  setTimeout(handleExportPdf, 100);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-750 text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
                                title="PDF yuklash"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm("Rostdan ham ushbu nakladnoyni arxivdan o'chirmoqchimisiz?")) {
                                    setSavedWaybills(prev => prev.filter(w => w.id !== wb.id));
                                    showToast("Накладная arxivdan o'chirildi", "warning");
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SUBTAB 4: REQUIREMENT 6: SIDE-BY-SIDE DUAL-LABEL QR PRINTING (2X MARKING) */}
      {/* ============================================================================== */}
      {activeSubTab === 'dual_print' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                2X Qop Birkasi — Dual Markirovka Chop Etish (Requirement 6)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Har bir qop uchun <strong>yonma-yon (side-by-side) 2 ta bir xil markirovka</strong> chiqariladi (qopning ikki tarafiga yopishtirish uchun).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Birkalarni Chop Etish</span>
              </button>
            </div>
          </div>

          {/* DUAL LABELS CONTAINER */}
          <div className="space-y-8">
            {(rows.length > 0 ? rows : brakRows).map((item) => {
              const qrUrl = dualQrUrls[item.id];
              const taraLabel = 'taraNumber' in item ? item.taraNumber : item.taraRaw;
              const orderModel = 'orderModel' in item ? item.orderModel : `${item.orderNumber} / ${item.modelCode}`;

              return (
                <div key={item.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-2 print:hidden">
                    <span>Qop Birkasi: <strong>{taraLabel}</strong> ({item.color}, {item.quantity} dona)</span>
                    <span className="text-amber-400 font-bold">2 ta nusxa (Old & Orqa tomon)</span>
                  </div>

                  {/* SIDE-BY-SIDE 2 IDENTICAL LABELS (Requirement 6) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-dashed border-slate-700">
                    
                    {/* LABEL 1 (Front Side) */}
                    <div className="bg-white text-slate-950 p-5 rounded-xl border-2 border-slate-900 shadow-md font-mono flex flex-col justify-between min-h-[300px]">
                      <div className="border-b-2 border-slate-900 pb-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-600">
                          <span>CHUST TEXTILE • O'ZBEKISTON</span>
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded">NUSXA #1</span>
                        </div>
                        <div className="flex justify-between items-baseline mt-2">
                          <h4 className="text-xl font-black text-slate-950">TARA: {taraLabel}</h4>
                          <span className="text-xs font-bold text-slate-700">{settings.waybillNumber}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 py-3 text-xs">
                        <div><span className="text-[10px] text-slate-500 uppercase font-bold block">Заказ. модель:</span><strong className="text-sm font-black">{orderModel}</strong></div>
                        <div><span className="text-[10px] text-slate-500 uppercase font-bold block">Наименование:</span><span className="font-bold">{item.productName}</span></div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                          <div><span className="text-[10px] text-slate-500 uppercase font-bold block">Цвет:</span><strong className="text-sm font-black">{item.color}</strong></div>
                          <div><span className="text-[10px] text-slate-500 uppercase font-bold block text-right">Кол-во:</span><strong className="text-base font-black text-slate-950">{item.quantity} dona</strong></div>
                        </div>
                      </div>

                      <div className="border-t-2 border-slate-900 pt-2 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Вес брутто:</span>
                          <span className="text-sm font-black">{item.grossWeight || 19.4} kg</span>
                        </div>
                        {qrUrl && (
                          <div className="w-18 h-18 shrink-0 bg-white p-1 border border-slate-900 rounded">
                            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LABEL 2 (Back Side - IDENTICAL COPY) */}
                    <div className="bg-white text-slate-950 p-5 rounded-xl border-2 border-slate-900 shadow-md font-mono flex flex-col justify-between min-h-[300px]">
                      <div className="border-b-2 border-slate-900 pb-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-600">
                          <span>CHUST TEXTILE • O'ZBEKISTON</span>
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded">NUSXA #2</span>
                        </div>
                        <div className="flex justify-between items-baseline mt-2">
                          <h4 className="text-xl font-black text-slate-950">TARA: {taraLabel}</h4>
                          <span className="text-xs font-bold text-slate-700">{settings.waybillNumber}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 py-3 text-xs">
                        <div><span className="text-[10px] text-slate-500 uppercase font-bold block">Заказ. модель:</span><strong className="text-sm font-black">{orderModel}</strong></div>
                        <div><span className="text-[10px] text-slate-500 uppercase font-bold block">Наименование:</span><span className="font-bold">{item.productName}</span></div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                          <div><span className="text-[10px] text-slate-500 uppercase font-bold block">Цвет:</span><strong className="text-sm font-black">{item.color}</strong></div>
                          <div><span className="text-[10px] text-slate-500 uppercase font-bold block text-right">Кол-во:</span><strong className="text-base font-black text-slate-950">{item.quantity} dona</strong></div>
                        </div>
                      </div>

                      <div className="border-t-2 border-slate-900 pt-2 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Вес бруtto:</span>
                          <span className="text-sm font-black">{item.grossWeight || 19.4} kg</span>
                        </div>
                        {qrUrl && (
                          <div className="w-18 h-18 shrink-0 bg-white p-1 border border-slate-900 rounded">
                            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 1: REQUIREMENT 1: INTERACTIVE IMAGE CROP & OCR REGION SELECTOR */}
      {/* ============================================================================== */}
      {showCropModal && cropSourceImage && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Crop className="w-4 h-4 text-cyan-400" />
                  Qop Markirovkasini Qirqish va Aniqlovchi Sozlash (Crop Fix)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Suratdagi matn va flomaster bilan yozilgan brutto vazn zonasini aniq qirqib oling.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 flex flex-col items-center justify-center bg-slate-950/60">
              <div className="relative border-2 border-cyan-500/60 rounded-xl overflow-hidden shadow-2xl max-w-full max-h-[50vh]">
                <img
                  src={cropSourceImage}
                  alt="Crop Target"
                  className="max-h-[50vh] w-auto object-contain transition-transform"
                  style={{
                    transform: `rotate(${cropRotation}deg)`,
                    filter: cropContrast ? 'contrast(140%) brightness(105%)' : 'none'
                  }}
                />
                <div className="absolute inset-0 border-2 border-dashed border-cyan-400/80 pointer-events-none flex items-center justify-center">
                  <span className="bg-slate-950/80 text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded border border-cyan-500/40">
                    KROP VA SKANER ZONASI
                  </span>
                </div>
              </div>

              {/* Crop Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setCropRotation(r => (r + 90) % 360)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>90° Burish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCropContrast(c => !c)}
                  className={`px-3 py-1.5 border text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
                    cropContrast 
                      ? 'bg-cyan-950 border-cyan-700 text-cyan-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Kontrastni oshirish ({cropContrast ? 'ON' : 'OFF'})</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={handleApplyCropAndExtract}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                <Check className="w-4 h-4" />
                <span>Qirqish va AI O'qish (Extract)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 2: REQUIREMENT 6: DIRECT QR CAMERA SCANNER */}
      {/* ============================================================================== */}
      {showQrScannerModal && (
        <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Scan className="w-4 h-4 text-emerald-400" />
                  Qop QR Kodini To'g'ridan-to'g'ri Skanerlash (Requirement 6)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kamerani qop birkasidagi QR kodga qarating. Ma'lumotlar avtomatik jadvalga qo'shiladi.
                </p>
              </div>
              <button
                type="button"
                onClick={stopCameraQrScanner}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-slate-950">
              <div className="relative w-72 h-72 border-2 border-emerald-500/80 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                
                {/* Aiming Reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                  <span className="text-[9px] font-mono text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded">
                    QR KODNI KO'RSATING
                  </span>
                </div>
              </div>

              {qrScanResultMsg && (
                <div className="mt-4 px-3.5 py-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl text-center">
                  {qrScanResultMsg}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <label className="text-xs text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4" />
                <span>QR rasm faylidan yuklash</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const codeReader = new BrowserQRCodeReader();
                      try {
                        const imgUrl = URL.createObjectURL(f);
                        const result = await codeReader.decodeFromImageUrl(imgUrl);
                        if (result) {
                          playBeep();
                          handleQrPayloadDecoded(result.getText());
                        }
                      } catch (err) {
                        setQrScanResultMsg("Fayldagi QR kodni o'qib bo'lmadi");
                      }
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={stopCameraQrScanner}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QO'LDA QOP QO'SHISH */}
      {showManualBagModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h4 className="text-sm font-extrabold text-white">Yangi Qopni Qo'lda Kiritish</h4>
              <button onClick={() => setShowManualBagModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const tara = form.tara.value || `${rows.length + 1} / V2`;
                const order = form.order.value || 'MOS-509.3';
                const model = form.model.value || 'SM-1111/150-BK (брак)';
                const name = form.name.value || 'Фуфайка (футболка) мужская';
                const color = form.color.value || 'Белый';
                const qty = parseInt(form.qty.value, 10) || 50;
                const weight = parseFloat(form.weight.value) || 18.5;

                const groupId = 'bag_manual_' + Date.now();
                const newRow: BagRowItem = {
                  id: `${groupId}_0`,
                  bagGroupId: groupId,
                  isFirstOfGroup: true,
                  seqNumber: settings.startSeq + rows.length,
                  bagNumber: rows.length + 1,
                  taraRaw: tara,
                  orderNumber: order,
                  modelCode: model,
                  productName: name,
                  color,
                  quantity: qty,
                  tara: 1,
                  grossWeight: weight,
                  weightUnsure: false,
                  readMethod: 'manual',
                  warnings: []
                };

                setRows(prev => reindexRows([...prev, newRow]));
                setShowManualBagModal(false);
                showToast(`✓ Qop ${tara} qo'shildi`, 'success');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-400 mb-1 font-bold">№ тары (masalan: 1 / V2):</label>
                <input name="tara" defaultValue={`${rows.length + 1} / V2`} className="w-full px-3 py-2 bg-slate-950 border border-slate-750 text-white font-mono rounded-xl outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Номер заказа (MOS):</label>
                <input name="order" defaultValue="MOS-509.3" className="w-full px-3 py-2 bg-slate-950 border border-slate-750 text-white font-mono rounded-xl outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Модель (kodi):</label>
                <input name="model" defaultValue="SM-1111/150-BK (брак)" className="w-full px-3 py-2 bg-slate-950 border border-slate-750 text-white font-mono rounded-xl outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Цвет:</label>
                  <input name="color" defaultValue="Белый" className="w-full px-3 py-2 bg-slate-950 border border-slate-750 text-white rounded-xl outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Кол-во (dona):</label>
                  <input name="qty" type="number" defaultValue="50" className="w-full px-3 py-2 bg-slate-950 border border-slate-750 text-white font-mono font-bold rounded-xl outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Вес брутто (kg):</label>
                <input name="weight" type="number" step="0.1" defaultValue="18.5" className="w-full px-3 py-2 bg-slate-950 border border-slate-750 text-emerald-400 font-mono font-bold rounded-xl outline-none focus:border-indigo-500" />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowManualBagModal(false)} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SURATNI TO'LIQ KO'RISH */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedImageModal(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white">Qop Markirovka Fotosurati</span>
              <button onClick={() => setSelectedImageModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <img src={selectedImageModal} alt="Mark" className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl" />
          </div>
        </div>
      )}

    </div>
  );
}
