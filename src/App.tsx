import React, { useState, useEffect } from 'react';
import { 
  Order, 
  InventoryItem, 
  Customer, 
  DefectItem, 
  PrintTask, 
  AppUser, 
  WarehouseBox,
  AuditLog,
  AuditActionType,
  SystemNotification
} from './types';
import { 
  INITIAL_ORDERS, 
  INITIAL_INVENTORY, 
  INITIAL_CUSTOMERS,
  INITIAL_DEFECTS,
  INITIAL_PRINT_TASKS,
  INITIAL_USERS,
  INITIAL_BOXES,
  INITIAL_AUDIT_LOGS
} from './mockData';

import { TRANSLATIONS, Language } from './locales';

// Views
import DashboardView from './components/DashboardView';
import OrdersView from './components/OrdersView';
import InventoryView from './components/InventoryView';
import PrintShopView from './components/PrintShopView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import ReportsView from './components/ReportsView';
import DefectsView from './components/DefectsView';
import HistoryView from './components/HistoryView';
import NakladnoyView from './components/NakladnoyView';
import BarcodeLabelsView from './components/BarcodeLabelsView';
import TexLogo from './components/TexLogo';
import InteractiveTelemetryHub from './components/InteractiveTelemetryHub';
import NotificationCenter from './components/NotificationCenter';
import { checkCurrentSession, logoutUser, getAuthHeaders } from './lib/authClient';

