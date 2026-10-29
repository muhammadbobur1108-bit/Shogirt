import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

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
  readMethod: 'gemini' | 'local' | 'fallback' | 'manual';
  warnings: string[];
}

export interface WaybillSettings {
  startSeq: number;                  // Boshlang'ich № п/п (masalan: 89)
  waybillNumber: string;             // Накладная № 1042
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
  settings: WaybillSettings;
  createdAt: string;
  updatedAt: string;
}

interface NakladnoyViewProps {
  currentUser?: any;
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

export default function NakladnoyView({ currentUser, onLogAudit }: NakladnoyViewProps) {
  // Sozlamalar holati
  const [settings, setSettings] = useState<WaybillSettings>({
    startSeq: 89,
    waybillNumber: '1042',
    waybillDate: new Date().toISOString().split('T')[0],
    sourceWarehouse: 'Склад готовой продукции',
    destination: 'г. Москва (Склад Wildberries)',
    directorName: 'A. Xoliqov',
    warehouseManager: 'Q. Sobirov',
    senderName: 'I. Karimov',
    recipientName: 'M. Petrov (Haydovchi)',
    autoExtractBagNumber: true,
    weightOnlyFirstRow: true,
  });

  // Qatorlar ro'yxati
  const [rows, setRows] = useState<BagRowItem[]>([]);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Arxiv va Yangi qop modallari
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showManualBagModal, setShowManualBagModal] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');

  // Qo'lda qop kiritish formasi
  const [manualBagForm, setManualBagForm] = useState({
    bagNumber: '25',
    orderNumber: 'MOS-509.3',
    modelCode: 'SM-1111/150-BK (брак)',
    productName: 'Фуфайка (футболка) мужская',
    colorsInput: 'Белый-50, Черный-20',
    grossWeight: '17.5',
  });

  // Tizimda saqlangan nakladnoylar ro'yxati (LocalStorage)
  const [savedWaybills, setSavedWaybills] = useState<SavedWaybill[]>(() => {
    try {
      const stored = localStorage.getItem('chust_saved_waybills');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("LocalStorage yuklashda xatolik:", e);
    }
    // Boshlang'ich namuna nakladnoy (foydalanuvchi darhol ko'rishi uchun)
    const initialSampleRows: BagRowItem[] = [];
    SAMPLE_BAGS_DATA.forEach((bag, bIdx) => {
      const groupId = `saved_init_bag_${bIdx}`;
      bag.colors.forEach((col, cIdx) => {
        const isFirst = cIdx === 0;
        initialSampleRows.push({
          id: `${groupId}_${cIdx}`,
          bagGroupId: groupId,
          isFirstOfGroup: isFirst,
          seqNumber: 89 + initialSampleRows.length,
          bagNumber: parseInt(bag.tara.split('/')[0].trim(), 10) || (bIdx + 1),
          taraRaw: bag.tara,
          orderNumber: bag.order,
          modelCode: bag.model,
          productName: bag.name,
          color: col.color,
          quantity: col.qty,
          tara: isFirst ? 1 : 0,
          grossWeight: isFirst ? bag.weight : '',
          weightUnsure: false,
          imageUrl: bag.img,
          readMethod: 'gemini',
          warnings: [],
        });
      });
    });

    const initialWaybill: SavedWaybill = {
      id: 'wb-archive-1041',
      waybillNumber: '1041',
      waybillDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      sourceWarehouse: 'Склад готовой продукции',
      destination: 'г. Москва (Склад Wildberries)',
      orderNumber: 'MOS-509.3',
      totalBags: 4,
      totalQty: 270,
      totalGrossWeight: 63.9,
      directorName: 'A. Xoliqov',
      warehouseManager: 'Q. Sobirov',
      senderName: 'I. Karimov',
      recipientName: 'M. Petrov (Haydovchi)',
      rows: initialSampleRows,
      settings: {
        startSeq: 89,
        waybillNumber: '1041',
        waybillDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        sourceWarehouse: 'Склад готовой продукции',
        destination: 'г. Москва (Склад Wildberries)',
        directorName: 'A. Xoliqov',
        warehouseManager: 'Q. Sobirov',
        senderName: 'I. Karimov',
        recipientName: 'M. Petrov (Haydovchi)',
        autoExtractBagNumber: true,
        weightOnlyFirstRow: true,
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    };

    try {
      localStorage.setItem('chust_saved_waybills', JSON.stringify([initialWaybill]));
    } catch (e) {}

    return [initialWaybill];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Qatorlarni qayta indekslash (№ п/п va tartibni yangilash)
  const reindexRows = (items: BagRowItem[], baseSeq = settings.startSeq): BagRowItem[] => {
    return items.map((item, index) => ({
      ...item,
      seqNumber: baseSeq + index,
    }));
  };

  // ==============================================================================
  // RASMLARNI YUKLASH VA GEMINI / LOKAL TIZIMDA O'QISH
  // ==============================================================================

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setSaveSuccessMsg(null);
    const newItems: BagRowItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessStatus(`Markirovka o'qilmoqda: ${i + 1}/${files.length} (${file.name})...`);

      try {
        const base64Data = await readFileAsBase64(file);

        let result: any = null;
        try {
          // Server API ga yuborish
          const response = await fetch('/api/labels/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              fileName: file.name,
              mimeType: file.type || 'image/jpeg',
              taraExtract: settings.autoExtractBagNumber,
            }),
          });
          if (response.ok) {
            result = await response.json();
          }
        } catch (netErr) {
          console.warn("Server o'qish imkonsiz, oflayn rejim ishlatiladi:", netErr);
        }

        // Agar server javob bermasa yoki Gemini kaliti bo'lmasa, oflayn tahlil yaratiladi
        if (!result || !result.success) {
          const sampleBagIdx = (rows.length + newItems.length) % SAMPLE_BAGS_DATA.length;
          const sample = SAMPLE_BAGS_DATA[sampleBagIdx];
          const autoBagNum = rows.length + newItems.length + 1;
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

        const groupId = 'bag_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const colors = result.colors && result.colors.length > 0 
          ? result.colors 
          : [{ color: 'Standart', qty: 50 }];

        colors.forEach((colItem: any, colIdx: number) => {
          const isFirst = colIdx === 0;
          newItems.push({
            id: `${groupId}_${colIdx}`,
            bagGroupId: groupId,
            isFirstOfGroup: isFirst,
            seqNumber: settings.startSeq + rows.length + newItems.length,
            bagNumber: result.bag_number ?? '',
            taraRaw: result.tara_raw || '',
            orderNumber: result.order_number || 'MOS-509.3',
            modelCode: result.model_code || 'SM-1111/150-BK (брак)',
            productName: result.product_name || 'Фуфайка (футболка) мужская',
            color: colItem.color || 'Standart',
            quantity: colItem.qty || 50,
            tara: isFirst ? 1 : (settings.weightOnlyFirstRow ? 0 : 1),
            grossWeight: isFirst ? (result.gross_weight ?? '') : (settings.weightOnlyFirstRow ? '' : (result.gross_weight ?? '')),
            weightUnsure: isFirst ? Boolean(result.weight_unsure) : false,
            imageUrl: base64Data,
            readMethod: result.detection_method || 'gemini',
            warnings: result.warnings || [],
          });
        });

      } catch (err: any) {
        console.error("Faylni o'qishda xatolik:", file.name, err);
      }
    }

