import React, { useState, useRef, useEffect } from 'react';
import { Order, OrderStatus, OrderSizes, Customer, AppUser, OrderColorVariant } from '../types';
import { COLORS } from '../mockData';
import { Language } from '../locales';
import OrderDetailModal from './OrderDetailModal';
import OrderStatusChart from './OrderStatusChart';
import { ResizableModal } from './ResizableModal';
import { 
  Search, 
  Plus, 
  Layers, 
  Clock, 
  Trash2,
  Eye,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  ChevronDown,
  Info,
  Check,
  AlertTriangle,
  Play,
  CheckCircle,
  FileText,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Truck
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  customers: Customer[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder?: (id: string) => void;
  selectedOrderFromDashboard: Order | null;
  onClearSelectedOrder: () => void;
  currentUser?: AppUser | null;
  lang: Language;
}

const ADULT_SIZES = [
  '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL', '11XL', '12XL', '13XL', '14XL', '15XL', '16XL'
];

const KIDS_SIZES_1 = [
  '116', '122', '128', '134', '140', '146', '152', '158', '164'
];

const KIDS_SIZES_2 = [
  '24', '26', '28', '40', '42'
];

export default function OrdersView({ 
  orders, 
  customers, 
  onAddOrder, 
  onUpdateOrder, 
  onDeleteOrder,
  selectedOrderFromDashboard, 
  onClearSelectedOrder,
  currentUser,
  lang
}: OrdersViewProps) {
  // Navigation & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Modals & form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditQtyModalOpen, setIsEditQtyModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // Brand Options with dynamic adding
  const [brands, setBrands] = useState<string[]>([
    'Stark Cotton',
    'Texnoavia',
    'Todomoda',
    'Sab collection'
  ]);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [showAddBrandInput, setShowAddBrandInput] = useState(false);

  // Form states
  const [formMosCode, setFormMosCode] = useState('');
  const [formModelCode, setFormModelCode] = useState('');
  const [formBrandName, setFormBrandName] = useState('Stark Cotton');
  const [formColorName, setFormColorName] = useState(COLORS[0].name);
  const [formColorHex, setFormColorHex] = useState(COLORS[0].hex);
  const [showAddColorInput, setShowAddColorInput] = useState(false);
  const [newColorNameInput, setNewColorNameInput] = useState('');
  const [newColorHexInput, setNewColorHexInput] = useState('#808080');
  const [formDeadline, setFormDeadline] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<OrderStatus>('yangi');
  const [formOneCOrderEmission, setFormOneCOrderEmission] = useState('');

  // Quantities state
  const [formQtyOrder, setFormQtyOrder] = useState<number>(0);
  const [formQtyCut, setFormQtyCut] = useState<number>(0);
  const [formQtyPotok, setFormQtyPotok] = useState<number>(0);
  const [formQtyPackaging, setFormQtyPackaging] = useState<number>(0);
  const [formQtyDefect, setFormQtyDefect] = useState<number>(0);
  const [formQtyRemaining, setFormQtyRemaining] = useState<number>(0);

  // Custom Sizes input
  const [activeSizeCategory, setActiveSizeCategory] = useState<'adult' | 'kids1' | 'kids2'>('adult');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({});

  // Excel paste import & Grid state
  const [csvPasteData, setCsvPasteData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const GRID_SIZE_PRESETS = {
    adult: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
    numeric: ['38', '40', '42', '44', '46', '48', '50', '52', '54', '56'],
    kids1: ['116', '122', '128', '134', '140', '146', '152', '158', '164'],
    kids2: ['24', '26', '28', '30', '32', '34', '36', '38', '40', '42']
  };

  const [gridSizeCategory, setGridSizeCategory] = useState<'adult' | 'numeric' | 'kids1' | 'kids2'>('adult');
  const activeGridSizes = GRID_SIZE_PRESETS[gridSizeCategory];

  interface ExcelGridRow {
    id: string;
    mosCode: string;
    modelCode: string;
    brandName: string;
    color: string;
    sizes: { [sizeKey: string]: number };
    qtyOrder: number;
    qtyCut: number;
    qtyPotok: number;
    qtyPackaging: number;
    deadline: string;
  }

  const createEmptyGridRow = (id: string): ExcelGridRow => ({
    id,
    mosCode: '',
    modelCode: '',
    brandName: '',
    color: '',
    sizes: {},
    qtyOrder: 0,
    qtyCut: 0,
    qtyPotok: 0,
    qtyPackaging: 0,
    deadline: ''
  });

  const [rowsToAddCount, setRowsToAddCount] = useState<number>(5);

  // Cell selection state for Excel grid
  const [selectedCells, setSelectedCells] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number } | null>(null);
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);

  const [excelGridRows, setExcelGridRows] = useState<ExcelGridRow[]>([
    createEmptyGridRow('1'),
    createEmptyGridRow('2'),
    createEmptyGridRow('3'),
    createEmptyGridRow('4'),
    createEmptyGridRow('5'),
  ]);

  const handleGridCellChange = (id: string, field: keyof Omit<ExcelGridRow, 'sizes'>, value: any) => {
    setExcelGridRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleGridSizeChange = (id: string, sizeKey: string, value: number) => {
    setExcelGridRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      return {
        ...row,
        sizes: {
          ...row.sizes,
          [sizeKey]: value
        }
      };
    }));
  };

  const handleAddGridRows = (count: number = 1) => {
    const newRows: ExcelGridRow[] = Array.from({ length: Math.max(1, count) }).map((_, idx) => createEmptyGridRow(`row-${Date.now()}-${idx}-${Math.random()}`));
    setExcelGridRows(prev => [...prev, ...newRows]);
  };

  const handleRemoveGridRow = (id: string) => {
    setExcelGridRows(prev => prev.filter(row => row.id !== id));
  };

  const handleClearGridRows = () => {
    setExcelGridRows([
      createEmptyGridRow('1'),
      createEmptyGridRow('2'),
      createEmptyGridRow('3'),
      createEmptyGridRow('4'),
      createEmptyGridRow('5'),
    ]);
    setSelectedCells(null);
  };

  const clearSelectedCells = () => {
    if (!selectedCells) return;
    const minR = Math.min(selectedCells.startRow, selectedCells.endRow);
    const maxR = Math.max(selectedCells.startRow, selectedCells.endRow);
    const minC = Math.min(selectedCells.startCol, selectedCells.endCol);
    const maxC = Math.max(selectedCells.startCol, selectedCells.endCol);

    setExcelGridRows(prev => prev.map((row, rIdx) => {
      if (rIdx >= minR && rIdx <= maxR) {
        const updatedRow = { ...row, sizes: { ...row.sizes } };
        for (let cIdx = minC; cIdx <= maxC; cIdx++) {
          if (cIdx === 0) updatedRow.mosCode = '';
          else if (cIdx === 1) updatedRow.modelCode = '';
          else if (cIdx === 2) updatedRow.brandName = '';
          else if (cIdx === 3) updatedRow.color = '';
          else if (cIdx >= 4 && cIdx < 4 + activeGridSizes.length) {
            const szKey = activeGridSizes[cIdx - 4];
            updatedRow.sizes[szKey] = 0;
          }
          else if (cIdx === 4 + activeGridSizes.length) updatedRow.qtyOrder = 0;
          else if (cIdx === 5 + activeGridSizes.length) updatedRow.qtyCut = 0;
          else if (cIdx === 6 + activeGridSizes.length) updatedRow.qtyPotok = 0;
          else if (cIdx === 7 + activeGridSizes.length) updatedRow.qtyPackaging = 0;
          else if (cIdx === 8 + activeGridSizes.length) updatedRow.deadline = '';
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const handleCellMouseDown = (rIdx: number, cIdx: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      if (selectedCells) {
        setSelectedCells({
          ...selectedCells,
          endRow: rIdx,
          endCol: cIdx
        });
      } else {
        setSelectedCells({ startRow: rIdx, startCol: cIdx, endRow: rIdx, endCol: cIdx });
      }
    } else {
      setIsDraggingGrid(true);
      setSelectedCells({ startRow: rIdx, startCol: cIdx, endRow: rIdx, endCol: cIdx });
    }
  };

  const handleCellMouseEnter = (rIdx: number, cIdx: number) => {
    if (isDraggingGrid) {
      setSelectedCells(prev => prev ? ({ ...prev, endRow: rIdx, endCol: cIdx }) : { startRow: rIdx, startCol: cIdx, endRow: rIdx, endCol: cIdx });
    }
  };

  const handleSelectAllCells = () => {
    setSelectedCells({
      startRow: 0,
      startCol: 0,
      endRow: Math.max(0, excelGridRows.length - 1),
      endCol: 8 + activeGridSizes.length
    });
  };

  const parseAndApplyGridPaste = (pasteText: string, startR: number = 0, startC: number = 0) => {
    if (!pasteText) return;

    const rawLines = pasteText.split(/\r?\n/);
    if (rawLines.length > 1 && rawLines[rawLines.length - 1].trim() === '') {
      rawLines.pop();
    }
    if (rawLines.length === 0) return;

    setExcelGridRows(prevRows => {
      const updated = [...prevRows];

      rawLines.forEach((line, lIdx) => {
        const targetRowIdx = startR + lIdx;
        while (updated.length <= targetRowIdx) {
          updated.push(createEmptyGridRow(`pasted-row-${Date.now()}-${updated.length}-${Math.random()}`));
        }

        const cols = line.includes('\t')
          ? line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''))
          : line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

        const rowToEdit = { ...updated[targetRowIdx], sizes: { ...updated[targetRowIdx].sizes } };

        cols.forEach((val, cIdx) => {
          const targetColIdx = startC + cIdx;

          if (targetColIdx === 0) {
            rowToEdit.mosCode = val;
          } else if (targetColIdx === 1) {
            rowToEdit.modelCode = val;
          } else if (targetColIdx === 2) {
            rowToEdit.brandName = val;
          } else if (targetColIdx === 3) {
            rowToEdit.color = val;
          } else if (targetColIdx >= 4 && targetColIdx < 4 + activeGridSizes.length) {
            const szKey = activeGridSizes[targetColIdx - 4];
            const num = parseInt(val.replace(/[^\d]/g, ''), 10);
            rowToEdit.sizes[szKey] = isNaN(num) ? 0 : num;
          } else if (targetColIdx === 4 + activeGridSizes.length) {
            const num = parseInt(val.replace(/[^\d]/g, ''), 10);
            rowToEdit.qtyOrder = isNaN(num) ? 0 : num;
          } else if (targetColIdx === 5 + activeGridSizes.length) {
            const num = parseInt(val.replace(/[^\d]/g, ''), 10);
            rowToEdit.qtyCut = isNaN(num) ? 0 : num;
          } else if (targetColIdx === 6 + activeGridSizes.length) {
            const num = parseInt(val.replace(/[^\d]/g, ''), 10);
            rowToEdit.qtyPotok = isNaN(num) ? 0 : num;
          } else if (targetColIdx === 7 + activeGridSizes.length) {
            const num = parseInt(val.replace(/[^\d]/g, ''), 10);
            rowToEdit.qtyPackaging = isNaN(num) ? 0 : num;
          } else if (targetColIdx === 8 + activeGridSizes.length) {
            rowToEdit.deadline = val;
          }
        });

        updated[targetRowIdx] = rowToEdit;
      });

      return updated;
    });

    const maxColsPasted = Math.max(...rawLines.map(l => l.includes('\t') ? l.split('\t').length : l.split(',').length));
    setSelectedCells({
      startRow: startR,
      startCol: startC,
      endRow: startR + rawLines.length - 1,
      endCol: Math.min(8 + activeGridSizes.length, startC + maxColsPasted - 1)
    });
  };

  const handleGridCellPaste = (e: React.ClipboardEvent, startR: number, startC: number) => {
    const pasteText = e.clipboardData.getData('text');
    if (!pasteText) return;

    if (pasteText.includes('\t') || pasteText.includes('\n') || pasteText.includes('\r')) {
      e.preventDefault();
      parseAndApplyGridPaste(pasteText, startR, startC);
    }
  };

  useEffect(() => {
    if (!isImportModalOpen) return;

    const handleMouseUp = () => {
      setIsDraggingGrid(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCells) {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (!isInput || e.key === 'Delete' || (selectedCells.startRow !== selectedCells.endRow || selectedCells.startCol !== selectedCells.endCol)) {
          e.preventDefault();
          clearSelectedCells();
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        const activeEl = document.activeElement;
        if (activeEl?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleSelectAllCells();
        }
      }

      if (e.shiftKey && selectedCells) {
        const maxColIdx = 8 + activeGridSizes.length;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCells(prev => prev ? ({ ...prev, endRow: Math.min(excelGridRows.length - 1, prev.endRow + 1) }) : null);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCells(prev => prev ? ({ ...prev, endRow: Math.max(0, prev.endRow - 1) }) : null);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedCells(prev => prev ? ({ ...prev, endCol: Math.min(maxColIdx, prev.endCol + 1) }) : null);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedCells(prev => prev ? ({ ...prev, endCol: Math.max(0, prev.endCol - 1) }) : null);
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImportModalOpen, selectedCells, excelGridRows, activeGridSizes]);

  const handlePasteRawTextToGrid = (rawText: string) => {
    if (!rawText.trim()) return;
    parseAndApplyGridPaste(rawText, 0, 0);
  };

  const handleSaveGridToOrders = () => {
    const validRows = excelGridRows.filter(r => r.mosCode.trim() || r.modelCode.trim());
    if (validRows.length === 0) {
      alert(lang === 'uz' ? 'Ma\'lumot to\'ldirilmagan! MOS yoki Model kodini kiriting.' : 'Заполните данные! Введите MOS или Код модели.');
      return;
    }

    // Group valid rows by order key: mosCode + "___" + modelCode
    const groupedMap = new Map<string, ExcelGridRow[]>();
    validRows.forEach(row => {
      const key = (row.mosCode.trim() || row.modelCode.trim()).toLowerCase();
      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key)!.push(row);
    });

    let addedCount = 0;
    groupedMap.forEach((rows) => {
      const firstRow = rows[0];
      const mosCode = firstRow.mosCode.trim() || `MOS-${Math.floor(100 + Math.random() * 900)}`;
      const modelCode = firstRow.modelCode.trim() || `SM-${Math.floor(1000 + Math.random() * 9000)}/160-TA`;
      const brandName = firstRow.brandName.trim() || 'Stark Cotton';
      const deadline = firstRow.deadline.trim() || new Date().toISOString().split('T')[0];

      // Build color variants
      const colorMap = new Map<string, ExcelGridRow[]>();
      rows.forEach(r => {
        const cName = r.color.trim() || 'Oq';
        if (!colorMap.has(cName)) {
          colorMap.set(cName, []);
        }
        colorMap.get(cName)!.push(r);
      });

      const colorVariants: OrderColorVariant[] = [];
      const overallSizes: OrderSizes = {};
      const overallRaskroySizes: { [size: string]: number } = {};
      const overallPoshivSizes: { [size: string]: number } = {};
      const overallUpakovkaSizes: { [size: string]: number } = {};

      let totalQtyOrder = 0;
      let totalQtyCut = 0;
      let totalQtyPotok = 0;
      let totalQtyPackaging = 0;

      colorMap.forEach((cRows, colorName) => {
        const variantSizes: OrderSizes = {};
        const variantRaskroy: { [size: string]: number } = {};
        const variantPoshiv: { [size: string]: number } = {};
        const variantUpakovka: { [size: string]: number } = {};

        let varQtyOrder = 0;
        let varQtyCut = 0;
        let varQtyPotok = 0;
        let varQtyPackaging = 0;

        cRows.forEach(r => {
          let rSizeSum = 0;
          Object.entries(r.sizes || {}).forEach(([sz, q]) => {
            const numQ = Number(q) || 0;
            if (numQ > 0) {
              variantSizes[sz] = (variantSizes[sz] || 0) + numQ;
              overallSizes[sz] = (overallSizes[sz] || 0) + numQ;
              rSizeSum += numQ;
            }
          });

          const qOrd = rSizeSum > 0 ? rSizeSum : (r.qtyOrder || 0);
          if (rSizeSum === 0 && r.qtyOrder > 0) {
            variantSizes['FREE'] = (variantSizes['FREE'] || 0) + r.qtyOrder;
            overallSizes['FREE'] = (overallSizes['FREE'] || 0) + r.qtyOrder;
          }

          const qCut = r.qtyCut || 0;
          const qPtk = r.qtyPotok || 0;
          const qPkg = r.qtyPackaging || 0;

          varQtyOrder += qOrd;
          varQtyCut += qCut;
          varQtyPotok += qPtk;
          varQtyPackaging += qPkg;

          // Add to overall order totals
          totalQtyOrder += qOrd;
          totalQtyCut += qCut;
          totalQtyPotok += qPtk;
          totalQtyPackaging += qPkg;
        });

        colorVariants.push({
          color: colorName,
          sizes: variantSizes,
          qtyOrder: varQtyOrder,
          qtyCut: varQtyCut,
          qtyPotok: varQtyPotok,
          qtyPackaging: varQtyPackaging,
          raskroySizes: variantRaskroy,
          poshivSizes: variantPoshiv,
          upakovkaSizes: variantUpakovka
        });
      });

      const distinctColors = Array.from(colorMap.keys()).join(', ');

      const newOrder: Order = {
        id: `grid-${Date.now()}-${Math.random()}`,
        priority: 'normal',
        orderNumber: modelCode,
        mosCode: mosCode,
        modelCode: modelCode,
        brandName: brandName,
        customerName: brandName,
        customerPhone: '+998 90 000-00-00',
        productType: 'Apparel Product',
        fabricType: 'Suprem',
        color: distinctColors || 'Oq',
        colorCode: '#000000',
        colorVariants: colorVariants,
        sizes: overallSizes,
        raskroySizes: overallRaskroySizes,
        poshivSizes: overallPoshivSizes,
        upakovkaSizes: overallUpakovkaSizes,
        totalQuantity: totalQtyOrder || 1000,
        qtyOrder: totalQtyOrder || 1000,
        qtyCut: totalQtyCut,
        qtyPotok: totalQtyPotok,
        qtyPackaging: totalQtyPackaging,
        qtyDefect: 0,
        qtyRemaining: Math.max(0, (totalQtyOrder || 1000) - totalQtyPackaging),
        createdAt: new Date().toISOString().split('T')[0],
        deadline: deadline,
        status: 'tikuv',
        productionLogs: []
      };

      onAddOrder(newOrder);
      addedCount++;
    });

    alert(lang === 'uz' ? `${addedCount} ta buyurtma kartasi muvaffaqiyatli saqlandi!` : `Успешно сохранено ${addedCount} карточек заказов!`);
    setIsImportModalOpen(false);
  };

  // Sync selected order from dashboard
  React.useEffect(() => {
    if (selectedOrderFromDashboard) {
      setEditingOrder(selectedOrderFromDashboard);
      // populate editing state
      setFormQtyOrder(selectedOrderFromDashboard.qtyOrder);
      setFormQtyCut(selectedOrderFromDashboard.qtyCut);
      setFormQtyPotok(selectedOrderFromDashboard.qtyPotok);
      setFormQtyPackaging(selectedOrderFromDashboard.qtyPackaging);
      setFormQtyDefect(selectedOrderFromDashboard.qtyDefect);
      setFormQtyRemaining(selectedOrderFromDashboard.qtyRemaining);
      setFormOneCOrderEmission(selectedOrderFromDashboard.oneCOrderEmission || '');
      setIsEditQtyModalOpen(true);
      onClearSelectedOrder();
    }
  }, [selectedOrderFromDashboard, onClearSelectedOrder]);

  const handleAddBrand = () => {
    if (newBrandInput.trim() && !brands.includes(newBrandInput.trim())) {
      setBrands(prev => [...prev, newBrandInput.trim()]);
      setFormBrandName(newBrandInput.trim());
      setNewBrandInput('');
      setShowAddBrandInput(false);
    }
  };

  const calculateFormTotalQty = () => {
    return Object.values(selectedSizes).reduce((sum: number, val: number) => sum + val, 0);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formMosCode.trim()) {
      alert(lang === 'uz' ? 'MOS kodini kiriting!' : 'Введите MOS код!');
      return;
    }

    const finalTotalQty = calculateFormTotalQty() || formQtyOrder;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      priority: 'normal',
      orderNumber: formModelCode || `SM-${Math.floor(1000 + Math.random() * 9000)}/160-OE.SC.MP`,
      mosCode: formMosCode.trim(),
      modelCode: formModelCode || `SM-${Math.floor(1000 + Math.random() * 9000)}/160-OE.SC.MP`,
      brandName: formBrandName,
      customerName: formBrandName,
      customerPhone: '+998 90 000-00-00',
      productType: 'T-Shirt (Futbolka)',
      fabricType: 'Suprem (100% Paxta)',
      color: formColorName,
      colorCode: formColorHex,
      sizes: { ...selectedSizes },
      totalQuantity: finalTotalQty,
      
      qtyOrder: formQtyOrder,
      qtyCut: formQtyCut,
      qtyPotok: formQtyPotok,
      qtyPackaging: formQtyPackaging,
      qtyDefect: formQtyDefect,
      qtyRemaining: formQtyRemaining || Math.max(0, formQtyOrder - formQtyPackaging - formQtyDefect),
      
      createdAt: new Date().toISOString().split('T')[0],
      deadline: formDeadline || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: formStatus,
      notes: formNotes,
      oneCOrderEmission: formOneCOrderEmission.trim(),
      productionLogs: [
        {
          id: `log-${Date.now()}`,
          stage: 'yangi',
          operator: 'Tizim',
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          note: lang === 'uz' ? 'Yangi ishlab chiqarish kartasi yaratildi.' : 'Создана новая карта производства.'
        }
      ]
    };

    onAddOrder(newOrder);
    setIsCreateModalOpen(false);

    // reset
    setFormMosCode('');
    setFormModelCode('');
    setFormQtyOrder(0);
    setFormQtyCut(0);
    setFormQtyPotok(0);
    setFormQtyPackaging(0);
    setFormQtyDefect(0);
    setFormQtyRemaining(0);
    setFormColorName(COLORS[0].name);
    setFormColorHex(COLORS[0].hex);
    setShowAddColorInput(false);
    setNewColorNameInput('');
    setSelectedSizes({});
    setFormNotes('');
    setFormOneCOrderEmission('');
  };

  const handleUpdateQuantities = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    // Remaining (qoldiq) can be auto-calculated or manually specified
    // Let's do: buyurtma_soni - qadoqlash
    const calculatedRemaining = Math.max(0, formQtyOrder - formQtyPackaging - formQtyDefect);

    const updatedOrder: Order = {
      ...editingOrder,
      qtyOrder: formQtyOrder,
      qtyCut: formQtyCut,
      qtyPotok: formQtyPotok,
      qtyPackaging: formQtyPackaging,
      qtyDefect: formQtyDefect,
      qtyRemaining: formQtyRemaining !== undefined ? formQtyRemaining : calculatedRemaining,
      totalQuantity: formQtyOrder, // sync total quantity
      status: formStatus,
      oneCOrderEmission: formOneCOrderEmission.trim()
    };

    onUpdateOrder(updatedOrder);
    setIsEditQtyModalOpen(false);
    setEditingOrder(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'MOS Code',
      'Model Code',
      'Brand Name',
      'Color',
      'Buyurtma Soni (Order)',
      'Kesim (Cut)',
      'Potoklarga Berilgan (Potok)',
      'Qadoqlash (Packed)',
      'Brak (Defects)',
      'Qoldiq (Remaining)',
      'Deadline',
      'Sizes Breakdown'
    ];

    const rows = orders.map(o => [
      o.mosCode,
      o.modelCode,
      o.brandName,
      o.color,
      o.qtyOrder,
      o.qtyCut,
      o.qtyPotok,
      o.qtyPackaging,
      o.qtyDefect,
      o.qtyRemaining,
      o.deadline,
      Object.entries(o.sizes).map(([sz, q]) => `${sz}:${q}`).join(';')
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tex_ERP_Ishlab_Chiqarish_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import handler (either file or paste input)
  const handleImportCSV = (textData: string) => {
    try {
      const lines = textData.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert(lang === 'uz' ? 'Ma\'lumot yetarli emas!' : 'Недостаточно данных!');
        return;
      }

      // Check headers
      let count = 0;
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        // Simple regex or split
        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 6) {
          const importedOrder: Order = {
            id: `imported-${Date.now()}-${i}`,
            priority: 'normal',
            orderNumber: cols[1] || 'SM-Unknown',
            mosCode: cols[0] || 'MOS-Unknown',
            modelCode: cols[1] || 'SM-Unknown',
            brandName: cols[2] || 'Stark Cotton',
            customerName: cols[2] || 'Stark Cotton',
            customerPhone: '+998 90 000-00-00',
            productType: 'Imported Apparel',
            fabricType: 'Cotton',
            color: cols[3] || 'Oq',
            colorCode: '#9CA3AF',
            sizes: {},
            totalQuantity: parseInt(cols[4]) || 0,
            qtyOrder: parseInt(cols[4]) || 0,
            qtyCut: parseInt(cols[5]) || 0,
            qtyPotok: parseInt(cols[6]) || 0,
            qtyPackaging: parseInt(cols[7]) || 0,
            qtyDefect: parseInt(cols[8]) || 0,
            qtyRemaining: parseInt(cols[9]) || 0,
            createdAt: new Date().toISOString().split('T')[0],
            deadline: cols[10] || new Date().toISOString().split('T')[0],
            status: 'tikuv',
            productionLogs: []
          };
          onAddOrder(importedOrder);
          count++;
        }
      }

      alert(lang === 'uz' ? `${count} ta buyurtma yuklandi.` : `Загружено ${count} записей.`);
      setIsImportModalOpen(false);
      setCsvPasteData('');
    } catch (err) {
      alert(lang === 'uz' ? 'Xatolik yuz berdi! Formatni tekshiring.' : 'Ошибка при импорте!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleImportCSV(text);
      }
    };
    reader.readAsText(file);
  };

  // KPI Calculations (Matching the image exactly!)
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.mosCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.modelCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.color.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBrand = brandFilter === 'all' || order.brandName === brandFilter;
    const matchesColor = colorFilter === 'all' || order.color.includes(colorFilter);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesBrand && matchesColor && matchesStatus;
  });

  const kpiTotalCards = filteredOrders.length;
  const kpiTotalOrder = filteredOrders.reduce((sum, o) => sum + o.qtyOrder, 0);
  const kpiTotalPotok = filteredOrders.reduce((sum, o) => sum + o.qtyPotok, 0);
  const kpiTotalRemaining = filteredOrders.reduce((sum, o) => sum + o.qtyRemaining, 0);
  const kpiWithRemainingCount = filteredOrders.filter(o => o.qtyRemaining > 0).length;

  const currentTranslations = {
    uz: {
      title: 'Kiyimbosh Ishlab Chiqarish Monitoringi',
      sub: 'Tayyor mahsulot buyurtmalari, kesim, potok va qadoqlash ko\'rsatkichlari jurnali',
      kpiCards: 'ЗАКАЗОВ (KARTALAR)',
      kpiTotal: 'ОБЩИЙ ЗАКАЗ (JAMI)',
      kpiPotok: 'РАЗДАНО (POTOKDA)',
      kpiRemaining: 'ОСТАТОК (QOLDIQ)',
      kpiWithRemaining: 'С ОСТАТКОМ (QOLDIQLI)',
      addBtn: 'Yangi karta qo\'shish',
      searchPl: 'MOS kod, Model yoki Brend bo\'yicha qidirish...',
      brandLabel: 'Brendni tanlash',
      colorLabel: 'Rang',
      qtyOrder: 'Buyurtma soni (Заказ)',
      qtyCut: 'Kesim (Крой)',
      qtyPotok: 'Potoklarga berilgan (Раздача)',
      qtyPackaging: 'Qadoqlash (Мето)',
      qtyDefect: 'Brak (Брак)',
      qtyRemaining: 'Qoldiq (Остаток)',
      excelImport: 'Exceldan yuklash',
      excelExport: 'Excelga yuklash (Export)',
      printBtn: 'PDF / Chop etish',
      allBrands: 'Barcha brendlar',
      allColors: 'Barcha ranglar'
    },
    ru: {
      title: 'Мониторинг Швейного Производства',
      sub: 'Журнал заказов готовой продукции, кроя, потока и упаковки',
      kpiCards: 'ЗАКАЗОВ',
      kpiTotal: 'ОБЩИЙ ЗАКАЗ',
      kpiPotok: 'РАЗДАНО',
      kpiRemaining: 'ОСТАТОК',
      kpiWithRemaining: 'С ОСТАТКОМ',
      addBtn: 'Добавить карту',
      searchPl: 'Поиск по коду MOS, Модели или Бренду...',
      brandLabel: 'Выбор бренда',
      colorLabel: 'Цвет',
      qtyOrder: 'Заказ (Buyurtma)',
      qtyCut: 'Крой (Kesim)',
      qtyPotok: 'Раздача (Potok)',
      qtyPackaging: 'Упаковка (Qadoq)',
      qtyDefect: 'Брак (Brak)',
      qtyRemaining: 'Остаток (Qoldiq)',
      excelImport: 'Импорт из Excel',
      excelExport: 'Экспорт в Excel',
      printBtn: 'Печать / PDF',
      allBrands: 'Все бренды',
      allColors: 'Все цвета'
    }
  }[lang];

  return (
    <div className="space-y-6" id="orders-module-view">
      
      {/* 1. TOP HEADER STATS ROW (EXACTLY MATCHING THE USER IMAGE) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div className="bg-[#1e293b] border border-slate-700/60 p-4 rounded-xl shadow-md text-left">
          <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
            {currentTranslations.kpiCards}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {kpiTotalCards}
          </h2>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#1e293b] border border-slate-700/60 p-4 rounded-xl shadow-md text-left">
          <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
            {currentTranslations.kpiTotal}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {kpiTotalOrder.toLocaleString()}
          </h2>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#1e293b] border border-slate-700/60 p-4 rounded-xl shadow-md text-left">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
            {currentTranslations.kpiPotok}
          </span>
          <h2 className="text-2xl font-black text-emerald-400 mt-1">
            {kpiTotalPotok.toLocaleString()}
          </h2>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#1e293b] border border-slate-700/60 p-4 rounded-xl shadow-md text-left">
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
            {currentTranslations.kpiRemaining}
          </span>
          <h2 className="text-2xl font-black text-slate-200 mt-1">
            {kpiTotalRemaining.toLocaleString()}
          </h2>
        </div>

        {/* KPI 5 */}
        <div className="bg-[#1e293b] border border-slate-700/60 p-4 rounded-xl shadow-md col-span-2 md:col-span-1 text-left">
          <span className="text-[10px] text-[#fbbf24] font-bold uppercase tracking-wider block">
            {currentTranslations.kpiWithRemaining}
          </span>
          <h2 className="text-2xl font-black text-[#fbbf24] mt-1">
            {kpiWithRemainingCount}
          </h2>
        </div>
      </div>

      {/* 2. ACTIONS TOOLBAR (Import, Export, Add, Search) */}
      <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder={currentTranslations.searchPl}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-hidden"
          >
            <option value="all">{currentTranslations.allBrands}</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Color Filter */}
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-hidden"
          >
            <option value="all">{currentTranslations.allColors}</option>
            {COLORS.map(c => (
              <option key={c.name} value={c.name.split(' ')[0]}>{c.name}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex bg-slate-900 border border-slate-700 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${viewMode === 'card' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title={lang === 'uz' ? 'Karta ko\'rinishi' : 'Вид карточек'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title={lang === 'uz' ? 'Ro\'yxat ko\'rinishi' : 'Вид списка'}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Import/Export/Create Buttons */}
        <div className="flex flex-wrap gap-2 justify-end">
          {/* Excel Export button */}
          <button 
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            {currentTranslations.excelExport}
          </button>

          {/* Print button */}
          <button 
            onClick={() => setIsPrintPreviewOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            {currentTranslations.printBtn}
          </button>

          {/* Add Order Card */}
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center shadow-lg shadow-indigo-600/30 cursor-pointer gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            {currentTranslations.addBtn}
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC VIEW: CARD GRID OR COMPACT TABLE */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="dark-production-cards-grid">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <Layers className="w-12 h-12 text-indigo-500 mx-auto opacity-80" />
              <h3 className="text-base font-bold text-white">
                {lang === 'uz' ? "Hozircha buyurtmalar mavjud emas (0/0)" : "Заказы отсутствуют (0/0)"}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {lang === 'uz' ? "Tizim noldan tayyorlandi. Yangi buyurtma kartasini qo'shish yoki Excel grid orqali ma'lumot kiritishingiz mumkin." : "Система подготовлена с нуля. Вы можете добавить новую карту заказа или загрузить данные через Excel."}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md transition-all mt-2"
              >
                <Plus className="w-4 h-4" />
                {currentTranslations.addBtn}
              </button>
            </div>
          ) : (
            filteredOrders.map(order => {
            // calculate completion percentage based on Packaging.
            const totalPoshiv = Object.values(order.poshivSizes || {}).reduce((sum, v) => sum + (v || 0), 0);
            const completionPercent = order.qtyOrder > 0 ? Math.min(100, Math.round((order.qtyPackaging / order.qtyOrder) * 100)) : 0;
            const isClosed = order.status === 'yakunlandi' || completionPercent >= 100;
            const statusText = isClosed 
              ? (lang === 'uz' ? 'YAKUNLANDI' : 'ЗАКРЫТ') 
              : (lang === 'uz' ? 'JARAYONDA' : 'В РАБОТЕ');

            return (
              <div 
                key={order.id} 
                onClick={() => {
                  setSelectedOrderDetail(order);
                  setIsDetailModalOpen(true);
                }}
                className="bg-[#111827] border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden group transition-all cursor-pointer"
              >
                {/* Header section */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono text-[10px] tracking-wider uppercase truncate max-w-[140px]">
                      {order.modelCode || order.orderNumber}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {/* Status Badge */}
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isClosed 
                          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' 
                          : 'border-sky-500/40 text-sky-400 bg-sky-500/10'
                      }`}>
                        {statusText}
                      </span>

                      {/* Quick Delete button - Super Admin only */}
                      {currentUser?.role === 'super_admin' && onDeleteOrder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletePassword('');
                            setDeletePasswordError('');
                            setOrderToDelete(order);
                          }}
                          className="bg-slate-800 hover:bg-rose-950 text-rose-400 p-1 rounded-md transition-colors cursor-pointer border border-slate-700/60"
                          title={lang === 'uz' ? "O'chirish" : 'Удалить'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* MOS code */}
                  <h3 className="text-[#06b6d4] text-base font-black tracking-tight mt-0.5">
                    {order.mosCode}
                  </h3>

                  {/* Brand Name & 1C Emissiya side-by-side */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sky-400 font-semibold text-xs">
                      {order.brandName}
                    </p>
                    {order.oneCOrderEmission && (
                      <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/40" title="1C Заказ на эмиссию">
                        1C: {order.oneCOrderEmission}
                      </span>
                    )}
                  </div>

                  {/* Plan Otgruzki ptichka (checkbox) toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextPlanState = !order.inShipmentPlan;
                        onUpdateOrder({
                          ...order,
                          inShipmentPlan: nextPlanState,
                          shipmentPlanStatus: nextPlanState ? (order.shipmentPlanStatus || (order.qtyPackaging >= order.qtyOrder ? 'tayyor' : 'rejalashtirilgan')) : undefined
                        });
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                        order.inShipmentPlan 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs' 
                          : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-slate-200'
                      }`}
                      title={lang === 'uz' ? "Otgruzka rejasiga kiritish (Ptichka)" : "Включить в план отгрузки (Галочка)"}
                    >
                      {order.inShipmentPlan ? (
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span>{lang === 'uz' ? 'План отгрузки' : 'План отгрузки'}</span>
                      {order.inShipmentPlan && (
                        <span className="text-[8px] uppercase font-black px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          {order.shipmentPlanStatus === 'tayyor' ? '🟢 Tayyor' : order.shipmentPlanStatus === 'jarayonda' ? '🔵 Jarayonda' : '🟡 Reja'}
                        </span>
                      )}
                    </button>
                    
                    {order.inShipmentPlan && (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Truck className="w-3 h-3 text-amber-400" />
                        <span>{order.deadline || 'Reja'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 6-Metric Balanced Grid (Order Qty, Cut, Distribution, Sewing, Packaging, Defect) */}
                <div className="grid grid-cols-3 gap-2.5 py-2.5 border-t border-b border-slate-800/60 text-left">
                  {/* 1. Order (Buyurtma soni) */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                      {lang === 'uz' ? 'Buyurtma' : 'ЗАКАЗ'}
                    </span>
                    <p className="text-sm font-black text-white">
                      {order.qtyOrder.toLocaleString()}
                    </p>
                  </div>

                  {/* 2. Kesim (Kroy) */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider block">
                      {lang === 'uz' ? 'Kroy' : 'КРОЙ'}
                    </span>
                    <p className="text-sm font-black text-indigo-300">
                      {order.qtyCut.toLocaleString()}
                    </p>
                  </div>

                  {/* 3. Razdacha */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider block">
                      {lang === 'uz' ? 'Razdacha' : 'РАЗДАЧА'}
                    </span>
                    <p className="text-sm font-black text-emerald-400">
                      {order.qtyPotok.toLocaleString()}
                    </p>
                  </div>

                  {/* 4. Poshiv (Sewing) */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-cyan-400 font-bold uppercase tracking-wider block">
                      {lang === 'uz' ? 'Poshiv' : 'ПОШИВ'}
                    </span>
                    <p className="text-sm font-black text-cyan-400">
                      {totalPoshiv.toLocaleString()}
                    </p>
                  </div>

                  {/* 5. Upakovka (Packaging) */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-sky-400 font-bold uppercase tracking-wider block">
                      {lang === 'uz' ? 'Upakovka' : 'УПАКОВКА'}
                    </span>
                    <p className="text-sm font-black text-sky-400">
                      {order.qtyPackaging.toLocaleString()}
                    </p>
                  </div>

                  {/* 6. Brak */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-rose-500 font-bold uppercase tracking-wider block">
                      {lang === 'uz' ? 'Brak' : 'БРАК'}
                    </span>
                    <p className={`text-sm font-black ${order.qtyDefect > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                      {order.qtyDefect.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress and bottom indicators */}
                <div className="space-y-2 text-[10px]">
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-sky-500'}`} 
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-extrabold text-indigo-400">
                      {lang === 'uz' ? 'Yopilish' : 'Закрытие'}: {completionPercent}% – {Object.keys(order.sizes).length} {lang === 'uz' ? 'razmer' : 'размеров'}
                    </span>

                    {/* Quick Color Tag on right */}
                    <div className="flex flex-wrap items-center justify-end gap-1 max-w-[180px]">
                      {(order.colorVariants && order.colorVariants.length > 0
                        ? order.colorVariants.map(v => v.color)
                        : order.color.split(/[,;\/]/)
                      )
                        .map(c => c.trim().replace(/,+$/, ''))
                        .filter(Boolean)
                        .map((colorName, idx) => (
                          <span key={idx} className="text-[9px] font-black text-slate-200 uppercase bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-700 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            {colorName}
                          </span>
                        ))
                      }
                    </div>
                  </div>

                  {/* Elegant prominent view button */}
                  <div className="pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => {
                        setSelectedOrderDetail(order);
                        setIsDetailModalOpen(true);
                      }}
                      className="w-full bg-slate-900/60 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 font-extrabold text-[10px] py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {lang === 'uz' ? "KO'RISH (O'lchamlar & Bo'limlar)" : "ПРОСМОТР (Размеры и Разделы)"}
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
        </div>
      ) : (
        /* Sleek compact tabular List View (Spisok) as requested */
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden" id="dark-production-list-view">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase text-center tracking-wider">
                  <th className="p-3.5 text-left font-mono">{lang === 'uz' ? 'MOS KOD' : 'КОД MOS'}</th>
                  <th className="p-3.5 text-left font-mono">{lang === 'uz' ? 'ARTIKUL' : 'АРТИКУЛ'}</th>
                  <th className="p-3.5 text-left">{lang === 'uz' ? 'BREND' : 'БРЕНД'}</th>
                  <th className="p-3.5">{lang === 'uz' ? 'RANG' : 'ЦВЕТ'}</th>
                  <th className="p-3.5 text-indigo-400 font-mono">{lang === 'uz' ? '1C EMISSIYA' : '1C ЭМИССИЯ'}</th>
                  <th className="p-3.5">{lang === 'uz' ? 'BUYURTMA' : 'ЗАКАЗ'}</th>
                  <th className="p-3.5">{lang === 'uz' ? 'KROY' : 'КРОЙ'}</th>
                  <th className="p-3.5 text-emerald-400">{lang === 'uz' ? 'RAZDACHA' : 'РАЗДАЧА'}</th>
                  <th className="p-3.5 text-cyan-400">{lang === 'uz' ? 'POSHIV' : 'ПОШИВ'}</th>
                  <th className="p-3.5 text-sky-400">{lang === 'uz' ? 'UPAKOVKA' : 'УПАКОВКА'}</th>
                  <th className="p-3.5 text-rose-400">{lang === 'uz' ? 'BRAK' : 'БРАК'}</th>
                  <th className="p-3.5 text-amber-400 text-center font-mono">{lang === 'uz' ? 'ПЛАН' : 'ПЛАН'}</th>
                  <th className="p-3.5">{lang === 'uz' ? 'YOPILISH %' : 'ЗАКРЫТИЕ %'}</th>
                  <th className="p-3.5">{lang === 'uz' ? 'STATUS' : 'СТАТУС'}</th>
                  <th className="p-3.5 text-right">{lang === 'uz' ? 'HARAKATLAR' : 'ДЕЙСТВИЯ'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-center font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-slate-500 font-bold">
                      {lang === 'uz' ? 'Buyurtmalar topilmadi' : 'Заказы не найдены'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const totalPoshiv = Object.values(order.poshivSizes || {}).reduce((sum, v) => sum + (v || 0), 0);
                    const completionPercent = order.qtyOrder > 0 ? Math.min(100, Math.round((order.qtyPackaging / order.qtyOrder) * 100)) : 0;
                    const isClosed = order.status === 'yakunlandi' || completionPercent >= 100;
                    const statusText = isClosed 
                      ? (lang === 'uz' ? 'YAKUNLANDI' : 'ЗАКРЫТ') 
                      : (lang === 'uz' ? 'JARAYONDA' : 'В РАБОТЕ');

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* MOS Code */}
                        <td className="p-3.5 text-left font-bold text-white font-mono text-xs">
                          {order.mosCode}
                        </td>

                        {/* Model Code */}
                        <td className="p-3.5 text-left text-slate-400 font-mono text-[11px] max-w-[150px] truncate">
                          {order.modelCode || '-'}
                        </td>

                        {/* Brand Name */}
                        <td className="p-3.5 text-left text-sky-400 font-semibold text-xs">
                          {order.brandName}
                        </td>

                        {/* Color */}
                        <td className="p-3.5 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px] mx-auto">
                            {(order.colorVariants && order.colorVariants.length > 0
                              ? order.colorVariants.map(v => v.color)
                              : order.color.split(/[,;\/]/)
                            )
                              .map(c => c.trim().replace(/,+$/, ''))
                              .filter(Boolean)
                              .map((colorName, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-slate-200 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                  {colorName}
                                </span>
                              ))
                            }
                          </div>
                        </td>

                        {/* 1C Order Emission */}
                        <td className="p-3.5 text-center">
                          {order.oneCOrderEmission ? (
                            <span className="font-mono text-xs text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/30">
                              {order.oneCOrderEmission}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Buyurtma (Order) */}
                        <td className="p-3.5 text-center font-bold text-white text-xs">
                          {order.qtyOrder.toLocaleString()}
                        </td>

                        {/* Kesim (Cut) */}
                        <td className="p-3.5 text-center text-slate-200">
                          {order.qtyCut.toLocaleString()}
                        </td>

                        {/* Potokka (Distribution) */}
                        <td className="p-3.5 text-center font-bold text-emerald-400 text-xs">
                          {order.qtyPotok.toLocaleString()}
                        </td>

                        {/* Poshiv (Sewing) */}
                        <td className="p-3.5 text-center font-bold text-cyan-400 text-xs">
                          {totalPoshiv.toLocaleString()}
                        </td>

                        {/* Upakovka (Packaging) */}
                        <td className="p-3.5 text-center font-bold text-sky-400 text-xs">
                          {order.qtyPackaging.toLocaleString()}
                        </td>

                        {/* Brak (Defect) */}
                        <td className="p-3.5 text-center font-bold text-rose-500">
                          {order.qtyDefect.toLocaleString()}
                        </td>

                        {/* Plan Otgruzki ptichka (checkbox) */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextPlanState = !order.inShipmentPlan;
                              onUpdateOrder({
                                ...order,
                                inShipmentPlan: nextPlanState,
                                shipmentPlanStatus: nextPlanState ? (order.shipmentPlanStatus || (order.qtyPackaging >= order.qtyOrder ? 'tayyor' : 'rejalashtirilgan')) : undefined
                              });
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1 ${
                              order.inShipmentPlan
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                                : 'bg-slate-900 text-slate-500 border-slate-700/80 hover:text-slate-300'
                            }`}
                            title={lang === 'uz' ? "Otgruzka rejasiga qo'shish (Ptichka)" : "Включить в план отгрузки (Галочка)"}
                          >
                            {order.inShipmentPlan ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                            {order.inShipmentPlan && (
                              <span className="text-[9px] uppercase font-bold text-amber-300">
                                {order.shipmentPlanStatus === 'tayyor' ? 'Tayyor' : 'Reja'}
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Yopilish % */}
                        <td className="p-3.5 text-center font-black text-indigo-400 text-xs">
                          {completionPercent}%
                        </td>

                        {/* Status (Closed / In Progress) */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isClosed 
                              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' 
                              : 'border-sky-500/40 text-sky-400 bg-sky-500/10'
                          }`}>
                            {statusText}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedOrderDetail(order);
                                setIsDetailModalOpen(true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg cursor-pointer transition-colors"
                              title={lang === 'uz' ? "Ko'rish" : 'Просмотр'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {currentUser?.role === 'super_admin' && onDeleteOrder && (
                              <button
                                onClick={() => {
                                  setDeletePassword('');
                                  setDeletePasswordError('');
                                  setOrderToDelete(order);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg cursor-pointer transition-colors"
                                title={lang === 'uz' ? "O'chirish" : 'Удалить'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================== MODAL: CREATE WORK CARD ==================================== */}
      <ResizableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={lang === 'uz' ? 'YANGI ISHLAB CHIQARISH KARTASI' : 'НОВАЯ КАРТА ПРОИЗВОДСТВА'}
        subtitle={lang === 'uz' ? "MOS kodi bo'yicha mahsulot ko'rsatkichlarini kiriting" : 'Внесите параметры для производственного отслеживания'}
        initialWidth={720}
        initialHeight={680}
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs text-slate-300">
          
          {/* Code details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-slate-400">MOS KOD (e.g. MOS-539.7.1 SZ) *</label>
              <input 
                type="text"
                required
                placeholder="Masalan: MOS-539.7.1 SZ"
                value={formMosCode}
                onChange={(e) => setFormMosCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-indigo-500 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-400">{lang === 'uz' ? 'Artikul / Model kodi' : 'Артикул / Код модели'}</label>
              <input 
                type="text"
                placeholder="Masalan: SM-OW-1111/160-TA.LMP.OE"
                value={formModelCode}
                onChange={(e) => setFormModelCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-indigo-500 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-indigo-400">{lang === 'uz' ? '1C Emissiya buyurtmasi' : '1С Заказ на эмиссию'}</label>
              <input 
                type="text"
                placeholder="Masalan: 1C-EM-5390"
                value={formOneCOrderEmission}
                onChange={(e) => setFormOneCOrderEmission(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-indigo-900/60 text-white rounded-xl focus:outline-hidden focus:border-indigo-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* Brand and color selection with dynamic add */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-slate-400">
                {lang === 'uz' ? 'Mijoz (Brend)' : 'Заказчик (Бренд)'}
              </label>
              {!showAddBrandInput ? (
                <div className="flex gap-2">
                  <select 
                    value={formBrandName}
                    onChange={(e) => setFormBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden text-xs cursor-pointer"
                  >
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => setShowAddBrandInput(true)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-2.5 rounded-xl cursor-pointer"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Yangi brend nomi..."
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden text-xs"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddBrand}
                    className="bg-indigo-600 text-white px-3 rounded-xl cursor-pointer"
                  >
                    OK
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddBrandInput(false)}
                    className="bg-slate-800 text-slate-400 px-2 rounded-xl cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-400">{lang === 'uz' ? 'Rangi' : 'Цвет'}</label>
              {!showAddColorInput ? (
                <div className="flex gap-2">
                  <select 
                    value={formColorName}
                    onChange={(e) => {
                      const found = COLORS.find(c => c.name === e.target.value);
                      if (found) {
                        setFormColorName(found.name);
                        setFormColorHex(found.hex);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden text-xs cursor-pointer"
                  >
                    {COLORS.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => setShowAddColorInput(true)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-2.5 rounded-xl cursor-pointer"
                    title={lang === 'uz' ? "Yangi rang qo'shish" : 'Добавить свой цвет'}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    required
                    placeholder={lang === 'uz' ? 'Masalan: Malina rang' : 'Например: Малиновый'}
                    value={newColorNameInput}
                    onChange={(e) => setNewColorNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden text-xs font-bold"
                  />
                  <input 
                    type="color"
                    value={newColorHexInput}
                    onChange={(e) => setNewColorHexInput(e.target.value)}
                    className="w-10 h-8 p-0 border-0 bg-transparent rounded-lg cursor-pointer shrink-0"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (newColorNameInput.trim()) {
                        setFormColorName(newColorNameInput.trim());
                        setFormColorHex(newColorHexInput);
                        setNewColorNameInput('');
                        setShowAddColorInput(false);
                      }
                    }}
                    className="bg-indigo-600 text-white px-3 rounded-xl cursor-pointer font-bold"
                  >
                    OK
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddColorInput(false)}
                    className="bg-slate-800 text-slate-400 px-2 rounded-xl cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Master Quantities (6 Boxes values) */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-300 uppercase tracking-wide">
              {lang === 'uz' ? 'Dastlabki ishlab chiqarish ko\'rsatkichlari' : 'Исходные производственные параметры'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Buyurtma */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">{currentTranslations.qtyOrder}</label>
                <input 
                  type="number"
                  required
                  min="1"
                  value={formQtyOrder}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setFormQtyOrder(val);
                    setFormQtyCut(val); // By default, cut is equal to order
                  }}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white text-center font-bold rounded-lg text-xs"
                />
              </div>

              {/* Kesim */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">{currentTranslations.qtyCut}</label>
                <input 
                  type="number"
                  required
                  min="0"
                  value={formQtyCut}
                  onChange={(e) => setFormQtyCut(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white text-center font-bold rounded-lg text-xs"
                />
              </div>

              {/* Potok */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">{currentTranslations.qtyPotok}</label>
                <input 
                  type="number"
                  value={formQtyPotok}
                  onChange={(e) => setFormQtyPotok(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white text-center font-bold rounded-lg text-xs"
                />
              </div>

              {/* Qadoqlash */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">{currentTranslations.qtyPackaging}</label>
                <input 
                  type="number"
                  value={formQtyPackaging}
                  onChange={(e) => setFormQtyPackaging(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white text-center font-bold rounded-lg text-xs"
                />
              </div>

              {/* Brak */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">{currentTranslations.qtyDefect}</label>
                <input 
                  type="number"
                  value={formQtyDefect}
                  onChange={(e) => setFormQtyDefect(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white text-center font-bold rounded-lg text-xs text-rose-400"
                />
              </div>

              {/* Qoldiq */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">{currentTranslations.qtyRemaining}</label>
                <input 
                  type="number"
                  placeholder="Avto"
                  value={formQtyRemaining || ''}
                  onChange={(e) => setFormQtyRemaining(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white text-center font-bold rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Sizes matrix (Adults 2XS-16XL, Kids 116-164, Kids 24-42) */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2">
              <h4 className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                {lang === 'uz' ? 'O\'lchamlar bo\'yicha kiritish' : 'Ввод по размерам'}
              </h4>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button 
                  type="button"
                  onClick={() => setActiveSizeCategory('adult')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${activeSizeCategory === 'adult' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  {lang === 'uz' ? 'Kattalar' : 'Взрослые'}
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveSizeCategory('kids1')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${activeSizeCategory === 'kids1' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  {lang === 'uz' ? 'Bolalar (116-164)' : 'Дети (116-164)'}
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveSizeCategory('kids2')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${activeSizeCategory === 'kids2' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  {lang === 'uz' ? 'Bolalar (24-42)' : 'Дети (24-42)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-[160px] overflow-y-auto p-1 bg-slate-950/60 rounded-lg">
              {activeSizeCategory === 'adult' && ADULT_SIZES.map(sz => (
                <div key={sz} className="text-center p-1 bg-slate-900/60 border border-slate-800/80 rounded-md">
                  <span className="text-[10px] font-black text-slate-400 block mb-0.5">{sz}</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={selectedSizes[sz] || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setSelectedSizes(prev => ({ ...prev, [sz]: val }));
                    }}
                    className="w-full text-center bg-slate-950 text-white text-xs p-1 rounded font-mono font-bold focus:outline-hidden"
                  />
                </div>
              ))}

              {activeSizeCategory === 'kids1' && KIDS_SIZES_1.map(sz => (
                <div key={sz} className="text-center p-1 bg-slate-900/60 border border-slate-800/80 rounded-md">
                  <span className="text-[10px] font-black text-slate-400 block mb-0.5">{sz}</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={selectedSizes[sz] || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setSelectedSizes(prev => ({ ...prev, [sz]: val }));
                    }}
                    className="w-full text-center bg-slate-950 text-white text-xs p-1 rounded font-mono font-bold focus:outline-hidden"
                  />
                </div>
              ))}

              {activeSizeCategory === 'kids2' && KIDS_SIZES_2.map(sz => (
                <div key={sz} className="text-center p-1 bg-slate-900/60 border border-slate-800/80 rounded-md">
                  <span className="text-[10px] font-black text-slate-400 block mb-0.5">{sz}</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={selectedSizes[sz] || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setSelectedSizes(prev => ({ ...prev, [sz]: val }));
                    }}
                    className="w-full text-center bg-slate-950 text-white text-xs p-1 rounded font-mono font-bold focus:outline-hidden"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span>{lang === 'uz' ? 'Hisoblangan o\'lcham jami:' : 'Рассчитанный итог по размерам:'}</span>
              <strong className="text-indigo-400 text-sm font-black">{calculateFormTotalQty()} {lang === 'uz' ? 'dona' : 'шт'}</strong>
            </div>
          </div>

          {/* Deadline & notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-slate-400">{lang === 'uz' ? 'Topshirish muddati' : 'Срок сдачи'}</label>
              <input 
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-400">{lang === 'uz' ? 'Qo\'shimcha izohlar' : 'Дополнительные примечания'}</label>
              <input 
                type="text"
                placeholder="..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden text-xs"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-slate-400 cursor-pointer"
            >
              {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
            </button>
            <button 
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl cursor-pointer"
            >
              {lang === 'uz' ? 'Karta yaratish' : 'Создать карту'}
            </button>
          </div>
        </form>
      </ResizableModal>

      {/* ==================================== MODAL: EDIT QUANTITIES (6 BOXES) ==================================== */}
      <ResizableModal
        isOpen={isEditQtyModalOpen && !!editingOrder}
        onClose={() => { setIsEditQtyModalOpen(false); setEditingOrder(null); }}
        title={lang === 'uz' ? 'KO\'RSATKICHLARNI TAHRIRLASH' : 'РЕДАКТИРОВАТЬ ПОКАЗАТЕЛИ'}
        subtitle={editingOrder ? `${editingOrder.brandName} - ${editingOrder.mosCode}` : undefined}
        initialWidth={500}
        initialHeight={550}
      >
        {editingOrder && (
          <form onSubmit={handleUpdateQuantities} className="space-y-4 text-xs text-slate-300">
            
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center font-mono font-bold text-[#06b6d4]">
              {editingOrder.mosCode} ({editingOrder.color.split(' ')[0]})
            </div>

            {/* 1C Emissiya Input */}
            <div className="space-y-1">
              <label className="block font-bold text-indigo-400">{lang === 'uz' ? '1C Emissiya buyurtmasi' : '1С Заказ на эмиссию'}</label>
              <input 
                type="text"
                placeholder="Masalan: 1C-EM-5390"
                value={formOneCOrderEmission}
                onChange={(e) => setFormOneCOrderEmission(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-indigo-900/60 text-white rounded-xl focus:outline-hidden focus:border-indigo-500 text-xs font-mono font-bold"
              />
            </div>

            {/* Five balanced boxes inputs (Removing METO/Qadoqlash) */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              {/* Buyurtma */}
              <div className="space-y-1">
                <label className="block text-[9px] text-slate-400 font-bold uppercase">{currentTranslations.qtyOrder}</label>
                <input 
                  type="number"
                  required
                  value={formQtyOrder}
                  onChange={(e) => setFormQtyOrder(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 text-white font-bold text-center rounded-lg text-xs"
                />
              </div>

              {/* Kesim */}
              <div className="space-y-1">
                <label className="block text-[9px] text-slate-400 font-bold uppercase">{currentTranslations.qtyCut}</label>
                <input 
                  type="number"
                  required
                  value={formQtyCut}
                  onChange={(e) => setFormQtyCut(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 text-white font-bold text-center rounded-lg text-xs"
                />
              </div>

              {/* Potok */}
              <div className="space-y-1">
                <label className="block text-[9px] text-slate-400 font-bold uppercase">{currentTranslations.qtyPotok}</label>
                <input 
                  type="number"
                  required
                  value={formQtyPotok}
                  onChange={(e) => setFormQtyPotok(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 text-white font-bold text-center rounded-lg text-xs"
                />
              </div>

              {/* Brak */}
              <div className="space-y-1">
                <label className="block text-[9px] text-slate-400 font-bold uppercase">{currentTranslations.qtyDefect}</label>
                <input 
                  type="number"
                  required
                  value={formQtyDefect}
                  onChange={(e) => setFormQtyDefect(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 text-white font-bold text-center rounded-lg text-xs text-rose-400"
                />
              </div>

              {/* Qoldiq (Spans 2 columns) */}
              <div className="space-y-1 col-span-2">
                <label className="block text-[9px] text-slate-400 font-bold uppercase">{currentTranslations.qtyRemaining}</label>
                <input 
                  type="number"
                  required
                  value={formQtyRemaining}
                  onChange={(e) => setFormQtyRemaining(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 text-white font-bold text-center rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Change status option */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-400">{lang === 'uz' ? 'Ishlab chiqarish holati' : 'Статус производства'}</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="yangi">{lang === 'uz' ? 'Yangi buyurtma' : 'Новый заказ'}</option>
                <option value="bichuv">{lang === 'uz' ? 'Bichuv sexida' : 'В раскройном цехе'}</option>
                <option value="tikuv">{lang === 'uz' ? 'Tikuv sexida' : 'В швейном цехе'}</option>
                <option value="qadoqlash">{lang === 'uz' ? 'Qadoqlashda' : 'На упаковке'}</option>
                <option value="yakunlandi">{lang === 'uz' ? 'Yakunlandi' : 'Завершен'}</option>
                <option value="bekor_qilindi">{lang === 'uz' ? 'Bekor qilindi' : 'Отменен'}</option>
              </select>
            </div>

            {/* Sizes overview (ReadOnly / Breakdown view) */}
            {Object.keys(editingOrder.sizes).length > 0 && (
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[10px]">
                <strong className="block text-slate-400 uppercase tracking-wider mb-1">
                  {lang === 'uz' ? 'Razmerlar taqsimoti:' : 'Разбивка по размерам:'}
                </strong>
                <div className="flex flex-wrap gap-1.5 font-mono">
                  {Object.entries(editingOrder.sizes).map(([sz, q]) => (
                    <span key={sz} className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-white font-bold">
                      {sz}: <span className="text-sky-400">{q}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => { setIsEditQtyModalOpen(false); setEditingOrder(null); }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-semibold rounded-xl cursor-pointer"
              >
                {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
              >
                {lang === 'uz' ? 'Yangilash' : 'Обновить'}
              </button>
            </div>

          </form>
        )}
      </ResizableModal>

      {/* ==================================== MODAL: EXCEL / 1C SPREADSHEET MATRIX IMPORT ==================================== */}
      <ResizableModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Загрузка кодов маркировки / Таблица заказов (Excel Grid Paste)"
        icon={<FileSpreadsheet className="w-4 h-4 text-amber-600" />}
        initialWidth={1150}
        initialHeight={720}
        minWidth={600}
        minHeight={400}
        theme="light"
      >
        <div className="flex flex-col h-full bg-white text-gray-900 overflow-hidden">
          {/* Action Buttons Row */}
          <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  type="button" 
                  onClick={handleSaveGridToOrders}
                  className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs px-4 py-1.5 rounded-sm border border-amber-600 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Готово (Сохранить)
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsImportModalOpen(false)}
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
                    value={rowsToAddCount} 
                    onChange={(e) => setRowsToAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center font-bold text-xs text-gray-900 border-b border-gray-300 outline-none focus:border-amber-500"
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddGridRows(rowsToAddCount)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-2 py-0.5 rounded-xs border border-emerald-300 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    Добавить
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={handleSelectAllCells}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs px-2.5 py-1.5 rounded-sm border border-blue-300 shadow-xs cursor-pointer"
                  title="Выделить всю таблицу (Ctrl+A)"
                >
                  Выделить всё (Ctrl+A)
                </button>

                <button 
                  type="button"
                  onClick={clearSelectedCells}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-xs px-2.5 py-1.5 rounded-sm border border-rose-300 shadow-xs cursor-pointer"
                  title="Очистить выделенные ячейки (Delete)"
                >
                  Очистить выделенное (Delete)
                </button>

                <button 
                  type="button"
                  onClick={handleClearGridRows}
                  className="bg-white hover:bg-rose-50 text-rose-700 font-medium text-xs px-2.5 py-1.5 rounded-sm border border-gray-200 shadow-xs cursor-pointer"
                >
                  Очистить всё
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2.5 py-1.5 rounded-sm text-xs border border-gray-300 cursor-pointer flex items-center gap-1"
                >
                  <Upload className="w-3 h-3 text-indigo-600" />
                  Загрузить из файла (.CSV)
                </button>
              </div>
            </div>

            {/* Size Scale Preset Selector & Info Notice Bar */}
            <div className="bg-[#fffbeb] border-b border-[#fef08a] px-3 py-2 text-[11px] text-[#92400e] flex flex-wrap items-center justify-between gap-2 font-sans">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <strong>Горизонтальная сетка размеров (Excel).</strong>
                  <span className="block text-[10px] text-amber-800/80">
                    Введите количество по каждому размеру горизонтально. Авто-сумма рассчитывает Заказ (Всего).
                  </span>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 bg-amber-100/80 p-1 rounded-md border border-amber-300">
                <span className="text-[10px] font-bold text-amber-900 mr-1">Шкала размеров:</span>
                <button
                  type="button"
                  onClick={() => setGridSizeCategory('adult')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${gridSizeCategory === 'adult' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white/80 text-amber-900 hover:bg-white'}`}
                >
                  Взрослые (XS-5XL)
                </button>
                <button
                  type="button"
                  onClick={() => setGridSizeCategory('numeric')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${gridSizeCategory === 'numeric' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white/80 text-amber-900 hover:bg-white'}`}
                >
                  Числовые (38-56)
                </button>
                <button
                  type="button"
                  onClick={() => setGridSizeCategory('kids1')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${gridSizeCategory === 'kids1' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white/80 text-amber-900 hover:bg-white'}`}
                >
                  Детские (116-164)
                </button>
                <button
                  type="button"
                  onClick={() => setGridSizeCategory('kids2')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${gridSizeCategory === 'kids2' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white/80 text-amber-900 hover:bg-white'}`}
                >
                  Детские (24-42)
                </button>
              </div>
            </div>

            {/* Quick Paste Buffer Textarea Drawer */}
            <div className="bg-slate-900 border-b border-slate-800 p-2">
              <details className="group">
                <summary className="text-[10px] font-bold text-amber-400 cursor-pointer flex items-center justify-between uppercase tracking-wider select-none">
                  <span>📋 Вставить текст Excel / 1С сюда (Ctrl+V Paste Buffer) — Колонки авто-заполнятся</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={3}
                    placeholder={`MOS-525.2\tSM-OW-1111\tStark Cotton\tБелый\t${activeGridSizes.map(() => '10').join('\t')}\t100\t0\t0\t2026-08-15`}
                    value={csvPasteData}
                    onChange={(e) => {
                      setCsvPasteData(e.target.value);
                      handlePasteRawTextToGrid(e.target.value);
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-amber-200 rounded-sm font-mono text-[11px] outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Формат: MOS | МОДЕЛЬ | БРЕНД | ЦВЕТ | {activeGridSizes.join(' | ')} | ЗАКАЗ | РАСКРОЙ | ПОШИВ | УПАКОВКА | СРОК</span>
                    <button 
                      type="button" 
                      onClick={() => handlePasteRawTextToGrid(csvPasteData)}
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
                    <th className="border border-amber-500 bg-amber-50/60 text-amber-900 px-2 py-1 text-left min-w-[130px] font-bold">
                      Код маркировки (MOS) *
                    </th>
                    <th className="border border-gray-300 px-2 py-1 text-left min-w-[130px]">Код модели</th>
                    <th className="border border-gray-300 px-2 py-1 text-left min-w-[100px]">Бренд</th>
                    <th className="border border-gray-300 px-2 py-1 text-left min-w-[85px]">Цвет</th>
                    
                    {/* Size Columns Headers */}
                    {activeGridSizes.map(sz => (
                      <th key={sz} className="border border-indigo-300 bg-indigo-50/80 text-indigo-900 px-1 py-1 text-center min-w-[42px] font-bold text-[10px]">
                        {sz}
                      </th>
                    ))}

                    <th className="border border-gray-300 px-2 py-1 text-right min-w-[85px] bg-amber-100/50 text-amber-900 font-bold">
                      Заказ (Всего)
                    </th>
                    <th className="border border-gray-300 px-2 py-1 text-right min-w-[70px]">Раскрой</th>
                    <th className="border border-gray-300 px-2 py-1 text-right min-w-[70px]">Пошив</th>
                    <th className="border border-gray-300 px-2 py-1 text-right min-w-[70px]">Упаковка</th>
                    <th className="border border-gray-300 px-2 py-1 text-center min-w-[90px]">Срок</th>
                    <th className="border border-gray-300 px-1 py-1 w-8 text-center">✕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {excelGridRows.map((row, rIdx) => {
                    const isCellSel = (cIdx: number) => {
                      if (!selectedCells) return false;
                      const minR = Math.min(selectedCells.startRow, selectedCells.endRow);
                      const maxR = Math.max(selectedCells.startRow, selectedCells.endRow);
                      const minC = Math.min(selectedCells.startCol, selectedCells.endCol);
                      const maxC = Math.max(selectedCells.startCol, selectedCells.endCol);
                      return rIdx >= minR && rIdx <= maxR && cIdx >= minC && cIdx <= maxC;
                    };

                    const rowSizeSum = Object.values(row.sizes || {}).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
                    const displayQtyOrder = rowSizeSum > 0 ? rowSizeSum : (row.qtyOrder || '');

                    return (
                      <tr key={row.id} className="hover:bg-amber-50/20 group">
                        <td className="border border-gray-300 px-1 py-1 text-center font-mono text-[10px] text-gray-500 bg-gray-50">
                          {rIdx + 1}
                        </td>
                        <td 
                          onMouseDown={(e) => handleCellMouseDown(rIdx, 0, e)}
                          onMouseEnter={() => handleCellMouseEnter(rIdx, 0)}
                          className={`border border-gray-300 p-0 ${isCellSel(0) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500 focus-within:bg-amber-50/40'}`}
                        >
                          <input 
                            type="text" 
                            value={row.mosCode} 
                            onChange={(e) => handleGridCellChange(row.id, 'mosCode', e.target.value)}
                            onPaste={(e) => handleGridCellPaste(e, rIdx, 0)}
                            placeholder="MOS-539.7.1"
                            className="w-full px-2 py-1 border-none outline-none font-mono font-bold text-gray-900 bg-transparent text-xs"
                          />
                        </td>
                        <td 
                          onMouseDown={(e) => handleCellMouseDown(rIdx, 1, e)}
                          onMouseEnter={() => handleCellMouseEnter(rIdx, 1)}
                          className={`border border-gray-300 p-0 ${isCellSel(1) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                        >
                          <input 
                            type="text" 
                            value={row.modelCode} 
                            onChange={(e) => handleGridCellChange(row.id, 'modelCode', e.target.value)}
                            onPaste={(e) => handleGridCellPaste(e, rIdx, 1)}
                            placeholder="SM-OW-1111..."
                            className="w-full px-2 py-1 border-none outline-none font-mono text-gray-800 bg-transparent text-xs"
                          />
                        </td>
                        <td 
                          onMouseDown={(e) => handleCellMouseDown(rIdx, 2, e)}
                          onMouseEnter={() => handleCellMouseEnter(rIdx, 2)}
                          className={`border border-gray-300 p-0 ${isCellSel(2) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                        >
                          <input 
                            type="text" 
                            value={row.brandName} 
                            onChange={(e) => handleGridCellChange(row.id, 'brandName', e.target.value)}
                            onPaste={(e) => handleGridCellPaste(e, rIdx, 2)}
                            placeholder="Stark Cotton"
                            className="w-full px-2 py-1 border-none outline-none text-gray-800 bg-transparent text-xs"
                          />
                        </td>
                        <td 
                          onMouseDown={(e) => handleCellMouseDown(rIdx, 3, e)}
                          onMouseEnter={() => handleCellMouseEnter(rIdx, 3)}
                          className={`border border-gray-300 p-0 ${isCellSel(3) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                        >
                          <input 
                            type="text" 
                            value={row.color} 
                            onChange={(e) => handleGridCellChange(row.id, 'color', e.target.value)}
                            onPaste={(e) => handleGridCellPaste(e, rIdx, 3)}
                            placeholder="Белый"
                            className="w-full px-2 py-1 border-none outline-none text-gray-800 bg-transparent text-xs"
                          />
                        </td>

                        {/* Dynamic Size Inputs */}
                        {activeGridSizes.map((szKey, sIdx) => {
                          const colIdx = 4 + sIdx;
                          const val = row.sizes[szKey] || '';
                          return (
                            <td 
                              key={szKey}
                              onMouseDown={(e) => handleCellMouseDown(rIdx, colIdx, e)}
                              onMouseEnter={() => handleCellMouseEnter(rIdx, colIdx)}
                              className={`border border-gray-300 p-0 ${isCellSel(colIdx) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-indigo-500 bg-indigo-50/10'}`}
                            >
                              <input 
                                type="number" 
                                value={val} 
                                onChange={(e) => handleGridSizeChange(row.id, szKey, parseInt(e.target.value) || 0)}
                                onPaste={(e) => handleGridCellPaste(e, rIdx, colIdx)}
                                placeholder="0"
                                className="w-full px-1 py-1 border-none outline-none font-bold text-center text-indigo-950 bg-transparent text-xs"
                              />
                            </td>
                          );
                        })}

                        {/* Qty Order Column */}
                        {(() => {
                          const colIdx = 4 + activeGridSizes.length;
                          return (
                            <td 
                              onMouseDown={(e) => handleCellMouseDown(rIdx, colIdx, e)}
                              onMouseEnter={() => handleCellMouseEnter(rIdx, colIdx)}
                              className={`border border-gray-300 p-0 text-right bg-amber-50/30 ${isCellSel(colIdx) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                            >
                              <input 
                                type="number" 
                                value={displayQtyOrder} 
                                onChange={(e) => handleGridCellChange(row.id, 'qtyOrder', parseInt(e.target.value) || 0)}
                                onPaste={(e) => handleGridCellPaste(e, rIdx, colIdx)}
                                placeholder="0"
                                className="w-full px-2 py-1 border-none outline-none font-extrabold text-right text-amber-950 bg-transparent text-xs"
                              />
                            </td>
                          );
                        })()}

                        {/* Qty Cut */}
                        {(() => {
                          const colIdx = 5 + activeGridSizes.length;
                          return (
                            <td 
                              onMouseDown={(e) => handleCellMouseDown(rIdx, colIdx, e)}
                              onMouseEnter={() => handleCellMouseEnter(rIdx, colIdx)}
                              className={`border border-gray-300 p-0 text-right ${isCellSel(colIdx) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                            >
                              <input 
                                type="number" 
                                value={row.qtyCut || ''} 
                                onChange={(e) => handleGridCellChange(row.id, 'qtyCut', parseInt(e.target.value) || 0)}
                                onPaste={(e) => handleGridCellPaste(e, rIdx, colIdx)}
                                placeholder="0"
                                className="w-full px-2 py-1 border-none outline-none text-right text-amber-800 font-bold bg-transparent text-xs"
                              />
                            </td>
                          );
                        })()}

                        {/* Qty Potok */}
                        {(() => {
                          const colIdx = 6 + activeGridSizes.length;
                          return (
                            <td 
                              onMouseDown={(e) => handleCellMouseDown(rIdx, colIdx, e)}
                              onMouseEnter={() => handleCellMouseEnter(rIdx, colIdx)}
                              className={`border border-gray-300 p-0 text-right ${isCellSel(colIdx) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                            >
                              <input 
                                type="number" 
                                value={row.qtyPotok || ''} 
                                onChange={(e) => handleGridCellChange(row.id, 'qtyPotok', parseInt(e.target.value) || 0)}
                                onPaste={(e) => handleGridCellPaste(e, rIdx, colIdx)}
                                placeholder="0"
                                className="w-full px-2 py-1 border-none outline-none text-right text-indigo-800 font-bold bg-transparent text-xs"
                              />
                            </td>
                          );
                        })()}

                        {/* Qty Packaging */}
                        {(() => {
                          const colIdx = 7 + activeGridSizes.length;
                          return (
                            <td 
                              onMouseDown={(e) => handleCellMouseDown(rIdx, colIdx, e)}
                              onMouseEnter={() => handleCellMouseEnter(rIdx, colIdx)}
                              className={`border border-gray-300 p-0 text-right ${isCellSel(colIdx) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                            >
                              <input 
                                type="number" 
                                value={row.qtyPackaging || ''} 
                                onChange={(e) => handleGridCellChange(row.id, 'qtyPackaging', parseInt(e.target.value) || 0)}
                                onPaste={(e) => handleGridCellPaste(e, rIdx, colIdx)}
                                placeholder="0"
                                className="w-full px-2 py-1 border-none outline-none text-right text-emerald-800 font-bold bg-transparent text-xs"
                              />
                            </td>
                          );
                        })()}

                        {/* Deadline */}
                        {(() => {
                          const colIdx = 8 + activeGridSizes.length;
                          return (
                            <td 
                              onMouseDown={(e) => handleCellMouseDown(rIdx, colIdx, e)}
                              onMouseEnter={() => handleCellMouseEnter(rIdx, colIdx)}
                              className={`border border-gray-300 p-0 ${isCellSel(colIdx) ? 'bg-blue-100/80 ring-2 ring-blue-500 z-10' : 'focus-within:border-amber-500'}`}
                            >
                              <input 
                                type="date" 
                                value={row.deadline} 
                                onChange={(e) => handleGridCellChange(row.id, 'deadline', e.target.value)}
                                onPaste={(e) => handleGridCellPaste(e, rIdx, colIdx)}
                                className="w-full px-1 py-1 border-none outline-none text-center text-gray-700 bg-transparent text-[10px]"
                              />
                            </td>
                          );
                        })()}

                        <td className="border border-gray-300 px-1 py-1 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveGridRow(row.id)}
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
              <span className="text-gray-500 font-medium">📋 Режим: Копировать-Вставить из Excel / 1С (Paste Buffer)</span>
              <div className="font-semibold text-gray-700">
                Всего заполненных строк: <strong className="text-gray-900">{excelGridRows.filter(r => r.mosCode || r.modelCode).length}</strong> / {excelGridRows.length}
              </div>
            </div>

          </div>
      </ResizableModal>

      {/* ==================================== MODAL: PDF / PRINT REPORT PREVIEW ==================================== */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-sm font-black text-gray-900 uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                {lang === 'uz' ? 'PDF BO\'YICHA HISOBOT KO\'RINIShI' : 'ПРОСМОТР PDF ОТЧЕТА'}
              </h3>
              <button onClick={() => setIsPrintPreviewOpen(false)} className="text-gray-400 hover:text-gray-900 text-lg font-bold cursor-pointer">✕</button>
            </div>

            {/* Print area */}
            <div className="mt-4 flex-1 overflow-y-auto bg-white p-6 border border-gray-200 rounded-xl" id="printable-area-report">
              <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                <h1 className="text-xl font-black uppercase tracking-wider text-gray-900">
                  {lang === 'uz' ? 'SHOGIRT ERP ISHLAB CHIQARISH HISOBOTI' : 'SHOGIRT ERP ПРОИЗВОДСТВЕННЫЙ ОТЧЕТ'}
                </h1>
                <p className="text-xs text-gray-500">Sana/Дата: {new Date().toLocaleDateString()} | Hamkorlar: {brands.join(', ')}</p>
              </div>

              {/* Table of metrics */}
              <table className="w-full text-left border-collapse text-[11px] mt-6">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700 text-center">
                    <th className="p-2 border-r border-gray-200 text-left">MOS KOD</th>
                    <th className="p-2 border-r border-gray-200 text-left">ARTIKUL (MODEL)</th>
                    <th className="p-2 border-r border-gray-200">BREND</th>
                    <th className="p-2 border-r border-gray-200">RANG</th>
                    <th className="p-2 border-r border-gray-200">1C EMISSIYA</th>
                    <th className="p-2 border-r border-gray-200 font-mono text-[10px]">BUYURTMA</th>
                    <th className="p-2 border-r border-gray-200 font-mono text-[10px]">KESIM</th>
                    <th className="p-2 border-r border-gray-200 font-mono text-[10px]">POTOKDA</th>
                    <th className="p-2 border-r border-gray-200 font-mono text-[10px]">BRAK</th>
                    <th className="p-2 font-mono text-[10px]">QOLDIQ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-center font-medium text-gray-800">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="p-2 border-r border-gray-200 text-left font-bold text-gray-900 font-mono">{o.mosCode}</td>
                      <td className="p-2 border-r border-gray-200 text-left font-mono truncate max-w-[120px]">{o.modelCode}</td>
                      <td className="p-2 border-r border-gray-200 text-left">{o.brandName}</td>
                      <td className="p-2 border-r border-gray-200">{o.color.split(' ')[0]}</td>
                      <td className="p-2 border-r border-gray-200 font-mono text-indigo-700 font-bold">{o.oneCOrderEmission || '-'}</td>
                      <td className="p-2 border-r border-gray-200 font-bold">{o.qtyOrder.toLocaleString()}</td>
                      <td className="p-2 border-r border-gray-200">{o.qtyCut.toLocaleString()}</td>
                      <td className="p-2 border-r border-gray-200">{o.qtyPotok.toLocaleString()}</td>
                      <td className="p-2 border-r border-gray-200 text-red-600">{o.qtyDefect.toLocaleString()}</td>
                      <td className="p-2 font-bold text-indigo-900">{o.qtyRemaining.toLocaleString()}</td>
                    </tr>
                  ))}
                  
                  {/* Totals Row */}
                  <tr className="bg-gray-50 border-t-2 border-gray-300 font-black text-gray-900">
                    <td colSpan={5} className="p-2.5 border-r border-gray-200 text-right uppercase tracking-wider">{lang === 'uz' ? 'JAMI' : 'ИТОГО'}:</td>
                    <td className="p-2.5 border-r border-gray-200">{kpiTotalOrder.toLocaleString()}</td>
                    <td className="p-2.5 border-r border-gray-200">{filteredOrders.reduce((sum, o) => sum + o.qtyCut, 0).toLocaleString()}</td>
                    <td className="p-2.5 border-r border-gray-200 text-emerald-700">{kpiTotalPotok.toLocaleString()}</td>
                    <td className="p-2.5 border-r border-gray-200 text-rose-600">{filteredOrders.reduce((sum, o) => sum + o.qtyDefect, 0).toLocaleString()}</td>
                    <td className="p-2.5 text-indigo-950">{kpiTotalRemaining.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Sizes summary helper inside report */}
              <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-gray-200 text-[10px]">
                <strong className="block text-gray-700 uppercase mb-2">{lang === 'uz' ? 'Qo\'shimcha eslatmalar va muvofiqlik jurnali' : 'Дополнительные примечания и лог соответствия'}</strong>
                <p className="text-gray-500 leading-relaxed">
                  {lang === 'uz' 
                    ? 'Ushbu hisobot real vaqt rejimida Shogirt ERP tizimidan olindi va chop etishga tayyorlandi. Ma\'lumotlarning aniqligi sifat nazorati xizmati tomonidan tasdiqlangan.' 
                    : 'Этот отчет сгенерирован в реальном времени из системы Shogirt ERP и готов к печати. Достоверность данных подтверждена службой контроля качества.'}
                </p>
              </div>
            </div>

            {/* Print trigger actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => setIsPrintPreviewOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 font-bold text-xs cursor-pointer"
              >
                {lang === 'uz' ? 'Yopish' : 'Закрыть'}
              </button>
              <button 
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                {lang === 'uz' ? 'Chop etish (Print / PDF)' : 'Печать (Print / PDF)'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================== MODAL: DYNAMIC ADVANCED DETAILS & PRODUCTION ==================================== */}
      {isDetailModalOpen && selectedOrderDetail && (
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          order={selectedOrderDetail}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedOrderDetail(null);
          }}
          onUpdateOrder={(updatedOrder) => {
            onUpdateOrder(updatedOrder);
          }}
          onDeleteOrder={onDeleteOrder}
          lang={lang}
        />
      )}

      {/* ==================================== MODAL: DELETE CONFIRMATION ==================================== */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  {lang === 'uz' ? "Buyurtmani o'chirish" : "Удаление заказа"}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {orderToDelete.mosCode} ({orderToDelete.modelCode || orderToDelete.brandName})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {lang === 'uz' 
                ? `Siz haqiqatan ham ushbu buyurtmani (${orderToDelete.mosCode}) tizimdan o'chirib tashlamoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.`
                : `Вы действительно хотите удалить этот заказ (${orderToDelete.mosCode})? Это действие нельзя отменить.`}
            </p>

            {/* Password input */}
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
                onClick={() => setOrderToDelete(null)}
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
                    onDeleteOrder(orderToDelete.id);
                  }
                  if (selectedOrderDetail?.id === orderToDelete.id) {
                    setIsDetailModalOpen(false);
                    setSelectedOrderDetail(null);
                  }
                  setOrderToDelete(null);
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
