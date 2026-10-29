import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Order, OrderStatus } from '../types';
import { Language } from '../locales';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Scissors, 
  Shirt, 
  Package, 
  XCircle,
  AlertTriangle,
  TrendingUp,
  Filter
} from 'lucide-react';

interface OrderStatusChartProps {
  orders: Order[];
  lang: Language;
  activeStatusFilter?: OrderStatus | 'all';
  onSelectStatusFilter?: (status: OrderStatus | 'all') => void;
  compact?: boolean;
}

export default function OrderStatusChart({ 
  orders, 
  lang, 
  activeStatusFilter = 'all', 
  onSelectStatusFilter,
  compact = false
}: OrderStatusChartProps) {
  
  // Status Counts
  const counts = {
    all: orders.length,
    yangi: orders.filter(o => o.status === 'yangi').length,
    bichuv: orders.filter(o => o.status === 'bichuv').length,
    tikuv: orders.filter(o => o.status === 'tikuv').length,
    qadoqlash: orders.filter(o => o.status === 'qadoqlash').length,
    yakunlandi: orders.filter(o => o.status === 'yakunlandi').length,
    bekor_qilindi: orders.filter(o => o.status === 'bekor_qilindi').length,
  };

  // Stage Quantities
  const totalQtyOrder = orders.reduce((sum, o) => sum + (o.qtyOrder || o.totalQuantity || 0), 0);
  const totalQtyCut = orders.reduce((sum, o) => sum + (o.qtyCut || 0), 0);
  const totalQtyPotok = orders.reduce((sum, o) => sum + (o.qtyPotok || 0), 0);
  const totalQtyPackaging = orders.reduce((sum, o) => sum + (o.qtyPackaging || 0), 0);
  const totalQtyDefect = orders.reduce((sum, o) => sum + (o.qtyDefect || 0), 0);

  // Status Labels and Colors
  const STATUS_CONFIG: Record<OrderStatus, { labelUz: string; labelRu: string; color: string; icon: any }> = {
    yangi: { 
      labelUz: "Yangi buyurtma", 
      labelRu: "Новый заказ", 
      color: "#3b82f6", // blue-500
      icon: Clock 
    },
    bichuv: { 
      labelUz: "Bichuv sexida", 
      labelRu: "В раскройном", 
      color: "#eab308", // yellow-500
      icon: Scissors 
    },
    tikuv: { 
      labelUz: "Tikuv sexida", 
      labelRu: "В швейном", 
      color: "#a855f7", // purple-500
      icon: Shirt 
    },
    qadoqlash: { 
      labelUz: "Qadoqlashda", 
      labelRu: "На упаковке", 
      color: "#f97316", // orange-500
      icon: Package 
    },
    yakunlandi: { 
      labelUz: "Yakunlandi", 
      labelRu: "Завершен", 
      color: "#10b981", // emerald-500
      icon: CheckCircle2 
    },
    bekor_qilindi: { 
      labelUz: "Bekor qilindi", 
      labelRu: "Отменен", 
      color: "#ef4444", // red-500
      icon: XCircle 
    }
  };

  // Pie chart data for order status distribution
  const pieData = (['yangi', 'bichuv', 'tikuv', 'qadoqlash', 'yakunlandi', 'bekor_qilindi'] as OrderStatus[])
    .map(statusKey => {
      const config = STATUS_CONFIG[statusKey];
      return {
        key: statusKey,
        name: lang === 'uz' ? config.labelUz : config.labelRu,
        value: counts[statusKey],
        color: config.color
      };
    })
    .filter(item => item.value > 0);

  // Fallback if all 0
  const displayPieData = pieData.length > 0 ? pieData : [
    { key: 'none', name: lang === 'uz' ? 'Ma\'lumot yo\'q' : 'Нет данных', value: 1, color: '#475569' }
  ];

  // Bar chart data for stage quantities (volume in pieces)
  const stageData = [
    {
      stage: lang === 'uz' ? '1. Buyurtma' : '1. Заказ',
      qty: totalQtyOrder,
      color: '#3b82f6'
    },
    {
      stage: lang === 'uz' ? '2. Bichuv (Kroy)' : '2. Крой',
      qty: totalQtyCut,
      color: '#eab308'
    },
    {
      stage: lang === 'uz' ? '3. Tikuv (Poshiv)' : '3. Пошив',
      qty: totalQtyPotok,
      color: '#a855f7'
    },
    {
      stage: lang === 'uz' ? '4. Qadoqlash' : '4. Упаковка',
      qty: totalQtyPackaging,
      color: '#10b981'
    },
    {
      stage: lang === 'uz' ? '5. Brak' : '5. Брак',
      qty: totalQtyDefect,
      color: '#ef4444'
    }
  ];

  // Overall completion rate
  const overallProgress = totalQtyOrder > 0 ? Math.min(100, Math.round((totalQtyPackaging / totalQtyOrder) * 100)) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6" id="order-status-chart-container">
      
      {/* Top Title & Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                {lang === 'uz' ? "Zakazlar holati diagrammasi" : "Диаграмма статусов заказов"}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'uz' 
                  ? "Bosqichlar va tayyorlik darajasi bo'yicha vizual ko'rsatkichlar" 
                  : "Визуальные показатели по этапам и степени готовности"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress summary pill */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === 'uz' ? "Umumiy Bajarilish" : "Общая Готовность"}
            </span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {overallProgress}% ({totalQtyPackaging.toLocaleString()} / {totalQtyOrder.toLocaleString()} {lang === 'uz' ? 'ta' : 'шт'})
            </span>
          </div>
          <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${overallProgress}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-extrabold text-white">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Status Selector Cards/Pills */}
      {onSelectStatusFilter && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
              activeStatusFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? "Barcha zakazlar" : "Все заказы"}</span>
            <span className="bg-slate-800/80 text-white px-2 py-0.5 rounded-md text-[10px] font-mono">
              {counts.all}
            </span>
          </button>

          {(['yangi', 'bichuv', 'tikuv', 'qadoqlash', 'yakunlandi', 'bekor_qilindi'] as OrderStatus[]).map(statusKey => {
            const config = STATUS_CONFIG[statusKey];
            const IconComp = config.icon;
            const count = counts[statusKey];
            const isActive = activeStatusFilter === statusKey;

            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => onSelectStatusFilter(statusKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                  isActive
                    ? 'text-white border-slate-600 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                style={{
                  backgroundColor: isActive ? config.color : undefined
                }}
              >
                <IconComp className="w-3.5 h-3.5" style={{ color: isActive ? '#ffffff' : config.color }} />
                <span>{lang === 'uz' ? config.labelUz : config.labelRu}</span>
                <span className="bg-slate-900/60 text-white px-2 py-0.5 rounded-md text-[10px] font-mono border border-white/10">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Visual Charts Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
        
        {/* CHART 1: DONUT / PIE CHART FOR STATUS DISTRIBUTION */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-400" />
              {lang === 'uz' ? "Holatlar Ulushi (Soni va %)" : "Распределение по статусам (Кол-во и %)"}
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              {orders.length} {lang === 'uz' ? 'ta buyurtma' : 'заказов'}
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={(entry: any) => {
                    if (entry && entry.key && entry.key !== 'none' && onSelectStatusFilter) {
                      onSelectStatusFilter(entry.key as OrderStatus);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#0f172a" 
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (data.key === 'none') return null;
                      const percent = orders.length > 0 ? Math.round((data.value / orders.length) * 100) : 0;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-white text-xs space-y-1">
                          <p className="font-extrabold flex items-center gap-1.5" style={{ color: data.color }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                            {data.name}
                          </p>
                          <p className="text-slate-300 font-mono">
                            {data.value} {lang === 'uz' ? 'ta zakaz' : 'заказов'} ({percent}%)
                          </p>
                          {onSelectStatusFilter && (
                            <p className="text-[10px] text-indigo-300 italic pt-0.5">
                              {lang === 'uz' ? "Filtrlash uchun bosing" : "Нажмите для фильтрации"}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            {(['yangi', 'bichuv', 'tikuv', 'qadoqlash', 'yakunlandi', 'bekor_qilindi'] as OrderStatus[]).map(statusKey => {
              const config = STATUS_CONFIG[statusKey];
              const count = counts[statusKey];
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              
              return (
                <div 
                  key={statusKey} 
                  onClick={() => onSelectStatusFilter && onSelectStatusFilter(statusKey)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeStatusFilter === statusKey
                      ? 'bg-slate-800 border-indigo-500'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                    <span className="text-[11px] font-bold text-slate-300 truncate">
                      {lang === 'uz' ? config.labelUz : config.labelRu}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-black text-white shrink-0">
                    {count} <span className="text-[9px] text-slate-500 font-normal">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: BAR CHART FOR PRODUCTION VOLUME ACROSS STAGES */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              {lang === 'uz' ? "Bosqichlar Bo'yicha Kiyim Hajmi (Dona)" : "Объем изделий по этапам (Штук)"}
            </h4>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {totalQtyOrder.toLocaleString()} {lang === 'uz' ? 'ta umumiy' : 'всего'}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="stage" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentOfOrder = totalQtyOrder > 0 ? Math.round((data.qty / totalQtyOrder) * 100) : 0;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-white text-xs space-y-1">
                          <p className="font-extrabold" style={{ color: data.color }}>
                            {data.stage}
                          </p>
                          <p className="text-sm font-black font-mono">
                            {data.qty.toLocaleString()} {lang === 'uz' ? 'dona' : 'шт'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {lang === 'uz' ? `Buyurtmaga nisbatan: ${percentOfOrder}%` : `От общего заказа: ${percentOfOrder}%`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Progress Bars inside right box */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {[
              { 
                label: lang === 'uz' ? 'Bichuv (Kroy) tayyorligi' : 'Готовность Кроя', 
                current: totalQtyCut, 
                target: totalQtyOrder, 
                color: 'bg-yellow-500' 
              },
              { 
                label: lang === 'uz' ? 'Tikuv (Poshiv) tayyorligi' : 'Готовность Пошива', 
                current: totalQtyPotok, 
                target: totalQtyOrder, 
                color: 'bg-purple-500' 
              },
              { 
                label: lang === 'uz' ? 'Qadoqlash (Upakovka) tayyorligi' : 'Готовность Упаковки', 
                current: totalQtyPackaging, 
                target: totalQtyOrder, 
                color: 'bg-emerald-500' 
              }
            ].map((pItem, idx) => {
              const pct = pItem.target > 0 ? Math.min(100, Math.round((pItem.current / pItem.target) * 100)) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>{pItem.label}</span>
                    <span className="font-mono text-white">
                      {pItem.current.toLocaleString()} / {pItem.target.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full ${pItem.color} transition-all duration-700 rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
