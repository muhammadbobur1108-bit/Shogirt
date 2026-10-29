import React, { useState, useMemo } from 'react';
import { Order, InventoryItem, DefectItem } from '../types';
import { TRANSLATIONS, Language } from '../locales';
import OrderStatusChart from './OrderStatusChart';
import { 
  BarChart3, 
  Layers, 
  Palette, 
  ShoppingBag, 
  Scissors, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight,
  Sparkles,
  PieChart
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  inventory: InventoryItem[];
  defects: DefectItem[];
  lang: Language;
}

export default function ReportsView({ orders, inventory, defects, lang }: ReportsViewProps) {
  const t = TRANSLATIONS[lang];

  // 3 Modes as requested:
  // 1. 'general' = Umumiy bo'limlar ko'rsatkichi (Общий свод по цехам)
  // 2. 'orders' = Har bir zakaz bo'yicha (По заказам)
  // 3. 'colors' = Zakazdagi rang va o'lchamlar bo'yicha (По цветам и размерам заказов)
  const [reportMode, setReportMode] = useState<'general' | 'orders' | 'colors'>('general');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<'all' | 'kroy' | 'potok' | 'poshiv' | 'upakovka' | 'ombor' | 'brak'>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Translations
  const setT = {
    uz: {
      title: "Zavod Hisobotlari & Analitika",
      subtitle: "Barcha sexlar va bo'limlar bo'yicha umumiy, buyurtmalar hamda ranglar kesimidagi batafsil hisobot",
      modeGeneral: "1. Umumiy hisobot (Sexlar kesimida)",
      modeOrders: "2. Buyurtmalar kesimida",
      modeColors: "3. Ranglar va o'lchamlar kesimida",
      exportExcel: "Excel export",
      printReport: "Chop etish",
      deptKroy: "Bichuv (Kroy)",
      deptPotok: "Razdacha (Potok)",
      deptPoshiv: "Tikuv (Poshiv)",
      deptUpakovka: "Qadoq (Upakovka)",
      deptOmbor: "Omborxona",
      deptBrak: "Brak bo'limi",
      totalOrders: "Jami buyurtmalar",
      totalQty: "Buyurtma soni (Jami)",
      totalCut: "Bichildi (Kroy)",
      totalPotok: "Tarqatildi (Razdacha)",
      totalPoshiv: "Tikildi (Poshiv)",
      totalPacked: "Qadoqlandi (Upakovka)",
      totalRemaining: "Qoldiq",
      defectRate: "Brak foizi",
      completionRate: "Bajarilish darajasi",
      searchPlaceholder: "Buyurtma, model, brend yoki rang bo'yicha...",
      allBrands: "Barcha brendlar",
      allDepts: "Barcha bo'limlar"
    },
    ru: {
      title: "Отчеты фабрики и Аналитика",
      subtitle: "Сводные данные по всем цехам: общие, по заказам, а также детально по цветам и размерам",
      modeGeneral: "1. Общий отчет (По цехам)",
      modeOrders: "2. В разрезе заказов",
      modeColors: "3. В разрезе цветов и размеров",
      exportExcel: "Экспорт в Excel",
      printReport: "Печать отчета",
      deptKroy: "Раскрой (Крой)",
      deptPotok: "Раздача (Поток)",
      deptPoshiv: "Пошив",
      deptUpakovka: "Упаковка",
      deptOmbor: "Склад готовой продукции",
      deptBrak: "Брак",
      totalOrders: "Всего заказов",
      totalQty: "Заказано (Всего)",
      totalCut: "Раскроено (Крой)",
      totalPotok: "Выдано (Раздача)",
      totalPoshiv: "Сшито (Пошив)",
      totalPacked: "Упаковано",
      totalRemaining: "Остаток",
      defectRate: "Процент брака",
      completionRate: "Процент готовности",
      searchPlaceholder: "Поиск по заказу, модели, бренду или цвету...",
      allBrands: "Все бренды",
      allDepts: "Все цеха"
    }
  }[lang];

  // Unique Brands
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      if (o.brandName) set.add(o.brandName);
    });
    return Array.from(set);
  }, [orders]);

  // Aggregated totals
  const totalOrderQty = orders.reduce((sum, o) => sum + (o.qtyOrder || 0), 0);
  const totalCutQty = orders.reduce((sum, o) => sum + (o.qtyCut || 0), 0);
  const totalPotokQty = orders.reduce((sum, o) => sum + (o.qtyPotok || 0), 0);
  const totalSewnQty = orders.reduce((sum, o) => {
    const pSizes = Object.values(o.poshivSizes || {}).reduce((s, v) => s + (v || 0), 0);
    return sum + (pSizes || o.qtyPotok || 0);
  }, 0);
  const totalPackedQty = orders.reduce((sum, o) => sum + (o.qtyPackaging || 0), 0);
  const totalDefectQty = defects.reduce((sum, d) => sum + (d.quantity || 0), 0) + orders.reduce((sum, o) => sum + (o.qtyDefect || 0), 0);
  const totalRemainingQty = Math.max(0, totalOrderQty - totalPackedQty);
  const overallCompletion = totalOrderQty > 0 ? Math.min(100, Math.round((totalPackedQty / totalOrderQty) * 100)) : 0;

  // Filtered Orders for Mode 2
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMos = order.mosCode?.toLowerCase().includes(q);
        const matchModel = order.modelCode?.toLowerCase().includes(q);
        const matchBrand = order.brandName?.toLowerCase().includes(q);
        const matchColor = order.color?.toLowerCase().includes(q);
        if (!matchMos && !matchModel && !matchBrand && !matchColor) return false;
      }
      if (selectedBrand !== 'all' && order.brandName !== selectedBrand) return false;
      return true;
    });
  }, [orders, searchQuery, selectedBrand]);

  // Granular Color Rows for Mode 3 (Each Order -> Each Color Variant)
  const colorRows = useMemo(() => {
    const rows: Array<{
      orderId: string;
      mosCode: string;
      modelCode: string;
      brandName: string;
      colorName: string;
      sizes: { [size: string]: number };
      qtyOrder: number;
      qtyCut: number;
      qtyPotok: number;
      qtyPackaging: number;
      qtyRemaining: number;
      completionPercent: number;
    }> = [];

    filteredOrders.forEach(order => {
      if (order.colorVariants && order.colorVariants.length > 0) {
        order.colorVariants.forEach(variant => {
          const cut = variant.qtyCut || Math.round(order.qtyCut / (order.colorVariants?.length || 1));
          const potok = variant.qtyPotok || Math.round(order.qtyPotok / (order.colorVariants?.length || 1));
          const pack = variant.qtyPackaging || Math.round(order.qtyPackaging / (order.colorVariants?.length || 1));
          const orderQty = variant.qtyOrder || Object.values(variant.sizes || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) || Math.round(order.qtyOrder / (order.colorVariants?.length || 1));
          const remain = Math.max(0, orderQty - pack);
          const percent = orderQty > 0 ? Math.min(100, Math.round((pack / orderQty) * 100)) : 0;

          rows.push({
            orderId: order.id,
            mosCode: order.mosCode,
            modelCode: order.modelCode || order.orderNumber,
            brandName: order.brandName,
            colorName: variant.color,
            sizes: variant.sizes || order.sizes,
            qtyOrder: orderQty,
            qtyCut: cut,
            qtyPotok: potok,
            qtyPackaging: pack,
            qtyRemaining: remain,
            completionPercent: percent
          });
        });
      } else {
        // Single color or split colors
        const colors = order.color.split(/[,;\/]/).map(c => c.trim()).filter(Boolean);
        const count = colors.length || 1;
        colors.forEach(cName => {
          const orderQty = Math.round(order.qtyOrder / count);
          const cut = Math.round(order.qtyCut / count);
          const potok = Math.round(order.qtyPotok / count);
          const pack = Math.round(order.qtyPackaging / count);
          const remain = Math.max(0, orderQty - pack);
          const percent = orderQty > 0 ? Math.min(100, Math.round((pack / orderQty) * 100)) : 0;

          rows.push({
            orderId: order.id,
            mosCode: order.mosCode,
            modelCode: order.modelCode || order.orderNumber,
            brandName: order.brandName,
            colorName: cName,
            sizes: order.sizes,
            qtyOrder: orderQty,
            qtyCut: cut,
            qtyPotok: potok,
            qtyPackaging: pack,
            qtyRemaining: remain,
            completionPercent: percent
          });
        });
      }
    });

    return rows;
  }, [filteredOrders]);

  // Export to Excel / CSV based on current active mode
  const handleExport = () => {
    let headers: string[] = [];
    let dataRows: (string | number)[][] = [];
    const fileName = `otchet_${reportMode}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportMode === 'general') {
      headers = ["Bo'lim / Sex", 'Jami hajm (dona)', 'Ulushi %', 'Holat'];
      dataRows = [
        ["Buyurtmalar (Jami)", totalOrderQty, "100%", "Faol"],
        ["Bichuv (Kroy)", totalCutQty, `${Math.round((totalCutQty / (totalOrderQty || 1)) * 100)}%`, "Bajarildi"],
        ["Razdacha (Potok)", totalPotokQty, `${Math.round((totalPotokQty / (totalOrderQty || 1)) * 100)}%`, "Jarayonda"],
        ["Tikuv (Poshiv)", totalSewnQty, `${Math.round((totalSewnQty / (totalOrderQty || 1)) * 100)}%`, "Tikuvda"],
        ["Qadoq (Upakovka)", totalPackedQty, `${Math.round((totalPackedQty / (totalOrderQty || 1)) * 100)}%`, "Tayyor"],
        ["Qoldiq (Yetishmayotgan)", totalRemainingQty, `${Math.round((totalRemainingQty / (totalOrderQty || 1)) * 100)}%`, "Kutilmoqda"],
        ["Brak soni", totalDefectQty, `${((totalDefectQty / (totalOrderQty || 1)) * 100).toFixed(1)}%`, "QC"]
      ];
    } else if (reportMode === 'orders') {
      headers = ['MOS Kod', 'Artikul / Model', 'Brend', 'Buyurtma (dona)', 'Kroy', 'Razdacha', 'Poshiv', 'Upakovka', 'Brak', 'Qoldiq', 'Bajarilish %'];
      dataRows = filteredOrders.map(o => [
        o.mosCode,
        `"${o.modelCode || o.orderNumber}"`,
        `"${o.brandName}"`,
        o.qtyOrder,
        o.qtyCut,
        o.qtyPotok,
        Object.values(o.poshivSizes || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0) || o.qtyPotok,
        o.qtyPackaging,
        o.qtyDefect,
        Math.max(0, o.qtyOrder - o.qtyPackaging),
        `${o.qtyOrder > 0 ? Math.round((o.qtyPackaging / o.qtyOrder) * 100) : 0}%`
      ]);
    } else {
      headers = ['MOS Kod', 'Artikul', 'Brend', 'Rang', "O'lchamlar", 'Buyurtma', 'Kroy', 'Razdacha', 'Upakovka', 'Qoldiq', 'Bajarilish %'];
      dataRows = colorRows.map(r => [
        r.mosCode,
        `"${r.modelCode}"`,
        `"${r.brandName}"`,
        `"${r.colorName}"`,
        `"${Object.entries(r.sizes || {}).map(([s, q]) => `${s}:${q}`).join(' ')}"`,
        r.qtyOrder,
        r.qtyCut,
        r.qtyPotok,
        r.qtyPackaging,
        r.qtyRemaining,
        `${r.completionPercent}%`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...dataRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="reports-view-module">
      
      {/* 1. TOP HEADER & MODE SELECTOR */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                {setT.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {setT.subtitle}
            </p>
          </div>

          {/* Action buttons: Excel Export & Print */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/40"
            >
              <Download className="w-4 h-4" />
              <span>{setT.exportExcel}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>{setT.printReport}</span>
            </button>
          </div>
        </div>

        {/* 3 Main View Modes Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          
          {/* Mode 1: Umumiy */}
          <button
            type="button"
            onClick={() => setReportMode('general')}
            className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              reportMode === 'general'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 ring-2 ring-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>{setT.modeGeneral}</span>
          </button>

          {/* Mode 2: By Orders */}
          <button
            type="button"
            onClick={() => setReportMode('orders')}
            className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              reportMode === 'orders'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 ring-2 ring-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{setT.modeOrders}</span>
          </button>

          {/* Mode 3: By Color & Size */}
          <button
            type="button"
            onClick={() => setReportMode('colors')}
            className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              reportMode === 'colors'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 ring-2 ring-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{setT.modeColors}</span>
          </button>

        </div>

        {/* Filters bar for Modes 2 & 3 */}
        {reportMode !== 'general' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={setT.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Brand Filter */}
            <div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="all">{setT.allBrands}</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Total Filter Summary */}
            <div className="flex items-center justify-end text-xs text-slate-400 font-medium">
              <span>{lang === 'uz' ? 'Ko\'rsatilmoqda:' : 'Отображается:'} <strong className="text-white font-mono">{reportMode === 'orders' ? filteredOrders.length : colorRows.length}</strong> qator</span>
            </div>
          </div>
        )}

      </div>

      {/* 2. MODE 1: UMUMIY ZAVOD BO'LIMLARI (GENERAL DEPARTMENT SUMMARY) */}
      {reportMode === 'general' && (
        <div className="space-y-6">
          
          {/* Top Aggregate Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{setT.totalQty}</span>
              <h3 className="text-2xl font-black text-white font-mono">{totalOrderQty.toLocaleString()} dona</h3>
              <p className="text-[11px] text-slate-400">{orders.length} ta faol shartnoma</p>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">{setT.totalCut}</span>
              <h3 className="text-2xl font-black text-indigo-300 font-mono">{totalCutQty.toLocaleString()} dona</h3>
              <p className="text-[11px] text-slate-400">{Math.round((totalCutQty / (totalOrderQty || 1)) * 100)}% bichildi</p>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">{setT.totalPoshiv}</span>
              <h3 className="text-2xl font-black text-cyan-300 font-mono">{totalSewnQty.toLocaleString()} dona</h3>
              <p className="text-[11px] text-slate-400">{Math.round((totalSewnQty / (totalOrderQty || 1)) * 100)}% tikildi</p>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">{setT.totalPacked}</span>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">{totalPackedQty.toLocaleString()} dona</h3>
              <p className="text-[11px] text-emerald-400 font-bold">{overallCompletion}% tayyor (100% upakovka)</p>
            </div>

          </div>

          {/* Department Performance Table */}
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>{lang === 'uz' ? "Sexlar va Bo'limlar Kesimida Zavod Balansi" : "Баланс фабрики по цехам и участкам"}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    <th className="p-3.5">BO'LIM / SEX</th>
                    <th className="p-3.5 text-center font-mono">REJA (ZAKAZ)</th>
                    <th className="p-3.5 text-center font-mono">FAKT (DONA)</th>
                    <th className="p-3.5 text-center font-mono">FARQ (QOLDIQ)</th>
                    <th className="p-3.5">BAJARILISH %</th>
                    <th className="p-3.5 text-right">HOLATI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  
                  {/* Kroy */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-indigo-400" />
                      <span>{setT.deptKroy}</span>
                    </td>
                    <td className="p-3.5 text-center font-mono">{totalOrderQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-indigo-400">{totalCutQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono text-slate-400">+{Math.max(0, totalCutQty - totalOrderQty)}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, Math.round((totalCutQty / (totalOrderQty || 1)) * 100))}%` }} />
                        </div>
                        <span className="font-mono text-indigo-400 font-bold">{Math.round((totalCutQty / (totalOrderQty || 1)) * 100)}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">Normada</span>
                    </td>
                  </tr>

                  {/* Razdacha */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>{setT.deptPotok}</span>
                    </td>
                    <td className="p-3.5 text-center font-mono">{totalCutQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{totalPotokQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono text-slate-400">{Math.max(0, totalCutQty - totalPotokQty)}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, Math.round((totalPotokQty / (totalCutQty || 1)) * 100))}%` }} />
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">{Math.round((totalPotokQty / (totalCutQty || 1)) * 100)}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold">Tikuvda</span>
                    </td>
                  </tr>

                  {/* Poshiv */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-cyan-400" />
                      <span>{setT.deptPoshiv}</span>
                    </td>
                    <td className="p-3.5 text-center font-mono">{totalPotokQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-cyan-400">{totalSewnQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono text-slate-400">{Math.max(0, totalPotokQty - totalSewnQty)}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(100, Math.round((totalSewnQty / (totalPotokQty || 1)) * 100))}%` }} />
                        </div>
                        <span className="font-mono text-cyan-400 font-bold">{Math.round((totalSewnQty / (totalPotokQty || 1)) * 100)}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">Yig'ilmoqda</span>
                    </td>
                  </tr>

                  {/* Upakovka */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-sky-400" />
                      <span>{setT.deptUpakovka}</span>
                    </td>
                    <td className="p-3.5 text-center font-mono">{totalOrderQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-sky-400">{totalPackedQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono text-slate-400">{totalRemainingQty.toLocaleString()}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-sky-500 h-full" style={{ width: `${overallCompletion}%` }} />
                        </div>
                        <span className="font-mono text-sky-400 font-bold">{overallCompletion}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">Qadoqlandi</span>
                    </td>
                  </tr>

                  {/* Brak */}
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>{setT.deptBrak}</span>
                    </td>
                    <td className="p-3.5 text-center font-mono">-</td>
                    <td className="p-3.5 text-center font-mono font-bold text-rose-400">{totalDefectQty.toLocaleString()}</td>
                    <td className="p-3.5 text-center font-mono text-slate-400">-</td>
                    <td className="p-3.5">
                      <span className="font-mono text-rose-400 font-bold">{((totalDefectQty / (totalOrderQty || 1)) * 100).toFixed(1)}% brak</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">Nazoratda</span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 3. MODE 2: HAR BIR BUYURTMA BO'YICHA HISOBOT (PER-ORDER BREAKDOWN) */}
      {reportMode === 'orders' && (
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <span>{lang === 'uz' ? "Buyurtmalar Kesimida To'liq Ishlab Chiqarish Hisoboti" : "Производственный отчет по каждому заказу"}</span>
            </h3>
            <span className="text-xs font-mono text-indigo-400 font-bold">
              {filteredOrders.length} ta buyurtma
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-wider text-center">
                  <th className="p-3.5 text-left font-mono">MOS KOD</th>
                  <th className="p-3.5 text-left">BREND / ARTIKUL</th>
                  <th className="p-3.5">RANGLAR</th>
                  <th className="p-3.5 font-mono text-white">BUYURTMA</th>
                  <th className="p-3.5 font-mono text-indigo-400">KROY</th>
                  <th className="p-3.5 font-mono text-emerald-400">RAZDACHA</th>
                  <th className="p-3.5 font-mono text-cyan-400">POSHIV</th>
                  <th className="p-3.5 font-mono text-sky-400">UPAKOVKA</th>
                  <th className="p-3.5 font-mono text-rose-400">BRAK</th>
                  <th className="p-3.5 font-mono">QOLDIQ</th>
                  <th className="p-3.5 font-mono">% BAJARILISH</th>
                  <th className="p-3.5 text-right">HOLAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-center">
                {filteredOrders.map(order => {
                  const sewn = Object.values(order.poshivSizes || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0) || order.qtyPotok;
                  const remain = Math.max(0, order.qtyOrder - order.qtyPackaging);
                  const percent = order.qtyOrder > 0 ? Math.min(100, Math.round((order.qtyPackaging / order.qtyOrder) * 100)) : 0;
                  const isClosed = order.status === 'yakunlandi' || percent >= 100;

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 text-left font-black text-cyan-400 font-mono text-xs">
                        {order.mosCode}
                      </td>
                      <td className="p-3.5 text-left">
                        <p className="font-bold text-white text-xs leading-none">{order.brandName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{order.modelCode || '-'}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {order.color}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white text-xs">
                        {order.qtyOrder.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-indigo-400 text-xs">
                        {order.qtyCut.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400 text-xs">
                        {order.qtyPotok.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-cyan-400 text-xs">
                        {sewn.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-sky-400 text-xs">
                        {order.qtyPackaging.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-rose-500">
                        {order.qtyDefect}
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">
                        {remain.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-xs">
                        <span className={percent >= 100 ? 'text-emerald-400' : 'text-indigo-400'}>
                          {percent}%
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                          isClosed 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                            : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        }`}>
                          {isClosed ? 'YAKUNLANDI' : 'JARAYONDA'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODE 3: ZAKAZDAGI RANG VA O'LCHAMLAR BO'YICHA HISOBOT (COLOR & SIZE LEVEL BREAKDOWN) */}
      {reportMode === 'colors' && (
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              <span>{lang === 'uz' ? "Buyurtmalardagi Har Bir Rang va O'lcham Kesimidagi Hisobot" : "Отчет по цветам и размерам в разрезе заказов"}</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {colorRows.length} ta rang varianti
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-wider text-center">
                  <th className="p-3.5 text-left font-mono">MOS KOD</th>
                  <th className="p-3.5 text-left">BREND / ARTIKUL</th>
                  <th className="p-3.5 text-left">RANG NOMI</th>
                  <th className="p-3.5 text-left">O'LCHAMLAR (S, M, L, XL...)</th>
                  <th className="p-3.5 font-mono text-white">ZAKAZ</th>
                  <th className="p-3.5 font-mono text-indigo-400">KROY</th>
                  <th className="p-3.5 font-mono text-emerald-400">RAZDACHA</th>
                  <th className="p-3.5 font-mono text-sky-400">UPAKOVKA</th>
                  <th className="p-3.5 font-mono">QOLDIQ</th>
                  <th className="p-3.5 font-mono text-right">% BAJARILISH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-center">
                {colorRows.map((row, idx) => (
                  <tr key={`${row.orderId}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 text-left font-black text-cyan-400 font-mono text-xs">
                      {row.mosCode}
                    </td>
                    <td className="p-3.5 text-left">
                      <p className="font-bold text-white text-xs leading-none">{row.brandName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.modelCode}</p>
                    </td>
                    <td className="p-3.5 text-left">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-slate-200 text-xs font-bold border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        {row.colorName}
                      </span>
                    </td>
                    <td className="p-3.5 text-left">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {Object.entries(row.sizes || {}).map(([sz, qty]) => (
                          <span key={sz} className="text-[10px] font-mono bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                            <strong>{sz}</strong>: {qty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white text-xs">
                      {row.qtyOrder.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-indigo-400 text-xs">
                      {row.qtyCut.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400 text-xs">
                      {row.qtyPotok.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-sky-400 text-xs">
                      {row.qtyPackaging.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {row.qtyRemaining.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-right text-xs">
                      <span className={row.completionPercent >= 100 ? 'text-emerald-400' : 'text-indigo-400'}>
                        {row.completionPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