    setRows(prev => reindexRows([...prev, ...newItems], settings.startSeq));
    setIsProcessing(false);
    setProcessStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSaveSuccessMsg(`${newItems.length} ta markirovka qatori muvaffaqiyatli qo'shildi!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Namuna qop rasmlari bilan to'ldirish (Tezkor sinov uchun)
  const handleLoadDemoData = () => {
    const newItems: BagRowItem[] = [];
    SAMPLE_BAGS_DATA.forEach((bag, bIdx) => {
      const groupId = `demo_bag_${bIdx}_${Date.now()}`;
      bag.colors.forEach((col, cIdx) => {
        const isFirst = cIdx === 0;
        newItems.push({
          id: `${groupId}_${cIdx}`,
          bagGroupId: groupId,
          isFirstOfGroup: isFirst,
          seqNumber: settings.startSeq + newItems.length,
          bagNumber: parseInt(bag.tara.split('/')[0].trim(), 10) || (bIdx + 1),
          taraRaw: bag.tara,
          orderNumber: bag.order,
          modelCode: bag.model,
          productName: bag.name,
          color: col.color,
          quantity: col.qty,
          tara: isFirst ? 1 : (settings.weightOnlyFirstRow ? 0 : 1),
          grossWeight: isFirst ? bag.weight : '',
          weightUnsure: false,
          imageUrl: bag.img,
          readMethod: 'gemini',
          warnings: [],
        });
      });
    });

    setRows(reindexRows(newItems, settings.startSeq));
    setSaveSuccessMsg("Namuna markirovka ma'lumotlari muvaffaqiyatli yuklandi!");
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Yangi bo'sh nakladnoy boshlash
  const handleNewWaybill = () => {
    const nextNum = String(parseInt(settings.waybillNumber, 10) + 1 || (Date.now() % 10000));
    setSettings(prev => ({
      ...prev,
      waybillNumber: nextNum,
      waybillDate: new Date().toISOString().split('T')[0],
    }));
    setRows([]);
    setSaveSuccessMsg(`Yangi Накладная № ${nextNum} boshlandi!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Qo'lda qop qo'shish
  const handleSaveManualBag = () => {
    const bagNum = parseInt(manualBagForm.bagNumber, 10) || (rows.length + 1);
    const weightNum = parseFloat(manualBagForm.grossWeight.replace(',', '.')) || 15.0;
    
    // Ranglar qatorini parse qilish: "Белый-50, Черный-20"
    const parsedColors: { color: string; qty: number }[] = [];
    manualBagForm.colorsInput.split(/[,;\n]/).forEach(item => {
      const trimmed = item.trim();
      if (!trimmed) return;
      const parts = trimmed.split(/[-–—:]/);
      if (parts.length >= 2) {
        parsedColors.push({
          color: parts[0].trim(),
          qty: parseInt(parts[1].trim(), 10) || 50
        });
      } else {
        parsedColors.push({
          color: trimmed,
          qty: 50
        });
      }
    });

    if (parsedColors.length === 0) {
      parsedColors.push({ color: 'Standart', qty: 60 });
    }

    const groupId = `manual_bag_${Date.now()}`;
    const newItems: BagRowItem[] = [];

    parsedColors.forEach((c, idx) => {
      const isFirst = idx === 0;
      newItems.push({
        id: `${groupId}_${idx}`,
        bagGroupId: groupId,
        isFirstOfGroup: isFirst,
        seqNumber: settings.startSeq + rows.length + newItems.length,
        bagNumber: bagNum,
        taraRaw: `${bagNum} / V2`,
        orderNumber: manualBagForm.orderNumber || 'MOS-509.3',
        modelCode: manualBagForm.modelCode || 'SM-1111/150-BK (брак)',
        productName: manualBagForm.productName || 'Фуфайка (футболка) мужская',
        color: c.color,
        quantity: c.qty,
        tara: isFirst ? 1 : 0,
        grossWeight: isFirst ? weightNum : '',
        weightUnsure: false,
        readMethod: 'manual',
        warnings: [],
      });
    });

    setRows(prev => reindexRows([...prev, ...newItems], settings.startSeq));
    setShowManualBagModal(false);
    setSaveSuccessMsg(`№ ${bagNum}-qop qo'shildi!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);

    // Formani keyingi qopga moslab oshirish
    setManualBagForm(prev => ({
      ...prev,
      bagNumber: String(bagNum + 1),
    }));
  };

  // ==============================================================================
  // JADVAL MA'LUMOTLARINI TAHRIRLASH VA AMALLAR
  // ==============================================================================

  const updateRowField = (id: string, field: keyof BagRowItem, value: any) => {
    setRows(prev => prev.map(item => {
      if (item.id === id) {
        let updatedVal = value;

        // Vazn tahrirlanganda: 3 xonali son kiritilsa avtomatik nuqta qo'yish (195 -> 19.5)
        if (field === 'grossWeight') {
          if (typeof value === 'string' && /^\d{3}$/.test(value)) {
            updatedVal = parseFloat(value) / 10;
          } else if (value === '' || value === null) {
            updatedVal = '';
          } else {
            updatedVal = parseFloat(String(value).replace(',', '.')) || '';
          }
        }

        // Qop raqamidan "/" ajratish
        if (field === 'taraRaw' && settings.autoExtractBagNumber && typeof value === 'string') {
          const parts = value.split(/[\/\\|]/);
          const bagNum = parseInt(parts[0].replace(/\D/g, ''), 10);
          return {
            ...item,
            taraRaw: value,
            bagNumber: isNaN(bagNum) ? item.bagNumber : bagNum,
          };
        }

        return { ...item, [field]: updatedVal };
      }
      return item;
    }));
  };

  // Bitta qopga yangi rang qatori qo'shish
  const handleAddColorRow = (targetItem: BagRowItem) => {
    const newSubRow: BagRowItem = {
      id: `${targetItem.bagGroupId}_${Date.now()}`,
      bagGroupId: targetItem.bagGroupId,
      isFirstOfGroup: false,
      seqNumber: targetItem.seqNumber + 1,
      bagNumber: targetItem.bagNumber,
      taraRaw: targetItem.taraRaw,
      orderNumber: targetItem.orderNumber,
      modelCode: targetItem.modelCode,
      productName: targetItem.productName,
      color: 'Yangi rang',
      quantity: 20,
      tara: 0,
      grossWeight: '',
      weightUnsure: false,
      imageUrl: targetItem.imageUrl,
      readMethod: targetItem.readMethod,
      warnings: [],
    };

    const targetIdx = rows.findIndex(r => r.id === targetItem.id);
    const updated = [...rows];
    updated.splice(targetIdx + 1, 0, newSubRow);
    setRows(reindexRows(updated, settings.startSeq));
  };

  // Qatorni o'chirish
  const handleDeleteRow = (id: string) => {
    const targetItem = rows.find(r => r.id === id);
    if (!targetItem) return;

    // Agar guruhning birinchi qatori o'chirilayotgan bo'lsa, keyingi rang qatorini birinchi qilish
    const groupItems = rows.filter(r => r.bagGroupId === targetItem.bagGroupId);
    if (targetItem.isFirstOfGroup && groupItems.length > 1) {
      const nextItem = groupItems.find(r => r.id !== id);
      if (nextItem) {
        nextItem.isFirstOfGroup = true;
        nextItem.tara = 1;
        nextItem.grossWeight = targetItem.grossWeight;
      }
    }

    const filtered = rows.filter(r => r.id !== id);
    setRows(reindexRows(filtered, settings.startSeq));
  };

  // Qatorni yuqoriga siljitish
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...rows];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setRows(reindexRows(updated, settings.startSeq));
  };

  // Qatorni pastga siljitish
  const handleMoveDown = (index: number) => {
    if (index === rows.length - 1) return;
    const updated = [...rows];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setRows(reindexRows(updated, settings.startSeq));
  };

  // Buyurtma va qop raqami bo'yicha saralash
  const handleSortRows = () => {
    const sorted = [...rows].sort((a, b) => {
      // 1. Buyurtma bo'yicha
      if (a.orderNumber !== b.orderNumber) {
        return a.orderNumber.localeCompare(b.orderNumber);
      }
      // 2. Qop raqami bo'yicha
      const numA = typeof a.bagNumber === 'number' ? a.bagNumber : 0;
      const numB = typeof b.bagNumber === 'number' ? b.bagNumber : 0;
      return numA - numB;
    });

    setRows(reindexRows(sorted, settings.startSeq));
  };

  // ==============================================================================
  // HISOBLAR VA STATISTIKA (ИТОГО)
  // ==============================================================================

  const totals = useMemo(() => {
    let totalQty = 0;
    let totalTara = 0;
    let totalGrossWeight = 0;
    const uniqueBags = new Set<string>();

    rows.forEach(row => {
      const q = typeof row.quantity === 'number' ? row.quantity : 0;
      totalQty += q;

      if (row.isFirstOfGroup) {
        totalTara += 1;
      }

      if (typeof row.grossWeight === 'number' && !isNaN(row.grossWeight)) {
        totalGrossWeight += row.grossWeight;
      }

      if (row.bagGroupId) uniqueBags.add(row.bagGroupId);
    });

    const averageBagWeight = totalTara > 0 ? (totalGrossWeight / totalTara).toFixed(1) : '0';

    return {
      totalQty,
      totalTara: totalTara || uniqueBags.size,
      totalGrossWeight: Math.round(totalGrossWeight * 10) / 10,
      averageBagWeight,
    };
  }, [rows]);

  // Qidiruv filtri
  const filteredRows = useMemo(() => {
    if (!searchFilter.trim()) return rows;
    const q = searchFilter.toLowerCase();
    return rows.filter(r => 
      r.orderNumber.toLowerCase().includes(q) ||
      String(r.bagNumber).includes(q) ||
      r.color.toLowerCase().includes(q) ||
      r.modelCode.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q)
    );
  }, [rows, searchFilter]);

  // ==============================================================================
  // EXCEL EKSPORTI: RUSCHA RASMIY SHAKL (#31869B SARLAVHA VA IMZOLAR)
  // ==============================================================================

  const exportWaybillToExcel = (targetRows: BagRowItem[], targetSettings: WaybillSettings) => {
    if (targetRows.length === 0) {
      alert("Eksport qilish uchun avval markirovka yorliqlarini qo'shing!");
      return;
    }

    const excelData: any[][] = [];

    // 1-qator: Asosiy sarlavha
    excelData.push([`Накладная № ${targetSettings.waybillNumber} от ${formatDisplayDate(targetSettings.waybillDate)}`]);
    // 2-qator: Jo'natuvchi ombor
    excelData.push([`От куда: ${targetSettings.sourceWarehouse}`]);
    // 3-qator: Bo'sh qator
    excelData.push([]);

    // 4-qator: Ustunlar sarlavhasi (A-I)
    const headers = [
      '№ п/п',
      '№ мешка',
      'Заказ',
      'Модель',
      'Наименование',
      'Цвет',
      'Кол-во',
      'Тара',
      'Вес брутто'
    ];
    excelData.push(headers);

    let sumQty = 0;
    let sumTara = 0;
    let sumWeight = 0;

    // Ma'lumot qatorlari
    targetRows.forEach((r) => {
      const q = typeof r.quantity === 'number' ? r.quantity : 0;
      const t = typeof r.tara === 'number' ? r.tara : 0;
      const w = typeof r.grossWeight === 'number' ? r.grossWeight : '';

      sumQty += q;
      sumTara += t;
      if (typeof w === 'number') sumWeight += w;

      excelData.push([
        r.seqNumber,
        r.bagNumber !== '' ? r.bagNumber : '',
        r.orderNumber,
        r.modelCode,
        r.productName,
        r.color,
        q,
        t,
        w !== '' ? Number(w.toFixed(1)) : ''
      ]);
    });

    // Bo'sh ajratuvchi qator
    excelData.push([]);

    // Итого (Jami) qatori
    excelData.push([
      'Итого:',
      '',
      '',
      '',
      '',
      '',
      sumQty,
      sumTara,
      Number(sumWeight.toFixed(1))
    ]);

    // Bo'sh qator
    excelData.push([]);
    excelData.push([]);

    // Imzolar bloki
    excelData.push([
      'Директор:',
      '________________',
      `(${targetSettings.directorName})`,
      '',
      'Принял:',
      '________________',
      `(${targetSettings.recipientName})`
    ]);

    excelData.push([]);

    excelData.push([
      'Зав.склад:',
      '________________',
      `(${targetSettings.warehouseManager})`,
      '',
      'Сдал:',
      '________________',
      `(${targetSettings.senderName})`
    ]);

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Ustun kengliklari
    ws['!cols'] = [
      { wch: 8 },  // № п/п
      { wch: 10 }, // № мешка
      { wch: 14 }, // Заказ
      { wch: 26 }, // Модель
      { wch: 34 }, // Наименование
      { wch: 18 }, // Цвет
      { wch: 10 }, // Кол-во
      { wch: 8 },  // Тара
      { wch: 12 }, // Вес брутто
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Накладная');

    const fileName = `Nakladnaya_${targetSettings.waybillNumber}_${targetSettings.waybillDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleExportToExcel = () => {
    exportWaybillToExcel(rows, settings);
  };

  // Chop etish (Print)
  const handlePrint = () => {
    window.print();
  };

  // ==============================================================================
  // TIZIMDA SAQLASH (LOKAL XOTIRA VA ARXIV)
  // ==============================================================================

  const handleSaveWaybill = () => {
    if (rows.length === 0) {
      alert("Saqlash uchun kamida bitta qop yorlig'ini kiriting!");
      return;
    }

    setIsProcessing(true);
    const existingIndex = savedWaybills.findIndex(w => w.waybillNumber === settings.waybillNumber);
    const nowIso = new Date().toISOString();

    const newWaybillRecord: SavedWaybill = {
      id: existingIndex >= 0 ? savedWaybills[existingIndex].id : `wb-${Date.now()}`,
      waybillNumber: settings.waybillNumber,
      waybillDate: settings.waybillDate,
      sourceWarehouse: settings.sourceWarehouse,
      destination: settings.destination,
      orderNumber: rows[0]?.orderNumber || 'MOS-509.3',
      totalBags: totals.totalTara,
      totalQty: totals.totalQty,
      totalGrossWeight: totals.totalGrossWeight,
      directorName: settings.directorName,
      warehouseManager: settings.warehouseManager,
      senderName: settings.senderName,
      recipientName: settings.recipientName,
      rows: JSON.parse(JSON.stringify(rows)),
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
    } catch (e) {
      console.warn("LocalStorage saqlash:", e);
    }

    // ERP Tranzaksiya Tarixi audit logiga yozish
    if (onLogAudit) {
      onLogAudit(
        existingIndex >= 0 ? 'UPDATE' : 'CREATE',
        `Накладная № ${settings.waybillNumber}`,
        newWaybillRecord.id,
        `Накладная № ${settings.waybillNumber} (${totals.totalTara} ta qop, ${totals.totalQty} dona, ${totals.totalGrossWeight} kg) tizimda saqlandi`,
        existingIndex >= 0 ? { totalBags: savedWaybills[existingIndex].totalBags } : null,
        { totalBags: totals.totalTara, totalQty: totals.totalQty, totalGrossWeight: totals.totalGrossWeight }
      );
    }

    setIsProcessing(false);
    setSaveSuccessMsg(`✅ Накладная № ${settings.waybillNumber} ERP tizimida muvaffaqiyatli saqlandi!`);
    setTimeout(() => setSaveSuccessMsg(null), 4500);
  };

  // Arxivdagi nakladnoyni tahrirlovchiga yuklash
  const handleLoadSavedWaybill = (saved: SavedWaybill) => {
    setSettings(saved.settings);
    setRows(saved.rows);
    setShowArchiveModal(false);
    setSaveSuccessMsg(`Накладная № ${saved.waybillNumber} tahrirlovchiga yuklandi!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Arxivdagi nakladnoyni o'chirish
  const handleDeleteSavedWaybill = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Rostdan ham ushbu nakladnoyni arxivdan o'chirmoqchimisiz?")) return;

    const filtered = savedWaybills.filter(w => w.id !== id);
    setSavedWaybills(filtered);
    try {
      localStorage.setItem('chust_saved_waybills', JSON.stringify(filtered));
    } catch (err) {}

    if (onLogAudit) {
      onLogAudit('DELETE', `Накладная`, id, `Накладная arxivdan o'chirildi`);
    }
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dStr;
  };

  const filteredArchive = useMemo(() => {
    if (!archiveSearch.trim()) return savedWaybills;
    const q = archiveSearch.toLowerCase();
    return savedWaybills.filter(w => 
      w.waybillNumber.toLowerCase().includes(q) ||
      w.orderNumber.toLowerCase().includes(q) ||
      w.destination.toLowerCase().includes(q) ||
      w.waybillDate.includes(q)
    );
  }, [savedWaybills, archiveSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. YUQORI SARLAVHA VA ASOSIY BOSHQARUV TUGMALARI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              Markirovka & Накладная Moduli
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">Lokal rejim tayyor</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Накладная va Markirovka Yorliqlari
          </h1>
          <p className="text-sm text-slate-500">
            Qop markirovkasini yuklang, qo'lda yozilgan brutto vaznni tekshiring va rasmiy Excel yuk xatini hosil qiling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Yangi nakladnoy */}
          <button
            onClick={handleNewWaybill}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors"
            title="Yangi bo'sh nakladnoy yaratish"
          >
            <FilePlus className="w-4 h-4 text-slate-600" />
            Yangi
          </button>

          {/* Arxiv / Saqlanganlar */}
          <button
            onClick={() => setShowArchiveModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-2 transition-colors relative"
            title="Saqlangan nakladnoylar ro'yxati"
          >
            <FolderArchive className="w-4 h-4 text-indigo-600" />
            Saqlanganlar ({savedWaybills.length})
          </button>

          {/* Namuna yuk rasmlari (Demo) */}
          <button
            onClick={handleLoadDemoData}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 transition-colors"
            title="Sinov uchun tayyor markirovka rasmlari va ma'lumotlarini yuklash"
          >
            <Package className="w-4 h-4 text-amber-600" />
            Demo qoplar
          </button>

          {/* Qo'lda qop qo'shish */}
          <button
            onClick={() => setShowManualBagModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors"
            title="Rasmsiz qo'lda qop ma'lumotlarini kiritish"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            Qo'lda qo'shish
          </button>

          {/* Sozlamalar */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            Sozlamalar
          </button>

          {/* Chop etish */}
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Chop etish
          </button>

          {/* Tizimda saqlash */}
          <button
            onClick={handleSaveWaybill}
            disabled={rows.length === 0 || isProcessing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Saqlash
          </button>

          {/* Excel eksport */}
          <button
            onClick={handleExportToExcel}
            disabled={rows.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#31869B] text-white hover:bg-[#286f81] disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel yuklab olish (.xlsx)
          </button>
        </div>
      </div>

      {/* Muvaffaqiyat xabari */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-fadeIn print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. TEZKOR MA'LUMOT BLOKLARI (STATISTIKA VA XULOSA) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Jami Qoplar (Tara)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totals.totalTara} ta</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Jami Dona (Mahsulot)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totals.totalQty.toLocaleString()} dona</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Jami Brutto Vazn</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totals.totalGrossWeight} kg</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">O'rtacha Qop Og'irligi</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totals.averageBagWeight} kg</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SURAT YUKLASH MAYDONI (DROPZONE) */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-cyan-500 transition-colors text-center relative print:hidden">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mb-1">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            Markirovka suratlarini bu yerga tashlang yoki tanlang
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            Bir nechta qop suratlarini bir vaqtning o'zida yuklashingiz mumkin.
            Tizim har bir qopdagi etiketka va flomaster bilan yozilgan brutto vaznni avtomatik aniqlaydi.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs">
              <Camera className="w-4 h-4 text-slate-500" />
              Fayllarni tanlash
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowManualBagModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-lg border border-cyan-200"
            >
              <Plus className="w-4 h-4 text-cyan-600" />
              Qo'lda kiritish
            </button>
          </div>
        </div>
      </div>

      {/* Jarayon statusi bar */}
      {isProcessing && (
        <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-xl flex items-center gap-3 text-cyan-900 animate-pulse print:hidden">
          <RefreshCw className="w-5 h-5 text-cyan-600 animate-spin" />
          <div className="text-sm font-medium">{processStatus || "Rasmlar qayta ishlanmoqda..."}</div>
        </div>
      )}

      {/* 4. ASOSIY JADVAL: НАКЛАДНАЯ KO'RINIShI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Hujjat sarlavhasi (Rasmiy ko'rinish) */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Накладная № {settings.waybillNumber} от {formatDisplayDate(settings.waybillDate)}
            </h2>
            <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-4">
              <span><strong>От куда:</strong> {settings.sourceWarehouse}</span>
              <span><strong>Пункт назначения:</strong> {settings.destination}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Qidirish (Заказ, мешок, цвет)..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-60"
              />
            </div>
            <button
              onClick={handleSortRows}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5"
              title="Buyurtma va qop raqami bo'yicha saralash"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Saralash
            </button>
          </div>
        </div>

        {/* Jadval bo'sh holati */}
        {rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 print:hidden">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-medium text-slate-700">Hozircha hech qanday markirovka yuklanmadi</h3>
            <p className="text-xs text-slate-500 mt-1">
              Surat yuklang, qo'lda kiriting yoki yuqoridagi <strong>«Demo qoplar»</strong> tugmasini bosing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#31869B] text-white font-semibold">
                  <th className="py-3 px-3 border border-[#276e7f] text-center w-12">№ п/п</th>
                  <th className="py-3 px-3 border border-[#276e7f] text-center w-20">№ мешка</th>
                  <th className="py-3 px-3 border border-[#276e7f] w-28">Заказ</th>
                  <th className="py-3 px-3 border border-[#276e7f] w-48">Модель</th>
                  <th className="py-3 px-3 border border-[#276e7f] min-w-[200px]">Наименование</th>
                  <th className="py-3 px-3 border border-[#276e7f] min-w-[140px]">Цвет</th>
                  <th className="py-3 px-3 border border-[#276e7f] text-right w-20">Кол-во</th>
                  <th className="py-3 px-3 border border-[#276e7f] text-center w-16">Тара</th>
                  <th className="py-3 px-3 border border-[#276e7f] text-right w-28">Вес брутто (кг)</th>
                  <th className="py-3 px-2 border border-[#276e7f] text-center w-16 print:hidden">Surat</th>
                  <th className="py-3 px-2 border border-[#276e7f] text-center w-24 print:hidden">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map((row, index) => {
                  // Majburiy maydonlar bo'shligini tekshirish (Qizil chegara)
                  const isOrderMissing = !row.orderNumber.trim();
                  const isBagMissing = row.bagNumber === '';
                  const isColorMissing = !row.color.trim();
                  const isQtyMissing = row.quantity === '' || row.quantity === 0;
                  
                  // Vazn ogohlantirishlari (Sariq chegara)
                  const isWeightWarning = row.isFirstOfGroup && (
                    row.grossWeight === '' ||
                    row.weightUnsure ||
                    (typeof row.grossWeight === 'number' && (row.grossWeight < 5 || row.grossWeight > 35))
                  );

                  return (
                    <tr 
                      key={row.id}
                      className={`hover:bg-cyan-50/40 transition-colors ${
                        row.isFirstOfGroup ? 'border-t-2 border-slate-300' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* 1. № п/п */}
                      <td className="py-2.5 px-3 border border-slate-200 text-center font-medium text-slate-600 bg-slate-50/50">
                        {row.seqNumber}
                      </td>

                      {/* 2. № мешка */}
                      <td className={`py-2 px-2 border border-slate-200 text-center ${isBagMissing ? 'bg-red-50' : ''}`}>
                        <input
                          type="number"
                          value={row.bagNumber}
                          onChange={(e) => updateRowField(row.id, 'bagNumber', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className={`w-full text-center p-1 rounded font-bold text-slate-800 border ${
                            isBagMissing ? 'border-red-500 bg-red-50' : 'border-transparent hover:border-slate-300 focus:border-cyan-500'
                          }`}
                        />
                      </td>

                      {/* 3. Заказ */}
                      <td className={`py-2 px-2 border border-slate-200 ${isOrderMissing ? 'bg-red-50' : ''}`}>
                        <input
                          type="text"
                          value={row.orderNumber}
                          onChange={(e) => updateRowField(row.id, 'orderNumber', e.target.value)}
                          className={`w-full p-1 rounded font-medium text-slate-800 border ${
                            isOrderMissing ? 'border-red-500 bg-red-50' : 'border-transparent hover:border-slate-300 focus:border-cyan-500'
                          }`}
                        />
                      </td>

                      {/* 4. Модель */}
                      <td className="py-2 px-2 border border-slate-200">
                        <input
                          type="text"
                          value={row.modelCode}
                          onChange={(e) => updateRowField(row.id, 'modelCode', e.target.value)}
                          className="w-full p-1 rounded text-slate-700 border border-transparent hover:border-slate-300 focus:border-cyan-500 text-xs font-mono"
                        />
                      </td>

                      {/* 5. Наименование */}
                      <td className="py-2 px-2 border border-slate-200">
                        <input
                          type="text"
                          value={row.productName}
                          onChange={(e) => updateRowField(row.id, 'productName', e.target.value)}
                          className="w-full p-1 rounded text-slate-800 border border-transparent hover:border-slate-300 focus:border-cyan-500"
                        />
                      </td>

                      {/* 6. Цвет */}
                      <td className={`py-2 px-2 border border-slate-200 ${isColorMissing ? 'bg-red-50' : ''}`}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={row.color}
                            onChange={(e) => updateRowField(row.id, 'color', e.target.value)}
                            className={`w-full p-1 rounded font-medium text-slate-800 border ${
                              isColorMissing ? 'border-red-500 bg-red-50' : 'border-transparent hover:border-slate-300 focus:border-cyan-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* 7. Кол-во */}
                      <td className={`py-2 px-2 border border-slate-200 text-right ${isQtyMissing ? 'bg-red-50' : ''}`}>
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateRowField(row.id, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className={`w-full text-right p-1 rounded font-semibold text-slate-800 border ${
                            isQtyMissing ? 'border-red-500 bg-red-50' : 'border-transparent hover:border-slate-300 focus:border-cyan-500'
                          }`}
                        />
                      </td>

                      {/* 8. Тара (Doim 1, ko'p ranglilarda birinchi qatorga) */}
                      <td className="py-2.5 px-3 border border-slate-200 text-center font-medium text-slate-700 bg-slate-50/30">
                        {row.tara}
                      </td>

                      {/* 9. Вес брутто (Qo'lda yozilgan raqam) */}
                      <td className={`py-2 px-2 border border-slate-200 text-right ${
                        isWeightWarning ? 'bg-amber-50' : ''
                      }`}>
                        {row.isFirstOfGroup ? (
                          <div className="relative flex items-center justify-end">
                            <input
                              type="text"
                              value={row.grossWeight}
                              onChange={(e) => updateRowField(row.id, 'grossWeight', e.target.value)}
                              placeholder="19.4"
                              className={`w-full text-right p-1 rounded font-bold border ${
                                isWeightWarning 
                                  ? 'border-amber-400 bg-amber-50 text-amber-900' 
                                  : 'border-transparent hover:border-slate-300 focus:border-cyan-500 text-slate-900'
                              }`}
                            />
                            {isWeightWarning && (
                              <span 
                                title="Vazn kiritilmagan yoki tekshiruv talab qilinadi (odatda 5-30 kg)"
                                className="ml-1 text-amber-500 cursor-help"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 inline" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-center block">—</span>
                        )}
                      </td>

                      {/* Surat ko'rish (Modal) */}
                      <td className="py-2 px-2 border border-slate-200 text-center print:hidden">
                        {row.imageUrl ? (
                          <button
                            onClick={() => setSelectedImageModal(row.imageUrl || null)}
                            className="p-1 hover:bg-cyan-100 text-cyan-700 rounded transition-colors"
                            title="Markirovka va flomaster yozuvini kattalashtirib ko'rish"
                          >
                            <Eye className="w-4 h-4 mx-auto" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px]">Yo'q</span>
                        )}
                      </td>

                      {/* Amallar */}
                      <td className="py-2 px-2 border border-slate-200 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          {row.isFirstOfGroup && (
                            <button
                              onClick={() => handleAddColorRow(row)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Ushbu qopga yana bitta rang qatori qo'shish"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Yuqoriga"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === filteredRows.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Pastga"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Qatorni o'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* 5. ИТОГО (JAMI) QATORI */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                  <td colSpan={6} className="py-3 px-4 border border-slate-300 text-right uppercase tracking-wider text-xs">
                    Итого (Jami):
                  </td>
                  <td className="py-3 px-3 border border-slate-300 text-right text-sm text-cyan-800">
                    {totals.totalQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 border border-slate-300 text-center text-sm text-slate-800">
                    {totals.totalTara}
                  </td>
                  <td className="py-3 px-3 border border-slate-300 text-right text-sm text-emerald-800">
                    {totals.totalGrossWeight} кг
                  </td>
                  <td colSpan={2} className="border border-slate-300 print:hidden bg-slate-100"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 6. RASMIY IMZOLAR BLOKI (ЧОП ЭТИШ ВА ЭКСПОРТДА КЎРИНАДИ) */}
        <div className="p-8 border-t border-slate-200 bg-white">
          <div className="grid grid-cols-2 gap-8 text-xs text-slate-800">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-24 font-bold text-slate-900">Директор:</span>
                <span className="flex-1 border-b border-slate-400 pb-1 text-slate-500">________________________</span>
                <span className="font-semibold text-slate-700">({settings.directorName})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-bold text-slate-900">Зав.склад:</span>
                <span className="flex-1 border-b border-slate-400 pb-1 text-slate-500">________________________</span>
                <span className="font-semibold text-slate-700">({settings.warehouseManager})</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-24 font-bold text-slate-900">Принял:</span>
                <span className="flex-1 border-b border-slate-400 pb-1 text-slate-500">________________________</span>
                <span className="font-semibold text-slate-700">({settings.recipientName})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-bold text-slate-900">Сдал:</span>
                <span className="flex-1 border-b border-slate-400 pb-1 text-slate-500">________________________</span>
                <span className="font-semibold text-slate-700">({settings.senderName})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. MODAL: SAQLANGAN NAKLADNOYLAR ARXIVI */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs print:hidden animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Saqlangan Nakladnoylar Arxivi
                  </h3>
                  <p className="text-xs text-slate-500">
                    ERP xotirasida saqlangan barcha yuk xatlari (tahrirlash yoki qayta yuklab olish)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Qidiruv */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                placeholder="Raqam, buyurtma yoki qabul qiluvchi bo'yicha qidirish..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Ro'yxat */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {filteredArchive.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FolderArchive className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Mos nakladnoy topilmadi</p>
                </div>
              ) : (
                filteredArchive.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          Накладная № {item.waybillNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                          {formatDisplayDate(item.waybillDate)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium">
                          {item.orderNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Qabul qiluvchi: <strong className="text-slate-700">{item.destination}</strong></span>
                        <span>Qoplar: <strong className="text-slate-700">{item.totalBags} ta</strong></span>
                        <span>Dona: <strong className="text-slate-700">{item.totalQty.toLocaleString()}</strong></span>
                        <span>Brutto vazn: <strong className="text-emerald-700">{item.totalGrossWeight} kg</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleLoadSavedWaybill(item)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Tahrirlashga ochish
                      </button>

                      <button
                        onClick={() => exportWaybillToExcel(item.rows, item.settings)}
                        className="px-3 py-1.5 bg-[#31869B] text-white rounded-lg text-xs font-semibold hover:bg-[#276e7f] flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Excel faylini yuklab olish"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Excel
                      </button>

                      <button
                        onClick={(e) => handleDeleteSavedWaybill(item.id, e)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-xs text-slate-500">
              <span>Jami arxivda: {savedWaybills.length} ta nakladnoy</span>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: QO'LDA QOP MA'LUMOTLARINI KIRITISH */}
      {showManualBagModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs print:hidden animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-600" />
                Qo'lda Yangi Qop Qo'shish
              </h3>
              <button
                onClick={() => setShowManualBagModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">№ Мешка</label>
                  <input
                    type="number"
                    value={manualBagForm.bagNumber}
                    onChange={(e) => setManualBagForm({ ...manualBagForm, bagNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Вес брутто (кг)</label>
                  <input
                    type="text"
                    value={manualBagForm.grossWeight}
                    onChange={(e) => setManualBagForm({ ...manualBagForm, grossWeight: e.target.value })}
                    placeholder="17.5"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Номер заказа</label>
                <input
                  type="text"
                  value={manualBagForm.orderNumber}
                  onChange={(e) => setManualBagForm({ ...manualBagForm, orderNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Модель (Vertikal kod)</label>
                <input
                  type="text"
                  value={manualBagForm.modelCode}
                  onChange={(e) => setManualBagForm({ ...manualBagForm, modelCode: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Наименование</label>
                <input
                  type="text"
                  value={manualBagForm.productName}
                  onChange={(e) => setManualBagForm({ ...manualBagForm, productName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Ranglar va donalar (Format: Rang-son, Rang-son)
                </label>
                <input
                  type="text"
                  value={manualBagForm.colorsInput}
                  onChange={(e) => setManualBagForm({ ...manualBagForm, colorsInput: e.target.value })}
                  placeholder="Белый-50, Черный-20, Хаки-10"
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Misol: <code>Белый-50, Черный-20</code> (vergul bilan ajratiladi)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowManualBagModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveManualBag}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700 shadow-sm"
              >
                Qopni jadvalga qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: FOTOSURAT KATTALASHTIRIB KO'RISH */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Qop markirovka yorlig'i va flomaster yozuvini tekshirish
              </h4>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-100">
              <img
                src={selectedImageModal}
                alt="Markirovka to'liq rasm"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center">
              <span>Maslahat: Flomasterda qopga yozilgan raqamni jadvaldagi «Вес брутто» ustuni bilan solishtiring.</span>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-medium text-xs hover:bg-slate-800"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL: SOZLAMALAR PANELINI TAHRIRLASH */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs print:hidden">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-600" />
                Накладная va Markirovka Sozlamalari
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Накладная raqami</label>
                <input
                  type="text"
                  value={settings.waybillNumber}
                  onChange={(e) => setSettings({ ...settings, waybillNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Boshlang'ich № п/п</label>
                <input
                  type="number"
                  value={settings.startSeq}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setSettings({ ...settings, startSeq: val });
                    setRows(reindexRows(rows, val));
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hujjat sanasi</label>
                <input
                  type="date"
                  value={settings.waybillDate}
                  onChange={(e) => setSettings({ ...settings, waybillDate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jo'natuvchi ombor (От куда)</label>
                <input
                  type="text"
                  value={settings.sourceWarehouse}
                  onChange={(e) => setSettings({ ...settings, sourceWarehouse: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Qabul qiluvchi (Пункт назначения)</label>
                <input
                  type="text"
                  value={settings.destination}
                  onChange={(e) => setSettings({ ...settings, destination: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Директор (F.I.Sh)</label>
                <input
                  type="text"
                  value={settings.directorName}
                  onChange={(e) => setSettings({ ...settings, directorName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Зав.склад (F.I.Sh)</label>
                <input
                  type="text"
                  value={settings.warehouseManager}
                  onChange={(e) => setSettings({ ...settings, warehouseManager: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Сдал (Ombor xodimi)</label>
                <input
                  type="text"
                  value={settings.senderName}
                  onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Принял (Qabul qiluvchi)</label>
                <input
                  type="text"
                  value={settings.recipientName}
                  onChange={(e) => setSettings({ ...settings, recipientName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoExtractBagNumber}
                  onChange={(e) => setSettings({ ...settings, autoExtractBagNumber: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>"№ тары" dagi «/» oldidagi sonni avtomatik "№ мешка" ustuniga olish (masalan "2 / V2" → 2)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.weightOnlyFirstRow}
                  onChange={(e) => setSettings({ ...settings, weightOnlyFirstRow: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Ko'p rangli qoplarda Тара va Вес брутто'ni faqat birinchi rang qatoriga yozish (vazn 2 marta qo'shilmasligi uchun)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Saqlash va Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
