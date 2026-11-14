import React, { useMemo, useState } from 'react';
import { Order, InventoryItem, AuditLog, DefectItem, PrintTask, WarehouseBox } from '../types';
import { Language } from '../locales';
import OrderStatusChart from './OrderStatusChart';
import {
  FactoryLedgerRow,
  OrderSizeMatrix,
  SIZE_PRESETS,
  loadBrandsList,
  detectSizePresetForRow,
  normalizePresetId,
  getEffectiveDisplaySizes,
  loadOrdersAndMatrices
} from '../lib/ordersSizeStore';
import {
  Truck,
  Calendar,
  Layers,
  Package,
  AlertTriangle,
  Scissors,
  Search,
  ChevronRight,
  Ruler,
  CheckCircle2,
  Plus,
  BarChart3,
  Tag
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  ledgerRows?: FactoryLedgerRow[];
  sizeMatrices?: Record<string, OrderSizeMatrix>;
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
  ledgerRows: propLedgerRows,
  sizeMatrices: propSizeMatrices,
  onNavigateToTab,
  onSelectOrder,
  lang
}: DashboardViewProps) {
  const isUz = lang === 'uz';

  const fallbackStore = useMemo(() => {
    if (propLedgerRows !== undefined && propSizeMatrices !== undefined) {
      return { rows: propLedgerRows, matrices: propSizeMatrices };
    }
    return loadOrdersAndMatrices();
  }, [propLedgerRows, propSizeMatrices]);

  const rows = propLedgerRows ?? fallbackStore.rows;
  const matrices = propSizeMatrices ?? fallbackStore.matrices;

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => {
      if (r.month) set.add(r.month);
    });
    return Array.from(set);
  }, [rows]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>(loadBrandsList());
    rows.forEach(r => {
      if (r.brand) set.add(r.brand);
    });
    return Array.from(set);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rows.filter(r => {
      if (selectedMonth !== 'all' && r.month !== selectedMonth) return false;
      if (selectedBrand !== 'all' && (r.brand || '') !== selectedBrand) return false;
      if (!q) return true;
      return (
        (r.brand || '').toLowerCase().includes(q) ||
        r.orderNo.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.color.toLowerCase().includes(q) ||
        (r.rost || '').toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q)
      );
    });
  }, [rows, selectedMonth, selectedBrand, searchQuery]);

  // Все агрегированные показатели строго из «Размеры по заказу»
  const totals = useMemo(() => {
    let orderQty = 0;
    let cutQty = 0;
    let distQty = 0;
    let sewQty = 0;
    let packQty = 0;
    let defectQty = 0;
    let totalPackQty = 0;
    let shipQty = 0;
    let stockQty = 0;

    filteredRows.forEach(r => {
      orderQty += r.qtyOrder || 0;
      cutQty += r.qtyCut || 0;
      distQty += r.qtyDistribution || 0;
      sewQty += r.qtySewing || 0;
      packQty += r.qtyPackaging || 0;
      defectQty += r.qtyDefect || 0;
      totalPackQty += r.qtyTotalPack || 0;
      shipQty += r.qtyShipped || 0;
      stockQty += r.qtyStock || 0;
    });

    const cutPct = orderQty > 0 ? ((cutQty / orderQty) * 100).toFixed(1) : '0.0';
    const closePct = distQty > 0 ? ((totalPackQty / distQty) * 100).toFixed(1) : '0.0';
    const defectPct = distQty > 0 ? ((defectQty / distQty) * 100).toFixed(1) : '0.0';
    const stockPct = packQty > 0 ? ((stockQty / packQty) * 100).toFixed(1) : '0.0';
    const shippedPct = packQty > 0 ? ((shipQty / packQty) * 100).toFixed(1) : '0.0';
    const diffDistPack = distQty - packQty;
    const diffDistPackPct = distQty > 0 ? ((diffDistPack / distQty) * 100).toFixed(1) : '0.0';
    const distinctOrders = new Set(filteredRows.map(r => r.orderNo)).size;
    const distinctModels = new Set(filteredRows.map(r => r.model)).size;

    return {
      orderQty,
      cutQty,
      cutPct,
      distQty,
      sewQty,
      packQty,
      defectQty,
      totalPackQty,
      shipQty,
      stockQty,
      closePct,
      defectPct,
      stockPct,
      shippedPct,
      diffDistPack,
      diffDistPackPct,
      distinctOrders,
      distinctModels,
      rowsCount: filteredRows.length
    };
  }, [filteredRows]);

  // Отфильтрованные Order[] для графика этапов
  const filteredOrdersForChart = useMemo(() => {
    const allowedIds = new Set(filteredRows.map(r => r.id));
    return orders.filter(o => allowedIds.has(o.id));
  }, [orders, filteredRows]);

  const labels = isUz
    ? {
        headerTitle: 'ISLAB CIQARIS DASBORDI',
        headerSub: 'Barca ko‘rsatkiclar to‘g‘ridan-to‘g‘ri «Zakazlar → Размеры по заказу» bo‘limidan olinmoqda',
        allMonths: 'Barca oylar',
        searchPh: 'Zakaz №, model, rang bo‘yica qidiris...',
        kpiOrders: 'Zakazlar soni',
        kpiOrdersSub: 'Qatorlar / Modellar',
        kpiVolume: 'Buyurtma hajmi',
        kpiStages: 'Kroy / Tarqatis',
        kpiPack: 'Qadoqlangan (Закрытие %)',
        kpiSew: 'Tikuv bosqici',
        kpiDefect: 'Brak darajasi',
        kpiDefectNorm: 'Me’yor: 3.5%',
        kpiShipped: 'Otgruzka qilingan',
        kpiStock: 'Ombor qoldig‘i',
        emptyTitle: 'Hozirca zakazlar kiritilmagan',
        emptyDesc:
          'Dasborddagi barca ko‘rsatkiclar «Zakazlar → Размеры по заказу» bo‘limidan avtomatik hisoblanadi. Birinci zakazni kiritis ucun quyidagi tugmani bosing.',
        emptyBtn: 'Zakazlar (Размеры по заказу) ga o‘tis',
        listTitle: 'Zakazlar va razmerlar bo‘yica holat',
        listSub: 'Har bir zakazni bosib, to‘g‘ridan-to‘g‘ri «Размеры по заказу» da tahrirlashingiz mumkin',
        openMatrix: 'Размеры по заказу'
      }
    : {
        headerTitle: 'ПРОИЗВОДСТВЕННЫЙ ДАШБОРД',
        headerSub: 'Все показатели формируются в реальном времени из раздела «Заказы → Размеры по заказу»',
        allMonths: 'Все месяцы',
        searchPh: 'Поиск по заказу, модели, цвету...',
        kpiOrders: 'Количество заказов',
        kpiOrdersSub: 'Строк / Моделей',
        kpiVolume: 'Объем заказа',
        kpiStages: 'Крой / Раздача',
        kpiPack: 'Упаковано и Закрытие',
        kpiSew: 'Пошив',
        kpiDefect: 'Брак (ОТК)',
        kpiDefectNorm: 'Норма: 3.5%',
        kpiShipped: 'Отгружено',
        kpiStock: 'Остаток на складе',
        emptyTitle: 'Данные по заказам еще не введены',
        emptyDesc:
          'Все показатели Дашборда берутся напрямую из раздела «Заказы → Размеры по заказу». Добавьте первый заказ или импортируйте Excel, чтобы увидеть аналитику.',
        emptyBtn: 'Ввести заказ в «Размеры по заказу»',
        listTitle: 'Сводка по заказам из матрицы размеров',
        listSub: 'Нажмите на любой заказ, чтобы открыть и отредактировать его в «Размеры по заказу»',
        openMatrix: 'Открыть в Размерах'
      };

  return (
    <div className="space-y-6 animate-fadeIn" id="dashboard-view-container">
      {/* 1. ВЕРХНИЙ БАННЕР И ФИЛЬТРЫ ПО МЕСЯЦУ / ПОИСКУ */}
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">{labels.headerTitle}</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{isUz ? 'Manba: Размеры по заказу' : 'Источник: Размеры по заказу'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-300">{labels.headerSub}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">
                {labels.allMonths} ({availableMonths.length})
              </option>
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-slate-900">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">
                {isUz ? 'Barca brendlar' : 'Все бренды'}
              </option>
              {availableBrands.map(b => (
                <option key={b} value={b} className="bg-slate-900">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={labels.searchPh}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 w-56 sm:w-64"
            />
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('buyurtmalar')}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>{isUz ? 'Razmerlar jadvali' : 'Размеры по заказу'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 6 KPI КАРТОЧЕК (ДАННЫЕ ИЗ РАЗМЕРЫ ПО ЗАКАЗУ) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5" id="dashboard-kpi-grid">
        <div className="bg-[#111827] border border-cyan-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">{labels.kpiOrders}</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2.5 text-2xl font-black text-white font-mono">{totals.distinctOrders}</div>
          <p className="text-[11px] text-slate-300 mt-1">
            {totals.rowsCount} • {totals.distinctModels} {isUz ? 'model' : 'мод.'}
          </p>
        </div>

        <div className="bg-[#111827] border border-blue-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider">{labels.kpiVolume}</span>
            <Scissors className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2.5 text-2xl font-black text-white font-mono">
            {totals.orderQty.toLocaleString()}
          </div>
          <p className="text-[11px] text-sky-300 mt-1 font-mono font-bold">
            {isUz ? 'Kroy' : 'Крой'}: {totals.cutQty.toLocaleString()} ({totals.cutPct}%)
          </p>
        </div>

        <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">{labels.kpiPack}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 text-2xl font-black text-emerald-400 font-mono">
            {totals.packQty.toLocaleString()}{' '}
            <span className="text-sm text-emerald-200">({totals.closePct}%)</span>
          </div>
          <p className="text-[11px] text-rose-300 mt-1 font-mono font-bold">
            {isUz ? 'Farq (Tarq−Qad)' : 'Разд−Упак'}: {totals.diffDistPack.toLocaleString()} ({totals.diffDistPackPct}%)
          </p>
        </div>

        <div className="bg-[#111827] border border-rose-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider">{labels.kpiDefect}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2.5 text-2xl font-black text-rose-400 font-mono">{totals.defectPct}%</div>
          <p className="text-[11px] text-slate-300 mt-1 font-mono">
            {totals.defectQty.toLocaleString()} шт • {labels.kpiDefectNorm}
          </p>
        </div>

        <div className="bg-[#111827] border border-amber-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">{labels.kpiShipped}</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2.5 text-2xl font-black text-amber-400 font-mono">{totals.shipQty.toLocaleString()}</div>
          <p className="text-[11px] text-slate-300 mt-1 font-mono">
            {totals.shippedPct}% {isUz ? 'qadoqdan' : 'от упаковки'}
          </p>
        </div>

        <div className="bg-[#111827] border border-purple-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider">{labels.kpiStock}</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2.5 text-2xl font-black text-purple-300 font-mono">{totals.stockQty.toLocaleString()}</div>
          <p className="text-[11px] text-purple-200 mt-1 font-mono">{totals.stockPct}%</p>
        </div>
      </div>

      {/* 3. ПУСТОЕ СОСТОЯНИЕ ИЛИ ГРАФИК + ЗАКАЗЫ */}
      {rows.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-10 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-amber-400/15 border border-amber-400/40 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
            <Ruler className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-lg font-black text-white">{labels.emptyTitle}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{labels.emptyDesc}</p>
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('buyurtmalar')}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>{labels.emptyBtn}</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ГРАФИК ЭТАПОВ ПРОИЗВОДСТВА */}
          <OrderStatusChart orders={filteredOrdersForChart} lang={lang} />

          {/* СПИСОК ЗАКАЗОВ ИЗ РАЗМЕРОВ */}
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-amber-400" />
                  <span>{labels.listTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{labels.listSub}</p>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl">
                {filteredRows.length} {isUz ? 'ta qator' : 'строк'}
              </span>
            </div>

            {filteredRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                {isUz ? 'Tanlangan filtr bo‘yica natija topilmadi' : 'По выбранному фильтру заказы не найдены'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRows.map(row => {
                  const matrix = matrices[row.id];
                  const effectiveSizes = getEffectiveDisplaySizes(matrix);
                  const norm = matrix ? normalizePresetId(matrix.presetId) : detectSizePresetForRow(row);
                  const safePreset = norm === 'custom' ? detectSizePresetForRow(row) : norm;
                  const sizeSummary =
                    effectiveSizes.length > 0
                      ? effectiveSizes.join(' • ')
                      : SIZE_PRESETS[safePreset].shortLabel;
                  const progress =
                    row.qtyOrder > 0 ? Math.min(100, Math.round((row.qtyPackaging / row.qtyOrder) * 100)) : 0;
                  const cutPct = row.qtyOrder > 0 ? ((row.qtyCut / row.qtyOrder) * 100).toFixed(1) : '0.0';
                  const diffPure = (row.qtyDistribution || 0) - (row.qtyPackaging || 0);
                  const diffPurePct = row.qtyDistribution > 0 ? ((diffPure / row.qtyDistribution) * 100).toFixed(1) : '0.0';

                  const matchedOrder = orders.find(o => o.id === row.id) || {
                    id: row.id,
                    orderNumber: row.orderNo,
                    mosCode: row.orderNo,
                    modelCode: row.model,
                    brandName: row.brand || row.orderNo,
                    customerName: row.month,
                    customerPhone: '',
                    productType: row.model,
                    fabricType: row.notes || '—',
                    color: row.rost ? `${row.color} (${row.rost})` : row.color,
                    colorCode: row.colorCode || '',
                    totalQuantity: row.qtyOrder,
                    sizes: {},
                    priority: 'normal' as const,
                    qtyOrder: row.qtyOrder,
                    qtyCut: row.qtyCut,
                    qtyPotok: row.qtySewing,
                    qtyPackaging: row.qtyPackaging,
                    qtyDefect: row.qtyDefect,
                    qtyRemaining: row.qtyStock,
                    status: 'yangi' as const,
                    deadline: row.month,
                    createdAt: '',
                    productionLogs: []
                  };

                  return (
                    <div
                      key={row.id}
                      className="bg-slate-950/90 border border-slate-800 hover:border-amber-400/50 p-4 rounded-2xl space-y-3 transition-all shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {row.brand && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-950 border border-indigo-600/50 text-indigo-200">
                                {row.brand}
                              </span>
                            )}
                            <span className="font-mono font-black text-sm text-cyan-300">{row.orderNo}</span>
                            {row.rost && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                                {row.rost}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                              {row.month}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white truncate">{row.model}</p>
                          <p className="text-[11px] text-amber-300 font-semibold">
                            {row.color}
                            {row.colorCode ? ` (${row.colorCode})` : ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectOrder(matchedOrder)}
                          className="px-3 py-1.5 bg-amber-400/15 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                        >
                          <span>{labels.openMatrix}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate" title={sizeSummary}>
                        {isUz ? 'Faol razmerlar' : 'Активные размеры'}: <span className="text-slate-100 font-bold">{sizeSummary}</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">{isUz ? 'Qadoq / Zakaz' : 'Упаковка / Заказ'}:</span>
                          <span className="font-mono font-bold text-white">
                            <span className="text-emerald-400">{row.qtyPackaging.toLocaleString()}</span> /{' '}
                            {row.qtyOrder.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-cyan-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-300 pt-0.5">
                          <span>
                            {isUz ? 'Kroy' : 'Крой'}: <strong className="text-sky-300">{row.qtyCut} ({cutPct}%)</strong> •{' '}
                            {isUz ? 'Tarq' : 'Разд'}: {row.qtyDistribution}
                          </span>
                          <span>
                            {isUz ? 'Tarq−Qad' : 'Разд−Упак'}:{' '}
                            <strong className={diffPure < 0 ? 'text-rose-400' : 'text-amber-300'}>
                              {diffPure} ({diffPurePct}%)
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