// Icons
import { 
  Layers, 
  LayoutDashboard, 
  ShoppingBag, 
  Calculator, 
  Package, 
  Users, 
  Calendar,
  Sparkles,
  Info,
  BarChart3, 
  AlertTriangle, 
  Printer, 
  Settings as SettingsIcon, 
  LogOut, 
  Globe, 
  Lock, 
  Trash2, 
  RotateCcw, 
  Clock,
  History,
  FileSpreadsheet,
  Barcode,
  Activity
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<string>('nakladnoy');
  
  // App States
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [defects, setDefects] = useState<DefectItem[]>(INITIAL_DEFECTS);
  const [printTasks, setPrintTasks] = useState<PrintTask[]>(INITIAL_PRINT_TASKS);
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('chust_erp_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load users from storage:', e);
    }
    return INITIAL_USERS;
  });
  const [boxes, setBoxes] = useState<WarehouseBox[]>(INITIAL_BOXES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  
  // Auth state: Strictly check session or remembered device via HttpOnly cookies and server verification
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function verifyBackendSession() {
      try {
        const res = await checkCurrentSession();
        if (isMounted) {
          if (res.authenticated && res.user) {
            setCurrentUser(res.user);
          } else {
            // Also check client cache if server is restarting or offline
            try {
              const sess = sessionStorage.getItem('chust_erp_session_user');
              const rem = localStorage.getItem('chust_erp_remembered_user');
              const userObj = sess ? JSON.parse(sess) : (rem ? JSON.parse(rem) : null);
              if (userObj && userObj.id) {
                setCurrentUser(userObj);
              } else {
                setCurrentUser(null);
              }
            } catch {
              setCurrentUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }
    verifyBackendSession();
    return () => { isMounted = false; };
  }, []);

  // Cross-tab order routing state
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Notification Center & Toast states
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const [toasts, setToasts] = useState<SystemNotification[]>([]);

  const addNotification = (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'alert' = 'info',
    statusTo?: string,
    orderId?: string
  ) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      createdAt: lang === 'ru' ? 'Только что' : 'Hozirgina',
      read: false,
      statusTo,
      orderId
    };

    setNotifications(prev => [newNotif, ...prev]);
    setToasts(prev => [newNotif, ...prev.slice(0, 2)]);

    // Auto-dismiss toast after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 4500);
  };

  // Live Clock State
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${dd}/${mm}/${yyyy} ${hh}:${min}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to log audit transactions into auditLogs (Supabase audit_logs)
  const logAudit = (
    actionType: AuditActionType,
    department: string,
    entityName: string,
    entityId: string,
    description: string,
    oldData?: any,
    newData?: any
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: currentTimeStr || new Date().toISOString().replace('T', ' ').slice(0, 16),
      userName: currentUser?.fullName || 'Tizim administratori',
      userRole: currentUser?.role,
      department,
      actionType,
      entityName,
      entityId,
      description,
      oldData: oldData ?? null,
      newData: newData ?? null
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper to strictly check tab permissions
  const isTabAllowedForUser = (tabId: string, user: AppUser | null) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (tabId === 'tarix' || tabId === 'nakladnoy' || tabId === 'labels' || tabId === 'telemetry') return true;
    if (user.allowedTabs && user.allowedTabs.length > 0) {
      return user.allowedTabs.includes(tabId);
    }
    // Fallback if allowedTabs is not set
    if (tabId === 'dashboard') return true;
    if (user.role === 'admin' && tabId !== 'settings') return true;
    return false;
  };

  // Guard activeTab when currentUser changes or if an unallowed tab is active
  useEffect(() => {
    if (currentUser && !isTabAllowedForUser(activeTab, currentUser)) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // 0-reset and Demo reload handlers
  const handleResetAllData = () => {
    setOrders([]);
    setInventory([]);
    setCustomers([]);
    setDefects([]);
    setPrintTasks([]);
    setBoxes([]);
    setSelectedOrderForModal(null);
    logAudit('DELETE', 'Система', 'Все разделы', 'all', 'Barcha bo\'limlar 0 dan tozalandi', null, null);
  };

  const handleLoadDemoData = () => {
    setOrders(INITIAL_ORDERS);
    setInventory(INITIAL_INVENTORY);
    setCustomers(INITIAL_CUSTOMERS);
    setDefects(INITIAL_DEFECTS);
    setPrintTasks(INITIAL_PRINT_TASKS);
    setBoxes(INITIAL_BOXES);
    logAudit('CREATE', 'Система', 'Демо данные', 'demo', 'Namuna ma\'lumotlar qayta yuklandi', null, null);
  };

  // Handlers
  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);

    // Automatically update customer metrics
    setCustomers(prevCustomers => {
      return prevCustomers.map(cust => {
        if (cust.name.toLowerCase() === newOrder.customerName.toLowerCase()) {
          return {
            ...cust,
            totalOrders: cust.totalOrders + 1,
            totalSpent: cust.totalSpent + (newOrder.totalAmount || 0)
          };
        }
        return cust;
      });
    });

    // If order needs printing, automatically add to printing queue
    if (newOrder.printRequired) {
      const newPrintTask: PrintTask = {
        id: `prt-${Date.now()}`,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        productType: newOrder.productType,
        totalQuantity: newOrder.totalQuantity,
        printType: 'silk-screen',
        printDesignName: `Dizayn ${newOrder.orderNumber}`,
        inkColors: ['Standart'],
        status: 'kutilmoqda',
        assignedOperator: 'Akmal Turg\'unov',
        completedQty: 0,
        notes: newOrder.printDetails || ''
      };
      setPrintTasks(prev => [newPrintTask, ...prev]);
    }

    // Trigger Notification & Toast
    addNotification(
      lang === 'ru' ? "Новый Заказ Принят 📥" : "Yangi Buyurtma Qabul Qilindi 📥",
      lang === 'ru'
        ? `Заказ "${newOrder.brandName}" (${newOrder.totalQuantity.toLocaleString()} шт) успешно зарегистрирован.`
        : `"${newOrder.brandName}" buyurtmasi (${newOrder.totalQuantity.toLocaleString()} dona) muvaffaqiyatli ro'yxatga olindi.`,
      'info',
      newOrder.status,
      newOrder.id
    );

    logAudit(
      'CREATE', 
      'Заказы', 
      `Заказ ${newOrder.mosCode || newOrder.orderNumber}`, 
      newOrder.id, 
      lang === 'ru'
        ? `Создан новый заказ: ${newOrder.brandName} (${newOrder.totalQuantity.toLocaleString()} шт)`
        : `Yangi buyurtma yaratildi: ${newOrder.brandName} (${newOrder.totalQuantity.toLocaleString()} dona)`,
      null,
      newOrder
    );
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    const oldOrder = orders.find(o => o.id === updatedOrder.id);
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    // Status Change Tracking for Notification Center & Toasts
    const brand = updatedOrder.brandName || updatedOrder.modelCode || (lang === 'ru' ? 'Заказ' : 'Buyurtma');
    
    // Check if status changed to 'Tayyor' / 'yakunlandi'
    const isNowTayyor = 
      (updatedOrder.status === 'yakunlandi' && oldOrder?.status !== 'yakunlandi') ||
      (updatedOrder.shipmentPlanStatus === 'tayyor' && oldOrder?.shipmentPlanStatus !== 'tayyor') ||
      (updatedOrder.qtyPackaging >= updatedOrder.qtyOrder && updatedOrder.qtyOrder > 0 && (!oldOrder || oldOrder.qtyPackaging < oldOrder.qtyOrder));

    if (isNowTayyor) {
      addNotification(
        lang === 'ru' ? "Заказ Готов! 🎉" : "Buyurtma Tayyor Bo'ldi! 🎉",
        lang === 'ru'
          ? `Заказ "${brand}" готов на 100% и подготовлен к отгрузке.`
          : `"${brand}" buyurtmasi 100% tayyor holatga o'tdi va jo'natishga tayyorlandi.`,
        'success',
        'tayyor',
        updatedOrder.id
      );
    } else if (oldOrder && updatedOrder.status !== oldOrder.status) {
      const statusLabelsRu: Record<string, string> = {
        yangi: 'Новый',
        bichuv: 'Раскрой',
        tikuv: 'Пошив',
        qadoqlash: 'Упаковка',
        yakunlandi: 'Готов (Завершен)',
        bekor_qilindi: 'Отменен'
      };
      const statusLabelsUz: Record<string, string> = {
        yangi: 'Yangi',
        bichuv: 'Bichuv',
        tikuv: 'Tikuv',
        qadoqlash: 'Qadoqlash',
        yakunlandi: 'Tayyor (Yakunlandi)',
        bekor_qilindi: 'Bekor qilindi'
      };
      const stageName = lang === 'ru' ? (statusLabelsRu[updatedOrder.status] || updatedOrder.status) : (statusLabelsUz[updatedOrder.status] || updatedOrder.status);
      addNotification(
        lang === 'ru' ? `Статус изменен: ${stageName}` : `Holat o'zgardi: ${stageName}`,
        lang === 'ru' ? `"${brand}" переведен на этап "${stageName}".` : `"${brand}" buyurtmasi ${stageName} bosqichiga o'tkazildi.`,
        'info',
        updatedOrder.status,
        updatedOrder.id
      );
    } else if (oldOrder && updatedOrder.shipmentPlanStatus !== oldOrder.shipmentPlanStatus && updatedOrder.shipmentPlanStatus) {
      addNotification(
        lang === 'ru' ? `Статус отгрузки: ${updatedOrder.shipmentPlanStatus.toUpperCase()}` : `Otgruzka holati: ${updatedOrder.shipmentPlanStatus.toUpperCase()}`,
        lang === 'ru' ? `Обновлен статус плана отгрузки заказа "${brand}".` : `"${brand}" buyurtmasining jo'natish rejasi holati o'zgartirildi.`,
        'info',
        updatedOrder.shipmentPlanStatus,
        updatedOrder.id
      );
    }

    logAudit(
      'UPDATE',
      'Заказы',
      `Заказ ${updatedOrder.mosCode || updatedOrder.orderNumber}`,
      updatedOrder.id,
      updatedOrder.inShipmentPlan && !oldOrder?.inShipmentPlan
        ? `Otgruzka rejasiga qo'shildi (${updatedOrder.shipmentPlanStatus || 'rejalashtirilgan'})`
        : `Buyurtma ko'rsatkichlari yangilandi`,
      oldOrder ? { qtyCut: oldOrder.qtyCut, qtyPotok: oldOrder.qtyPotok, qtyPackaging: oldOrder.qtyPackaging, inShipmentPlan: oldOrder.inShipmentPlan } : null,
      { qtyCut: updatedOrder.qtyCut, qtyPotok: updatedOrder.qtyPotok, qtyPackaging: updatedOrder.qtyPackaging, inShipmentPlan: updatedOrder.inShipmentPlan, shipmentPlanStatus: updatedOrder.shipmentPlanStatus }
    );
  };

  const handleDeleteOrder = (id: string) => {
    const target = orders.find(o => o.id === id);
    setOrders(prev => prev.filter(o => o.id !== id));
    logAudit(
      'DELETE',
      'Заказы',
      `Заказ ${target?.mosCode || id}`,
      id,
      `Buyurtma tizimdan o'chirildi`,
      target,
      null
    );
  };

  const handleUpdateInventory = (updatedItems: InventoryItem[]) => {
    setInventory(updatedItems);
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
  };

  const handleAddDefect = (newDefect: DefectItem) => {
    setDefects(prev => [newDefect, ...prev]);
    logAudit('CREATE', 'Брак', `Дефект ${newDefect.orderNumber}`, newDefect.id, `Brak qayd etildi (${newDefect.quantity} dona)`, null, newDefect);
  };

  const handleRemoveDefect = (id: string) => {
    const def = defects.find(d => d.id === id);
    setDefects(prev => prev.filter(d => d.id !== id));
    logAudit('DELETE', 'Брак', `Дефект ${def?.orderNumber || id}`, id, `Brak yozuvi o'chirildi`, def, null);
  };

  const handleAddPrintTask = (newTask: PrintTask) => {
    setPrintTasks(prev => [newTask, ...prev]);
  };

  const handleUpdatePrintTask = (updatedTask: PrintTask) => {
    setPrintTasks(prev => prev.map(pt => pt.id === updatedTask.id ? updatedTask : pt));
  };

  const handleAddUser = (newUser: AppUser) => {
    setUsers(prev => {
      const updated = [...prev, newUser];
      try {
        localStorage.setItem('chust_erp_users', JSON.stringify(updated));
      } catch (e) {
        console.warn('Storage error on user add:', e);
      }
      return updated;
    });
    logAudit('CREATE', 'Система', `Пользователь ${newUser.fullName}`, newUser.id, `Yangi xodim qo'shildi (${newUser.role})`, null, newUser);
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    const oldU = users.find(u => u.id === updatedUser.id);
    setUsers(prev => {
      const updated = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
      try {
        localStorage.setItem('chust_erp_users', JSON.stringify(updated));
      } catch (e) {
        console.warn('Storage error on user update:', e);
      }
      return updated;
    });
    // Keep active session in sync if current user's profile or permissions changed
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      try {
        sessionStorage.setItem('chust_erp_session_user', JSON.stringify(updatedUser));
        if (localStorage.getItem('chust_erp_remembered_user')) {
          localStorage.setItem('chust_erp_remembered_user', JSON.stringify(updatedUser));
        }
      } catch {}
    }
    logAudit('UPDATE', 'Система', `Пользователь ${updatedUser.fullName}`, updatedUser.id, `Foydalanuvchi ma'lumotlari yangilandi`, oldU, updatedUser);
  };

  const handleDeleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      try {
        localStorage.setItem('chust_erp_users', JSON.stringify(updated));
      } catch (e) {
        console.warn('Storage error on user delete:', e);
      }
      return updated;
    });
    if (target) {
      logAudit('DELETE', 'Система', `Пользователь ${target.fullName}`, id, `Xodim tizimdan o'chirildi`, target, null);
    }
  };

  const handleDashboardOrderSelect = (order: Order) => {
    setSelectedOrderForModal(order);
    setActiveTab('buyurtmalar');
  };

  const handleSelectOrderById = (orderId: string) => {
    const target = orders.find(o => o.id === orderId);
    if (target) {
      setSelectedOrderForModal(target);
    }
    setActiveTab('buyurtmalar');
  };

  const handleSimulateStatusChange = () => {
    const target = orders[0];
    if (target) {
      handleUpdateOrder({
        ...target,
        status: 'yakunlandi',
        shipmentPlanStatus: 'tayyor',
        qtyPackaging: target.qtyOrder
      });
    } else {
      addNotification(
        lang === 'ru' ? "Заказ Готов к Отгрузке! 🎉" : "Buyurtma Tayyor Bo'ldi! 🎉",
        lang === 'ru'
          ? "Заказ LC Waikiki (Футболка Поло) готов на 100% и подготовлен к отгрузке."
          : "LC Waikiki (Polo futbolka) buyurtmasi 100% tayyor holatga o'tdi va jo'natishga tayyorlandi.",
        'success',
        'tayyor'
      );
    }
  };

  const handleLoginSuccess = (user: AppUser, rememberMe?: boolean) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('chust_erp_session_user', JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem('chust_erp_remembered_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('chust_erp_remembered_user');
      }
    } catch (e) {
      console.warn('Storage error on login:', e);
    }

    logAudit('CREATE', 'Тизим', `Кириш: ${user.fullName}`, user.id, `Foydalanuvchi tizimga kirdi (${user.role})`, null, null);
    addNotification(
      lang === 'ru' ? `Добро пожаловать, ${user.fullName}!` : `Xush kelibsiz, ${user.fullName}!`,
      lang === 'ru' ? 'Вы успешно авторизовались в системе.' : 'Tizimga muvaffaqiyatli kirdingiz.',
      'success'
    );

    // Sync users to backend if administrator
    if (user.role === 'super_admin' || user.role === 'admin') {
      fetch('/api/auth/sync-users', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ users }),
      }).catch(e => console.warn('User sync error:', e));
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      logAudit('DELETE', 'Тизим', `Чиқиш: ${currentUser.fullName}`, currentUser.id, `Foydalanuvchi tizimdan chiqdi`, null, null);
    }
    await logoutUser();
    setCurrentUser(null);
  };

  // While verifying cryptographic HttpOnly session cookie on load
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <TexLogo size="lg" variant="light" />
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-5 py-2.5 rounded-2xl text-cyan-400 font-mono text-xs shadow-xl">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>XAVFSIZ SESSIYA TEKSHIRILMOQDA (256-BIT SSL)...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display login flow
  if (!currentUser) {
    return (
      <LoginView 
        users={users.filter(u => u.activeStatus)} 
        onLoginSuccess={handleLoginSuccess} 
        lang={lang} 
        onLanguageChange={setLang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-gray-100" id="erp-root-layout">
      
      {/* 1. TOP HEADER BRAND WITH NEW LOGO */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md" id="erp-header">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          
          {/* New Custom Brand & Logo */}
          <TexLogo size="md" variant="light" />

          {/* User profile & controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">

            {/* Quick Live Telemetry HUD Switch */}
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                activeTab === 'telemetry'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60'
              }`}
              title="Kiber Telemetriya & Sex IoT (HUD)"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">🛰️ HUD</span>
              <span className="text-[9px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase animate-pulse">
                LIVE
              </span>
            </button>

            {/* Notification Center with Bell & Toast dock */}
            <NotificationCenter 
              notifications={notifications}
              toasts={toasts}
              onDismissToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
              onMarkAllAsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, read: true }) : n))}
              onClearAll={() => { setNotifications([]); setToasts([]); }}
              onSelectOrder={handleSelectOrderById}
              lang={lang}
              onSimulateStatusChange={handleSimulateStatusChange}
            />

            <div className="hidden md:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse" />
              <span className="text-slate-200 font-bold">{currentUser.fullName}</span>
              <span className="text-[10px] bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-extrabold px-2 py-0.5 rounded-md uppercase">
                {t[currentUser.role as keyof typeof t] || currentUser.role}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
              title={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 max-w-full w-full mx-auto px-3 sm:px-6 py-4 flex flex-col lg:flex-row gap-5" id="workspace-grid">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="lg:w-64 shrink-0 flex flex-col space-y-2.5" id="sidebar-navigation">
          
          {/* Top Clock Pill: "день/месяц/год час" */}
          <div className="bg-black text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-2xl shadow-lg border border-slate-800 text-center flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono tracking-tight">{currentTimeStr || "день/месяц/год час"}</span>
          </div>

          {(() => {
            // Note: 'users' and 'history' are integrated directly inside 'settings'
            const allSidebarTabs = [
              { id: 'telemetry', label: 'Телеметрия (HUD)', icon: Activity, count: 'LIVE', countColor: 'bg-cyan-500 text-slate-950 font-black' },
              { id: 'dashboard', label: 'Дашборд производства', icon: LayoutDashboard },
              { id: 'buyurtmalar', label: 'Заказы', icon: ShoppingBag, count: orders.filter(o => o.status !== 'yakunlandi' && o.status !== 'bekor_qilindi').length },
              { id: 'nakladnoy', label: 'Накладная (Честный Знак)', icon: FileSpreadsheet, countColor: 'bg-cyan-500 text-white' },
              { id: 'labels', label: 'Этикетки / Штрихкоды', icon: Barcode, countColor: 'bg-emerald-500 text-white' },
              { id: 'ombor', label: 'Склад готовой продукции', icon: Package, count: inventory.filter(i => i.quantity <= i.minThreshold).length, countColor: 'bg-rose-500 text-white' },
              { id: 'hisobotlar', label: 'Отчеты и Аналитика', icon: BarChart3 },
              { id: 'brak', label: 'Брак (Контроль ОТК)', icon: AlertTriangle, count: defects.length, countColor: 'bg-amber-500 text-black' },
              { id: 'print', label: 'Печатный и Вышивальный цех', icon: Printer, count: printTasks.filter(pt => pt.status !== 'yakunlandi').length },
              { id: 'settings', label: 'Настройки системы', icon: SettingsIcon }
            ];

            const visibleTabs = allSidebarTabs.filter(tab => isTabAllowedForUser(tab.id, currentUser));

            return visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'buyurtmalar') setSelectedOrderForModal(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-xs sm:text-sm font-black rounded-2xl border transition-all duration-150 cursor-pointer shadow-md ${
                    isActive 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/40 transform translate-x-1 ring-2 ring-blue-400/50' 
                      : 'bg-black text-white border-slate-900 hover:bg-slate-900 hover:text-amber-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>

                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ml-1 ${tab.countColor || 'bg-blue-500 text-white'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            });
          })()}
        </aside>

        {/* WORKSPACE VIEWS CONTAINER */}
        <main className="flex-1 min-w-0 flex flex-col space-y-4" id="main-content-display">
          
          {/* Top Banner: "новости" */}
          <div className="bg-black text-white px-6 py-2.5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between font-extrabold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping shrink-0" />
              <span className="text-amber-300">новости:</span>
            </div>
            <div className="overflow-hidden whitespace-nowrap text-slate-200 font-bold normal-case text-xs">
              <span>🚀 Система Shogirt ERP: План отгрузок, Интерактивная телеметрия (IoT), Интеграция 1С и Честный Знак активны!</span>
            </div>
          </div>

          {activeTab === 'telemetry' && (
            <InteractiveTelemetryHub 
              orders={orders}
              inventory={inventory}
              defects={defects}
              printTasks={printTasks}
              boxes={boxes}
              auditLogs={auditLogs}
              lang={lang}
              onNavigateToTab={setActiveTab}
              onSelectOrder={handleDashboardOrderSelect}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView 
              orders={orders} 
              inventory={inventory} 
              defects={defects}
              printTasks={printTasks}
              boxes={boxes}
              auditLogs={auditLogs}
              onNavigateToTab={setActiveTab}
              onSelectOrder={handleDashboardOrderSelect}
              onUpdateOrder={handleUpdateOrder}
              lang={lang}
            />
          )}

          {activeTab === 'buyurtmalar' && (
            <OrdersView 
              orders={orders}
              customers={customers}
              onAddOrder={handleAddOrder}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
              selectedOrderFromDashboard={selectedOrderForModal}
              onClearSelectedOrder={() => setSelectedOrderForModal(null)}
              currentUser={currentUser}
              lang={lang}
            />
          )}

          {activeTab === 'nakladnoy' && (
            <NakladnoyView 
              currentUser={currentUser}
              onLogAudit={(actionType, entityName, entityId, desc, oldData, newData) => {
                logAudit(actionType, "Ombor / Nakladnoy", entityName, entityId, desc, oldData, newData);
              }}
            />
          )}

          {activeTab === 'labels' && (
            <BarcodeLabelsView />
          )}

          {activeTab === 'ombor' && (
            <InventoryView 
              inventory={inventory}
              onUpdateInventory={handleUpdateInventory}
              boxes={boxes}
              onUpdateBoxes={setBoxes}
              orders={orders}
              currentUser={currentUser}
              lang={lang}
            />
          )}

          {activeTab === 'hisobotlar' && (
            <ReportsView 
              orders={orders}
              inventory={inventory}
              defects={defects}
              lang={lang}
            />
          )}

          {activeTab === 'tarix' && (
            <SettingsView 
              lang={lang} 
              onChangeLanguage={setLang} 
              langList={['ru', 'uz']} 
              onResetAllData={handleResetAllData}
              onLoadDemoData={handleLoadDemoData}
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              currentUser={currentUser}
              orders={orders}
              inventory={inventory}
              customers={customers}
              defects={defects}
              printTasks={printTasks}
              boxes={boxes}
              auditLogs={auditLogs}
            />
          )}

          {activeTab === 'brak' && (
            <DefectsView 
              defects={defects}
              orders={orders}
              onAddDefect={handleAddDefect}
              onRemoveDefect={handleRemoveDefect}
              lang={lang}
            />
          )}

          {activeTab === 'print' && (
            <PrintShopView 
              printTasks={printTasks} 
              orders={orders} 
              onAddPrintTask={handleAddPrintTask} 
              onUpdatePrintTask={handleUpdatePrintTask} 
              onDeletePrintTask={(id) => setPrintTasks(prev => prev.filter(pt => pt.id !== id))}
              currentUser={currentUser}
              lang={lang} 
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              lang={lang} 
              onChangeLanguage={setLang} 
              langList={['uz', 'ru']} 
              onResetAllData={handleResetAllData}
              onLoadDemoData={handleLoadDemoData}
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              currentUser={currentUser}
              orders={orders}
              inventory={inventory}
              customers={customers}
              defects={defects}
              printTasks={printTasks}
              boxes={boxes}
              auditLogs={auditLogs}
            />
          )}
        </main>

      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-center text-xs text-slate-400" id="erp-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-2">
          <TexLogo size="sm" variant="light" showSubtitle={false} />
          <p className="text-[11px] text-slate-400">© 2026 Shogirt ERP. {lang === 'uz' ? "To'qimachilik va tikuvchilik korxonalarini avtomatlashtirish tizimi." : "Система автоматизации текстильных и швейных предприятий."}</p>
        </div>
      </footer>

    </div>
  );
}
