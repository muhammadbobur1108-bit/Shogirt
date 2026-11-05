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

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_DEFECTS: DefectItem[] = [];

export const INITIAL_PRINT_TASKS: PrintTask[] = [];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-owner',
    username: 'muhammadbobur',
    fullName: 'Muhammad Bobur (Tizim Egasi)',
    role: 'super_admin',
    phone: '+998 90 110-08-08',
    email: 'muhammadbobur1108@gmail.com',
    activeStatus: true,
    pin: '1108',
    password: 'admin',
    allowedTabs: ['dashboard', 'buyurtmalar', 'ombor', 'hisobotlar', 'brak', 'print', 'users', 'settings', 'nakladnoy', 'labels', 'telemetry', 'tarix']
  },
  {
    id: 'usr-0',
    username: 'super_admin',
    fullName: 'Супер Админ (Владелец)',
    role: 'super_admin',
    phone: '+998 90 000-00-00',
    activeStatus: true,
    pin: '0000',
    password: 'admin',
    allowedTabs: ['dashboard', 'buyurtmalar', 'ombor', 'hisobotlar', 'brak', 'print', 'users', 'settings', 'nakladnoy', 'labels', 'telemetry', 'tarix']
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

export const INITIAL_BOXES: WarehouseBox[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
