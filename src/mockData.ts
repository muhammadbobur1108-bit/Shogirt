import { Order, InventoryItem, Customer, DefectItem, PrintTask, AppUser, WarehouseBox, AuditLog } from './types';

export const PRODUCT_TYPES = [
  'T-Shirt (Futbolka)',
  'Polo (Yoqali futbolka)',
  'Hoodie (Xudi/Keng sviter)',
  'Sweatshirt (Svitshot)',
  'Sport shim (Joggers)',
  'Shorti (Kalta shim)',
  'Bolalar kiyimi (Kombinezon)'
];

export const FABRIC_TYPES = [
  'Suprem (100% Paxta, 160g)',
  'Suprem Laykra (95% Paxta, 5% Laykra, 180g)',
  'Interlok (Ikki tomonlama, 220g)',
  'Pike (Lakos, Polo uchun, 200g)',
  'Futra 2-iplik (Pelyushli, 240g)',
  'Futra 3-iplik (Nachesli, 320g)',
  'Ribana (Yoqa va manzhet uchun, 260g)',
  'Kashkorse (Egiluvchan, 280g)'
];

export const COLORS = [
  { name: 'Глубокий черный (Deep Black)', hex: '#1A1A1A' },
  { name: 'Белый (Pure White)', hex: '#FFFFFF' },
  { name: 'Темно-синий (Navy Blue)', hex: '#1E3A8A' },
  { name: 'Серый меланж (Gray Melange)', hex: '#9CA3AF' },
  { name: 'Темно-красный (Бордо)', hex: '#7F1D1D' },
  { name: 'Оливковый (Olive Green)', hex: '#3F6212' },
  { name: 'Желтый (Mustard)', hex: '#D97706' },
  { name: 'Нежно-розовый (Baby Pink)', hex: '#FBCFE8' }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-mos-1',
    orderNumber: 'MOS-525.4',
    mosCode: 'MOS-525.4',
    modelCode: 'SM-OW-1111/160-TA.LMP.OE',
    brandName: 'Texnoavia',
    customerName: 'ООО Техноавиа Москва',
    customerPhone: '+7 (495) 123-45-67',
    productType: 'T-Shirt (Futbolka)',
    fabricType: 'Suprem (100% Paxta, 160g)',
    color: 'Белый (Pure White)',
    colorCode: '#FFFFFF',
    sizes: { 'S': 1000, 'M': 1500, 'L': 1500, 'XL': 1000 },
    totalQuantity: 5000,
    priority: 'shoshilinch',
    inShipmentPlan: true,
    shipmentPlanStatus: 'tayyor',
    shipmentTargetDate: '2026-08-10',
    qtyOrder: 5000,
    qtyCut: 6000,
    qtyPotok: 5400,
    qtyPackaging: 5000,
    qtyDefect: 200,
    qtyRemaining: 0,
    pricePerUnit: 4.5,
    totalAmount: 22500,
    createdAt: '2026-07-20',
    deadline: '2026-08-10',
    status: 'tikuv',
    productionLogs: []
  },
  {
    id: 'ord-mos-2',
    orderNumber: 'MOS-526.1',
    mosCode: 'MOS-526.1',
    modelCode: 'SM-OW-1112/180-ST.COTTON',
    brandName: 'Stark Cotton',
    customerName: 'Stark Group LLC',
    customerPhone: '+998 90 987-65-43',
    productType: 'Polo (Yoqali futbolka)',
    fabricType: 'Pike (Lakos, Polo uchun, 200g)',
    color: 'Темно-синий (Navy Blue)',
    colorCode: '#1E3A8A',
    sizes: { 'M': 800, 'L': 1200, 'XL': 1000 },
    totalQuantity: 3000,
    priority: 'normal',
    inShipmentPlan: true,
    shipmentPlanStatus: 'jarayonda',
    shipmentTargetDate: '2026-08-15',
    qtyOrder: 3000,
    qtyCut: 3500,
    qtyPotok: 3100,
    qtyPackaging: 2800,
    qtyDefect: 120,
    qtyRemaining: 200,
    createdAt: '2026-07-21',
    deadline: '2026-08-15',
    status: 'bichuv',
    productionLogs: []
  },
  {
    id: 'ord-mos-3',
    orderNumber: 'MOS-527.2',
    mosCode: 'MOS-527.2',
    modelCode: 'HD-OW-2200/320-TODOMODA',
    brandName: 'Todomoda',
    customerName: 'Todomoda Fashion',
    customerPhone: '+998 93 111-22-33',
    productType: 'Hoodie (Xudi/Keng sviter)',
    fabricType: 'Futra 3-iplik (Nachesli, 320g)',
    color: 'Глубокий черный (Deep Black)',
    colorCode: '#1A1A1A',
    sizes: { 'L': 1500, 'XL': 1500, '2XL': 1000 },
    totalQuantity: 4000,
    priority: 'shoshilinch',
    inShipmentPlan: true,
    shipmentPlanStatus: 'rejalashtirilgan',
    shipmentTargetDate: '2026-08-12',
    qtyOrder: 4000,
    qtyCut: 4200,
    qtyPotok: 3800,
    qtyPackaging: 3500,
    qtyDefect: 150,
    qtyRemaining: 500,
    createdAt: '2026-07-22',
    deadline: '2026-08-12',
    status: 'tikuv',
    productionLogs: []
  },
  {
    id: 'ord-mos-4',
    orderNumber: 'MOS-528.0',
    mosCode: 'MOS-528.0',
    modelCode: 'SW-OW-3300/240-SAB',
    brandName: 'Sab Collection',
    customerName: 'Sab Store',
    customerPhone: '+998 94 444-55-66',
    productType: 'Sweatshirt (Svitshot)',
    fabricType: 'Futra 2-iplik (Pelyushli, 240g)',
    color: 'Серый меланж (Gray Melange)',
    colorCode: '#9CA3AF',
    sizes: { 'S': 500, 'M': 1000, 'L': 1000 },
    totalQuantity: 2500,
    priority: 'normal',
    qtyOrder: 2500,
    qtyCut: 2700,
    qtyPotok: 2400,
    qtyPackaging: 2200,
    qtyDefect: 80,
    qtyRemaining: 300,
    createdAt: '2026-07-23',
    deadline: '2026-08-18',
    status: 'bichuv',
    productionLogs: []
  },
  {
    id: 'ord-mos-5',
    orderNumber: 'MOS-529.5',
    mosCode: 'MOS-529.5',
    modelCode: 'JG-OW-4400/280-APEX',
    brandName: 'Apex Sport',
    customerName: 'Apex Sport Club',
    customerPhone: '+998 95 880-44-33',
    productType: 'Sport shim (Joggers)',
    fabricType: 'Kashkorse (Egiluvchan, 280g)',
    color: 'Глубокий черный (Deep Black)',
    colorCode: '#1A1A1A',
    sizes: { 'M': 1000, 'L': 1500, 'XL': 1000, '2XL': 1000 },
    totalQuantity: 4500,
    priority: 'shoshilinch',
    qtyOrder: 4500,
    qtyCut: 4800,
    qtyPotok: 4200,
    qtyPackaging: 4000,
    qtyDefect: 110,
    qtyRemaining: 500,
    createdAt: '2026-07-24',
    deadline: '2026-08-08',
    status: 'qadoqlash',
    productionLogs: []
  },
  {
    id: 'ord-mos-6',
    orderNumber: 'MOS-530.3',
    mosCode: 'MOS-530.3',
    modelCode: 'TS-OW-5500/180-PROMO',
    brandName: 'Promo Group',
    customerName: 'Promo Group MCHJ',
    customerPhone: '+998 91 999-88-77',
    productType: 'T-Shirt (Futbolka)',
    fabricType: 'Suprem Laykra (95% Paxta, 5% Laykra, 180g)',
    color: 'Желтый (Mustard)',
    colorCode: '#D97706',
    sizes: { 'S': 1000, 'M': 2000, 'L': 2000 },
    totalQuantity: 5000,
    priority: 'normal',
    qtyOrder: 5000,
    qtyCut: 5200,
    qtyPotok: 4900,
    qtyPackaging: 4800,
    qtyDefect: 90,
    qtyRemaining: 200,
    createdAt: '2026-07-25',
    deadline: '2026-08-20',
    status: 'yangi',
    productionLogs: []
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Klasik Futbolka (Navy Blue)', category: 'fabric', quantity: 450, unit: 'dona', color: 'Темно-синий', minThreshold: 100 },
  { id: 'inv-2', name: 'Klasik Futbolka (Pure White)', category: 'fabric', quantity: 280, unit: 'dona', color: 'Белый', minThreshold: 100 },
  { id: 'inv-3', name: 'Polo Futbolka (Oq)', category: 'fabric', quantity: 150, unit: 'dona', color: 'Белый', minThreshold: 50 },
  { id: 'inv-4', name: 'Oversize Xudi (Deep Black)', category: 'yarn', quantity: 320, unit: 'dona', color: 'Глубокий черный', minThreshold: 80 },
  { id: 'inv-5', name: 'Xudi Kapushonli (Kulrang)', category: 'yarn', quantity: 180, unit: 'dona', color: 'Серый', minThreshold: 50 },
  { id: 'inv-6', name: 'Sport Shim / Joggerlar', category: 'accessories', quantity: 240, unit: 'dona', color: 'Серый', minThreshold: 60 },
  { id: 'inv-7', name: 'Keng Shim (Qora)', category: 'accessories', quantity: 120, unit: 'dona', color: 'Черный', minThreshold: 40 },
  { id: 'inv-8', name: 'Bolalar Kombinezoni', category: 'accessories', quantity: 95, unit: 'dona', color: 'Светло-розовый', minThreshold: 30 }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Asrorbek Jalolov', company: 'Shaxsiy brend', phone: '+998 90 123-45-67', email: 'asror_j@gmail.com', totalOrders: 3, totalSpent: 7420 },
  { id: 'cust-2', name: 'Sardor Rahimjonov', company: 'Oqshom MCHJ', phone: '+998 93 543-21-09', email: 'sardor@oqshom.uz', totalOrders: 1, totalSpent: 3825 },
  { id: 'cust-3', name: 'Lola Karimboyeva', company: 'Kids Fashion LLC', phone: '+998 97 777-11-22', email: 'lola@kidsfashion.uz', totalOrders: 2, totalSpent: 4200 },
  { id: 'cust-4', name: 'Javohir Toshpo\'latov', company: 'Apex Sport', phone: '+998 95 880-44-33', email: 'apex_sport@mail.ru', totalOrders: 5, totalSpent: 12500 },
  { id: 'cust-5', name: 'Bekzod Alimov', company: 'Promo Group', phone: '+998 91 999-88-77', email: 'info@promogroup.uz', totalOrders: 4, totalSpent: 9120 }
];

