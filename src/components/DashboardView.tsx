import React, { useState } from 'react';
import { Order, InventoryItem, AuditLog, DefectItem, PrintTask, WarehouseBox } from '../types';
import { TRANSLATIONS, Language } from '../locales';
import OrderStatusChart from './OrderStatusChart';
import InteractiveTelemetryHub from './InteractiveTelemetryHub';
import { 
  Truck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  Scissors, 
  CheckSquare, 
  Square, 
  Search, 
  ChevronRight, 
  History,
  Activity,
  Sparkles,
  Cpu,
  Workflow
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  inventory?: InventoryItem[];
  defects?: DefectItem[];
  printTasks?: PrintTask[];
  boxes?: WarehouseBox[];
  auditLogs?: AuditLog[];
  onNavigateToTab?: (tab: string) => void;
  onSelectOrder: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
  lang: Language;
}

export default function DashboardView({ 
  orders, 
  inventory = [], 
  defects = [],
  printTasks = [],
  boxes = [],
  auditLogs = [],
  onNavigateToTab, 
  onSelectOrder, 
  onUpdateOrder,
  lang 
}: DashboardViewProps) {
  const t = TRANSLATIONS[lang];

  // Plan Otgruzki status filter
  const [shippingStatusFilter, setShippingStatusFilter] = useState<'all' | 'rejalashtirilgan' | 'jarayonda' | 'tayyor' | 'otgruzka_qilindi'>('all');
  const [shippingSearch, setShippingSearch] = useState('');
  
  // High-Tech Telemetry HUD vs Standard Plan Switcher
  const [dashboardViewMode, setDashboardViewMode] = useState<'telemetry' | 'standard'>('telemetry');

  // Translations
  const setT = {
    uz: {
      kpiActiveOrders: "Faol Buyurtmalar",
      kpiTotalPcs: "Ishlab Chiqarish Hajmi",
      kpiPlanOtgruzki: "Otgruzka Rejasi",
      kpiWarehouse: "Ombor Zaxirasi",
      planTitle: "Otgruzka Rejasi (План отгрузки)",
      planSubtitle: "Zakazlar bo'limidan ptichka orqali rejalashtirilgan va jo'natilishga tayyor mahsulotlar grafigi",
      filterAll: "Barchasi",
      filterPlanned: "Rejalashtirilgan",
      filterInProgress: "Jarayonda",
      filterReady: "Yuklashga tayyor (100%)",
      filterShipped: "Otgruzka qilindi",
      noPlannedOrders: "Hozircha otgruzka rejasiga kiritilgan buyurtmalar yo'q.",
      noPlannedHelp: "Buyurtmalar (Заказы) bo'limida buyurtma kartasidagi 'План отгрузки' ptichkasini yoqing.",
      addAllToPlan: "Barcha faol zakazlarni planga qo'shish",
      openOrder: "Ko'rish & O'lchamlar",
      recentAudit: "So'nggi Tranzaksiyalar va Harakatlar",
      viewAllHistory: "Barcha tarixni ko'rish (Batafsil)",
      daysLeft: "kun qoldi",
      today: "Bugun jo'natish",
      overdue: "Muddati o'tgan"
    },
    ru: {
      kpiActiveOrders: "Активные заказы",
      kpiTotalPcs: "Объем производства",
      kpiPlanOtgruzki: "План отгрузки",
      kpiWarehouse: "Склад готовой продукции",
      planTitle: "План отгрузки (Shipping Plan)",
      planSubtitle: "График заказов, добавленных в план через отметку (птичку) в Заказах",
      filterAll: "Все в плане",
      filterPlanned: "Запланировано",
      filterInProgress: "В производстве",
      filterReady: "Готовы к отгрузке (100%)",
      filterShipped: "Отгружено",
      noPlannedOrders: "В плане отгрузки пока нет заказов.",
      noPlannedHelp: "В разделе Заказы отметьте нужные заказы галочкой 'План отгрузки'.",
      addAllToPlan: "Добавить все активные заказы в план",
      openOrder: "Просмотр и Размеры",
      recentAudit: "Последние транзакции и действия",
      viewAllHistory: "Смотреть всю историю (Подробнее)",
      daysLeft: "дн. осталось",
      today: "Отгрузка сегодня",
      overdue: "Срок истек"
    }
  }[lang];

  // Aggregate metrics
  const activeOrders = orders.filter(o => o.status !== 'yakunlandi' && o.status !== 'bekor_qilindi');
  const totalOrderedPcs = orders.reduce((sum, o) => sum + (o.qtyOrder || 0), 0);
  const totalCutPcs = orders.reduce((sum, o) => sum + (o.qtyCut || 0), 0);
  const totalSewnPcs = orders.reduce((sum, o) => sum + (o.qtyPotok || 0), 0);
  const totalPackedPcs = orders.reduce((sum, o) => sum + (o.qtyPackaging || 0), 0);
  const totalWarehouseQty = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Orders explicitly marked in shipment plan (inShipmentPlan: true or legacy ready orders)
  const plannedOrders = orders.filter(o => o.inShipmentPlan === true || (o.qtyPackaging >= o.qtyOrder && o.qtyOrder > 0));

  const filteredPlannedOrders = plannedOrders.filter(order => {
    // Search
    if (shippingSearch.trim()) {
      const q = shippingSearch.toLowerCase();
      const matchMos = order.mosCode?.toLowerCase().includes(q);
      const matchBrand = order.brandName?.toLowerCase().includes(q);
      const matchCust = order.customerName?.toLowerCase().includes(q);
      const matchModel = order.modelCode?.toLowerCase().includes(q);
      if (!matchMos && !matchBrand && !matchCust && !matchModel) return false;
    }

    // Status filter
    if (shippingStatusFilter === 'all') return true;
    
    const currentStatus = order.shipmentPlanStatus || (order.qtyPackaging >= order.qtyOrder ? 'tayyor' : 'jarayonda');
    return currentStatus === shippingStatusFilter;
  });

  // Calculate days remaining helper
  const getDeadlineBadge = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const deadlineDate = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          {setT.overdue} ({Math.abs(diffDays)}d)
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {setT.today}
        </span>
      );
    } else {
      return (
        <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
          <Calendar className="w-3 h-3 text-indigo-400" />
          {diffDays} {setT.daysLeft} ({deadlineStr})
        </span>
      );
    }
  };

  const handleStatusChange = (order: Order, newStatus: 'rejalashtirilgan' | 'jarayonda' | 'tayyor' | 'otgruzka_qilindi') => {
    if (onUpdateOrder) {
      onUpdateOrder({
        ...order,
        inShipmentPlan: true,
        shipmentPlanStatus: newStatus
      });
    }
  };

  const handleAddAllToPlan = () => {
    if (onUpdateOrder) {
      activeOrders.forEach(order => {
        onUpdateOrder({
          ...order,
          inShipmentPlan: true,
          shipmentPlanStatus: order.qtyPackaging >= order.qtyOrder ? 'tayyor' : 'jarayonda'
        });
      });
    }
  };

  return (
    <div className="space-y-6" id="dashboard-view-container">
      
      {/* Top View Mode Switcher: Interactive Telemetry HUD vs Classic Shipping Plan */}
      <div className="bg-[#0b1329] border border-cyan-500/30 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDashboardViewMode('telemetry')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              dashboardViewMode === 'telemetry'
                ? 'bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>🛰️ {lang === 'uz' ? 'Kiber Telemetriya & Sex IoT (HUD)' : 'Кибер-Телеметрия & Цех IoT (HUD)'}</span>
            <span className="text-[9px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase ml-1 animate-pulse">
              LIVE
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardViewMode('standard')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              dashboardViewMode === 'standard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-300" />
            <span>📋 {lang === 'uz' ? 'Otgruzka Rejasi & Jadvallar' : 'План отгрузки и Заказы'}</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-cyan-300 px-3">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Real-time Telemetry: FAOL
          </span>
        </div>
      </div>

      {/* RENDER INTERACTIVE TELEMETRY HUB */}
      {dashboardViewMode === 'telemetry' && (
        <InteractiveTelemetryHub 
          orders={orders}
          inventory={inventory}
          defects={defects}
          printTasks={printTasks}
          boxes={boxes}
          auditLogs={auditLogs}
          lang={lang}
          onNavigateToTab={onNavigateToTab}
          onSelectOrder={onSelectOrder}
        />
      )}

      {/* 1. TOP EXECUTIVE KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-kpi-grid">
        
        {/* KPI 1: Active Orders */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {setT.kpiActiveOrders}
            </span>
            <div className="p-2.5 bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">
              {activeOrders.length} <span className="text-xs font-medium text-slate-400 font-sans">ta faol</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Jami hajm: <strong className="text-white font-mono">{totalOrderedPcs.toLocaleString()}</strong> dona</span>
              <span className="text-emerald-400 font-bold">{Math.round((orders.filter(o => o.status === 'yakunlandi').length / (orders.length || 1)) * 100)}% tayyor</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Production Pipeline Progress */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {setT.kpiTotalPcs}
            </span>
            <div className="p-2.5 bg-cyan-600/15 text-cyan-400 border border-cyan-500/30 rounded-xl">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-cyan-400 font-mono">
              {totalPackedPcs.toLocaleString()} <span className="text-xs font-medium text-slate-400 font-sans">dona qadoq</span>
            </h3>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-indigo-300 font-mono">Kroy: {totalCutPcs.toLocaleString()}</span>
              <span>•</span>
              <span className="text-emerald-300 font-mono">Tikuv: {totalSewnPcs.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Otgruzka Rejasi */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {setT.kpiPlanOtgruzki}
            </span>
            <div className="p-2.5 bg-amber-600/15 text-amber-400 border border-amber-500/30 rounded-xl">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-400 font-mono">
              {plannedOrders.length} <span className="text-xs font-medium text-slate-400 font-sans">ta reja</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span className="text-emerald-400 font-bold">
                {plannedOrders.filter(o => (o.shipmentPlanStatus === 'tayyor' || o.qtyPackaging >= o.qtyOrder)).length} ta jo'natishga tayyor
              </span>
              <span className="text-slate-400 text-[10px]">
                {plannedOrders.filter(o => o.priority === 'shoshilinch').length} ta shoshilinch
              </span>
            </p>
          </div>
        </div>

        {/* KPI 4: Warehouse Items */}
        <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {setT.kpiWarehouse}
            </span>
            <div className="p-2.5 bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-400 font-mono">
              {totalWarehouseQty.toLocaleString()} <span className="text-xs font-medium text-slate-400 font-sans">dona tayyor</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{inventory.length} turdagi mato & aksessuar</span>
              <span className="text-xs font-bold text-indigo-400">100% nazorat</span>
            </p>
          </div>
        </div>

      </div>

      {/* 2. ORDER STATUS CHART */}
      <OrderStatusChart 
        orders={orders} 
        lang={lang} 
      />

      {/* 3. REDESIGNED PLAN OTGRUZKI SECTION (ПЛАН ОТГРУЗКИ) */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5" id="plan-otgruzki-section">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                {setT.planTitle}
              </h3>
              <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                {plannedOrders.length} {lang === 'uz' ? 'buyurtma' : 'заказов'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {setT.planSubtitle}
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={shippingSearch}
                onChange={(e) => setShippingSearch(e.target.value)}
                placeholder={lang === 'uz' ? "Planni qidirish..." : "Поиск в плане..."}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setShippingStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  shippingStatusFilter === 'all' 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {setT.filterAll} ({plannedOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setShippingStatusFilter('rejalashtirilgan')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  shippingStatusFilter === 'rejalashtirilgan' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {setT.filterPlanned}
              </button>

              <button
                type="button"
                onClick={() => setShippingStatusFilter('jarayonda')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  shippingStatusFilter === 'jarayonda' 
                    ? 'bg-sky-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {setT.filterInProgress}
              </button>

              <button
                type="button"
                onClick={() => setShippingStatusFilter('tayyor')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  shippingStatusFilter === 'tayyor' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {setT.filterReady}
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards / Table List */}
        {filteredPlannedOrders.length === 0 ? (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
            <Truck className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">{setT.noPlannedOrders}</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{setT.noPlannedHelp}</p>
            </div>
            {activeOrders.length > 0 && (
              <button
                type="button"
                onClick={handleAddAllToPlan}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-indigo-900/30"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{setT.addAllToPlan}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlannedOrders.map(order => {
              const progress = order.qtyOrder > 0 
                ? Math.min(100, Math.round((order.qtyPackaging / order.qtyOrder) * 100))
                : 0;

              const currentStatus = order.shipmentPlanStatus || (progress >= 100 ? 'tayyor' : 'jarayonda');

              return (
                <div 
                  key={order.id}
                  className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl transition-all group"
                >
                  {/* Top Bar: MOS Code, Brand, Countdown & Priority */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-cyan-400 font-mono tracking-tight">
                          {order.mosCode || order.orderNumber}
                        </span>
                        {order.priority === 'shoshilinch' && (
                          <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                            {lang === 'uz' ? 'Shoshilinch' : 'Срочно'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white">
                        {order.brandName} • <span className="text-slate-400 font-normal">{order.customerName}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {order.productType} • <span className="text-slate-200">{order.color}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1.5">
                      {getDeadlineBadge(order.deadline)}
                      
                      {/* Interactive Status Changer Dropdown */}
                      <div className="flex justify-end">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(order, e.target.value as any)}
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            currentStatus === 'tayyor'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : currentStatus === 'jarayonda'
                              ? 'bg-sky-950 text-sky-300 border-sky-700'
                              : currentStatus === 'otgruzka_qilindi'
                              ? 'bg-purple-950 text-purple-300 border-purple-700'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}
                        >
                          <option value="rejalashtirilgan">{lang === 'uz' ? '🟡 Rejalashtirilgan' : '🟡 Запланировано'}</option>
                          <option value="jarayonda">{lang === 'uz' ? '🔵 Ishlab chiqarilmoqda' : '🔵 В производстве'}</option>
                          <option value="tayyor">{lang === 'uz' ? '🟢 Yuklashga tayyor' : '🟢 Готов к отгрузке'}</option>
                          <option value="otgruzka_qilindi">{lang === 'uz' ? '🟣 Otgruzka qilindi' : '🟣 Отгружено'}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Production Metrics & Progress Bar */}
                  <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">
                        Qadoqlangan / Buyurtma:
                      </span>
                      <span className="font-mono font-bold text-white">
                        <span className="text-emerald-400">{order.qtyPackaging.toLocaleString()}</span> / {order.qtyOrder.toLocaleString()} dona
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          progress >= 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Bajarilish: <strong className="text-slate-200">{progress}%</strong></span>
                      <span className="text-indigo-400">
                        Kroy: {order.qtyCut} • Tikuv: {order.qtyPotok}
                      </span>
                    </div>
                  </div>

                  {/* Action Button: Open Order */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 font-mono">
                      1C: {order.oneCOrderEmission || '-'}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectOrder(order)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{setT.openOrder}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. RECENT TRANSACTIONS WIDGET (Tranzaksiya tarixi vidjeti) */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                {setT.recentAudit}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'uz' ? "Supabase audit_logs jadvalidan olingan oxirgi o'zgarishlar" : "Последние изменения из журнала аудита"}
              </p>
            </div>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('tarix')}
              className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>{setT.viewAllHistory}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Transactions Mini List */}
        <div className="divide-y divide-slate-800/60 text-xs">
          {auditLogs.slice(0, 4).map(log => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                  log.actionType === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  log.actionType === 'UPDATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {log.actionType}
                </span>
                <span className="font-bold text-white truncate">{log.entityName}</span>
                <span className="text-slate-400 truncate hidden sm:inline">{log.description}</span>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <span>{log.userName}</span>
                <span>•</span>
                <span>{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
