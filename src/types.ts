export type UserRole = 
  | 'super_admin' 
  | 'factory_manager' 
  | 'production_manager' 
  | 'warehouse_manager' 
  | 'cutting_master' 
  | 'sewing_master' 
  | 'printing_dept' 
  | 'embroidery_dept' 
  | 'packaging_dept' 
  | 'qc' 
  | 'accountant' 
  | 'hr' 
  | 'operator' 
  | 'viewer'
  // Backwards compatibility roles
  | 'admin'
  | 'bichuvchi'
  | 'tikuvchi'
  | 'printer'
  | 'omborchi';

export type ProductionStage = 
  | 'order_received'
  | 'fabric_warehouse'
  | 'cutting'
  | 'printing'
  | 'embroidery'
  | 'sewing'
  | 'ironing'
  | 'quality_control'
  | 'packaging'
  | 'finished_goods_warehouse'
  | 'shipping';

export type StageStatus = 'waiting' | 'in_progress' | 'completed' | 'rejected';

export type OrderStatus = 'yangi' | 'bichuv' | 'tikuv' | 'qadoqlash' | 'yakunlandi' | 'bekor_qilindi';

export interface StageProgress {
  stage: ProductionStage;
  status: StageStatus;
  waitingQty: number;
  inProgressQty: number;
  completedQty: number;
  rejectedQty: number;
  remainingQty: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface OrderSizes {
  [sizeKey: string]: number;
}

export interface OrderColorVariant {
  color: string;
  colorCode?: string;
  sizes: OrderSizes;
  qtyOrder: number;
  qtyCut: number;
  qtyPotok: number;
  qtyPackaging: number;
  raskroySizes?: { [size: string]: number };
  poshivSizes?: { [size: string]: number };
  upakovkaSizes?: { [size: string]: number };
}

export interface OrderIssue {
  id: string;
  orderId?: string;
  orderNumber?: string;
  mosCode?: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  text: string;
  imageUrl?: string;
  status: 'open' | 'resolved';
}

export interface Order {
  id: string;
  orderNumber: string;
  mosCode: string; // e.g., 'MOS-539.7.1 SZ'
  modelCode: string; // e.g., 'SM-OW-1111/160-TA.LMP.OE'
  brandName: string; // e.g., 'Stark Cotton', 'Texnoavia', 'Todomoda', 'Sab collection'
  customerName: string;
  customerPhone: string;
  productType: string;
  fabricType: string;
  color: string;
  colorCode: string;
  colorVariants?: OrderColorVariant[];
  sizes: OrderSizes;
  totalQuantity: number;
  
  priority: 'past' | 'normal' | 'shoshilinch';
  
  // Production metrics
  qtyOrder: number;      // buyurtma soni
  qtyCut: number;        // kesim (kroy)
  qtyPotok: number;      // potoklarga berilgan
  qtyPackaging: number;  // qadoqlash
  qtyDefect: number;     // brak
  qtyRemaining: number;  // qoldiq
  
  pricePerUnit?: number; // USD or UZS
  totalAmount?: number;  // total order value
  advancePayment?: number; // advance payment
  createdAt: string;
  deadline: string;
  status: OrderStatus;
  currentStage?: ProductionStage;
  stageProgresses?: StageProgress[];
  
  // Shipment plan status (Planga zakazi bo'limidan ptichka orqali qo'yish)
  inShipmentPlan?: boolean;
  shipmentPlanStatus?: 'rejalashtirilgan' | 'jarayonda' | 'tayyor' | 'otgruzka_qilindi';
  shipmentTargetDate?: string;
  
  notes?: string;
  productionLogs: ProductionLog[];
  printRequired?: boolean;
  printName?: string;
  printDetails?: string;
  printStatus?: 'kutilmoqda' | 'bosilmoqda' | 'yakunlandi';
  vishivkaName?: string;
  oneCOrderEmission?: string; // 1C заказ на эмиссию

  // Size-by-size production metrics
  raskroySizes?: { [size: string]: number };
  razdachaSizes?: { [size: string]: number };
  poshivSizes?: { [size: string]: number };
  upakovkaSizes?: { [size: string]: number };
  upakovkaBoxSizes?: { [size: string]: number };
  upakovkaBagSizes?: { [size: string]: number };
  upakovkaPackSizes?: { [size: string]: number };
  brakSizes?: { [size: string]: number };
  otkSizes?: { [size: string]: number };
  otkIsReady?: boolean;
  oneCBarcodes?: string[];
  oneCArticles?: string[];

  // Upakovka details
  upakovkaType?: string; // e.g., "korobka" | "meshok"
  upakovkaPackage?: string; // e.g., "paket"
  upakovkaTypeDetails?: string; // e.g., "tip upakovki"