export const INITIAL_DEFECTS: DefectItem[] = [
  {
    id: 'def-1',
    orderId: 'ord-1',
    orderNumber: 'TX-2026-001',
    productType: 'T-Shirt (Futbolka)',
    defectType: 'tikuv_xatosi',
    quantity: 12,
    reporter: 'Malika Tojiyeva',
    createdAt: '2026-07-15',
    description: 'Yeng choki noto\'g\'ri tikilgani uchun qayta tikuvga berildi',
    actionTaken: 'tuzatildi',
    status: 'Tuzatildi'
  },
  {
    id: 'def-2',
    orderId: 'ord-2',
    orderNumber: 'TX-2026-002',
    productType: 'Hoodie (Xudi/Keng sviter)',
    defectType: 'mato_shikasti',
    quantity: 5,
    reporter: 'Zafar aka',
    createdAt: '2026-07-16',
    description: 'Mato rulonida teshik aniqlandi, yaroqsiz qismlar chiqarib yuborildi',
    actionTaken: 'utilizatsiya',
    status: 'Utilizatsiya'
  },
  {
    id: 'def-3',
    orderId: 'ord-1',
    orderNumber: 'TX-2026-001',
    productType: 'T-Shirt (Futbolka)',
    defectType: 'print_brak',
    quantity: 8,
    reporter: 'Akmal Turg\'unov',
    createdAt: '2026-07-16',
    description: 'Pechat xiralashgan yoki bo\'yoq oqqan',
    actionTaken: 'qayta_bichildi',
    status: 'Jarayonda'
  }
];

