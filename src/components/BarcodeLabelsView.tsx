/**
 * Chust Textile ERP - Shtrix-kod va Etiketkalar (GS1-128 / SSCC) Asosiy Moduli
 * 
 * Barcha hisob-kitoblar, o'qish, validatsiya va PDF yaratish to'liq
 * brauzerda (mijoz tomonida) amalga oshiriladi.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Barcode, 
  UploadCloud, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Eye, 
  RefreshCw, 
  SlidersHorizontal, 
  Copy, 
  Check, 
  FileUp, 
  Sparkles,
  HelpCircle,
  Settings,
  Globe,
  Server,
  Key,
  WifiOff,
  X
} from 'lucide-react';
import { BarcodeItem, BarcodeStatus, LabelSettings, LabelFormatType, ApiSettings, DEFAULT_LABEL_SETTINGS, SETTINGS_80x50, DEFAULT_API_SETTINGS } from '../lib/barcode/types';
import { readBarcodeImage } from '../lib/barcode/reader';
import { validateSSCC, cleanSSCCDigits, tryCorrectSSCC, formatSSCC } from '../lib/barcode/sscc';
import { generateLabelsPdf, downloadPdfBlob } from '../lib/barcode/pdfGenerator';
import { importBarcodesFromExcel, exportBarcodesToExcel } from '../lib/barcode/excel';
import { labelRepository } from '../repository/labelRepository';
import LabelPreviewCard from './LabelPreviewCard';

// Demo namunalar (darhol sinash uchun)
const DEMO_ITEMS: BarcodeItem[] = [
  {
    id: 'demo-photo-match',
    fileName: 'etiketka_80x50.png',
    rawCode: '046602509310827968',
    sscc: '046602509310827968',
    formattedCode: '(00)046602509310827968',
    color: 'Зеленый',
    size: '104',
    rost: '170-176',
    copies: 4,
    status: 'OK',
    notes: 'Namuna: 80x50 mm etiketka (Rasm bo\'yicha: Цвет: Зеленый, Размер: 104, Рост: 170-176)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-1',
    fileName: 'namuna_1.jpg',
    rawCode: '046400143805267798',
    sscc: '046400143805267798',
    formattedCode: '(00)046400143805267798',
    color: 'Белый',
    size: 'XL',
    rost: '176-182',
    copies: 4,
    status: 'OK',
    notes: 'Namuna: To\'liq to\'g\'ri SSCC kodi',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    fileName: 'namuna_2.jpg',
    rawCode: '046400143805267798',
    sscc: '046400143805267798',
    formattedCode: '(00)046400143805267798',
    color: 'Серый агат / Черный / Лавровый венок',
    size: '48-50',
    rost: '170-176',
    copies: 4,
    status: 'OK',
    notes: 'Namuna: Ko\'p rangli qop (3 ta rang)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-3',
    fileName: 'namuna_ocr.jpg',
    rawCode: '046400143805267798',
    sscc: '046400143805267798',
    formattedCode: '(00)046400143805267798',
    color: 'Глубокий черный',
    size: 'M',
    rost: '164-170',
    copies: 4,
    status: 'OCR',
    notes: 'Namuna: Yozuvdan (OCR) o\'qilgan',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-4',
    fileName: 'namuna_tuzatildi.jpg',
    rawCode: '046400143805267798',
    sscc: '046400143805267798',
    formattedCode: '(00)046400143805267798',
    color: 'Оливковый / Хаки',
    size: 'L',
    rost: '170-176',
    copies: 4,
    status: 'tuzatildi',
    notes: 'Namuna: OCR xatosi avtomatik to\'g\'rilangan',
    createdAt: new Date().toISOString()
  }
];

export default function BarcodeLabelsView() {
  const [items, setItems] = useState<BarcodeItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [settings, setSettings] = useState<LabelSettings>(DEFAULT_LABEL_SETTINGS);

  // O'qish jarayoni (Progress)
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');
  const isCancelledRef = useRef<boolean>(false);

  // Modallar
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'dimensions' | 'api'>('dimensions');
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    try {
      const saved = localStorage.getItem('chust_erp_api_settings');
      return saved ? JSON.parse(saved) : DEFAULT_API_SETTINGS;
    } catch {
      return DEFAULT_API_SETTINGS;
    }
  });
  const [apiTestStatus, setApiTestStatus] = useState<string | null>(null);

  const [batchColorInput, setBatchColorInput] = useState<string>('');
  const [batchSizeInput, setBatchSizeInput] = useState<string>('');
  const [batchRostInput, setBatchRostInput] = useState<string>('170-176');
  const [batchCopiesInput, setBatchCopiesInput] = useState<number>(4);
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const handleSelectFormat = (fmt: LabelFormatType) => {
    if (fmt === '80x50') {
      setSettings(SETTINGS_80x50);
    } else {
      setSettings(DEFAULT_LABEL_SETTINGS);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Dastlabki yuklash: IndexedDB dan o'qish
  useEffect(() => {
    let isMounted = true;
    labelRepository.getAll().then(loaded => {
      if (isMounted) {
        if (loaded && loaded.length > 0) {
          setItems(loaded);
          setSelectedItemId(loaded[0]?.id || null);
        } else {
          // Birinchi ochilganda namunaviy ma'lumotlar bilan to'ldirish
          setItems(DEMO_ITEMS);
          setSelectedItemId(DEMO_ITEMS[0].id);
          labelRepository.saveAll(DEMO_ITEMS);
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Takroriy kodlarni avtomatik aniqlash va belgilash
  const processedItems = useMemo(() => {
    // Har bir to'g'ri SSCC kodning necha marta uchraganini sanaymiz
    const codeCounts = new Map<string, number>();
    for (const item of items) {
      if (item.sscc && item.sscc.length === 18) {
        codeCounts.set(item.sscc, (codeCounts.get(item.sscc) || 0) + 1);
      }
    }

    return items.map(item => {
      if (item.sscc && item.sscc.length === 18 && (codeCounts.get(item.sscc) || 0) > 1) {
        // Agar xato bo'lmasa va 1 dan ko'p bo'lsa - takror deb belgilash
        if (item.status === 'OK' || item.status === 'OCR' || item.status === 'tuzatildi') {
          return { ...item, status: 'takror' as BarcodeStatus };
        }
      }
      return item;
    });
  }, [items]);

  // Statistikalar
  const stats = useMemo(() => {
    const total = processedItems.length;
    const okCount = processedItems.filter(i => i.status === 'OK').length;
    const ocrCount = processedItems.filter(i => i.status === 'OCR' || i.status === 'tuzatildi').length;
    const errorCount = processedItems.filter(i => i.status === 'nazorat_mos_emas' || i.status === 'oqilmadi').length;
    const duplicateCount = processedItems.filter(i => i.status === 'takror').length;
    const totalLabelsToPrint = processedItems
      .filter(i => i.status === 'OK' || i.status === 'OCR' || i.status === 'tuzatildi' || i.status === 'takror')
      .reduce((sum, i) => sum + (i.copies || 4), 0);

    return { total, okCount, ocrCount, errorCount, duplicateCount, totalLabelsToPrint };
  }, [processedItems]);

  // Tanlangan etiketka
  const selectedItem = useMemo(() => {
    return processedItems.find(i => i.id === selectedItemId) || processedItems[0] || null;
  }, [processedItems, selectedItemId]);

  // Filtr va qidiruv bo'yicha saralangan ro'yxat
  const filteredItems = useMemo(() => {
    return processedItems.filter(item => {
      // Filtr
      if (filterStatus === 'valid' && !(item.status === 'OK' || item.status === 'OCR' || item.status === 'tuzatildi')) return false;
      if (filterStatus === 'errors' && !(item.status === 'nazorat_mos_emas' || item.status === 'oqilmadi')) return false;
      if (filterStatus === 'duplicates' && item.status !== 'takror') return false;

      // Qidiruv
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = item.rawCode.toLowerCase().includes(q) || item.sscc.toLowerCase().includes(q);
        const matchColor = (item.color || '').toLowerCase().includes(q);
        const matchSize = (item.size || '').toLowerCase().includes(q);
        const matchFile = (item.fileName || '').toLowerCase().includes(q);
        return matchCode || matchColor || matchSize || matchFile;
      }

      return true;
    });
  }, [processedItems, filterStatus, searchQuery]);

  // O'zgarishlarni IndexedDB ga saqlash
  const updateAndPersistItems = useCallback((newItems: BarcodeItem[]) => {
    setItems(newItems);
    labelRepository.saveAll(newItems);
  }, []);

  // 1. Fayllarni o'qish (Navbat, Progress va ETA bilan)
  const processFilesQueue = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(0);
    isCancelledRef.current = false;

    const total = files.length;
    const startTime = Date.now();
    const newAddedItems: BarcodeItem[] = [];

    for (let i = 0; i < total; i++) {
      if (isCancelledRef.current) break;

      const file = files[i];
      const percent = Math.round(((i + 1) / total) * 100);
      setProgressPercent(percent);

      // Taxminiy qolgan vaqt (ETA)
      const elapsed = (Date.now() - startTime) / 1000;
      const avgPerItem = elapsed / (i + 1);
      const remainingSeconds = Math.max(0, Math.round(avgPerItem * (total - (i + 1))));

      setProcessingStatusText(
        `O'qilmoqda: ${i + 1} / ${total} ta rasm... (Qolgan vaqt: ~${remainingSeconds} sek)`
      );

      // Rasm URL
      const imageUrl = URL.createObjectURL(file);

      // Parallel ZXing + OCR o'qish
      const readResult = await readBarcodeImage(file, file.name);

      const newItem: BarcodeItem = {
        id: `bc-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        fileName: file.name,
        imageUrl,
        rawCode: readResult.rawCode,
        sscc: readResult.sscc,
        formattedCode: readResult.formattedCode,
        color: '',
        size: '',
        copies: settings.defaultCopies,
        status: readResult.status,
        notes: readResult.details,
        createdAt: new Date().toISOString()
      };

      newAddedItems.push(newItem);
    }

    setIsProcessing(false);
    setProgressPercent(100);
    setProcessingStatusText('');

    if (newAddedItems.length > 0) {
      const merged = [...newAddedItems, ...items];
      updateAndPersistItems(merged);
      setSelectedItemId(newAddedItems[0].id);
    }
  };

  // Drag & drop hodisalari
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const rawFiles = e.dataTransfer.files;
      const filesArray: File[] = [];
      for (let i = 0; i < rawFiles.length; i++) {
        const f = rawFiles[i];
        if (f.type.startsWith('image/')) {
          filesArray.push(f);
        }
      }
      processFilesQueue(filesArray);
    }
  };

  // 2. Ctrl+V Buferdan qo'yish (Win+Shift+S skrinshotlari)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const fileName = `Skrinshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
            const file = new File([blob], fileName, { type: blob.type });
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        processFilesQueue(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [items, settings]);

  // Excel orqali import qilish
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setProcessingStatusText('Excel fayli tahlil qilinmoqda...');
      const res = await importBarcodesFromExcel(file);
      setIsProcessing(false);

      if (res.items.length > 0) {
        const merged = [...res.items, ...items];
        updateAndPersistItems(merged);
        setSelectedItemId(res.items[0].id);
        alert(`Muvaffaqiyatli import qilindi: ${res.items.length} ta shtrix-kod (${res.validCodesCount} ta to'g'ri)`);
      } else {
        alert('Excel faylda 18 yoki 20 xonali shtrix-kod raqamlari topilmadi.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      alert(`Excel importida xatolik: ${err?.message || err}`);
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  // Qator maydonini to'g'ridan-to'g'ri o'zgartirish
  const handleUpdateField = (id: string, field: keyof BarcodeItem, value: any) => {
    const updated = items.map(item => {
      if (item.id !== id) return item;

      const newItem = { ...item, [field]: value };

      // Agar kod o'zgartirilgan bo'lsa, SSCC nazorat raqamini qayta tekshiramiz
      if (field === 'rawCode') {
        const clean = cleanSSCCDigits(String(value));
        if (clean.length === 18 && validateSSCC(clean)) {
          newItem.sscc = clean;
          newItem.formattedCode = formatSSCC(clean);
          newItem.status = 'OK';
          newItem.notes = 'Foydalanuvchi tomonidan qo\'lda kiritildi (to\'g\'ri)';
        } else {
          const corr = tryCorrectSSCC(clean);
          if (corr && corr.wasCorrected) {
            newItem.sscc = corr.corrected;
            newItem.formattedCode = formatSSCC(corr.corrected);
            newItem.status = 'tuzatildi';
            newItem.notes = corr.details;
          } else {
            newItem.sscc = clean;
            newItem.formattedCode = formatSSCC(clean);
            newItem.status = clean.length === 18 ? 'nazorat_mos_emas' : 'oqilmadi';
          }
        }
      }

      return newItem;
    });

    updateAndPersistItems(updated);
  };

  // Qatorni o'chirish
  const handleDeleteRow = (id: string) => {
    const filtered = items.filter(i => i.id !== id);
    updateAndPersistItems(filtered);
    if (selectedItemId === id) {
      setSelectedItemId(filtered[0]?.id || null);
    }
  };

  // Barcha qatorlarni tozalash
  const handleClearAll = () => {
    if (window.confirm('Haqiqatan ham barcha etiketkalarni tozalamoqchimisiz?')) {
      updateAndPersistItems([]);
      setSelectedItemId(null);
    }
  };

  // Demo yuklash
  const handleLoadDemo = () => {
    updateAndPersistItems(DEMO_ITEMS);
    setSelectedItemId(DEMO_ITEMS[0].id);
  };

  // Qo'lda bo'sh qator qo'shish
  const handleAddManualRow = () => {
    const newRow: BarcodeItem = {
      id: `bc-manual-${Date.now()}`,
      fileName: 'Qo\'lda kiritilgan',
      rawCode: '',
      sscc: '',
      formattedCode: '',
      color: '',
      size: '',
      rost: '170-176',
      copies: settings.defaultCopies,
      status: 'oqilmadi',
      notes: 'Raqamni kiriting',
      createdAt: new Date().toISOString()
    };
    const merged = [newRow, ...items];
    updateAndPersistItems(merged);
    setSelectedItemId(newRow.id);
  };

  // Ommaviy parametrlarni qo'llash
  const handleApplyBatch = () => {
    const updated = items.map(item => ({
      ...item,
      color: batchColorInput ? batchColorInput : item.color,
      size: batchSizeInput ? batchSizeInput : item.size,
      rost: batchRostInput ? batchRostInput : (item.rost || '170-176'),
      copies: batchCopiesInput > 0 ? batchCopiesInput : item.copies
    }));

    updateAndPersistItems(updated);
    setShowBatchModal(false);
  };

  // PDF Yaratish va yuklab olish
  const handleGeneratePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const pdfBytes = await generateLabelsPdf(processedItems, settings, {
        widthMm: settings.widthMm,
        heightMm: settings.heightMm,
        barcodeWidthMm: settings.barcodeWidthMm,
        barcodeHeightMm: settings.barcodeHeightMm,
        marginTopMm: settings.marginTopMm,
        marginLeftMm: settings.marginLeftMm
      });
      downloadPdfBlob(pdfBytes, `Chust_Etiketkalar_${settings.formatType}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      alert(`PDF yaratishda xatolik: ${err?.message || err}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-5 pb-10" id="barcode-labels-module">
      
      {/* 1. MODULE HEADER & STATS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white flex items-center gap-2">
                  Этикетки / Штрих-код (GS1-128 / SSCC)
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    settings.formatType === '80x50'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    {settings.formatType === '80x50' ? '80x50 mm Vertikal' : '40x58 mm Termo'}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rasm/skrinshotlardan shtrix-kodlarni o'qish, rang/o'lcham/rost kiritish va tayyor PDF olish
                </p>
              </div>
            </div>

            {/* FORMAT TANLASH (40x58 mm yoki 80x50 mm) & SOZLAMALAR */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 p-1 rounded-2xl shadow-inner">
              <button
                type="button"
                onClick={() => handleSelectFormat('40x58')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.formatType === '40x58'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                40x58 mm (Gorizontal)
              </button>
              <button
                type="button"
                onClick={() => handleSelectFormat('80x50')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  settings.formatType === '80x50'
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>80x50 mm (Vertikal)</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  Rasm bo'yicha
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-600"
                title="Etiketka va shtrix-kod o'lchamlari (Eni, Bo'yi, Hoshiyalar)"
              >
                <Settings className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </div>

          {/* Stat kartalar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400">Jami kodlar:</span>{' '}
              <strong className="text-white font-mono">{stats.total}</strong>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-300">
              <span>To'g'ri (OK):</span>{' '}
              <strong className="font-mono">{stats.okCount}</strong>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-xl text-sky-300">
              <span>OCR/Tuzatildi:</span>{' '}
              <strong className="font-mono">{stats.ocrCount}</strong>
            </div>

            {stats.duplicateCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300">
                <span>Takroriy:</span>{' '}
                <strong className="font-mono">{stats.duplicateCount}</strong>
              </div>
            )}

            {stats.errorCount > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl text-rose-300">
                <span>Xatolar:</span>{' '}
                <strong className="font-mono">{stats.errorCount}</strong>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 2. UPLOAD ZONE & DRAG & DROP / CTRL+V */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="bg-slate-900/60 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center transition-all cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFilesQueue(Array.from(e.target.files));
          }}
        />

        <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-slate-800 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 rounded-2xl transition-all shadow-md">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-sm font-bold text-slate-200">
            Shtrix-kod rasmlarini bu yerga tashlang yoki fayllarni tanlang
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-slate-300">
              Ctrl+V
            </span>
            <span>bilan to'g'ridan-to'g'ri buferdan (Win+Shift+S) qo'yish mumkin</span>
            <span>·</span>
            <span>PNG, JPG, WEBP formatlar</span>
          </div>
        </div>
      </div>

      {/* 3. PROGRESS BAR (O'QISH JARAYONI) */}
      {isProcessing && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              {processingStatusText}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-white">{progressPercent}%</span>
              <button
                onClick={() => { isCancelledRef.current = true; }}
                className="text-[11px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2 py-1 rounded transition-colors"
              >
                Bekor qilish
              </button>
            </div>
          </div>

          {/* Bar */}
          <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-200 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 4. TOOLBAR & ACTIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* Chap qism: Filtrlar va Qidiruv */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Kodni yoki rangni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-3 py-2 rounded-xl text-xs w-48 sm:w-60 focus:outline-hidden focus:border-indigo-500"
          />

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterStatus === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hammasi ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('valid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterStatus === 'valid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              To'g'ri ({stats.okCount + stats.ocrCount})
            </button>
            {stats.errorCount > 0 && (
              <button
                onClick={() => setFilterStatus('errors')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === 'errors' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-400 hover:text-white'
                }`}
              >
                Xatolar ({stats.errorCount})
              </button>
            )}
            {stats.duplicateCount > 0 && (
              <button
                onClick={() => setFilterStatus('duplicates')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === 'duplicates' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-400 hover:text-white'
                }`}
              >
                Takroriy ({stats.duplicateCount})
              </button>
            )}
          </div>
        </div>

        {/* O'ng qism: Qo'shish, Excel, Ommaviy va PDF */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          <button
            onClick={handleAddManualRow}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition-colors"
            title="Qo'lda yangi qator kiritish"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Qo'lda kiritish</span>
          </button>

          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition-colors"
            title="Barcha qatorlarga bir xil rang va o'lcham berish"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Hammasiga qo'llash</span>
          </button>

          {/* Excel Input */}
          <input 
            ref={excelInputRef}
            type="file" 
            accept=".xlsx,.xls" 
            className="hidden" 
            onChange={handleExcelUpload}
          />
          <button
            onClick={() => excelInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-2 rounded-xl border border-slate-700 transition-colors"
            title="Excel fayldan 18-20 xonali kodlarni import qilish"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel Import</span>
          </button>

          <button
            onClick={() => exportBarcodesToExcel(processedItems)}
            disabled={processedItems.length === 0}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 px-3 py-2 rounded-xl border border-slate-700 transition-colors"
            title="Excel formatida saqlab olish"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Eksport</span>
          </button>

          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 px-3 py-2 rounded-xl border border-slate-700 transition-colors"
            title="Namunaviy to'g'ri va ko'p rangli etiketkalar"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Demo namunalar</span>
          </button>

          {/* ASOSIY PDF YARATISH TUGMASI */}
          <button
            onClick={handleGeneratePdf}
            disabled={stats.okCount + stats.ocrCount === 0 || isGeneratingPdf}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {isGeneratingPdf ? 'Yaratilmoqda...' : `PDF Yaratish (${stats.totalLabelsToPrint} dona)`}
            </span>
          </button>

        </div>

      </div>

      {/* 5. MAIN CONTENT SPLIT: TABLE + LIVE 40x58 MM PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* JADVAL (8 yoki 9 ustun) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">№</th>
                    <th className="py-3 px-3 w-16">Rasm</th>
                    <th className="py-3 px-4 min-w-[190px]">Shtrix-kod raqami</th>
                    <th className="py-3 px-3 w-28">Holat</th>
                    <th className="py-3 px-3 min-w-[130px]">Rang (Цвет)</th>
                    <th className="py-3 px-3 w-24">O'lcham (Размер)</th>
                    <th className="py-3 px-3 w-24">Рост (Bo'y)</th>
                    <th className="py-3 px-3 w-16 text-center">Nusxa</th>
                    <th className="py-3 px-3 w-20 text-center">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        Hech qanday etiketka topilmadi. Yuqoridan rasm yuklang yoki "Qo'lda kiritish" tugmasini bosing.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const isSelected = item.id === selectedItemId;

                      return (
                        <tr 
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : ''
                          }`}
                        >
                          {/* № */}
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Rasm ko'rinishi */}
                          <td className="py-2 px-3">
                            {item.imageUrl ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageModalUrl(item.imageUrl || null);
                                }}
                                className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-indigo-400 transition-all flex items-center justify-center group"
                                title="Rasmni kattalashtirish"
                              >
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.fileName} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                                />
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
                                <Barcode className="w-4 h-4" />
                              </div>
                            )}
                          </td>

                          {/* Shtrix-kod raqami (inline input) */}
                          <td className="py-2 px-4">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={item.rawCode}
                                onChange={(e) => handleUpdateField(item.id, 'rawCode', e.target.value)}
                                placeholder="046400143805267798"
                                className="w-full bg-slate-800/90 border border-slate-700 text-white font-mono px-2.5 py-1.5 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                              />
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                                <span>{item.formattedCode || '-'}</span>
                                {item.notes && (
                                  <span className="text-slate-500 truncate max-w-[140px]" title={item.notes}>
                                    · {item.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Holat nishoni */}
                          <td className="py-2 px-3">
                            {item.status === 'OK' && (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3" /> OK
                              </span>
                            )}
                            {item.status === 'OCR' && (
                              <span className="inline-flex items-center gap-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                OCR
                              </span>
                            )}
                            {item.status === 'tuzatildi' && (
                              <span className="inline-flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded-md text-[11px] font-bold" title={item.notes}>
                                Tuzatildi
                              </span>
                            )}
                            {item.status === 'takror' && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                <AlertTriangle className="w-3 h-3" /> Takror
                              </span>
                            )}
                            {item.status === 'nazorat_mos_emas' && (
                              <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                <AlertCircle className="w-3 h-3" /> Xato
                              </span>
                            )}
                            {item.status === 'oqilmadi' && (
                              <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                O'qilmadi
                              </span>
                            )}
                          </td>

                          {/* Rang (Цвет) */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.color}
                              onChange={(e) => handleUpdateField(item.id, 'color', e.target.value)}
                              placeholder="Белый yoki Зеленый"
                              className="w-full bg-slate-800/80 border border-slate-700 text-white px-2 py-1.5 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                            />
                          </td>

                          {/* O'lcham (Размер) */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.size}
                              onChange={(e) => handleUpdateField(item.id, 'size', e.target.value)}
                              placeholder="104 yoki XL"
                              className="w-full bg-slate-800/80 border border-slate-700 text-white font-bold px-2 py-1.5 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                            />
                          </td>

                          {/* Рост (Bo'y) */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.rost || ''}
                              onChange={(e) => handleUpdateField(item.id, 'rost', e.target.value)}
                              placeholder="170-176"
                              className="w-full bg-slate-800/80 border border-slate-700 text-white font-mono px-2 py-1.5 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                            />
                          </td>

                          {/* Nusxalar soni */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={item.copies}
                              onChange={(e) => handleUpdateField(item.id, 'copies', parseInt(e.target.value, 10) || 1)}
                              className="w-14 text-center bg-slate-800/80 border border-slate-700 text-white font-mono font-bold px-1 py-1.5 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                            />
                          </td>

                          {/* Amallar */}
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItemId(item.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Prevyuni ko'rish"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRow(item.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pastki panel */}
            <div className="bg-slate-800/60 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
              <span>Ko'rsatilmoqda: {filteredItems.length} ta etiketka</span>
              {items.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  Barchasini tozalash
                </button>
              )}
            </div>
          </div>
        </div>

        {/* JONLI ETİKETKA PREVYUSI */}
        <div className="lg:col-span-4 space-y-4">
          <LabelPreviewCard
            item={selectedItem}
            widthMm={settings.widthMm}
            heightMm={settings.heightMm}
            formatType={settings.formatType}
          />

          {/* Spetsifikatsiya yordamchisi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              {settings.formatType === '80x50' ? '80x50 mm Vertikal Etiketka' : '40x58 mm Termo Etiketka'}
            </h4>
            <ul className="space-y-1.5 text-[11px] leading-relaxed list-disc list-inside text-slate-400">
              <li>Standart: <strong>GS1-128 (SSCC)</strong> 18 xonali to'liq nazorat raqami</li>
              {settings.formatType === '80x50' ? (
                <>
                  <li>Format: <strong>80x50 mm (Vertikal)</strong> — Huddi rasmdagidek</li>
                  <li>Shtrix-kod o'lchami: <strong>Eniga 4.2 sm (42 mm)</strong>, <strong>Bo'yiga 5.1 sm (51 mm)</strong></li>
                  <li>Tagida: Oraliqli 20 ta raqamlar + (00) formatlangan SSCC</li>
                  <li>Pastda 3 ta ustun: <strong>Цвет:</strong> | <strong>Размер:</strong> | <strong>Рост:</strong></li>
                </>
              ) : (
                <>
                  <li>Format: <strong>40x58 mm</strong> termo qop etiketkasi, 90° burilgan</li>
                  <li>Modullar: <strong>156 ta modul</strong>, eni 0.27 mm, chiziq uzunligi 33 mm</li>
                  <li>Pastda: Rang (yagona yoki ko'p qatorli) va o'lcham</li>
                </>
              )}
            </ul>
          </div>
        </div>

      </div>

      {/* MODAL 1: OMMAVIY QO'LLASH (BATCH UPDATE) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                Hammasiga rang, o'lcham va rost qo'llash
              </h3>
              <button 
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Kiritilgan ma'lumotlar ro'yxatdagi barcha etiketkalarga birdaniga o'rnatiladi:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Rang (Цвет):</label>
                <input
                  type="text"
                  placeholder="Masalan: Зеленый yoki Белый"
                  value={batchColorInput}
                  onChange={(e) => setBatchColorInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">O'lcham (Размер):</label>
                <input
                  type="text"
                  placeholder="Masalan: 104 yoki XL"
                  value={batchSizeInput}
                  onChange={(e) => setBatchSizeInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Bo'y / Rost (Рост):</label>
                <input
                  type="text"
                  placeholder="Masalan: 170-176 yoki 164"
                  value={batchRostInput}
                  onChange={(e) => setBatchRostInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Har bir koddan nusxa soni:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={batchCopiesInput}
                  onChange={(e) => setBatchCopiesInput(parseInt(e.target.value, 10) || 4)}
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleApplyBatch}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Barchasiga qo'llash
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: RASMNI KATTALASHTIRIB KO'RISH */}
      {previewImageModalUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImageModalUrl(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl max-h-[85vh] p-2 relative shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImageModalUrl(null)}
              className="absolute top-3 right-3 bg-slate-800/80 hover:bg-slate-800 text-white p-1.5 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageModalUrl} 
              alt="Shtrix-kod kattalashtirilgan rasm" 
              className="max-h-[75vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* MODAL 3: ETIKETKA VA SHTRIX-KOD O'LCHAMLARI HAMDA API SOZLAMALARI */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Dastur va Etiketka Sozlamalari
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TABLAR: O'LCHAMLAR VA API INTEGRATSIYASI */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setSettingsActiveTab('dimensions')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all ${
                  settingsActiveTab === 'dimensions'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Etiketka o'lchamlari
              </button>
              <button
                type="button"
                onClick={() => setSettingsActiveTab('api')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                  settingsActiveTab === 'api'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>ERP API Integratsiyasi</span>
                <span className="text-[9px] bg-slate-700 text-slate-300 px-1 py-0.2 rounded font-mono">
                  {apiSettings.enabled ? 'Faol' : 'Oflayn'}
                </span>
              </button>
            </div>

            {settingsActiveTab === 'dimensions' ? (
              <>
                {/* Tezkor format tanlash */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Tayyor andozalar (Preset):</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings(SETTINGS_80x50)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        settings.formatType === '80x50'
                          ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>80x50 mm (Vertikal)</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">3-rasm</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal mt-1">
                        Kod: 44.0 mm x 57.0 mm (Baland)
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings(DEFAULT_LABEL_SETTINGS)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        settings.formatType === '40x58'
                          ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 ring-2 ring-blue-500/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>40x58 mm (Gorizontal)</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Termo qop</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal mt-1">
                        90° burilgan, 33x42.1 mm
                      </p>
                    </button>
                  </div>
                </div>

                {/* O'lchamlar formasi */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Shtrix-kod Eni (mm):</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="10"
                        max="100"
                        value={settings.barcodeWidthMm}
                        onChange={(e) => setSettings(prev => ({ ...prev, barcodeWidthMm: parseFloat(e.target.value) || 44 }))}
                        className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-500">mm</span>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-mono">3-rasm: 44.0 mm</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Shtrix-kod Bo'yi (mm):</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="10"
                        max="100"
                        value={settings.barcodeHeightMm || 57}
                        onChange={(e) => setSettings(prev => ({ ...prev, barcodeHeightMm: parseFloat(e.target.value) || 57 }))}
                        className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-500">mm</span>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-mono">3-rasm: 57.0 mm</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Etiketka Eni (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.widthMm}
                      onChange={(e) => setSettings(prev => ({ ...prev, widthMm: parseFloat(e.target.value) || 50 }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Etiketka Bo'yi (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.heightMm}
                      onChange={(e) => setSettings(prev => ({ ...prev, heightMm: parseFloat(e.target.value) || 80 }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Yuqori hoshiya (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.marginTopMm}
                      onChange={(e) => setSettings(prev => ({ ...prev, marginTopMm: parseFloat(e.target.value) || 3.5 }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Chap hoshiya (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={settings.marginLeftMm}
                      onChange={(e) => setSettings(prev => ({ ...prev, marginLeftMm: parseFloat(e.target.value) || 3.0 }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                  <p className="text-slate-300 font-bold">3-rasm bo'yicha moslashuv:</p>
                  <p>
                    Shtrix-kod chiziqlari etiketkaning 71% qismini egallaydi. Pastki yozuvlar va 3 ta ustun (Цвет:, Размер:, Рост:) qog'oz chetiga qadar toza taqsimlangan.
                  </p>
                </div>
              </>
            ) : (
              /* TAB 2: ERP API INTEGRATSIYASI */
              <div className="space-y-3.5 text-xs">
                {/* Oflayn / API holati bildirishnomasi */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 shrink-0 mt-0.5">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-blue-300">Hozirda: Oflayn rejim (API o'chiq)</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Shtrix-kod o'qish, SSCC tekshirish va PDF generatsiya 100% brauzerda avtonom ishlaydi. 
                      Kelajakda ERP serveri yoki tashqi API tayyor bo'lganda, quyidagi maydonlarga manzil kiritib tizimni to'g'ridan-to'g'ri ulash mumkin.
                    </p>
                  </div>
                </div>

                {/* API yoqish/o'chirish */}
                <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <div>
                    <span className="font-bold text-white block">Tashqi API bilan sinxronizatsiya</span>
                    <span className="text-[11px] text-slate-400">Yangi o'qilgan etiketkalarni ERP serveriga yuborish</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={apiSettings.enabled} 
                      onChange={(e) => setApiSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* API Endpoint URL */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    ERP API Endpoint URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.chusttextile.uz/v1/labels"
                    value={apiSettings.apiUrl}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiUrl: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">Masalan: https://erp.chusttextile.uz/api/labels</p>
                </div>

                {/* API Kalit / Token */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    API Kalit (Bearer Token):
                  </label>
                  <input
                    type="password"
                    placeholder="ct_live_xxxxxxxxxxxxxxxx"
                    value={apiSettings.apiKey}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Test aloqasi */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!apiSettings.apiUrl) {
                        setApiTestStatus('Iltimos, avval API URL manzilini kiriting');
                      } else {
                        setApiTestStatus('API manzili saqlandi (Server kutish holatida)');
                      }
                      setTimeout(() => setApiTestStatus(null), 3500);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs transition-colors"
                  >
                    Ulanishni tekshirish
                  </button>
                  {apiTestStatus && (
                    <span className="text-[11px] text-amber-300 font-mono">
                      {apiTestStatus}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (settingsActiveTab === 'dimensions') {
                    setSettings(settings.formatType === '80x50' ? SETTINGS_80x50 : DEFAULT_LABEL_SETTINGS);
                  } else {
                    setApiSettings(DEFAULT_API_SETTINGS);
                    localStorage.removeItem('chust_erp_api_settings');
                  }
                }}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Standartga qaytarish
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('chust_erp_api_settings', JSON.stringify(apiSettings));
                  } catch {}
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tayyor / Saqlash
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