  // Other modules
  vishivkaDetails?: string;
  vishivkaStatus?: string;
  otkStatus?: string;
  otkConfirmedBy?: string;
  otkConfirmedAt?: string;
  otkSizeMDetails?: string;
  projectOwnerName?: string;
  projectOwnerPhone?: string;
  issues?: OrderIssue[];
}

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string or format "DD.MM.YYYY HH:mm"
  userName: string;
  userRole?: string;
  department: 'Заказы' | 'Раскрой' | 'Пошив' | 'Упаковка' | 'Склад' | 'Печатных цех' | 'Брак' | 'Система' | string;
  actionType: AuditActionType;
  entityName: string; // e.g. "Заказ MOS-525.4" or "Складской бокс K-101"
  entityId: string;
  description: string;
  oldData?: Record<string, any> | string | null;
  newData?: Record<string, any> | string | null;
}

export interface ProductionLog {
  id: string;
  stage: OrderStatus | ProductionStage;
  operator: string;
  updatedAt: string;
  note: string;
  completedQty?: number;
}

export type WarehouseCategory = 
  | 'fabric' 
  | 'accessories' 
  | 'labels' 
  | 'boxes' 
  | 'threads' 
  | 'buttons' 
  | 'zippers' 
  | 'elastic' 
  | 'poly_bags'
  | 'yarn';

export interface InventoryItem {
  id: string;
  name: string;
  category: WarehouseCategory;
  quantity: number;
  unit: 'kg' | 'dona' | 'rulon' | 'metr' | 'quti' | 'pachka';
  color?: string;
  barcode?: string;
  minThreshold: number; // warning level
  unitPriceUsd?: number;
  location?: string;
  lastRestocked?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
}

export interface FabricCalculatorResult {
  productType: string;
  quantity: number;
  avgWeightPerUnit: number; // kg per unit (e.g., 0.18kg for T-shirt)
  wastagePercent: number; // e.g. 10%
  totalFabricNeeded: number; // kg
  ribanaNeeded: number; // kg for collars
  yarnNeeded: number; // yarn estimate
}

export type DefectCategory = 
  | 'needle_hole'
  | 'wrong_stitch'
  | 'wrong_print'
  | 'wrong_embroidery'
  | 'color_diff'
  | 'missing_label'
  | 'broken_seam'
  | 'other'
  | 'mato_shikasti'
  | 'tikuv_xatosi'
  | 'olcham_farqi'
  | 'print_brak'
  | 'boshqa';

export interface DefectItem {
  id: string;
  orderId: string;
  orderNumber: string;
  productType: string;
  defectType: DefectCategory;
  quantity: number;
  reporter: string;
  responsibleWorker?: string;
  department?: string;
  createdAt: string;
  description: string;
  actionTaken: string; // e.g. 'qayta_bichildi', 'tuzatildi', 'utilizatsiya'
  photoUrl?: string;
  status: 'Ochq' | 'Jarayonda' | 'Tuzatildi' | 'Utilizatsiya';
}

export interface PrintTask {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  productType: string;
  totalQuantity: number;
  printType: 'silk-screen' | 'sublimatsiya' | 'termo-trans' | 'nakleyka';
  printDesignName: string;
  inkColors: string[];
  status: 'kutilmoqda' | 'tayyorlanmoqda' | 'bosilmoqda' | 'yakunlandi';
  assignedOperator: string;
  completedQty: number;
  notes?: string;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone: string;
  activeStatus: boolean;
  pin: string; // Simple login pin/password
  department?: string;
  email?: string;
  allowedTabs?: string[]; // IDs of tabs this user is permitted to view
}

export interface WarehouseBox {
  id: string;
  boxNumber: string;      // Korobka raqami (e.g., K-001)
  orderNumber: string;    // Buyurtma (or ID)
  modelCode: string;      // Model
  color: string;          // Rangi
  size: string;           // Razmeri
  quantity: number;       // Soni (dona)
  weightKg: number;       // Og'irligi (kg)
  brandName: string;      // Brend
  createdAt: string;      // Yaralgan sanasi (e.g. 2026-07-21)
  barcode?: string;
  qrCode?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  role: UserRole;
  department: string;
  phone: string;
  baseSalary: number; // UZS or USD
  status: 'active' | 'on_leave' | 'terminated';
  joinDate: string;
  contractNumber: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  workingHours: number;
  overtimeHours: number;
  status: 'present' | 'late' | 'absent' | 'on_leave';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string; // YYYY-MM
  baseSalary: number;
  bonuses: number;
  penalties: number;
  netPayable: number;
  status: 'pending' | 'approved' | 'paid';
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  createdAt: string;
  read: boolean;
  channel?: 'telegram' | 'system' | 'email';
  orderId?: string;
  statusTo?: string;
}