export const INITIAL_PRINT_TASKS: PrintTask[] = [
  {
    id: 'prt-1',
    orderId: 'ord-1',
    orderNumber: 'TX-2026-001',
    customerName: 'Asrorbek Jalolov',
    productType: 'T-Shirt (Futbolka)',
    totalQuantity: 1200,
    printType: 'silk-screen',
    printDesignName: 'Logo Asror Front',
    inkColors: ['Oq (White)', 'Qizil (Red)'],
    status: 'bosilmoqda',
    assignedOperator: 'Akmal Turg\'unov',
    completedQty: 420,
    notes: 'Quritgich haroratiga e\'tibor bering, 160 daraja bo\'lsin.'
  },
  {
    id: 'prt-2',
    orderId: 'ord-2',
    orderNumber: 'TX-2026-002',
    customerName: 'Sardor Rahimjonov (Oqshom MCHJ)',
    productType: 'Hoodie (Xudi/Keng sviter)',
    totalQuantity: 450,
    printType: 'termo-trans',
    printDesignName: 'Oqshom Oversize Chest',
    inkColors: ['Silver Reflective'],
    status: 'kutilmoqda',
    assignedOperator: 'Akmal Turg\'unov',
    completedQty: 0,
    notes: 'Termo pressni 15 soniya ushlab turing.'
  }
];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-0',
    username: 'super_admin',
    fullName: 'Супер Админ (Тизим Эгаси)',
    role: 'super_admin',
    phone: '+998 90 000-00-00',
    activeStatus: true,
    pin: '0000',
    allowedTabs: ['dashboard', 'buyurtmalar', 'ombor', 'hisobotlar', 'brak', 'print', 'users', 'settings']
  },
  {
    id: 'usr-1',
    username: 'dilshod_admin',
    fullName: 'Dilshod Rahimjonov',
    role: 'admin',
    phone: '+998 90 999-01-01',
    activeStatus: true,
    pin: '1111',
    allowedTabs: ['dashboard', 'buyurtmalar', 'ombor', 'hisobotlar', 'brak', 'print']
  },
  {
    id: 'usr-2',
    username: 'zafar_cutter',
    fullName: 'Zafar aka Karimov',
    role: 'bichuvchi',
    phone: '+998 93 111-22-33',
    activeStatus: true,
    pin: '2222',
    allowedTabs: ['dashboard', 'buyurtmalar', 'brak']
  },
  {
    id: 'usr-3',
    username: 'malika_tailor',
    fullName: 'Malika Tojiyeva',
    role: 'tikuvchi',
    phone: '+998 94 444-55-66',
    activeStatus: true,
    pin: '3333',
    allowedTabs: ['dashboard', 'buyurtmalar']
  },
  {
    id: 'usr-4',
    username: 'akmal_printer',
    fullName: 'Akmal Turg\'unov',
    role: 'printer',
    phone: '+998 97 888-99-00',
    activeStatus: true,
    pin: '4444',
    allowedTabs: ['dashboard', 'print']
  },
  {
    id: 'usr-5',
    username: 'anvar_store',
    fullName: 'Anvar Toshmatov',
    role: 'omborchi',
    phone: '+998 99 777-33-11',
    activeStatus: true,
    pin: '5555',
    allowedTabs: ['dashboard', 'ombor']
  }
];

