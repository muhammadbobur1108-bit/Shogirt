import React, { useState, useEffect } from 'react';
import { InventoryItem, WarehouseBox, Order, AppUser } from '../types';
import { TRANSLATIONS, Language } from '../locales';
import { 
  Search, 
  Plus, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  Box as BoxIcon, 
  ShieldAlert, 
  Printer, 
  Calendar, 
  Tag, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  PlusCircle, 
  FileText,
  ClipboardList,
  FileSpreadsheet,
  Check,
  Upload,
  Info
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
  const t = TRANSLATIONS[lang];

  // Active top-level subtab: 'raw_materials' or 'boxes_stock'
  const [subTab, setSubTab] = useState<'raw_materials' | 'boxes_stock'>('raw_materials');

  const [boxToDelete, setBoxToDelete] = useState<WarehouseBox | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'fabric' | 'yarn' | 'accessory'>('all');

  // New raw stock modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'fabric' | 'yarn' | 'accessory'>('fabric');
  const [formQty, setFormQty] = useState(100);
  const [formUnit, setFormUnit] = useState<'kg' | 'dona' | 'rulon' | 'metr'>('dona');
  const [formMinThreshold, setFormMinThreshold] = useState(50);
  const [formColor, setFormColor] = useState('');

  // New Box form state
  const [isAddBoxModalOpen, setIsAddBoxModalOpen] = useState(false);
  const [boxFormNumber, setBoxFormNumber] = useState('');
  const [boxFormOrderNumber, setBoxFormOrderNumber] = useState('');
  const [boxFormModelCode, setBoxFormModelCode] = useState('');
  const [boxFormColor, setBoxFormColor] = useState('');
  const [boxFormSize, setBoxFormSize] = useState('L');
  const [boxFormQuantity, setBoxFormQuantity] = useState(50);
  const [boxFormWeightKg, setBoxFormWeightKg] = useState(15.2);
  const [boxFormBrandName, setBoxFormBrandName] = useState('');
  const [boxFormNotes, setBoxFormNotes] = useState('');
  const [boxFormDate, setBoxFormDate] = useState('2026-07-21');

  // Daily list view state
  const [selectedDailyDate, setSelectedDailyDate] = useState('2026-07-21');
  const [isDailyListModalOpen, setIsDailyListModalOpen] = useState(false);

  // Sklad Excel Grid modal state
  const [isExcelSkladModalOpen, setIsExcelSkladModalOpen] = useState(false);
  const [skladRowsToAddCount, setSkladRowsToAddCount] = useState<number>(5);
  const [skladPasteText, setSkladPasteText] = useState('');

  // Cell selection state for Sklad Excel grid
  const [selectedSkladCells, setSelectedSkladCells] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number } | null>(null);
  const [isDraggingSkladGrid, setIsDraggingSkladGrid] = useState(false);

  interface SkladExcelRow {
    id: string;
    name: string;
    category: 'fabric' | 'yarn' | 'accessory';
    color: string;
    quantity: number;
    unit: 'dona' | 'kg' | 'rulon' | 'metr';
    minThreshold: number;
  }

  const [skladExcelRows, setSkladExcelRows] = useState<SkladExcelRow[]>([
    { id: '1', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
    { id: '2', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
    { id: '3', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
    { id: '4', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
    { id: '5', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
  ]);

  const handleSkladGridCellChange = (id: string, field: keyof SkladExcelRow, value: any) => {
    setSkladExcelRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddSkladGridRows = (count: number = 1) => {
    const newRows: SkladExcelRow[] = Array.from({ length: Math.max(1, count) }).map((_, idx) => ({
      id: `srow-${Date.now()}-${idx}-${Math.random()}`,
      name: '',
      category: 'fabric',
      color: '',
      quantity: 0,
      unit: 'dona',
      minThreshold: 0
    }));
    setSkladExcelRows(prev => [...prev, ...newRows]);
  };

  const handleRemoveSkladGridRow = (id: string) => {
    setSkladExcelRows(prev => prev.filter(r => r.id !== id));
  };

  const handleClearSkladGridRows = () => {
    setSkladExcelRows([
      { id: '1', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
      { id: '2', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
      { id: '3', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
      { id: '4', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
      { id: '5', name: '', category: 'fabric', color: '', quantity: 0, unit: 'dona', minThreshold: 0 },
    ]);
    setSelectedSkladCells(null);
  };

  const clearSelectedSkladCells = () => {
    if (!selectedSkladCells) return;
    const minR = Math.min(selectedSkladCells.startRow, selectedSkladCells.endRow);
    const maxR = Math.max(selectedSkladCells.startRow, selectedSkladCells.endRow);
    const minC = Math.min(selectedSkladCells.startCol, selectedSkladCells.endCol);
    const maxC = Math.max(selectedSkladCells.startCol, selectedSkladCells.endCol);

    const fields: (keyof SkladExcelRow)[] = [
      'name', 'category', 'color', 'quantity', 'unit', 'minThreshold'
    ];

    setSkladExcelRows(prev => prev.map((row, rIdx) => {
      if (rIdx >= minR && rIdx <= maxR) {
        const updatedRow = { ...row };
        for (let cIdx = minC; cIdx <= maxC; cIdx++) {
          const field = fields[cIdx];
          if (field === 'quantity' || field === 'minThreshold') {
            (updatedRow[field] as number) = 0;
          } else if (field === 'category') {
            updatedRow.category = 'fabric';
          } else if (field === 'unit') {
            updatedRow.unit = 'dona';
          } else {
            (updatedRow[field] as string) = '';
          }
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const handleSkladCellMouseDown = (rIdx: number, cIdx: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      if (selectedSkladCells) {
        setSelectedSkladCells({
          ...selectedSkladCells,
          endRow: rIdx,
          endCol: cIdx
        });
      } else {
        setSelectedSkladCells({ startRow: rIdx, startCol: cIdx, endRow: rIdx, endCol: cIdx });
      }
    } else {
      setIsDraggingSkladGrid(true);
      setSelectedSkladCells({ startRow: rIdx, startCol: cIdx, endRow: rIdx, endCol: cIdx });
    }
  };

  const handleSkladCellMouseEnter = (rIdx: number, cIdx: number) => {
    if (isDraggingSkladGrid) {
      setSelectedSkladCells(prev => prev ? ({ ...prev, endRow: rIdx, endCol: cIdx }) : { startRow: rIdx, startCol: cIdx, endRow: rIdx, endCol: cIdx });
    }
  };

  const handleSelectAllSkladCells = () => {
    setSelectedSkladCells({
      startRow: 0,
      startCol: 0,
      endRow: Math.max(0, skladExcelRows.length - 1),
      endCol: 5
    });
  };

  const parseAndApplySkladGridPaste = (pasteText: string, startR: number = 0, startC: number = 0) => {
    if (!pasteText) return;

    const rawLines = pasteText.split(/\r?\n/);
    if (rawLines.length > 1 && rawLines[rawLines.length - 1].trim() === '') {
      rawLines.pop();
    }
    if (rawLines.length === 0) return;

    const fields: (keyof SkladExcelRow)[] = [
      'name', 'category', 'color', 'quantity', 'unit', 'minThreshold'
    ];

    setSkladExcelRows(prevRows => {
      const updated = [...prevRows];

      rawLines.forEach((line, lIdx) => {
        const targetRowIdx = startR + lIdx;
        while (updated.length <= targetRowIdx) {
          updated.push({
            id: `spasted-row-${Date.now()}-${updated.length}-${Math.random()}`,
            name: '',
            category: 'fabric',
            color: '',
            quantity: 0,
            unit: 'dona',
            minThreshold: 0
          });
        }

        const cols = line.includes('\t')
          ? line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''))
          : line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

        const rowToEdit = { ...updated[targetRowIdx] };

        cols.forEach((val, cIdx) => {
          const targetColIdx = startC + cIdx;
          if (targetColIdx < fields.length) {
            const field = fields[targetColIdx];
            if (field === 'quantity' || field === 'minThreshold') {
              const num = parseInt(val.replace(/[^\d]/g, ''), 10);
              (rowToEdit[field] as number) = isNaN(num) ? 0 : num;
            } else if (field === 'category') {
              const catLower = val.toLowerCase();
              if (catLower.includes('xudi') || catLower.includes('yarn') || catLower.includes('ip') || catLower.includes('худи')) {
                rowToEdit.category = 'yarn';
              } else if (catLower.includes('shim') || catLower.includes('accessory') || catLower.includes('furnitura') || catLower.includes('брюки')) {
                rowToEdit.category = 'accessory';
              } else {
                rowToEdit.category = 'fabric';
              }
            } else if (field === 'unit') {
              const unitLower = val.toLowerCase();
              if (unitLower.includes('kg') || unitLower.includes('кг')) rowToEdit.unit = 'kg';
              else if (unitLower.includes('rulon') || unitLower.includes('рулон')) rowToEdit.unit = 'rulon';
              else if (unitLower.includes('metr') || unitLower.includes('метр')) rowToEdit.unit = 'metr';
              else rowToEdit.unit = 'dona';
            } else {
              (rowToEdit[field] as string) = val;
            }
          }
        });

        updated[targetRowIdx] = rowToEdit;
      });

      return updated;
    });

    const maxColsPasted = Math.max(...rawLines.map(l => l.includes('\t') ? l.split('\t').length : l.split(',').length));
    setSelectedSkladCells({
      startRow: startR,
      startCol: startC,
      endRow: startR + rawLines.length - 1,
      endCol: Math.min(fields.length - 1, startC + maxColsPasted - 1)
    });
  };

  const handleSkladGridCellPaste = (e: React.ClipboardEvent, startR: number, startC: number) => {
    const pasteText = e.clipboardData.getData('text');
    if (!pasteText) return;

    if (pasteText.includes('\t') || pasteText.includes('\n') || pasteText.includes('\r')) {
      e.preventDefault();
      parseAndApplySkladGridPaste(pasteText, startR, startC);
    }
  };

  useEffect(() => {
    if (!isExcelSkladModalOpen) return;

    const handleMouseUp = () => {
      setIsDraggingSkladGrid(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSkladCells) {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (!isInput || e.key === 'Delete' || (selectedSkladCells.startRow !== selectedSkladCells.endRow || selectedSkladCells.startCol !== selectedSkladCells.endCol)) {
          e.preventDefault();
          clearSelectedSkladCells();
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        const activeEl = document.activeElement;
        if (activeEl?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleSelectAllSkladCells();
        }
      }

      if (e.shiftKey && selectedSkladCells) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSkladCells(prev => prev ? ({ ...prev, endRow: Math.min(skladExcelRows.length - 1, prev.endRow + 1) }) : null);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSkladCells(prev => prev ? ({ ...prev, endRow: Math.max(0, prev.endRow - 1) }) : null);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedSkladCells(prev => prev ? ({ ...prev, endCol: Math.min(5, prev.endCol + 1) }) : null);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedSkladCells(prev => prev ? ({ ...prev, endCol: Math.max(0, prev.endCol - 1) }) : null);
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExcelSkladModalOpen, selectedSkladCells, skladExcelRows]);

  const handlePasteRawTextToSkladGrid = (rawText: string) => {
    if (!rawText.trim()) return;
    parseAndApplySkladGridPaste(rawText, 0, 0);
  };

  const handleSaveSkladGridToInventory = () => {
    const validRows = skladExcelRows.filter(r => r.name.trim());
    if (validRows.length === 0) {
      alert(lang === 'uz' ? 'Iltimos, kamida bitta mahsulot nomini kiriting!' : 'Пожалуйста, введите наименование хотя бы одного изделия!');
      return;
    }

    const newItems: InventoryItem[] = validRows.map(r => ({
      id: `inv-${Date.now()}-${Math.random()}`,
      name: r.name,
      category: r.category,
      quantity: r.quantity || 0,
      unit: r.unit || 'dona',
      color: r.color || undefined,
      minThreshold: r.minThreshold || 20
    }));

    onUpdateInventory([...inventory, ...newItems]);
    alert(lang === 'uz' ? `${newItems.length} ta mahsulot omborga saqlandi!` : `Успешно добавлено ${newItems.length} наименований!`);
    setIsExcelSkladModalOpen(false);
  };

  // Box filters
  const [boxSearchQuery, setBoxSearchQuery] = useState('');
  const [boxBrandFilter, setBoxBrandFilter] = useState('all');
  const [boxSizeFilter, setBoxSizeFilter] = useState('all');

  const iT = {
    uz: {
      searchPlaceholder: "Tayyor mahsulotlar nomini qidirish...",
      totalCategories: "Jami kiyim turi",
      lowStockCount: "Kam qolgan",
      totalFabricWeight: "Jami futbolkalar",
      totalYarnWeight: "Jami xudilar",
      addBtn: "Yangi mahsulot qo'shish",
      allCat: "📦 Barchasi",
      fabricCat: "👕 Futbolkalar",
      yarnCat: "🧥 Xudilar",
      accessoryCat: "👖 Shimlar va b.",
      stockLabel: "Mavjud miqdor",
      lowStockNotice: "Kam qoldi!",
      colorLabel: "Rangi",
      adjustStock: "Zaxirani boshqarish",
      addItemTitle: "Omborga yangi mahsulot qo'shish",
      validationAlert: "Mahsulot nomini kiriting!",
      unit_kg: "kg",
      unit_dona: "dona",
      unit_rulon: "rulon",
      unit_metr: "metr",

      // New box module translations
      tabRaw: "🧵 Xomashyolar zaxirasi",
      tabBoxes: "📦 Korobkalar (Qutilar) ombori",
      boxesTitle: "Tayyor mahsulotlar korobkalari",
      boxesSub: "Qadoqlangan tayyor mahsulotlarni korobka raqami, brend, model, o'lcham va og'irlik bo'yicha hisobga olish",
      addBoxBtn: "Yangi korobka qo'shish",
      dailyListBtn: "📅 Kunlik ro'yxat (Hisobot)",
      totalBoxes: "Jami korobkalar",
      totalBoxPcs: "Jami tayyor kiyim (Dona)",
      totalBoxKg: "Jami og'irlik (KG)",
      registeredToday: "Bugun qadoqlandi",
      boxNo: "Korobka №",
      boxNoLabel: "Korobka raqami",
      orderNo: "Buyurtma",
      model: "Model kodi",
      color: "Rangi",
      size: "O'lcham",
      qty: "Soni (Dona)",
      weight: "Vazni (KG)",
      brand: "Brend",
      notes: "Izoh",
      actions: "Amallar",
      noBoxesMatched: "Hech qanday korobka topilmadi.",
      allBrands: "Barcha brendlar",
      allSizes: "Barcha o'lchamlar",
      dailyReportTitle: "Kunlik qadoqlangan korobkalar ro'yxati",
      dailyReportSub: "Sanani tanlang va har bir korobka bo'yicha alohida ma'lumotlarni hisobotga chiqaring",
      selectDate: "Sanani tanlang:",
      printThisReport: "Chop etish (Print)",
      copyText: "Matnni nusxalash",
      copiedNotice: "Nusxalandi!",
      close: "Yopish",
      addNewBoxTitle: "Omborga yangi qadoqlangan korobka qo'shish",
      selectOrderPlaceholder: "-- Buyurtmadan tanlab to'ldirish --",
      helperAutofill: "Tizimdagi buyurtmalardan birini tanlasangiz, Model, Rang va Brend avtomatik ravishda to'ldiriladi.",
      save: "Saqlash",
      cancel: "Bekor qilish",
      deleteConfirm: "Haqiqatan ham ushbu korobkani ombordan o'chirmoqchimisiz?"
    },
    ru: {
      searchPlaceholder: "Поиск готовой продукции...",
      totalCategories: "Всего изделий",
      lowStockCount: "На исходе",
      totalFabricWeight: "Всего футболок",
      totalYarnWeight: "Всего худи",
      addBtn: "Добавить изделие",
      allCat: "📦 Все виды",
      fabricCat: "👕 Футболки",
      yarnCat: "🧥 Худи",
      accessoryCat: "👖 Брюки и др.",
      stockLabel: "В наличии",
      lowStockNotice: "Мало осталось!",
      colorLabel: "Цвет",
      adjustStock: "Управление запасами",
      addItemTitle: "Добавить изделие на склад",
      validationAlert: "Введите название изделия!",
      unit_kg: "кг",
      unit_dona: "шт",
      unit_rulon: "рулон",
      unit_metr: "метр",

      // New box module translations
      tabRaw: "🧵 Запасы сырья",
      tabBoxes: "📦 Склад готовых коробок",
      boxesTitle: "Коробки готовой продукции",
      boxesSub: "Учет упакованных готовых изделий по номерам коробок, брендам, моделям, размерам и весу",
      addBoxBtn: "Добавить коробку",
      dailyListBtn: "📅 Ежедневный список (Отчет)",
      totalBoxes: "Всего коробок",
      totalBoxPcs: "Всего готовых изд. (шт)",
      totalBoxKg: "Общий вес (кг)",
      registeredToday: "Упаковано сегодня",
      boxNo: "Коробка №",
      boxNoLabel: "Номер коробки",
      orderNo: "Заказ",
      model: "Код модели",
      color: "Цвет",
      size: "Размер",
      qty: "Кол-во (шт)",
      weight: "Вес (кг)",
      brand: "Бренд",
      notes: "Примечание",
      actions: "Действия",
      noBoxesMatched: "Коробки не найдены.",
      allBrands: "Все бренды",
      allSizes: "Все размеры",
      dailyReportTitle: "Ежедневный отчет по упаковке коробок",
      dailyReportSub: "Выберите дату и сформируйте детализированный список по каждой коробке",
      selectDate: "Выберите дату:",
      printThisReport: "Печать отчета",
      copyText: "Копировать текст",
      copiedNotice: "Скопировано!",
      close: "Закрыть",
      addNewBoxTitle: "Добавить новую упакованную коробку на склад",
      selectOrderPlaceholder: "-- Заполнить на основе заказа --",
      helperAutofill: "При выборе заказа из системы поля Модель, Цвет и Бренд заполнятся автоматически.",
      save: "Сохранить",
      cancel: "Отмена",
      deleteConfirm: "Вы действительно хотите удалить эту коробку со склада?"
    }
  }[lang];

  // Handle direct raw material stock level adjustments
  const handleAdjustQty = (itemId: string, amount: number) => {
    const updated = inventory.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + amount);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    onUpdateInventory(updated);
  };

  // Filter raw material items
  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.color && item.color.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert(iT.validationAlert);
      return;
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: formName,
      category: formCategory,
      quantity: formQty,
      unit: formUnit,
      color: formColor || undefined,
      minThreshold: formMinThreshold
    };

    onUpdateInventory([...inventory, newItem]);

    // reset
    setFormName('');
    setFormQty(100);
    setFormMinThreshold(50);
    setFormColor('');
    setIsAddModalOpen(false);
  };

  // Custom KPI summaries for raw materials
  const totalFabWeight = inventory.filter(i => i.category === 'fabric' && i.unit === 'dona').reduce((sum, i) => sum + i.quantity, 0);
  const totalYarnWeight = inventory.filter(i => i.category === 'yarn' && i.unit === 'dona').reduce((sum, i) => sum + i.quantity, 0);
  const lowItemsCount = inventory.filter(i => i.quantity <= i.minThreshold).length;


  // =================================== BOX METHODS & LOGIC ===================================

  // Auto-fill form fields when order is selected
  const handleOrderSelectForBox = (selectedOrderNum: string) => {
    setBoxFormOrderNumber(selectedOrderNum);
    const orderObj = orders.find(o => o.orderNumber === selectedOrderNum || o.modelCode === selectedOrderNum);
    if (orderObj) {
      setBoxFormModelCode(orderObj.modelCode);
      setBoxFormColor(orderObj.color);
      setBoxFormBrandName(orderObj.brandName);
    }
  };

  // Handle saving new box to warehouse state
  const handleAddNewBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxFormNumber.trim()) {
      alert(lang === 'uz' ? 'Korobka raqamini kiriting!' : 'Введите номер коробки!');
      return;
    }

    const newBox: WarehouseBox = {
      id: `box-${Date.now()}`,
      boxNumber: boxFormNumber,
      orderNumber: boxFormOrderNumber || 'Noma\'lum',
      modelCode: boxFormModelCode || 'Noma\'lum',
      color: boxFormColor || 'Noma\'lum',
      size: boxFormSize,
      quantity: boxFormQuantity,
      weightKg: boxFormWeightKg,
      brandName: boxFormBrandName || 'Stark Cotton',
      createdAt: boxFormDate,
      notes: boxFormNotes
    };

    if (onUpdateBoxes) {
      onUpdateBoxes([...boxes, newBox]);
    }

    // Reset Box fields
    setBoxFormNumber('');
    setBoxFormOrderNumber('');
    setBoxFormModelCode('');
    setBoxFormColor('');
    setBoxFormSize('L');
    setBoxFormQuantity(50);
    setBoxFormWeightKg(15);
    setBoxFormBrandName('');
    setBoxFormNotes('');
    setIsAddBoxModalOpen(false);
  };

  // Handle box delete
  const handleDeleteBox = (boxId: string) => {
    if (onUpdateBoxes) {
      onUpdateBoxes(boxes.filter(b => b.id !== boxId));
    }
  };

  // Helper: Open add box modal and pre-populate next number
  const openAddBoxModal = () => {
    // Generate sequential box number based on count
    const nextNum = `K-2026-${101 + boxes.length}`;
    setBoxFormNumber(nextNum);
    
    // Default date to today's date
    const todayStr = "2026-07-21";
    setBoxFormDate(todayStr);

    setIsAddBoxModalOpen(true);
  };

  // Filter box list based on filters
  const filteredBoxes = boxes.filter(box => {
    const matchesQuery = 
      box.boxNumber.toLowerCase().includes(boxSearchQuery.toLowerCase()) ||
      box.orderNumber.toLowerCase().includes(boxSearchQuery.toLowerCase()) ||
      box.modelCode.toLowerCase().includes(boxSearchQuery.toLowerCase()) ||
      box.color.toLowerCase().includes(boxSearchQuery.toLowerCase());

    const matchesBrand = boxBrandFilter === 'all' || box.brandName === boxBrandFilter;
    const matchesSize = boxSizeFilter === 'all' || box.size === boxSizeFilter;

    return matchesQuery && matchesBrand && matchesSize;
  });

  // Extract unique brands and sizes for dropdown filters
  const uniqueBrands = Array.from(new Set(boxes.map(b => b.brandName)));
  const uniqueSizes = Array.from(new Set(boxes.map(b => b.size)));

  // Daily report boxes
  const dailyReportBoxes = boxes.filter(b => b.createdAt === selectedDailyDate);
  const dailyTotalPcs = dailyReportBoxes.reduce((sum, b) => sum + b.quantity, 0);
  const dailyTotalKg = dailyReportBoxes.reduce((sum, b) => sum + b.weightKg, 0);

  // Box Metrics
  const totalBoxesCount = boxes.length;
  const totalBoxPieces = boxes.reduce((sum, b) => sum + b.quantity, 0);
  const totalBoxKgSum = boxes.reduce((sum, b) => sum + b.weightKg, 0);
  const boxesTodayCount = boxes.filter(b => b.createdAt === '2026-07-21').length;

  const [copiedText, setCopiedText] = useState(false);
  const handleCopyDailyText = () => {
    let reportStr = `${iT.dailyReportTitle} (${selectedDailyDate})\n`;
    reportStr += `--------------------------------------------------\n`;
    reportStr += `Jami korobkalar: ${dailyReportBoxes.length} ta | Jami soni: ${dailyTotalPcs} dona | Jami og'irligi: ${dailyTotalKg.toFixed(1)} kg\n\n`;
    
    dailyReportBoxes.forEach((b, idx) => {
      reportStr += `${idx + 1}. Korobka: ${b.boxNumber} | Buyurtma: ${b.orderNumber} | Model: ${b.modelCode} | Rangi: ${b.color} | Razmer: ${b.size} | Soni: ${b.quantity} dona | Og'irligi: ${b.weightKg} kg\n`;
    });

    navigator.clipboard.writeText(reportStr);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6" id="inventory-view-module">
      
      {/* 1. Pill Navigation for subtabs */}
      <div className="flex bg-[#0f172a] p-1 rounded-2xl border border-slate-800 shadow-md justify-start max-w-md">
        <button
          onClick={() => setSubTab('raw_materials')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === 'raw_materials' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{iT.tabRaw}</span>
        </button>

        <button
          onClick={() => setSubTab('boxes_stock')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === 'boxes_stock' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BoxIcon className="w-4 h-4" />
          <span>{iT.tabBoxes}</span>
        </button>
      </div>

      {/* ================================ SUBTAB A: RAW MATERIALS STOCK (🧵) ================================ */}
      {subTab === 'raw_materials' && (
        <div className="space-y-6 animate-fade-in" id="raw-materials-subtab">
          
          {/* Header Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg uppercase tracking-tight flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-600" /> {t.inventoryTitle}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{lang === 'uz' ? 'Ombor zaxiralari, tayyor kiyimlar, qoldiqlar va kunlik otchetlar' : 'Складские запасы, готовая продукция, остатки и ежедневные отчеты'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsDailyListModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center shadow-xs cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                {lang === 'uz' ? 'Kunlik hisobot (Print)' : 'Ежедневный отчет'}
              </button>

              <button
                type="button"
                onClick={() => setIsExcelSkladModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-lg flex items-center shadow-xs cursor-pointer transition-all"
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                {lang === 'uz' ? 'Exceldan import' : 'Импорт из Excel'}
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 mr-1.5" /> {iT.addBtn}
              </button>
            </div>
          </div>

          {/* Advanced Metrics Summary Row (Matching Image 1) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="inventory-kpi-row">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">ВСЕГО ИЗДЕЛИЙ</span>
              <h3 className="text-xl font-black text-gray-900 mt-1">{inventory.length} <span className="text-xs text-gray-500 font-bold">tur</span></h3>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">НА ИСХОДЕ</span>
                <h3 className={`text-xl font-black mt-1 ${lowItemsCount > 0 ? 'text-rose-600' : 'text-gray-900'}`}>{lowItemsCount} <span className="text-xs text-gray-500 font-bold">tur</span></h3>
              </div>
              {lowItemsCount > 0 && <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">ВСЕГО ФУТБОЛОК</span>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                {inventory
                  .filter(i => i.category === 'fabric' || i.name.toLowerCase().includes('futbolka') || i.name.toLowerCase().includes('t-shirt'))
                  .reduce((sum, i) => sum + i.quantity, 0)
                  .toLocaleString()} <span className="text-xs text-gray-500 font-bold">шт</span>
              </h3>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">ВСЕГО ХУДИ</span>
              <h3 className="text-xl font-black text-emerald-600 mt-1">
                {inventory
                  .filter(i => i.category === 'yarn' || i.name.toLowerCase().includes('xudi') || i.name.toLowerCase().includes('hoodie'))
                  .reduce((sum, i) => sum + i.quantity, 0)
                  .toLocaleString()} <span className="text-xs text-gray-500 font-bold">шт</span>
              </h3>
            </div>
          </div>

          {/* Search & Tabs Toolbar (Matching Image 1) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            {/* Category Toggles */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
              {[
                { id: 'all', label: '📦 Все виды' },
                { id: 'fabric', label: '👕 Футболки' },
                { id: 'yarn', label: '🧥 Худи' },
                { id: 'accessory', label: '👖 Брюки и др.' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activeCategory === cat.id 
                      ? 'bg-white text-gray-900 shadow-xs' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Поиск готовой продукции..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-gray-800"
              />
            </div>
          </div>

          {/* Inventory List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="inventory-grid">
            {filteredItems.map(item => {
              const isLow = item.quantity <= item.minThreshold;
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-white p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                    isLow 
                      ? 'border-rose-200 bg-rose-50/10 shadow-xs' 
                      : 'border-gray-150 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${
                        item.category === 'fabric' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : item.category === 'yarn'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {item.category === 'fabric' ? t.fabric : item.category === 'yarn' ? t.yarn : t.accessory}
                      </span>
                      
                      {isLow && (
                        <span className="text-[9px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md flex items-center animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-0.5" /> {iT.lowStockNotice}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-black text-gray-900 leading-snug">{item.name}</h4>
                    {item.color && (
                      <p className="text-[10px] text-gray-500 font-medium flex items-center">
                        🎨 {iT.colorLabel}: <span className="font-bold text-gray-700 ml-1">{item.color}</span>
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold block uppercase">{iT.stockLabel}</span>
                      <h3 className="text-base font-black text-gray-950 font-mono leading-none mt-1">
                        {item.quantity} {t[item.unit as keyof typeof t] || item.unit}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 block font-bold uppercase">{t.minLimit}</span>
                      <span className="text-xs font-mono font-bold text-gray-700">
                        {item.minThreshold} {t[item.unit as keyof typeof t] || item.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <span className="text-[9px] text-gray-400 font-semibold">{t.adjustStock}:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleAdjustQty(item.id, -10)}
                        className="px-2 py-1 border border-gray-200 bg-gray-50 hover:bg-gray-150 rounded text-gray-600 font-bold text-[10px] cursor-pointer"
                        title="-10"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleAdjustQty(item.id, -50)}
                        className="px-2 py-1 border border-gray-200 bg-gray-50 hover:bg-gray-150 rounded text-gray-600 font-bold text-[10px] cursor-pointer"
                        title="-50"
                      >
                        -50
                      </button>
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <button
                        onClick={() => handleAdjustQty(item.id, 10)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded text-indigo-700 font-bold text-[10px] cursor-pointer flex items-center"
                        title="+10"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleAdjustQty(item.id, 50)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded text-indigo-700 font-bold text-[10px] cursor-pointer flex items-center"
                        title="+50"
                      >
                        +50
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ================================ SUBTAB B: BOXED GOODS STOCK (📦) ================================ */}
      {subTab === 'boxes_stock' && (
        <div className="space-y-6 animate-fade-in" id="boxes-subtab-container">
          
          {/* Header Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg uppercase tracking-tight flex items-center">
                <BoxIcon className="w-5 h-5 mr-2 text-indigo-600" /> {iT.boxesTitle}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{iT.boxesSub}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsDailyListModalOpen(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center shadow-xs cursor-pointer transition-all"
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                {iT.dailyListBtn}
              </button>

              <button
                onClick={openAddBoxModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                {iT.addBoxBtn}
              </button>
            </div>
          </div>

          {/* Box metrics card highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="boxes-kpi-row">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">{iT.totalBoxes}</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{totalBoxesCount} <span className="text-xs text-gray-400">quti</span></h3>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">{iT.totalBoxPcs}</span>
              <h3 className="text-xl font-black text-indigo-700 mt-1">{totalBoxPieces.toLocaleString()} <span className="text-xs text-gray-400">dona</span></h3>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">{iT.totalBoxKg}</span>
              <h3 className="text-xl font-black text-emerald-700 mt-1">{totalBoxKgSum.toFixed(1)} <span className="text-xs text-gray-400">kg</span></h3>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs bg-indigo-50/10">
              <span className="text-[10px] text-indigo-600 font-bold uppercase block">{iT.registeredToday}</span>
              <h3 className="text-xl font-black text-indigo-900 mt-1">{boxesTodayCount} <span className="text-xs text-gray-400">quti</span></h3>
            </div>
          </div>

          {/* Filters & search for box stock */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Search query box */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder={lang === 'uz' ? "Korobka, buyurtma, model yoki rang bo'yicha qidirish..." : "Поиск по коробке, заказу, модели..."}
                value={boxSearchQuery}
                onChange={(e) => setBoxSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Brand Filter */}
            <div className="relative">
              <select
                value={boxBrandFilter}
                onChange={(e) => setBoxBrandFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 cursor-pointer text-gray-700 font-semibold"
              >
                <option value="all">📁 {iT.allBrands}</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div className="relative">
              <select
                value={boxSizeFilter}
                onChange={(e) => setBoxSizeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 cursor-pointer text-gray-700 font-semibold"
              >
                <option value="all">📏 {iT.allSizes}</option>
                {uniqueSizes.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

          </div>

          {/* BOX LISTING TABLE */}
          <div className="bg-white rounded-xl border border-gray-150 overflow-hidden shadow-xs" id="boxes-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-150 text-slate-500 font-bold">
                    <th className="p-3.5">{iT.boxNo}</th>
                    <th className="p-3.5">{iT.brand}</th>
                    <th className="p-3.5">{iT.orderNo}</th>
                    <th className="p-3.5">{iT.model}</th>
                    <th className="p-3.5">{iT.color}</th>
                    <th className="p-3.5 text-center">{iT.size}</th>
                    <th className="p-3.5 text-right">{iT.qty}</th>
                    <th className="p-3.5 text-right">{iT.weight}</th>
                    <th className="p-3.5">{lang === 'uz' ? 'Sana' : 'Дата'}</th>
                    <th className="p-3.5 text-center">{iT.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBoxes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 italic">
                        {iT.noBoxesMatched}
                      </td>
                    </tr>
                  ) : (
                    filteredBoxes.map(box => (
                      <tr key={box.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-[#06b6d4] font-mono whitespace-nowrap">{box.boxNumber}</td>
                        <td className="p-3.5 font-bold text-gray-900">{box.brandName}</td>
                        <td className="p-3.5 text-slate-600 font-mono whitespace-nowrap max-w-[120px] truncate" title={box.orderNumber}>
                          {box.orderNumber}
                        </td>
                        <td className="p-3.5 text-gray-700 font-semibold">{box.modelCode}</td>
                        <td className="p-3.5 text-gray-600 font-medium">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full border border-gray-200 block bg-slate-400" />
                            <span>{box.color}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="bg-gray-100 text-gray-800 font-black px-2 py-0.5 rounded text-[10px]">
                            {box.size}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black text-indigo-700 font-mono">{box.quantity}</td>
                        <td className="p-3.5 text-right font-black text-emerald-700 font-mono">{box.weightKg.toFixed(1)}</td>
                        <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">{box.createdAt}</td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            {currentUser?.role === 'super_admin' && (
                              <button
                                onClick={() => {
                                  setDeletePassword('');
                                  setDeletePasswordError('');
                                  setBoxToDelete(box);
                                }}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                title={lang === 'uz' ? "O'chirish" : 'Удалить'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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


      {/* ==================================== MODAL: ADD RAW MATERIAL ==================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100" id="add-inventory-modal">
            
            <div className="flex items-center justify-between pb-3 border-b border-b-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight flex items-center">
                <BoxIcon className="w-4 h-4 mr-1.5 text-indigo-600" /> {iT.addItemTitle}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4 mt-4 text-xs">
              
              <div className="space-y-1">
                <label className="block font-bold text-gray-600">{t.itemName} *</label>
                <input 
                  type="text"
                  required
                  placeholder={lang === 'uz' ? "Masalan: Klassik Polo Futbolka (Qora)" : "Например: Классическая футболка поло (Черная)"}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{t.itemCategory}</label>
                  <select 
                    value={formCategory}
                    onChange={(e: any) => {
                      setFormCategory(e.target.value);
                      setFormUnit('dona');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg cursor-pointer"
                  >
                    <option value="fabric">{t.fabric}</option>
                    <option value="yarn">{t.yarn}</option>
                    <option value="accessory">{t.accessory}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{t.itemColor}</label>
                  <input 
                    type="text"
                    placeholder="Masalan: Qora, To'q qizil"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="block font-bold text-gray-600">{t.quantity} *</label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      min="0"
                      value={formQty}
                      onChange={(e) => setFormQty(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 font-mono">{t[formUnit as keyof typeof t] || formUnit}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">Birlik</label>
                  <select 
                    value={formUnit}
                    onChange={(e: any) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg cursor-pointer"
                  >
                    <option value="kg">{iT.unit_kg}</option>
                    <option value="dona">{iT.unit_dona}</option>
                    <option value="rulon">{iT.unit_rulon}</option>
                    <option value="metr">{iT.unit_metr}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-600">{t.minThreshold} *</label>
                <div className="relative">
                  <input 
                    type="number"
                    required
                    min="1"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 font-mono">{t[formUnit as keyof typeof t] || formUnit}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  {t.add}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}


      {/* ============================== MODAL: ADD BOX TO STOCK ============================== */}
      {isAddBoxModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150" id="add-box-modal">
            
            <div className="flex items-center justify-between pb-3 border-b border-b-gray-100">
              <h3 className="text-sm font-black text-gray-950 flex items-center">
                <PlusCircle className="w-4 h-4 mr-1.5 text-indigo-600" /> {iT.addNewBoxTitle}
              </h3>
              <button onClick={() => setIsAddBoxModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddNewBox} className="space-y-4 mt-4 text-xs">
              
              {/* Order quick filler dropdown */}
              <div className="space-y-1 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                <label className="block font-bold text-indigo-900">⚡ {lang === 'uz' ? 'Buyurtmadan tezkor to\'ldirish' : 'Быстрое заполнение из заказа'}</label>
                <select
                  value={boxFormOrderNumber}
                  onChange={(e) => handleOrderSelectForBox(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-indigo-200 text-xs text-indigo-950 rounded-lg focus:outline-hidden cursor-pointer"
                >
                  <option value="">{iT.selectOrderPlaceholder}</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.orderNumber}>
                      {o.brandName} - {o.orderNumber} ({o.color.split(' ')[0]})
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-indigo-500/80 block mt-1 leading-tight">{iT.helperAutofill}</span>
              </div>

              {/* Box Number & Brand row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{iT.boxNoLabel} *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Masalan: K-2026-105"
                    value={boxFormNumber}
                    onChange={(e) => setBoxFormNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden font-mono font-bold text-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{iT.brand} *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Masalan: Stark Cotton, Texnoavia"
                    value={boxFormBrandName}
                    onChange={(e) => setBoxFormBrandName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              {/* Model & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{iT.model} *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Masalan: SM-OW-1111/160"
                    value={boxFormModelCode}
                    onChange={(e) => setBoxFormModelCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{iT.color} *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Masalan: To'q Qora, Oq"
                    value={boxFormColor}
                    onChange={(e) => setBoxFormColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Size, Qty, Weight */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{iT.size} *</label>
                  <select
                    value={boxFormSize}
                    onChange={(e) => setBoxFormSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg cursor-pointer font-bold"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                    <option value="3XL">3XL</option>
                    <option value="4XL">4XL</option>
                    <option value="6XL">6XL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{iT.qty} *</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={boxFormQuantity}
                    onChange={(e) => setBoxFormQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{iT.weight} (kg) *</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    min="0.1"
                    value={boxFormWeightKg}
                    onChange={(e) => setBoxFormWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              {/* Date and Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{lang === 'uz' ? 'Qabul qilingan sana' : 'Дата поступления'} *</label>
                  <input 
                    type="date"
                    required
                    value={boxFormDate}
                    onChange={(e) => setBoxFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{iT.notes}</label>
                  <input 
                    type="text"
                    placeholder="Masalan: 1-partiya, navbatdagi"
                    value={boxFormNotes}
                    onChange={(e) => setBoxFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddBoxModalOpen(false)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 font-semibold cursor-pointer"
                >
                  {iT.cancel}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  {iT.save}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}


      {/* ============================== MODAL: DAILY PACKAGING REPORT SHEET (📅) ============================== */}
      {isDailyListModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col justify-between max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight">{iT.dailyReportTitle}</h3>
                  <p className="text-[10px] text-gray-500">{iT.dailyReportSub}</p>
                </div>
              </div>
              <button onClick={() => setIsDailyListModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-lg cursor-pointer">✕</button>
            </div>

            {/* Date Picker Selector */}
            <div className="bg-slate-50 p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs mt-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">{iT.selectDate}</span>
                <input 
                  type="date"
                  value={selectedDailyDate}
                  onChange={(e) => setSelectedDailyDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white font-mono font-bold text-indigo-700 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyDailyText}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold flex items-center transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  {copiedText ? iT.copiedNotice : iT.copyText}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  {iT.printThisReport}
                </button>
              </div>
            </div>

            {/* Print Area content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs" id="printable-daily-report-area">
              
              {/* Daily total summary cards */}
              <div className="grid grid-cols-3 gap-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
                <div className="text-center bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">{lang === 'uz' ? 'Qutilar soni' : 'Всего коробок'}</span>
                  <span className="text-lg font-black text-slate-800 font-mono">{dailyReportBoxes.length} ta</span>
                </div>
                <div className="text-center bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">{lang === 'uz' ? 'Kiyimlar soni' : 'Всего изделий'}</span>
                  <span className="text-lg font-black text-indigo-700 font-mono">{dailyTotalPcs.toLocaleString()} dona</span>
                </div>
                <div className="text-center bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">{lang === 'uz' ? 'Umumiy vazn' : 'Общий вес'}</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">{dailyTotalKg.toFixed(1)} kg</span>
                </div>
              </div>

              {/* Table of daily boxes */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-gray-200 text-slate-600 font-bold">
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">{iT.boxNo}</th>
                      <th className="p-2.5">{iT.brand}</th>
                      <th className="p-2.5">{iT.orderNo}</th>
                      <th className="p-2.5">{iT.model}</th>
                      <th className="p-2.5">{iT.color}</th>
                      <th className="p-2.5 text-center">{iT.size}</th>
                      <th className="p-2.5 text-right">{iT.qty}</th>
                      <th className="p-2.5 text-right">{iT.weight}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {dailyReportBoxes.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-400 italic">
                          {lang === 'uz' ? `${selectedDailyDate} sanasida qadoqlangan korobkalar topilmadi.` : `За упакованные коробки на дату ${selectedDailyDate} данных нет.`}
                        </td>
                      </tr>
                    ) : (
                      dailyReportBoxes.map((box, index) => (
                        <tr key={box.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-400 font-mono">{index + 1}</td>
                          <td className="p-2.5 font-bold text-indigo-700 font-mono">{box.boxNumber}</td>
                          <td className="p-2.5 font-bold text-slate-800">{box.brandName}</td>
                          <td className="p-2.5 text-slate-600 font-mono">{box.orderNumber}</td>
                          <td className="p-2.5 text-slate-700">{box.modelCode}</td>
                          <td className="p-2.5 text-slate-600">{box.color.split(' ')[0]}</td>
                          <td className="p-2.5 text-center">
                            <span className="font-bold">{box.size}</span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">{box.quantity}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-700">{box.weightKg.toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Close Button */}
            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsDailyListModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-gray-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
              >
                {iT.close}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================== MODAL: SKLAD EXCEL GRID IMPORT (📊) ============================== */}
      {isExcelSkladModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden animate-fade-in font-sans">
          <div className="bg-white rounded-lg max-w-5xl w-full flex flex-col shadow-2xl border border-gray-400 overflow-hidden max-h-[95vh]">
            
            {/* Top 1C Window Header */}
            <div className="bg-gray-100 border-b border-gray-300 px-3 py-1.5 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800 tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                Загрузка остатков и продукции склада (Excel Grid Matrix)
              </span>
              <button type="button" onClick={() => setIsExcelSkladModalOpen(false)} className="hover:bg-gray-200 px-1.5 py-0.5 rounded-sm font-bold text-gray-700 cursor-pointer">✕</button>
            </div>

            {/* Action Buttons Row */}
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  type="button" 
                  onClick={handleSaveSkladGridToInventory}
                  className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs px-4 py-1.5 rounded-sm border border-amber-600 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Готово (Сохранить)
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsExcelSkladModalOpen(false)}
                  className="bg-white hover:bg-gray-100 text-gray-800 font-semibold text-xs px-3.5 py-1.5 rounded-sm border border-gray-300 shadow-xs cursor-pointer"
                >
                  Закрыть
                </button>
                <div className="h-4 w-px bg-gray-300 my-auto mx-1" />
                
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-sm px-1.5 py-0.5">
                  <span className="text-[10px] text-gray-500 font-semibold">Строки:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={skladRowsToAddCount} 
                    onChange={(e) => setSkladRowsToAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center font-bold text-xs text-gray-900 border-b border-gray-300 outline-none focus:border-amber-500"
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddSkladGridRows(skladRowsToAddCount)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-2 py-0.5 rounded-xs border border-emerald-300 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    Добавить
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={handleSelectAllSkladCells}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs px-2.5 py-1.5 rounded-sm border border-blue-300 shadow-xs cursor-pointer"
                  title="Выделить всю таблицу (Ctrl+A)"
                >
                  Выделить всё (Ctrl+A)
                </button>

                <button 
                  type="button"
                  onClick={clearSelectedSkladCells}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-xs px-2.5 py-1.5 rounded-sm border border-rose-300 shadow-xs cursor-pointer"
                  title="Очистить выделенные ячейки (Delete)"
                >
                  Очистить выделенное (Delete)
                </button>

                <button 
                  type="button"
                  onClick={handleClearSkladGridRows}
                  className="bg-white hover:bg-rose-50 text-rose-700 font-medium text-xs px-2.5 py-1.5 rounded-sm border border-gray-200 shadow-xs cursor-pointer"
                >
                  Очистить всё
                </button>
              </div>
            </div>

            {/* Info Notice Bar */}
            <div className="bg-[#fffbeb] border-b border-[#fef08a] px-3 py-2 text-[11px] text-[#92400e] flex items-start gap-2 font-sans">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Необходимо скопировать данные в таблицу из внешнего файла (Excel, Word и пр.) через буфер обмена.</strong>
                <span className="block text-[10px] text-amber-800/80 mt-0.5">
                  Допустимые названия колонок: "Наименование товара / одежды" - обязателен, "Категория / Тип", "Цвет", "Количество", "Ед. изм.", "Мин. остаток".
                </span>
              </div>
            </div>

            {/* Quick Paste Buffer Textarea Drawer */}
            <div className="bg-slate-900 border-b border-slate-800 p-2">
              <details className="group" open>
                <summary className="text-[10px] font-bold text-amber-400 cursor-pointer flex items-center justify-between uppercase tracking-wider select-none">
                  <span>📋 Вставить текст Excel / 1С сюда (Ctrl+V Paste Buffer) — Колонки авто-заполнятся</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Футболка Оверсайз Белый	fabric	Белый	500	шт	50"
                    value={skladPasteText}
                    onChange={(e) => {
                      setSkladPasteText(e.target.value);
                      handlePasteRawTextToSkladGrid(e.target.value);
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-amber-200 rounded-sm font-mono text-[11px] outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Формат: НАИМЕНОВАНИЕ | ТИП | ЦВЕТ | КОЛИЧЕСТВО | ЕДИНИЦА | ЛИМИТ</span>
                    <button 
                      type="button" 
                      onClick={() => handlePasteRawTextToSkladGrid(skladPasteText)}
                      className="text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Перенести в таблицу ➔
                    </button>
                  </div>
                </div>
              </details>
            </div>

            {/* Spreadsheet Cell Grid Matrix */}
            <div className="flex-1 overflow-auto bg-white p-1 select-none">
              <table className="w-full border-collapse border border-gray-300 text-[11px]">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-semibold text-center border-b border-gray-300">
                    <th className="border border-gray-300 px-1.5 py-1 text-[10px] w-8">№</th>
                    <th className="border border-amber-500 bg-amber-50/60 text-amber-900 px-2 py-1 text-left min-w-[200px] font-bold">
                      Наименование товара / одежды *
                    </th>
                    <th className="border border-gray-300 px-2 py-1 text-left min-w-[120px]">Категория / Тип</th>
                    <th className="border border-gray-300 px-2 py-1 text-left min-w-[100px]">Цвет</th>
                    <th className="border border-gray-300 px-2 py-1 text-right min-w-[100px]">Количество</th>
                    <th className="border border-gray-300 px-2 py-1 text-center min-w-[80px]">Ед. изм.</th>
                    <th className="border border-gray-300 px-2 py-1 text-right min-w-[100px]">Мин. остаток</th>
                    <th className="border border-gray-300 px-1 py-1 w-10 text-center">✕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {skladExcelRows.map((row, rIdx) => {
                    const isCellSel = (cIdx: number) => {
                      if (!selectedSkladCells) return false;
                      const minR = Math.min(selectedSkladCells.startRow, selectedSkladCells.endRow);
                      const maxR = Math.max(selectedSkladCells.startRow, selectedSkladCells.endRow);
                      const minC = Math.min(selectedSkladCells.startCol, selectedSkladCells.endCol);
                      const maxC = Math.max(selectedSkladCells.startCol, selectedSkladCells.endCol);
                      return rIdx >= minR && rIdx <= maxR && cIdx >= minC && cIdx <= maxC;
                    };

                    return (
                      <tr key={row.id} className="hover:bg-amber-50/20 group">
                        <td className="border border-gray-300 px-1 py-1 text-center font-mono text-[10px] text-gray-500 bg-gray-50">
                          {rIdx + 1}
                        </td>
                        <td 
                          onMouseDown={(e) => handleSkladCellMouseDown(rIdx, 0, e)}
                          onMouseEnter={() => handleSkladCellMouseEnter(rIdx, 0)}
                          className={`border border-gray-300 p-0 ${isCellSel(0) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500 focus-within:bg-amber-50/40'}`}
                        >
                          <input 
                            type="text" 
                            value={row.name} 
                            onChange={(e) => handleSkladGridCellChange(row.id, 'name', e.target.value)}
                            onPaste={(e) => handleSkladGridCellPaste(e, rIdx, 0)}
                            placeholder="Футболка Классик Белая..."
                            className="w-full px-2 py-1 border-none outline-none font-bold text-gray-900 bg-transparent text-xs"
                          />
                        </td>
                        <td 
                          onMouseDown={(e) => handleSkladCellMouseDown(rIdx, 1, e)}
                          onMouseEnter={() => handleSkladCellMouseEnter(rIdx, 1)}
                          className={`border border-gray-300 p-0 ${isCellSel(1) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                        >
                          <select 
                            value={row.category} 
                            onChange={(e) => handleSkladGridCellChange(row.id, 'category', e.target.value as any)}
                            className="w-full px-2 py-1 border-none outline-none bg-transparent text-xs text-gray-800 font-semibold cursor-pointer"
                          >
                            <option value="fabric">👕 Футболка</option>
                            <option value="yarn">🧥 Худи</option>
                            <option value="accessory">👖 Брюки / Другое</option>
                          </select>
                        </td>
                        <td 
                          onMouseDown={(e) => handleSkladCellMouseDown(rIdx, 2, e)}
                          onMouseEnter={() => handleSkladCellMouseEnter(rIdx, 2)}
                          className={`border border-gray-300 p-0 ${isCellSel(2) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                        >
                          <input 
                            type="text" 
                            value={row.color} 
                            onChange={(e) => handleSkladGridCellChange(row.id, 'color', e.target.value)}
                            onPaste={(e) => handleSkladGridCellPaste(e, rIdx, 2)}
                            placeholder="Белый / Черный..."
                            className="w-full px-2 py-1 border-none outline-none text-gray-800 bg-transparent text-xs"
                          />
                        </td>
                        <td 
                          onMouseDown={(e) => handleSkladCellMouseDown(rIdx, 3, e)}
                          onMouseEnter={() => handleSkladCellMouseEnter(rIdx, 3)}
                          className={`border border-gray-300 p-0 text-right ${isCellSel(3) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                        >
                          <input 
                            type="number" 
                            value={row.quantity || ''} 
                            onChange={(e) => handleSkladGridCellChange(row.id, 'quantity', parseInt(e.target.value) || 0)}
                            onPaste={(e) => handleSkladGridCellPaste(e, rIdx, 3)}
                            placeholder="0"
                            className="w-full px-2 py-1 border-none outline-none font-black text-right text-indigo-900 bg-transparent text-xs"
                          />
                        </td>
                        <td 
                          onMouseDown={(e) => handleSkladCellMouseDown(rIdx, 4, e)}
                          onMouseEnter={() => handleSkladCellMouseEnter(rIdx, 4)}
                          className={`border border-gray-300 p-0 text-center ${isCellSel(4) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                        >
                          <select 
                            value={row.unit} 
                            onChange={(e) => handleSkladGridCellChange(row.id, 'unit', e.target.value as any)}
                            className="w-full px-1 py-1 border-none outline-none bg-transparent text-xs text-center text-gray-700 font-bold cursor-pointer"
                          >
                            <option value="dona">шт</option>
                            <option value="kg">кг</option>
                            <option value="rulon">рулон</option>
                            <option value="metr">метр</option>
                          </select>
                        </td>
                        <td 
                          onMouseDown={(e) => handleSkladCellMouseDown(rIdx, 5, e)}
                          onMouseEnter={() => handleSkladCellMouseEnter(rIdx, 5)}
                          className={`border border-gray-300 p-0 text-right ${isCellSel(5) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                        >
                          <input 
                            type="number" 
                            value={row.minThreshold || ''} 
                            onChange={(e) => handleSkladGridCellChange(row.id, 'minThreshold', parseInt(e.target.value) || 0)}
                            onPaste={(e) => handleSkladGridCellPaste(e, rIdx, 5)}
                            placeholder="0"
                            className="w-full px-2 py-1 border-none outline-none text-right font-bold text-rose-700 bg-transparent text-xs"
                          />
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkladGridRow(row.id)}
                            className="text-gray-400 hover:text-rose-600 font-bold cursor-pointer"
                            title="Удалить строку"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Toolbar */}
            <div className="bg-gray-100 border-t border-gray-300 px-3 py-1.5 flex items-center justify-between text-[11px] text-gray-600">
              <span className="text-gray-500 font-medium">📋 Режим: Копировать-Вставить из Excel / 1С на склад (Paste Buffer)</span>
              <div className="font-semibold text-gray-700">
                Всего заполненных строк: <strong className="text-gray-900">{skladExcelRows.filter(r => r.name).length}</strong> / {skladExcelRows.length}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Box Modal */}
      {boxToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  {lang === 'uz' ? "Korbkani o'chirish" : "Удаление коробки"}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{boxToDelete.boxNumber} ({boxToDelete.color} / {boxToDelete.size})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {lang === 'uz' 
                ? `Haqiqatan ham "${boxToDelete.boxNumber}" korobkasini ombor qutisidan o'chirib tashlamoqchimisiz?`
                : `Вы действительно хотите удалить коробку "${boxToDelete.boxNumber}" из склада?`}
            </p>

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
                onClick={() => setBoxToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  const superAdminPin = currentUser?.pin || '0000';
                  if (deletePassword.trim() !== superAdminPin) {
                    setDeletePasswordError(lang === 'uz' ? "Noto'g'ri parol! Ma'lumot o'chirilmadi." : "Неверный пароль! Данные не удалены.");
                    return;
                  }
                  handleDeleteBox(boxToDelete.id);
                  setBoxToDelete(null);
                  setDeletePassword('');
                  setDeletePasswordError('');
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {lang === 'uz' ? "Ha, o'chirish" : "Да, удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
