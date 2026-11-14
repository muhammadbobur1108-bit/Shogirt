import React, { useState, useMemo } from 'react';
import { InventoryItem, WarehouseBox, Order, AppUser } from '../types';
import { Language } from '../locales';
import { 
  Search, 
  Plus, 
  Layers, 
  Package, 
  Box as BoxIcon, 
  Printer, 
  Calendar, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  PlusCircle, 
  FileText,
  ClipboardList,
  FileSpreadsheet,
  Check,
  Info,
  GitMerge,
  Truck,
  CheckSquare,
  Square,
  RefreshCw,
  Eye,
  AlertCircle,
  X,
  FileCheck
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onUpdateInventory: (updatedItems: InventoryItem[]) => void;
  boxes?: WarehouseBox[];
  onUpdateBoxes?: (updatedBoxes: WarehouseBox[]) => void;
  orders?: Order[];
  currentUser?: AppUser | null;
  lang: Language;
}

export default function InventoryView({ 
  inventory, 
  onUpdateInventory, 
  boxes = [], 
  onUpdateBoxes, 
  orders = [], 
  currentUser,
  lang 
}: InventoryViewProps) {
  // Primary subtab: 'finished_goods' (Склад готовой продукции - DEFAULT) or 'raw_materials' (Сырье и материалы)
  const [subTab, setSubTab] = useState<'finished_goods' | 'raw_materials'>('finished_goods');

  // Checkbox Mode (Daily Checklist verification mode)
  const [isChecklistMode, setIsChecklistMode] = useState<boolean>(false);
  const [checklistDate, setChecklistDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Selective Printing & Multi-select Checkboxes
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Filters for Finished Goods Warehouse
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [taraFilter, setTaraFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Notification Toast state (Zatarka and operations)
  const [zatarkaToast, setZatarkaToast] = useState<{ message: string; type: 'info' | 'warning' | 'success' } | null>(null);

  const showToast = (message: string, type: 'info' | 'warning' | 'success' = 'warning') => {
    setZatarkaToast({ message, type });
    setTimeout(() => {
      setZatarkaToast(null);
    }, 6000);
  };

  // =================================== ADD TARA (BOX) MODAL & FORM ===================================
  const [isAddBoxModalOpen, setIsAddBoxModalOpen] = useState(false);
  const [formBoxNumber, setFormBoxNumber] = useState('');
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formModelCode, setFormModelCode] = useState('');
  const [formArticle, setFormArticle] = useState('');
  const [formProductName, setFormProductName] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formSize, setFormSize] = useState('100/170-176');
  const [formQuantity, setFormQuantity] = useState(20);
  const [formPackagingDate, setFormPackagingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formWarehouseDate, setFormWarehouseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Готов к отгрузке' | 'Остаток' | 'Отгружен' | 'На проверке'>('Готов к отгрузке');
  const [formWeightKg, setFormWeightKg] = useState(15.0);
  const [formNotes, setFormNotes] = useState('');

  // Delete modal state
  const [boxToDelete, setBoxToDelete] = useState<WarehouseBox | null>(null);

  // Raw materials modal & state
  const [isAddRawModalOpen, setIsAddRawModalOpen] = useState(false);
  const [rawFormName, setRawFormName] = useState('');
  const [rawFormCategory, setRawFormCategory] = useState<'fabric' | 'yarn' | 'accessory'>('fabric');
  const [rawFormQty, setRawFormQty] = useState(100);
  const [rawFormUnit, setRawFormUnit] = useState<'kg' | 'dona' | 'rulon' | 'metr'>('dona');
  const [rawFormMinThreshold, setRawFormMinThreshold] = useState(50);
  const [rawFormColor, setRawFormColor] = useState('');
  const [rawSearchQuery, setRawSearchQuery] = useState('');
  const [rawActiveCategory, setRawActiveCategory] = useState<'all' | 'fabric' | 'yarn' | 'accessory'>('all');

  // Excel Sklad Modal state
  const [isExcelSkladModalOpen, setIsExcelSkladModalOpen] = useState(false);
  const [skladPasteText, setSkladPasteText] = useState('');

  // =================================== UNIQUE FILTER OPTIONS ===================================
  const uniqueOrders = useMemo(() => {
    const list = Array.from(new Set(boxes.map(b => b.orderNumber).filter(Boolean)));
    return list.sort();
  }, [boxes]);

  const uniqueColors = useMemo(() => {
    const list = Array.from(new Set(boxes.map(b => b.color).filter(Boolean)));
    return list.sort();
  }, [boxes]);

  const uniqueTaras = useMemo(() => {
    const list = Array.from(new Set(boxes.map(b => b.boxNumber).filter(Boolean)));
    return list.sort();
  }, [boxes]);

  // =================================== FILTERED WAREHOUSE BOXES ===================================
  const filteredBoxes = useMemo(() => {
    return boxes.filter(box => {
      // Search text matches any key field
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (box.boxNumber && box.boxNumber.toLowerCase().includes(q)) ||
        (box.orderNumber && box.orderNumber.toLowerCase().includes(q)) ||
        (box.modelCode && box.modelCode.toLowerCase().includes(q)) ||
        (box.article && box.article.toLowerCase().includes(q)) ||
        (box.productName && box.productName.toLowerCase().includes(q)) ||
        (box.color && box.color.toLowerCase().includes(q)) ||
        (box.size && box.size.toLowerCase().includes(q)) ||
        (box.status && box.status.toLowerCase().includes(q))
      );

      // Dropdown filters
      const matchesOrder = orderFilter === 'all' || box.orderNumber === orderFilter;
      const matchesColor = colorFilter === 'all' || box.color === colorFilter;
      const matchesTara = taraFilter === 'all' || box.boxNumber === taraFilter;
      const matchesStatus = statusFilter === 'all' || box.status === statusFilter;

      // Checklist date filter if in Checklist Mode
      const matchesDate = !isChecklistMode || (box.warehouseDate === checklistDate || box.packagingDate === checklistDate || box.createdAt === checklistDate);

      return matchesSearch && matchesOrder && matchesColor && matchesTara && matchesStatus && matchesDate;
    });
  }, [boxes, searchQuery, orderFilter, colorFilter, taraFilter, statusFilter, isChecklistMode, checklistDate]);

  // Metrics
  const totalBoxesCount = boxes.length;
  const totalQuantityPcs = boxes.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  const readyForShipmentCount = boxes.filter(b => b.status === 'Готов к отгрузке').length;
  const remainderCount = boxes.filter(b => b.status === 'Остаток').length;

  // Checklist verification stats
  const checklistVerifiedCount = filteredBoxes.filter(b => b.checked).length;
  const checklistVerifiedQty = filteredBoxes.filter(b => b.checked).reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  const checklistPendingCount = filteredBoxes.length - checklistVerifiedCount;

  // Selected boxes for print
  const selectedBoxes = useMemo(() => {
    if (selectedBoxIds.length > 0) {
      return boxes.filter(b => selectedBoxIds.includes(b.id));
    }
    return filteredBoxes;
  }, [boxes, selectedBoxIds, filteredBoxes]);

  const selectedTotalPcs = selectedBoxes.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

  // =================================== SMART INVENTORY MATCHING & ZATARKA ===================================
  // Check if current form inputs match an existing warehouse remainder item
  const detectedZatarkaMatch = useMemo(() => {
    if (!formModelCode.trim() && !formArticle.trim()) return null;
    const cleanFormArt = formArticle.trim().replace(/^0+/, '').toLowerCase();
    const cleanFormModel = formModelCode.trim().toLowerCase();
    const cleanFormSize = formSize.trim().toLowerCase();

    return boxes.find(b => {
      const bArtClean = (b.article || '').trim().replace(/^0+/, '').toLowerCase();
      const bModelClean = (b.modelCode || '').trim().toLowerCase();
      const bSizeClean = (b.size || '').trim().toLowerCase();

      const isModelMatch = cleanFormModel && (bModelClean === cleanFormModel || bModelClean.includes(cleanFormModel) || cleanFormModel.includes(bModelClean));
      const isArtMatch = cleanFormArt && (bArtClean === cleanFormArt || bArtClean.includes(cleanFormArt) || cleanFormArt.includes(bArtClean));
      const isSizeMatch = cleanFormSize && (bSizeClean === cleanFormSize || bSizeClean.includes(cleanFormSize) || cleanFormSize.includes(bSizeClean));

      return (isModelMatch || isArtMatch) && isSizeMatch && (b.status === 'Остаток' || b.quantity > 0);
    });
  }, [boxes, formModelCode, formArticle, formSize]);

  // Open add box modal
  const openAddBoxModal = () => {
    const nextTaraNum = `Т-${String(boxes.length + 1).padStart(3, '0')}`;
    setFormBoxNumber(nextTaraNum);
    setFormOrderNumber('');
    setFormModelCode('');
    setFormArticle('02618');
    setFormProductName('Футболка мужская');
    setFormColor('Хаки');
    setFormSize('100/170-176');
    setFormQuantity(20);
    const today = new Date().toISOString().split('T')[0];
    setFormPackagingDate(today);
    setFormWarehouseDate(today);
    setFormStatus('Готов к отгрузке');
    setFormWeightKg(15.0);
    setFormNotes('');
    setIsAddBoxModalOpen(true);
  };

  // Quick autofill when order is selected
  const handleOrderSelect = (orderNum: string) => {
    setFormOrderNumber(orderNum);
    const found = orders.find(o => o.orderNumber === orderNum || o.mosCode === orderNum);
    if (found) {
      setFormModelCode(found.modelCode || '');
      setFormArticle(found.oneCArticles?.[0] || found.mosCode || '02618');
      setFormProductName(found.productType || 'Футболка мужская');
      setFormColor(found.color || 'Хаки');
      
      // Determine sizes
      const sizesList = Object.entries(found.upakovkaSizes || found.sizes || {})
        .filter(([_, q]) => Number(q) > 0)
        .map(([s]) => s);
      if (sizesList.length > 0) {
        setFormSize(sizesList.join(', '));
      } else {
        setFormSize('2XS/84-12XL/148');
      }
      
      setFormQuantity(found.qtyPackaging || found.totalQuantity || 50);
    }
  };

  // Submit Add Box Form
  const handleSaveBox = (mergeWithZatarka: boolean = false) => {
    if (!formBoxNumber.trim()) {
      alert(lang === 'uz' ? 'Tara raqamini kiriting!' : 'Введите номер тары!');
      return;
    }

    if (mergeWithZatarka && detectedZatarkaMatch) {
      const existingX = detectedZatarkaMatch.quantity;
      const newY = Number(formQuantity) || 0;
      const fullZ = existingX + newY;
      const alertMsg = `В наличии есть остаток ${existingX} шт. Новая затарка ${newY} шт. Объединив остатки, получаем полноценную партию ${fullZ} шт. для затарки`;

      const updated = boxes.map(b => b.id === detectedZatarkaMatch.id ? {
        ...b,
        quantity: fullZ,
        status: 'Готов к отгрузке',
        packagingDate: formPackagingDate,
        warehouseDate: formWarehouseDate,
        notes: `Затарка объединена: +${newY} шт (${formOrderNumber || 'Заказ'})`
      } : b);

      if (onUpdateBoxes) {
        onUpdateBoxes(updated);
      }
      showToast(alertMsg, 'warning');
      setIsAddBoxModalOpen(false);
      return;
    }

    // Normal add new box
    const newBox: WarehouseBox = {
      id: `tara-${Date.now()}-${Math.random()}`,
      boxNumber: formBoxNumber.trim(),
      orderNumber: formOrderNumber.trim() || 'MOS-539.7.1',
      modelCode: formModelCode.trim() || 'SM-OW-1111/160',
      article: formArticle.trim() || '02618',
      productName: formProductName.trim() || 'Футболка мужская',
      color: formColor.trim() || 'Хаки',
      size: formSize.trim() || '2XS/84-12XL/148',
      quantity: Number(formQuantity) || 0,
      packagingDate: formPackagingDate,
      warehouseDate: formWarehouseDate,
      status: formStatus,
      weightKg: Number(formWeightKg) || 0,
      brandName: 'Chust Textile',
      createdAt: formWarehouseDate,
      notes: formNotes.trim(),
      checked: false
    };

    if (onUpdateBoxes) {
      onUpdateBoxes([newBox, ...boxes]);
    }

    // If an existing remainder was present, notify user anyway
    if (detectedZatarkaMatch) {
      const existingX = detectedZatarkaMatch.quantity;
      const newY = Number(formQuantity) || 0;
      const fullZ = existingX + newY;
      showToast(`В наличии есть остаток ${existingX} шт. Новая затарка ${newY} шт. Объединив остатки, получаем полноценную партию ${fullZ} шт. для затарки`, 'warning');
    } else {
      showToast(
        lang === 'uz'
          ? `Tara ${newBox.boxNumber} omborga muvaffaqiyatli qabul qilindi!`
          : `Тара ${newBox.boxNumber} (${newBox.quantity} шт) успешно принята на склад!`,
        'success'
      );
    }

    setIsAddBoxModalOpen(false);
  };

  // Delete box
  const confirmDeleteBox = () => {
    if (!boxToDelete) return;
    if (onUpdateBoxes) {
      onUpdateBoxes(boxes.filter(b => b.id !== boxToDelete.id));
    }
    setSelectedBoxIds(prev => prev.filter(id => id !== boxToDelete.id));
    showToast(
      lang === 'uz'
        ? `Tara ${boxToDelete.boxNumber} ombordan o'chirildi`
        : `Тара ${boxToDelete.boxNumber} удалена со склада`,
      'info'
    );
    setBoxToDelete(null);
  };

  // Quick Status change on row
  const handleQuickStatusChange = (boxId: string, newStatus: string) => {
    if (onUpdateBoxes) {
      const updated = boxes.map(b => b.id === boxId ? { ...b, status: newStatus } : b);
      onUpdateBoxes(updated);
    }
  };

  // Toggle checklist checkbox on row
  const handleToggleCheck = (boxId: string) => {
    if (onUpdateBoxes) {
      const updated = boxes.map(b => b.id === boxId ? { ...b, checked: !b.checked } : b);
      onUpdateBoxes(updated);
    }
  };

  // Checklist bulk mark
  const handleMarkAllChecked = (checkedVal: boolean) => {
    const idsInFilter = new Set(filteredBoxes.map(b => b.id));
    if (onUpdateBoxes) {
      const updated = boxes.map(b => idsInFilter.has(b.id) ? { ...b, checked: checkedVal } : b);
      onUpdateBoxes(updated);
    }
    showToast(
      checkedVal
        ? (lang === 'uz' ? 'Barcha ko\'rsatilgan taralar tekshirildi deb belgilandi' : 'Все отфильтрованные тары отмечены как проверенные')
        : (lang === 'uz' ? 'Barcha belgilar olib tashlandi' : 'Все отметки проверки сняты'),
      'info'
    );
  };

  // Multi-select for selective printing
  const handleToggleSelectRow = (id: string) => {
    setSelectedBoxIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedBoxIds.length === filteredBoxes.length) {
      setSelectedBoxIds([]);
    } else {
      setSelectedBoxIds(filteredBoxes.map(b => b.id));
    }
  };

  // Batch ship / remove
  const handleBatchShip = () => {
    if (selectedBoxIds.length === 0) return;
    if (onUpdateBoxes) {
      const updated = boxes.map(b => selectedBoxIds.includes(b.id) ? { ...b, status: 'Отгружен' } : b);
      onUpdateBoxes(updated);
    }
    showToast(
      lang === 'uz'
        ? `${selectedBoxIds.length} ta tara muvaffaqiyatli "Otgrujen" holatiga o'tkazildi!`
        : `${selectedBoxIds.length} тар переведены в статус "Отгружен"!`,
      'success'
    );
    setSelectedBoxIds([]);
  };

  // Batch delete
  const handleBatchDelete = () => {
    if (selectedBoxIds.length === 0) return;
    if (window.confirm(lang === 'uz' ? `Tanlangan ${selectedBoxIds.length} ta tarani o'chirmoqchimisiz?` : `Удалить выбранные ${selectedBoxIds.length} тар?`)) {
      if (onUpdateBoxes) {
        onUpdateBoxes(boxes.filter(b => !selectedBoxIds.includes(b.id)));
      }
      setSelectedBoxIds([]);
      showToast(lang === 'uz' ? 'Tanlangan taralar o\'chirildi' : 'Выбранные тары удалены', 'info');
    }
  };

  // Helper status color badge
  const renderStatusBadge = (status: string, boxId: string) => {
    let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';
    if (status === 'Готов к отгрузке') {
      colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    } else if (status === 'Остаток') {
      colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    } else if (status === 'Отгружен') {
      colorClass = 'bg-slate-700/50 text-slate-400 border-slate-600/40 line-through';
    } else if (status === 'На проверке') {
      colorClass = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }

    return (
      <div className="relative inline-block group">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider cursor-pointer flex items-center gap-1 ${colorClass}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {status || 'Готов к отгрузке'}
        </span>
        {/* Quick status dropdown on hover/click */}
        <div className="hidden group-hover:flex flex-col absolute left-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-30 min-w-[130px] text-[10px]">
          <button 
            type="button" 
            onClick={() => handleQuickStatusChange(boxId, 'Готов к отгрузке')}
            className="px-2.5 py-1 text-left text-emerald-400 hover:bg-slate-800 font-bold"
          >
            ● Готов к отгрузке
          </button>
          <button 
            type="button" 
            onClick={() => handleQuickStatusChange(boxId, 'Остаток')}
            className="px-2.5 py-1 text-left text-amber-300 hover:bg-slate-800 font-bold"
          >
            ● Остаток (Затарка)
          </button>
          <button 
            type="button" 
            onClick={() => handleQuickStatusChange(boxId, 'На проверке')}
            className="px-2.5 py-1 text-left text-blue-300 hover:bg-slate-800 font-bold"
          >
            ● На проверке
          </button>
          <button 
            type="button" 
            onClick={() => handleQuickStatusChange(boxId, 'Отгружен')}
            className="px-2.5 py-1 text-left text-slate-400 hover:bg-slate-800 font-bold"
          >
            ● Отгружен
          </button>
        </div>
      </div>
    );
  };

  // =================================== RAW MATERIALS CRUD & LOGIC ===================================
  const handleAddNewRawItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawFormName.trim()) {
      alert(lang === 'uz' ? 'Mahsulot nomini kiriting!' : 'Введите название изделия!');
      return;
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: rawFormName.trim(),
      category: rawFormCategory,
      quantity: rawFormQty,
      unit: rawFormUnit,
      color: rawFormColor.trim() || undefined,
      minThreshold: rawFormMinThreshold
    };

    onUpdateInventory([...inventory, newItem]);
    setRawFormName('');
    setRawFormQty(100);
    setRawFormMinThreshold(50);
    setRawFormColor('');
    setIsAddRawModalOpen(false);
  };

  const handleAdjustRawQty = (itemId: string, amount: number) => {
    const updated = inventory.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + amount);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    onUpdateInventory(updated);
  };

  const filteredRawItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(rawSearchQuery.toLowerCase()) || 
        (item.color && item.color.toLowerCase().includes(rawSearchQuery.toLowerCase()));
      const matchesCategory = rawActiveCategory === 'all' || item.category === rawActiveCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, rawSearchQuery, rawActiveCategory]);

  return (
    <div className="space-y-5 animate-fade-in text-slate-100">
      
      {/* ======================= NOTIFICATION ALERT TOAST ======================= */}
      {zatarkaToast && (
        <div className="fixed top-20 right-6 z-50 max-w-lg bg-amber-950/95 text-amber-100 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fade-in flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 block">
              {lang === 'uz' ? 'OMBOR ZATARKA OGOHLANTIRISHI' : 'УВЕДОМЛЕНИЕ СКЛАДА И ЗАТАРКИ'}
            </span>
            <p className="text-xs font-bold leading-snug">
              {zatarkaToast.message}
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setZatarkaToast(null)} 
            className="text-amber-400 hover:text-white text-lg p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================= 1. TOP SUBTAB NAVIGATION ======================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-md w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubTab('finished_goods')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-2 px-4 text-xs font-black rounded-lg transition-all cursor-pointer ${
              subTab === 'finished_goods' 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BoxIcon className="w-4 h-4 text-cyan-300" />
            <span>{lang === 'uz' ? 'Склад готовой продукции (Тайёр маҳсулот)' : 'Склад готовой продукции'}</span>
            <span className="ml-1.5 px-2 py-0.2 bg-black/40 rounded-full text-[10px] font-mono text-cyan-200">
              {boxes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('raw_materials')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-2 px-4 text-xs font-black rounded-lg transition-all cursor-pointer ${
              subTab === 'raw_materials' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-300" />
            <span>{lang === 'uz' ? 'Хомашё ва матолар' : 'Сырье и материалы'}</span>
            <span className="ml-1.5 px-2 py-0.2 bg-black/40 rounded-full text-[10px] font-mono text-indigo-200">
              {inventory.length}
            </span>
          </button>
        </div>

        {/* Action Header controls */}
        {subTab === 'finished_goods' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Checkbox Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsChecklistMode(!isChecklistMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isChecklistMode 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isChecklistMode ? (lang === 'uz' ? 'Чеклист фаол' : 'Чеклист включен') : (lang === 'uz' ? 'Чеклист режими (Checkbox)' : 'Чеклист (Checkbox)')}</span>
            </button>

            {/* Selective Print Button */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'uz' ? 'Танланганларни чоп этиш' : 'Печать накладной'}</span>
              {selectedBoxIds.length > 0 && (
                <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 rounded-full text-[10px] font-black">
                  {selectedBoxIds.length}
                </span>
              )}
            </button>

            {/* Add Tara Entry Button */}
            <button
              type="button"
              onClick={openAddBoxModal}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'uz' ? 'Янги тара қўшиш' : '+ Добавить тару на склад'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ================= SUBTAB 1: СКЛАД ГОТОВОЙ ПРОДУКЦИИ (PRIMARY) ============ */}
      {/* ========================================================================= */}
      {subTab === 'finished_goods' && (
        <div className="space-y-4">
          
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                {lang === 'uz' ? 'Жами таралар / жойлар' : 'Всего тар / мест'}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-white font-mono">{totalBoxesCount}</span>
                <span className="text-xs text-slate-400 font-semibold">{lang === 'uz' ? 'тара' : 'тар'}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
              <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">
                {lang === 'uz' ? 'Жами тайёр кийим' : 'Всего готовых изделий'}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-cyan-300 font-mono">{totalQuantityPcs.toLocaleString()}</span>
                <span className="text-xs text-cyan-400/80 font-semibold">{lang === 'uz' ? 'дона' : 'шт'}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">
                {lang === 'uz' ? 'Отгрузкага тайёр' : 'Готово к отгрузке'}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">{readyForShipmentCount}</span>
                <span className="text-xs text-emerald-400/80 font-semibold">{lang === 'uz' ? 'тара' : 'тар'}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md">
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">
                {lang === 'uz' ? 'Омбордаги қолдиқ (Затарка)' : 'Остатки на складе (Затарка)'}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-amber-300 font-mono">{remainderCount}</span>
                <span className="text-xs text-amber-400/80 font-semibold">{lang === 'uz' ? 'тара' : 'тар'}</span>
              </div>
            </div>
          </div>

          {/* CHECKLIST MODE ACTIVE BAR */}
          {isChecklistMode && (
            <div className="bg-amber-950/40 border-2 border-amber-500/60 p-3.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs animate-fade-in shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-amber-200 text-sm flex items-center gap-2">
                    {lang === 'uz' ? 'Кунлик қабул ва текширув чеклисти (Checkbox Mode)' : 'Ежедневный чеклист приемки и проверки (Checkbox Mode)'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {lang === 'uz' 
                      ? 'Омборчи ҳар бир тарани жойида санаб чиқиб, қутидаги белгини босиши керак.' 
                      : 'Кладовщик физически сверяет и пересчитывает тару на складе, отмечая галочкой.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <input 
                    type="date"
                    value={checklistDate}
                    onChange={(e) => setChecklistDate(e.target.value)}
                    className="bg-transparent text-xs text-white font-mono font-bold outline-none"
                  />
                </div>

                <div className="text-[11px] font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  {lang === 'uz' ? 'Текширилди:' : 'Проверено:'} <strong className="text-emerald-400">{checklistVerifiedCount}</strong> / {filteredBoxes.length} ({checklistVerifiedQty} шт)
                </div>

                <button
                  type="button"
                  onClick={() => handleMarkAllChecked(true)}
                  className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  ✓ {lang === 'uz' ? 'Ҳаммасини белгилаш' : 'Отметить все'}
                </button>

                <button
                  type="button"
                  onClick={() => handleMarkAllChecked(false)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  ✕ {lang === 'uz' ? 'Белгиларни олиш' : 'Снять'}
                </button>
              </div>
            </div>
          )}

          {/* ======================= FILTER & SELECTIVE PRINT BAR ======================= */}
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
              
              {/* Search input */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder={lang === 'uz' ? "Тара №, буюртма, модел, артикул ёки ранг бўйича қидириш..." : "Поиск по таре №, заказу, модели, артикулу..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Order Filter */}
              <div>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
                >
                  <option value="all">📁 {lang === 'uz' ? 'Барча буюртмалар' : 'Все заказы'}</option>
                  {uniqueOrders.map(ord => (
                    <option key={ord} value={ord}>{ord}</option>
                  ))}
                </select>
              </div>

              {/* Color Filter */}
              <div>
                <select
                  value={colorFilter}
                  onChange={(e) => setColorFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
                >
                  <option value="all">🎨 {lang === 'uz' ? 'Барча ранглар' : 'Все цвета'}</option>
                  {uniqueColors.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
                >
                  <option value="all">🏷️ {lang === 'uz' ? 'Барча статуслар' : 'Все статусы'}</option>
                  <option value="Готов к отгрузке">🟢 Готов к отгрузке</option>
                  <option value="Остаток">🟡 Остаток (Затарка)</option>
                  <option value="На проверке">🔵 На проверке</option>
                  <option value="Отгружен">⚪ Отгружен</option>
                </select>
              </div>

            </div>

            {/* SELECTION BAR (When items are selected via checkboxes) */}
            {selectedBoxIds.length > 0 && (
              <div className="bg-cyan-950/40 border border-cyan-800/60 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300">
                    {lang === 'uz' ? 'Танланди:' : 'Выбрано:'} <strong className="text-white font-mono">{selectedBoxIds.length}</strong> {lang === 'uz' ? 'тара' : 'тар'}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-mono text-cyan-200">
                    {lang === 'uz' ? 'Жами:' : 'Всего:'} <strong>{selectedTotalPcs}</strong> {lang === 'uz' ? 'дона' : 'шт'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{lang === 'uz' ? 'Танланганларни чоп этиш' : 'Печать выбранных тар'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchShip}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{lang === 'uz' ? 'Отгрузка қилиш' : 'Отгрузить'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'uz' ? 'Ўчириш' : 'Удалить'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBoxIds([])}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-white"
                  >
                    {lang === 'uz' ? 'Бекор қилиш' : 'Снять'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ================= 2. THE STRICT 11-COLUMN WAREHOUSE TABLE =============== */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={filteredBoxes.length > 0 && selectedBoxIds.length === filteredBoxes.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer w-4 h-4"
                        title={lang === 'uz' ? 'Ҳаммасини танлаш' : 'Выбрать все'}
                      />
                    </th>
                    <th className="p-3 whitespace-nowrap text-cyan-400">1. Номер тары</th>
                    <th className="p-3 whitespace-nowrap text-slate-300">2. Заказ</th>
                    <th className="p-3 whitespace-nowrap text-slate-300">3. Модель</th>
                    <th className="p-3 whitespace-nowrap text-amber-400">4. Артикул</th>
                    <th className="p-3 whitespace-nowrap text-slate-300">5. Наименование</th>
                    <th className="p-3 whitespace-nowrap text-slate-300">6. Цвет</th>
                    <th className="p-3 whitespace-nowrap text-indigo-300">7. Размеры</th>
                    <th className="p-3 whitespace-nowrap text-right text-emerald-400">8. Всего</th>
                    <th className="p-3 whitespace-nowrap text-slate-400">9. Дата упаковка</th>
                    <th className="p-3 whitespace-nowrap text-slate-400">10. Дата склада</th>
                    <th className="p-3 whitespace-nowrap text-center">11. Статус</th>
                    <th className="p-3 whitespace-nowrap text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredBoxes.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-12 text-center text-slate-500 italic space-y-2">
                        <BoxIcon className="w-8 h-8 mx-auto text-slate-600" />
                        <p>{lang === 'uz' ? 'Складда ҳозирча тайёр маҳсулот тароси мавжуд эмас ёки фильтрга тўғри келмади.' : 'На складе готовой продукции нет записей или они не подходят под фильтр.'}</p>
                        <button
                          type="button"
                          onClick={openAddBoxModal}
                          className="mt-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{lang === 'uz' ? 'Биринчи тарани қўшиш' : 'Добавить первую тару'}</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredBoxes.map((box, idx) => {
                      const isSelected = selectedBoxIds.includes(box.id);
                      return (
                        <tr 
                          key={box.id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-cyan-950/30' 
                              : box.checked 
                                ? 'bg-emerald-950/20 hover:bg-emerald-950/30' 
                                : idx % 2 === 0 ? 'bg-slate-900/40 hover:bg-slate-800/60' : 'bg-slate-950/40 hover:bg-slate-800/60'
                          }`}
                        >
                          {/* Checkbox select */}
                          <td className="p-3 text-center">
                            {isChecklistMode ? (
                              <button
                                type="button"
                                onClick={() => handleToggleCheck(box.id)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                                  box.checked ? 'bg-emerald-500 text-slate-950 font-black' : 'border border-slate-700 bg-slate-950 text-transparent hover:border-emerald-500'
                                }`}
                                title={lang === 'uz' ? 'Жисман текширилганлик белгиси' : 'Физически проверено'}
                              >
                                ✓
                              </button>
                            ) : (
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectRow(box.id)}
                                className="rounded border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer w-4 h-4"
                              />
                            )}
                          </td>

                          {/* 1. Номер тары */}
                          <td className="p-3 font-bold text-cyan-400 font-mono whitespace-nowrap flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            <span>{box.boxNumber || `Т-${idx + 1}`}</span>
                          </td>

                          {/* 2. Заказ */}
                          <td className="p-3 font-mono text-slate-200 font-bold whitespace-nowrap">
                            {box.orderNumber || '—'}
                          </td>

                          {/* 3. Модель */}
                          <td className="p-3 font-mono text-slate-300 whitespace-nowrap max-w-[150px] truncate" title={box.modelCode}>
                            {box.modelCode || '—'}
                          </td>

                          {/* 4. Артикул */}
                          <td className="p-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                            <span className="bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                              {box.article || '02618'}
                            </span>
                          </td>

                          {/* 5. Наименование */}
                          <td className="p-3 text-white font-semibold whitespace-nowrap max-w-[180px] truncate" title={box.productName}>
                            {box.productName || 'Футболка мужская'}
                          </td>

                          {/* 6. Цвет */}
                          <td className="p-3 text-slate-300 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400 border border-slate-600 shrink-0" />
                              <span>{box.color || 'Хаки'}</span>
                            </span>
                          </td>

                          {/* 7. Размеры */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                              {box.size || '2XS/84-12XL/148'}
                            </span>
                          </td>

                          {/* 8. Всего */}
                          <td className="p-3 text-right font-black text-emerald-400 font-mono text-sm whitespace-nowrap">
                            {box.quantity} <span className="text-[10px] text-slate-400 font-normal">шт</span>
                          </td>

                          {/* 9. Дата упаковка */}
                          <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {box.packagingDate || box.createdAt || '—'}
                          </td>

                          {/* 10. Дата склада */}
                          <td className="p-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                            {box.warehouseDate || box.createdAt || '—'}
                          </td>

                          {/* 11. Статус */}
                          <td className="p-3 text-center whitespace-nowrap">
                            {renderStatusBadge(box.status, box.id)}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBoxIds([box.id]);
                                  setIsPrintModalOpen(true);
                                }}
                                className="p-1.5 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'uz' ? 'Чоп этиш' : 'Печать'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setBoxToDelete(box)}
                                className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'uz' ? 'Ўчириш' : 'Удалить'}
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

            {/* Table Footer info */}
            <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <span>
                {lang === 'uz' ? 'Кўрсатилмоқда:' : 'Показано тар:'} <strong className="text-white font-mono">{filteredBoxes.length}</strong> / {boxes.length}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono">
                  {lang === 'uz' ? 'Жами сақланаётган маҳсулот:' : 'Итого в отфильтрованных:'} <strong className="text-emerald-400">{filteredBoxes.reduce((s, b) => s + (Number(b.quantity) || 0), 0).toLocaleString()} шт</strong>
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= SUBTAB 2: СЫРЬЕ И МАТЕРИАЛЫ (SECONDARY) ================ */}
      {/* ========================================================================= */}
      {subTab === 'raw_materials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div>
              <h3 className="font-bold text-white text-base uppercase tracking-tight flex items-center">
                <Layers className="w-5 h-5 mr-2 text-indigo-400 shrink-0" />
                {lang === 'uz' ? 'Хомашё ва матолар омбори' : 'Склад сырья и материалов'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'uz' ? 'Матолар, иплар, фурнитура ва хомашё захираларини бошқариш' : 'Учет тканей, пряжи, фурнитуры и загрузка через 1С Excel Grid'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddRawModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'uz' ? 'Хомашё қўшиш' : 'Добавить сырье'}</span>
              </button>
            </div>
          </div>

          {/* Raw materials filter */}
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-wrap gap-2 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder={lang === 'uz' ? "Хомашё номи ёки ранги бўйича қидириш..." : "Поиск по названию или цвету сырья..."}
                value={rawSearchQuery}
                onChange={(e) => setRawSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button 
                type="button" 
                onClick={() => setRawActiveCategory('all')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rawActiveCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {lang === 'uz' ? 'Барчаси' : 'Все'}
              </button>
              <button 
                type="button" 
                onClick={() => setRawActiveCategory('fabric')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rawActiveCategory === 'fabric' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {lang === 'uz' ? 'Мато' : 'Ткани'}
              </button>
              <button 
                type="button" 
                onClick={() => setRawActiveCategory('yarn')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rawActiveCategory === 'yarn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {lang === 'uz' ? 'Ип' : 'Пряжа'}
              </button>
              <button 
                type="button" 
                onClick={() => setRawActiveCategory('accessory')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${rawActiveCategory === 'accessory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {lang === 'uz' ? 'Фурнитура' : 'Фурнитура'}
              </button>
            </div>
          </div>

          {/* Raw materials list */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="p-3">#</th>
                  <th className="p-3">{lang === 'uz' ? 'Номи' : 'Наименование'}</th>
                  <th className="p-3">{lang === 'uz' ? 'Категория' : 'Категория'}</th>
                  <th className="p-3">{lang === 'uz' ? 'Ранги' : 'Цвет'}</th>
                  <th className="p-3 text-right">{lang === 'uz' ? 'Миқдори' : 'Количество'}</th>
                  <th className="p-3 text-center">{lang === 'uz' ? 'Бирлиги' : 'Ед. изм.'}</th>
                  <th className="p-3 text-right">{lang === 'uz' ? 'Мин. қолдиқ' : 'Мин. остаток'}</th>
                  <th className="p-3 text-center">{lang === 'uz' ? 'Бошқариш' : 'Управление'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRawItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                      {lang === 'uz' ? 'Хомашёлар рўйхати бўш.' : 'Записей сырья нет.'}
                    </td>
                  </tr>
                ) : (
                  filteredRawItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 bg-slate-900/30 transition-colors">
                      <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-bold text-white">{item.name}</td>
                      <td className="p-3 text-slate-300 capitalize">{item.category}</td>
                      <td className="p-3 text-slate-300">{item.color || '—'}</td>
                      <td className="p-3 text-right font-black text-indigo-300 font-mono text-sm">{item.quantity}</td>
                      <td className="p-3 text-center text-slate-400 font-mono">{item.unit}</td>
                      <td className="p-3 text-right font-mono text-slate-400">{item.minThreshold}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustRawQty(item.id, 10)}
                            className="px-2 py-0.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded text-[10px] font-bold"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustRawQty(item.id, -10)}
                            className="px-2 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-[10px] font-bold"
                          >
                            -10
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
      )}


      {/* ========================================================================= */}
      {/* ================= 3. MODAL: ADD TARA (BOX) TO WAREHOUSE ================= */}
      {/* ========================================================================= */}
      {isAddBoxModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-5 md:p-6 shadow-2xl border border-slate-700 text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <BoxIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {lang === 'uz' ? 'Омборга янги тара қўшиш' : 'Добавить тару на склад готовой продукции'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'uz' ? 'Тара рақами, буюртма, модел, артикул ва қолдиқларни киритиш' : 'Заполнение параметров тары, модели, артикула и проверка затарки'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddBoxModalOpen(false)} 
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Order Selector Dropdown */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                ⚡ {lang === 'uz' ? 'Тайёр буюртмадан маълумотларни тўлдириш:' : 'Быстрое заполнение из существующего заказа:'}
              </label>
              <select
                value={formOrderNumber}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
              >
                <option value="">{lang === 'uz' ? '-- Буюртмани танланг (ёки қўлда ёзинг) --' : '-- Выберите заказ (или введите вручную) --'}</option>
                {orders.map(o => (
                  <option key={o.id} value={o.orderNumber}>
                    {o.orderNumber} - {o.modelCode} ({o.color}) [{o.brandName}]
                  </option>
                ))}
              </select>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* 1. Номер тары */}
              <div className="space-y-1">
                <label className="font-bold text-cyan-400 block">1. Номер тары *</label>
                <input 
                  type="text" 
                  value={formBoxNumber}
                  onChange={(e) => setFormBoxNumber(e.target.value)}
                  placeholder="Т-001"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono font-black text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 2. Заказ */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">2. Заказ *</label>
                <input 
                  type="text" 
                  value={formOrderNumber}
                  onChange={(e) => setFormOrderNumber(e.target.value)}
                  placeholder="MOS-539.7.1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 3. Модель */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">3. Модель *</label>
                <input 
                  type="text" 
                  value={formModelCode}
                  onChange={(e) => setFormModelCode(e.target.value)}
                  placeholder="SM-OW-1111/160"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 4. Артикул */}
              <div className="space-y-1">
                <label className="font-bold text-amber-400 block">4. Артикул *</label>
                <input 
                  type="text" 
                  value={formArticle}
                  onChange={(e) => setFormArticle(e.target.value)}
                  placeholder="02618 ёки 2342598"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono font-bold text-amber-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 5. Наименование */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-300 block">5. Наименование *</label>
                <input 
                  type="text" 
                  value={formProductName}
                  onChange={(e) => setFormProductName(e.target.value)}
                  placeholder="Футболка мужская с коротким рукавом"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 6. Цвет */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">6. Цвет *</label>
                <input 
                  type="text" 
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="Хаки"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 7. Размеры */}
              <div className="space-y-1">
                <label className="font-bold text-indigo-300 block">7. Размеры (e.g. 2XS/84-12XL/148, 100/170-176) *</label>
                <input 
                  type="text" 
                  value={formSize}
                  onChange={(e) => setFormSize(e.target.value)}
                  placeholder="100/170-176 ёки 2XS/84-12XL/148"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono font-bold text-indigo-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 8. Всего (шт) */}
              <div className="space-y-1">
                <label className="font-bold text-emerald-400 block">8. Всего (Кол-во шт) *</label>
                <input 
                  type="number" 
                  min="1"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono font-black text-emerald-400 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 11. Статус */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">11. Статус *</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Готов к отгрузке">🟢 Готов к отгрузке</option>
                  <option value="Остаток">🟡 Остаток (Затарка)</option>
                  <option value="На проверке">🔵 На проверке</option>
                  <option value="Отгружен">⚪ Отгружен</option>
                </select>
              </div>

              {/* 9. Дата упаковка */}
              <div className="space-y-1">
                <label className="font-bold text-slate-400 block">9. Дата упаковка</label>
                <input 
                  type="date" 
                  value={formPackagingDate}
                  onChange={(e) => setFormPackagingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 10. Дата склада */}
              <div className="space-y-1">
                <label className="font-bold text-slate-400 block">10. Дата склада</label>
                <input 
                  type="date" 
                  value={formWarehouseDate}
                  onChange={(e) => setFormWarehouseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

            </div>

            {/* SMART INVENTORY MATCHING & ZATARKA WARNING BANNER */}
            {detectedZatarkaMatch && (
              <div className="bg-amber-950/60 border-2 border-amber-500/80 p-3.5 rounded-2xl space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wide">
                  <GitMerge className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'uz' ? 'Омбордаги қолдиқ билан мослик аниқланди!' : 'Обнаружено совпадение с остатком на складе!'}</span>
                </div>
                <p className="text-xs text-amber-100 font-semibold leading-relaxed bg-black/40 p-2.5 rounded-xl border border-amber-500/30">
                  📢 <strong>
                    В наличии есть остаток {detectedZatarkaMatch.quantity} шт. Новая затарка {formQuantity} шт. Объединив остатки, получаем полноценную партию {detectedZatarkaMatch.quantity + formQuantity} шт. для затарки
                  </strong>
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Тара остатка: <strong>{detectedZatarkaMatch.boxNumber}</strong> | Модель: {detectedZatarkaMatch.modelCode} | Артикул: {detectedZatarkaMatch.article}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddBoxModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {lang === 'uz' ? 'Бекор қилиш' : 'Отмена'}
              </button>

              {detectedZatarkaMatch && (
                <button
                  type="button"
                  onClick={() => handleSaveBox(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <GitMerge className="w-4 h-4" />
                  <span>
                    {lang === 'uz' ? 'Қолдиқ билан бирлаштириш (Затарка)' : 'Объединить затарку в партию'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSaveBox(false)}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'uz' ? 'Алоҳида янги тара сифатида сақлаш' : 'Сохранить отдельной тарой'}</span>
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* ================= 4. MODAL: SELECTIVE PRINTING MANIFEST ================== */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-white text-slate-900 rounded-2xl max-w-5xl w-full flex flex-col shadow-2xl border border-gray-300 overflow-hidden max-h-[96vh]">
            
            {/* Top Toolbar */}
            <div className="bg-slate-100 border-b border-gray-300 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    {lang === 'uz' ? 'Склад накладнойи ва отгрузка чеклисти (Print Preview)' : 'Складская накладная и отгрузочный лист готовой продукции'}
                  </h3>
                  <p className="text-[11px] text-gray-600">
                    {lang === 'uz' 
                      ? `Танланган ${selectedBoxes.length} та тара бўйича чоп этиш учун тайёр ҳужжат` 
                      : `Печать по выбранным тарам (${selectedBoxes.length} позиций, ${selectedTotalPcs} шт)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'uz' ? 'Чоп этиш (Print)' : 'Печать (Ctrl+P)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg text-xs cursor-pointer"
                >
                  ✕ {lang === 'uz' ? 'Ёпиш' : 'Закрыть'}
                </button>
              </div>
            </div>

            {/* Printable Document Sheet Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white text-gray-900" id="warehouse-printable-manifest">
              
              {/* Header Letterhead */}
              <div className="border-b-2 border-gray-900 pb-3 flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 block">
                    ООО "CHUST TEXTILE" • СИСТЕМА УЧЕТА ПРОИЗВОДСТВА
                  </span>
                  <h1 className="text-xl font-black text-gray-900 mt-0.5">
                    АКТ ПРИЕМА-ПЕРЕДАЧИ И ОТГРУЗКИ ГОТОВОЙ ПРОДУКЦИИ (НАКЛАДНАЯ)
                  </h1>
                  <span className="text-xs text-gray-600 font-medium">
                    Склад готовой продукции (Отгрузочный манифест)
                  </span>
                </div>
                <div className="text-right text-xs font-mono space-y-0.5">
                  <div className="font-bold text-gray-800">
                    Дата: <span className="underline">{new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <div className="text-gray-600">
                    Всего тар: <strong>{selectedBoxes.length}</strong>
                  </div>
                  <div className="text-gray-900 font-bold">
                    Итого изделий: <strong>{selectedTotalPcs.toLocaleString()} шт</strong>
                  </div>
                </div>
              </div>

              {/* Manifest Metadata */}
              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 font-bold block text-[10px] uppercase">Склад отправитель:</span>
                  <span className="font-bold text-gray-900">Склад готовой продукции (Цех Чуст)</span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold block text-[10px] uppercase">Фильтр по заказу:</span>
                  <span className="font-bold text-gray-900">{orderFilter === 'all' ? 'Все выбранные заказы' : orderFilter}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold block text-[10px] uppercase">Ответственный зав. складом:</span>
                  <span className="font-bold text-gray-900">Q. Sobirov</span>
                </div>
              </div>

              {/* Strict 11-column Document Table */}
              <table className="w-full text-left text-[11px] border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-gray-800 font-bold text-center border-b border-gray-300">
                    <th className="border border-gray-300 p-1.5 w-7">№</th>
                    <th className="border border-gray-300 p-1.5">Номер тары</th>
                    <th className="border border-gray-300 p-1.5">Заказ</th>
                    <th className="border border-gray-300 p-1.5">Модель</th>
                    <th className="border border-gray-300 p-1.5">Артикул</th>
                    <th className="border border-gray-300 p-1.5 text-left">Наименование</th>
                    <th className="border border-gray-300 p-1.5">Цвет</th>
                    <th className="border border-gray-300 p-1.5">Размеры</th>
                    <th className="border border-gray-300 p-1.5 text-right font-black">Всего (шт)</th>
                    <th className="border border-gray-300 p-1.5">Дата упаковка</th>
                    <th className="border border-gray-300 p-1.5">Дата склада</th>
                    <th className="border border-gray-300 p-1.5">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBoxes.map((box, i) => (
                    <tr key={box.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="border border-gray-300 p-1 text-center font-mono text-gray-500">{i + 1}</td>
                      <td className="border border-gray-300 p-1 font-mono font-bold text-gray-900">{box.boxNumber}</td>
                      <td className="border border-gray-300 p-1 font-mono">{box.orderNumber}</td>
                      <td className="border border-gray-300 p-1 font-mono">{box.modelCode}</td>
                      <td className="border border-gray-300 p-1 font-mono font-bold">{box.article || '02618'}</td>
                      <td className="border border-gray-300 p-1 font-medium">{box.productName || 'Футболка мужская'}</td>
                      <td className="border border-gray-300 p-1">{box.color}</td>
                      <td className="border border-gray-300 p-1 font-mono font-semibold">{box.size}</td>
                      <td className="border border-gray-300 p-1 text-right font-bold text-gray-900 font-mono">{box.quantity}</td>
                      <td className="border border-gray-300 p-1 font-mono text-gray-600 text-center">{box.packagingDate || '—'}</td>
                      <td className="border border-gray-300 p-1 font-mono text-gray-600 text-center">{box.warehouseDate || '—'}</td>
                      <td className="border border-gray-300 p-1 text-center font-bold text-[10px]">
                        {box.status || 'Готов к отгрузке'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-900">
                    <td colSpan={8} className="border border-gray-300 p-1.5 text-right uppercase text-[10px]">
                      ИТОГО ПО НАКЛАДНОЙ:
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-black font-mono text-xs">
                      {selectedTotalPcs.toLocaleString()} шт
                    </td>
                    <td colSpan={3} className="border border-gray-300 p-1.5 text-center text-gray-600 font-mono text-[10px]">
                      {selectedBoxes.length} тар
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures block */}
              <div className="pt-6 grid grid-cols-3 gap-6 text-xs text-gray-800">
                <div className="space-y-4">
                  <span className="font-bold block">Сдал (Упаковочный цех):</span>
                  <div className="border-b border-gray-400 pb-1 text-gray-500 font-mono">
                    ________________ / ________________
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="font-bold block">Принял (Зав. складом готовой продукции):</span>
                  <div className="border-b border-gray-400 pb-1 text-gray-500 font-mono">
                    ________________ (Q. Sobirov)
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="font-bold block">Получил (Экспедитор / Водитель):</span>
                  <div className="border-b border-gray-400 pb-1 text-gray-500 font-mono">
                    ________________ / ________________
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* ================= 5. MODAL: DELETE CONFIRMATION ========================= */}
      {/* ========================================================================= */}
      {boxToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  {lang === 'uz' ? 'Тарани омбордан ўчириш' : 'Удалить тару со склада?'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {boxToDelete.boxNumber} ({boxToDelete.modelCode} • {boxToDelete.quantity} шт)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {lang === 'uz'
                ? `Ҳақиқатан ҳам "${boxToDelete.boxNumber}" рақамли тарани тайёр маҳсулот омборидан ўчириб ташламоқчимисиз?`
                : `Вы действительно хотите удалить тару "${boxToDelete.boxNumber}" (${boxToDelete.quantity} шт) из склада готовой продукции?`}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBoxToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'uz' ? 'Бекор қилиш' : 'Отмена'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteBox}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {lang === 'uz' ? 'Ҳа, ўчириш' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= 6. MODAL: ADD RAW MATERIAL ============================ */}
      {/* ========================================================================= */}
      {isAddRawModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-700 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                {lang === 'uz' ? 'Янги хомашё қўшиш' : 'Добавить сырье / ткань'}
              </h3>
              <button type="button" onClick={() => setIsAddRawModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddNewRawItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Номи *</label>
                <input 
                  type="text" 
                  required
                  value={rawFormName}
                  onChange={(e) => setRawFormName(e.target.value)}
                  placeholder="Супрем 100% пахта (Оқ)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Категория</label>
                  <select 
                    value={rawFormCategory}
                    onChange={(e: any) => setRawFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="fabric">Мато (Fabric)</option>
                    <option value="yarn">Ип (Yarn)</option>
                    <option value="accessory">Фурнитура</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Ранги</label>
                  <input 
                    type="text" 
                    value={rawFormColor}
                    onChange={(e) => setRawFormColor(e.target.value)}
                    placeholder="Оқ / Қора"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Миқдори *</label>
                  <input 
                    type="number" 
                    min="0"
                    value={rawFormQty}
                    onChange={(e) => setRawFormQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-indigo-300 font-bold font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Бирлиги</label>
                  <select 
                    value={rawFormUnit}
                    onChange={(e: any) => setRawFormUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="kg">кг</option>
                    <option value="dona">дона / шт</option>
                    <option value="rulon">рулон</option>
                    <option value="metr">метр</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRawModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  {lang === 'uz' ? 'Бекор қилиш' : 'Отмена'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  {lang === 'uz' ? 'Сақлаш' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