export const INITIAL_BOXES: WarehouseBox[] = [
  {
    id: 'box-1',
    boxNumber: 'K-2026-101',
    orderNumber: 'SM-OW-1111/160-TA.LMP.OE',
    modelCode: 'SM-OW-1111/160',
    color: 'Белый (Pure White)',
    size: 'L',
    quantity: 40,
    weightKg: 12.5,
    brandName: 'Texnoavia',
    createdAt: '2026-07-21',
    notes: 'Первая партия упакована'
  },
  {
    id: 'box-2',
    boxNumber: 'K-2026-102',
    orderNumber: 'SM-OW-1111/160-TA.LMP.OE',
    modelCode: 'SM-OW-1111/160',
    color: 'Белый (Pure White)',
    size: 'M',
    quantity: 50,
    weightKg: 14.8,
    brandName: 'Texnoavia',
    createdAt: '2026-07-21',
    notes: 'Контроль качества проверен'
  },
  {
    id: 'box-3',
    boxNumber: 'K-2026-103',
    orderNumber: 'SM-OW-1111/160-SC.LMP.MP',
    modelCode: 'SM-OW-1111/160',
    color: 'Темно-синий (Navy Blue)',
    size: 'XL',
    quantity: 30,
    weightKg: 18.2,
    brandName: 'Stark Cotton',
    createdAt: '2026-07-21',
    notes: 'Толстовка из плотной ткани'
  },
  {
    id: 'box-4',
    boxNumber: 'K-2026-104',
    orderNumber: 'SM-OW-1111/160-SC.LMP.MP',
    modelCode: 'SM-OW-1111/160',
    color: 'Темно-синий (Navy Blue)',
    size: 'M',
    quantity: 30,
    weightKg: 17.5,
    brandName: 'Stark Cotton',
    createdAt: '2026-07-20',
    notes: 'Упаковка вечерней смены'
  },
  {
    id: 'box-5',
    boxNumber: 'K-2026-105',
    orderNumber: 'SM-OW-1111/160-SCMST.LMP',
    modelCode: 'SM-OW-1111/160',
    color: 'Серый меланж (Gray Melange)',
    size: 'XL',
    quantity: 45,
    weightKg: 15.0,
    brandName: 'Todomoda',
    createdAt: '2026-07-20'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-10-14 10:42',
    userName: 'Dilshod Rahimjonov',
    userRole: 'admin',
    department: 'Заказы',
    actionType: 'UPDATE',
    entityName: 'Заказ MOS-525.4',
    entityId: 'ord-mos-1',
    description: "Otgruzka rejasiga qo'shildi va holati 'Tayyor' etib belgilandi",
    oldData: {
      inShipmentPlan: false,
      shipmentPlanStatus: 'kutilmoqda',
      qtyPackaging: 4800
    },
    newData: {
      inShipmentPlan: true,
      shipmentPlanStatus: 'tayyor',
      qtyPackaging: 5000,
      completionPercent: 100
    }
  },
  {
    id: 'log-102',
    timestamp: '2026-10-14 09:30',
    userName: 'Zafar aka Karimov',
    userRole: 'bichuvchi',
    department: 'Раскрой',
    actionType: 'UPDATE',
    entityName: 'Заказ MOS-526.1',
    entityId: 'ord-mos-2',
    description: "Kroy soni yangilandi: 3,200 dan 3,500 donaga oshirildi",
    oldData: {
      qtyCut: 3200,
      raskroySizes: { M: 700, L: 1300, XL: 1200 }
    },
    newData: {
      qtyCut: 3500,
      raskroySizes: { M: 800, L: 1500, XL: 1200 }
    }
  },
  {
    id: 'log-103',
    timestamp: '2026-10-14 08:15',
    userName: 'Malika Tojiyeva',
    userRole: 'tikuvchi',
    department: 'Пошив',
    actionType: 'UPDATE',
    entityName: 'Заказ MOS-527.2',
    entityId: 'ord-mos-3',
    description: "Poshiv 3-potokdan 450 dona Hoodi qabul qilindi",
    oldData: {
      qtyPotok: 3350,
      currentStage: 'sewing'
    },
    newData: {
      qtyPotok: 3800,
      currentStage: 'sewing',
      shiftOperator: '3-brigada'
    }
  },
  {
    id: 'log-104',
    timestamp: '2026-10-13 17:50',
    userName: 'Anvar Toshmatov',
    userRole: 'omborchi',
    department: 'Склад',
    actionType: 'CREATE',
    entityName: 'Складской короб K-2026-105',
    entityId: 'box-5',
    description: "Yangi korobka qadoqlandi: Todomoda XL 45 dona (15 kg)",
    oldData: null,
    newData: {
      boxNumber: 'K-2026-105',
      orderNumber: 'SM-OW-1111/160-SCMST.LMP',
      color: 'Серый меланж',
      size: 'XL',
      quantity: 45,
      weightKg: 15.0
    }
  },
  {
    id: 'log-105',
    timestamp: '2026-10-13 15:20',
    userName: 'Dilshod Rahimjonov',
    userRole: 'admin',
    department: 'Заказы',
    actionType: 'CREATE',
    entityName: 'Заказ MOS-528.0',
    entityId: 'ord-mos-4',
    description: "Yangi buyurtma ro'yxatdan o'tkazildi (Sab Collection - 2,500 dona)",
    oldData: null,
    newData: {
      mosCode: 'MOS-528.0',
      brandName: 'Sab Collection',
      totalQuantity: 2500,
      productType: 'Sweatshirt (Svitshot)',
      fabricType: 'Futra 2-iplik',
      deadline: '2026-08-20'
    }
  },
  {
    id: 'log-106',
    timestamp: '2026-10-13 11:10',
    userName: 'Akmal Turg\'unov',
    userRole: 'printer',
    department: 'Печатных цех',
    actionType: 'UPDATE',
    entityName: 'Печать MOS-525.4',
    entityId: 'prt-1',
    description: "Ipak bosma (Шелкография) holati 'Yakunlandi' etib belgilandi",
    oldData: {
      status: 'bosilmoqda',
      completedQty: 3200
    },
    newData: {
      status: 'yakunlandi',
      completedQty: 5000
    }
  },
  {
    id: 'log-107',
    timestamp: '2026-10-12 16:40',
    userName: 'Dilshod Rahimjonov',
    userRole: 'admin',
    department: 'Брак',
    actionType: 'DELETE',
    entityName: 'Дефект DEF-2026-88',
    entityId: 'def-88',
    description: "Xato kiritilgan brak kartasi o'chirildi",
    oldData: {
      defectType: 'mato_shikasti',
      quantity: 15,
      reporter: 'Malika Tojiyeva',
      status: 'Tuzatildi'
    },
    newData: null
  }
];
