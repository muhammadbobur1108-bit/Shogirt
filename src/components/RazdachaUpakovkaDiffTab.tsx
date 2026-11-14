import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  ArrowLeftRight,
  Download,
  FileText,
  Layers,
  Ruler
} from 'lucide-react';
import {
  FactoryLedgerRow,
  OrderSizeMatrix,
  getPopulatedSizes
} from '../lib/ordersSizeStore';

interface RazdachaUpakovkaDiffTabProps {
  rows: FactoryLedgerRow[];
  sizeMatrices: Record<string, OrderSizeMatrix>;
  selectedMonth: string;
  onOpenInSizeMatrix: (rowId: string) => void;
  registerCyrillicFonts: (doc: jsPDF) => Promise<string>;
  onNotice: (msg: string) => void;
}

function DiffChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-950 border border-cyan-500/50 rounded-xl px-3 py-2 shadow-2xl text-xs">
      {label && <p className="font-bold text-cyan-300 mb-1 border-b border-slate-800 pb-1">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-slate-100 font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: entry.color || '#38bdf8' }} />
            <span>{entry.name}:</span>
          </span>
          <span className="font-mono font-black text-white">{Number(entry.value || 0).toLocaleString()} шт</span>
        </div>
      ))}
    </div>
  );
}

export default function RazdachaUpakovkaDiffTab({
  rows,
  sizeMatrices,
  selectedMonth,
  onOpenInSizeMatrix,
  registerCyrillicFonts,
  onNotice
}: RazdachaUpakovkaDiffTabProps) {
  const [groupByOrder, setGroupByOrder] = useState(false);

  const summary = useMemo(() => {
    let distQty = 0;
    let packQty = 0;
    let defectQty = 0;
    rows.forEach(r => {
      distQty += r.qtyDistribution || 0;
      packQty += r.qtyPackaging || 0;
      defectQty += r.qtyDefect || 0;
    });
    const pureDiff = distQty - packQty;
    const pureDiffPct = distQty > 0 ? (pureDiff / distQty) * 100 : 0;
    const packOfDistPct = distQty > 0 ? (packQty / distQty) * 100 : 0;

    const withDefectDiff = distQty - (packQty + defectQty);
    const withDefectDiffPct = distQty > 0 ? (withDefectDiff / distQty) * 100 : 0;

    return {
      distQty,
      packQty,
      defectQty,
      pureDiff,
      pureDiffPct,
      packOfDistPct,
      withDefectDiff,
      withDefectDiffPct
    };
  }, [rows]);

  const groupedOrderRows = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        firstRowId: string;
        month: string;
        brand: string;
        orderNo: string;
        model: string;
        colorsCount: number;
        distQty: number;
        packQty: number;
        defectQty: number;
      }
    >();
    rows.forEach(r => {
      const k = r.orderNo;
      const existing = map.get(k);
      if (!existing) {
        map.set(k, {
          key: k,
          firstRowId: r.id,
          month: r.month,
          brand: r.brand || '—',
          orderNo: r.orderNo,
          model: r.model,
          colorsCount: 1,
          distQty: r.qtyDistribution || 0,
          packQty: r.qtyPackaging || 0,
          defectQty: r.qtyDefect || 0
        });
      } else {
        existing.colorsCount += 1;
        existing.distQty += r.qtyDistribution || 0;
        existing.packQty += r.qtyPackaging || 0;
        existing.defectQty += r.qtyDefect || 0;
      }
    });
    return Array.from(map.values());
  }, [rows]);

  const chartData = useMemo(() => {
    const source = groupByOrder
      ? groupedOrderRows.map(g => ({
          name: g.orderNo,
          Раздача: g.distQty,
          Упаковка: g.packQty,
          Разница: g.distQty - g.packQty
        }))
      : rows.map(r => ({
          name: `${r.orderNo} (${r.color}${r.rost ? ' ' + r.rost : ''})`,
          Раздача: r.qtyDistribution || 0,
          Упаковка: r.qtyPackaging || 0,
          Разница: (r.qtyDistribution || 0) - (r.qtyPackaging || 0)
        }));
    return source.slice(0, 16);
  }, [groupByOrder, groupedOrderRows, rows]);

  const handleExportExcel = () => {
    const head = [
      '№',
      'Месяц',
      'Бренд',
      'Заказ №',
      'Модель',
      'Цвет',
      'Рост',
      'Раздача (шт)',
      'Упаковка (шт)',
      'Брак (шт)',
      'Разница Разд−Упак (шт)',
      'Разница Разд−Упак (%)',
      'Разница с браком (шт)',
      'Разница с браком (%)',
      'По размерам (Разд−Упак)'
    ];

    const body = rows.map((r, idx) => {
      const dist = r.qtyDistribution || 0;
      const pack = r.qtyPackaging || 0;
      const def = r.qtyDefect || 0;
      const pureDiff = dist - pack;
      const pureDiffPct = dist > 0 ? ((pureDiff / dist) * 100).toFixed(1) : '0.0';
      const defDiff = dist - (pack + def);
      const defDiffPct = dist > 0 ? ((defDiff / dist) * 100).toFixed(1) : '0.0';

      const m = sizeMatrices[r.id];
      const popSizes = getPopulatedSizes(m);
      const sizeStr = popSizes
        .map(sz => {
          const c = m?.values?.[sz];
          if (!c) return '';
          const d = (c.dist || 0) - (c.pack || 0);
          const pct = c.dist > 0 ? ((d / c.dist) * 100).toFixed(1) : '0.0';
          return `${sz}: ${d} (${pct}%)`;
        })
        .filter(Boolean)
        .join('; ');

      return [
        idx + 1,
        r.month,
        r.brand || '—',
        r.orderNo,
        r.model,
        r.color,
        r.rost || '—',
        dist,
        pack,
        def,
        pureDiff,
        `${pureDiffPct}%`,
        defDiff,
        `${defDiffPct}%`,
        sizeStr
      ];
    });

    const foot = [
      'ИТОГО',
      '',
      '',
      '',
      '',
      '',
      '',
      summary.distQty,
      summary.packQty,
      summary.defectQty,
      summary.pureDiff,
      `${summary.pureDiffPct.toFixed(1)}%`,
      summary.withDefectDiff,
      `${summary.withDefectDiffPct.toFixed(1)}%`,
      ''
    ];

    const ws = XLSX.utils.aoa_to_sheet([head, ...body, foot]);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 15 },
      { wch: 14 },
      { wch: 24 },
      { wch: 16 },
      { wch: 11 },
      { wch: 14 },
      { wch: 14 },
      { wch: 11 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 42 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Разница Разд-Упак');
    XLSX.writeFile(wb, `Разница_Раздача_Упаковка_${new Date().toISOString().split('T')[0]}.xlsx`);
    onNotice('Отчет по разнице (Раздача − Упаковка) скачан в Excel!');
  };

  const handleExportPdf = async () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const fontName = await registerCyrillicFonts(doc);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('ОТЧЕТ: РАЗНИЦА МЕЖДУ РАЗДАЧЕЙ И УПАКОВКОЙ (ШТ И %)', 12, 14);

      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Период: ${selectedMonth === 'all' ? 'Все месяцы' : selectedMonth}   |   Раздача: ${summary.distQty.toLocaleString()} шт   |   Упаковка: ${summary.packQty.toLocaleString()} шт   |   Разница: ${summary.pureDiff.toLocaleString()} шт (${summary.pureDiffPct.toFixed(1)}%)`,
        12,
        20
      );

      const head = [[
        '№',
        'Бренд',
        'Заказ №',
        'Модель',
        'Цвет',
        'Рост',
        'Раздача',
        'Упаковка',
        'Брак',
        'Разница (шт)',
        'Разница (%)',
        'С браком (шт / %)'
      ]];

      const body = rows.map((r, idx) => {
        const dist = r.qtyDistribution || 0;
        const pack = r.qtyPackaging || 0;
        const def = r.qtyDefect || 0;
        const diff = dist - pack;
        const diffPct = dist > 0 ? ((diff / dist) * 100).toFixed(1) : '0.0';
        const dDef = dist - (pack + def);
        const dDefPct = dist > 0 ? ((dDef / dist) * 100).toFixed(1) : '0.0';
        return [
          String(idx + 1),
          r.brand || '—',
          r.orderNo,
          r.model,
          r.color,
          r.rost || '—',
          dist.toLocaleString(),
          pack.toLocaleString(),
          def.toLocaleString(),
          diff.toLocaleString(),
          `${diffPct}%`,
          `${dDef.toLocaleString()} (${dDefPct}%)`
        ];
      });

      const foot = [[
        '',
        'ИТОГО',
        '',
        '',
        '',
        '',
        summary.distQty.toLocaleString(),
        summary.packQty.toLocaleString(),
        summary.defectQty.toLocaleString(),
        summary.pureDiff.toLocaleString(),
        `${summary.pureDiffPct.toFixed(1)}%`,
        `${summary.withDefectDiff.toLocaleString()} (${summary.withDefectDiffPct.toFixed(1)}%)`
      ]];

      autoTable(doc, {
        startY: 24,
        head,
        body,
        foot,
        theme: 'grid',
        styles: { font: fontName, fontSize: 7.5, cellPadding: 1.5, textColor: [15, 23, 42] },
        headStyles: { fillColor: [254, 240, 138], textColor: [15, 23, 42], fontStyle: 'bold', halign: 'center' },
        footStyles: { fillColor: [254, 240, 138], textColor: [15, 23, 42], fontStyle: 'bold' },
        margin: { left: 10, right: 10 }
      });

      doc.save(`Разница_Раздача_Упаковка_${new Date().toISOString().split('T')[0]}.pdf`);
      onNotice('PDF отчет по разнице скачан!');
    } catch (e) {
      console.error(e);
      alert('Ошибка при создании PDF!');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Заголовок и кнопки */}
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-300">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">
                РАЗНИЦА: РАЗДАЧА И УПАКОВКА (В ШТУКАХ И ПРОЦЕНТАХ)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Детальный контроль расхождения между выданным количеством (Раздача) и упакованной продукцией (Упаковка) по заказам, цветам, ростам и размерам.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950 border border-slate-700 rounded-xl p-1 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setGroupByOrder(false)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                  !groupByOrder ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                По цветам / ростам ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setGroupByOrder(true)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                  groupByOrder ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Сводно по заказам ({groupedOrderRows.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* 4 KPI карточки */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#0e1a38] border border-blue-500/40 rounded-xl p-3.5">
            <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider block">
              ВСЕГО РАЗДАЧА
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {summary.distQty.toLocaleString()} <span className="text-sm text-slate-300">шт</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Выдано в цех по всем строкам</div>
          </div>

          <div className="bg-[#0e1a38] border border-emerald-500/40 rounded-xl p-3.5">
            <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider block">
              ВСЕГО УПАКОВКА
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {summary.packQty.toLocaleString()} <span className="text-sm text-emerald-200">({summary.packOfDistPct.toFixed(1)}%)</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Брак: <strong className="text-rose-300">{summary.defectQty.toLocaleString()} шт</strong>
            </div>
          </div>

          <div className={`bg-[#0e1a38] border rounded-xl p-3.5 ${summary.pureDiff < 0 ? 'border-rose-500/60' : 'border-amber-500/50'}`}>
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
              РАЗНИЦА (РАЗДАЧА − УПАКОВКА) В ШТ
            </span>
            <div className={`text-2xl font-black font-mono mt-1 ${summary.pureDiff < 0 ? 'text-rose-400' : 'text-amber-300'}`}>
              {summary.pureDiff > 0 ? `+${summary.pureDiff.toLocaleString()}` : summary.pureDiff.toLocaleString()} шт
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              С учетом брака (Разд − Общ.упак): <strong className="text-white">{summary.withDefectDiff.toLocaleString()} шт</strong>
            </div>
          </div>

          <div className={`bg-[#0e1a38] border rounded-xl p-3.5 ${summary.pureDiffPct < 0 ? 'border-rose-500/60' : 'border-purple-500/50'}`}>
            <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider block">
              РАЗНИЦА В ПРОЦЕНТАХ (%)
            </span>
            <div className={`text-2xl font-black font-mono mt-1 ${summary.pureDiffPct < 0 ? 'text-rose-400' : 'text-purple-300'}`}>
              {summary.pureDiffPct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              С учетом брака: <strong className="text-white">{summary.withDefectDiffPct.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* График сравнения */}
      {chartData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Сравнение: Раздача vs Упаковка и Разница (шт)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  stroke="#cbd5e1"
                  tick={{ fill: '#f1f5f9', fontSize: 10 }}
                  angle={-18}
                  textAnchor="end"
                  height={55}
                />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#e2e8f0', fontSize: 11 }} />
                <Tooltip content={<DiffChartTooltip />} />
                <Legend wrapperStyle={{ color: '#f8fafc', fontSize: '12px' }} />
                <Bar dataKey="Раздача" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Упаковка" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Разница" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Таблица детальной разницы */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[68vh]">
          {groupByOrder ? (
            <table className="w-full text-left text-xs text-slate-100 font-mono">
              <thead className="sticky top-0 bg-[#080e1d] text-slate-200 border-b border-slate-700 text-[11px] uppercase">
                <tr>
                  <th className="p-2.5 text-center">№</th>
                  <th className="p-2.5 text-cyan-300">Месяц</th>
                  <th className="p-2.5 text-amber-300">Бренд</th>
                  <th className="p-2.5 text-cyan-400">Заказ №</th>
                  <th className="p-2.5">Модель</th>
                  <th className="p-2.5 text-center">Цвета/роста</th>
                  <th className="p-2.5 text-right text-sky-300">Раздача (шт)</th>
                  <th className="p-2.5 text-right text-emerald-400">Упаковка (шт)</th>
                  <th className="p-2.5 text-right text-rose-400">Брак (шт)</th>
                  <th className="p-2.5 text-right text-amber-300">Разница (шт)</th>
                  <th className="p-2.5 text-center text-purple-300">Разница (%)</th>
                  <th className="p-2.5 text-right text-slate-200">С браком (шт / %)</th>
                  <th className="p-2.5 text-center">Открыть</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {groupedOrderRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-400 font-sans">
                      Нет данных. Введите заказы в разделе «Размеры по заказу».
                    </td>
                  </tr>
                ) : (
                  groupedOrderRows.map((g, idx) => {
                    const diff = g.distQty - g.packQty;
                    const diffPct = g.distQty > 0 ? (diff / g.distQty) * 100 : 0;
                    const defDiff = g.distQty - (g.packQty + g.defectQty);
                    const defDiffPct = g.distQty > 0 ? (defDiff / g.distQty) * 100 : 0;

                    return (
                      <tr key={g.key} className="hover:bg-slate-800/50 bg-[#0d162e]/60">
                        <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-sans text-cyan-200">{g.month}</td>
                        <td className="p-2.5 font-sans font-bold text-amber-300">{g.brand}</td>
                        <td className="p-2.5 font-black text-cyan-300">{g.orderNo}</td>
                        <td className="p-2.5 font-sans text-white truncate max-w-[180px]">{g.model}</td>
                        <td className="p-2.5 text-center">{g.colorsCount}</td>
                        <td className="p-2.5 text-right font-bold text-sky-300">{g.distQty.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-400">{g.packQty.toLocaleString()}</td>
                        <td className="p-2.5 text-right text-rose-400">{g.defectQty > 0 ? g.defectQty.toLocaleString() : '0'}</td>
                        <td className={`p-2.5 text-right font-black ${diff < 0 ? 'text-rose-400 bg-rose-950/40' : diff === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                        </td>
                        <td className={`p-2.5 text-center font-black ${diffPct < 0 ? 'text-rose-400' : 'text-purple-300'}`}>
                          {diffPct.toFixed(1)}%
                        </td>
                        <td className="p-2.5 text-right text-slate-200">
                          {defDiff.toLocaleString()} ({defDiffPct.toFixed(1)}%)
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenInSizeMatrix(g.firstRowId)}
                            className="px-2 py-1 bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 rounded text-[11px] font-sans font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Ruler className="w-3 h-3" />
                            <span>Размеры</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-slate-100 font-mono">
              <thead className="sticky top-0 bg-[#080e1d] text-slate-200 border-b border-slate-700 text-[11px] uppercase">
                <tr>
                  <th className="p-2.5 text-center">№</th>
                  <th className="p-2.5 text-amber-300">Бренд</th>
                  <th className="p-2.5 text-cyan-400">Заказ №</th>
                  <th className="p-2.5">Модель</th>
                  <th className="p-2.5 text-amber-200">Цвет</th>
                  <th className="p-2.5 text-cyan-200">Рост</th>
                  <th className="p-2.5 text-right text-sky-300">Раздача</th>
                  <th className="p-2.5 text-right text-emerald-400">Упаковка</th>
                  <th className="p-2.5 text-right text-rose-400">Брак</th>
                  <th className="p-2.5 text-right text-amber-300">Разница (шт)</th>
                  <th className="p-2.5 text-center text-purple-300">Разница (%)</th>
                  <th className="p-2.5 text-right text-slate-200">С браком (шт / %)</th>
                  <th className="p-2.5 text-slate-300">По размерам (только заполненные)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-400 font-sans">
                      Нет данных. Введите заказы в разделе «Размеры по заказу».
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const dist = r.qtyDistribution || 0;
                    const pack = r.qtyPackaging || 0;
                    const def = r.qtyDefect || 0;
                    const diff = dist - pack;
                    const diffPct = dist > 0 ? (diff / dist) * 100 : 0;
                    const defDiff = dist - (pack + def);
                    const defDiffPct = dist > 0 ? (defDiff / dist) * 100 : 0;

                    const m = sizeMatrices[r.id];
                    const popSizes = getPopulatedSizes(m);

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/50 bg-[#0d162e]/60">
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-sans font-bold text-amber-300">{r.brand || '—'}</td>
                        <td className="p-2 font-black text-cyan-300">
                          <button
                            type="button"
                            onClick={() => onOpenInSizeMatrix(r.id)}
                            className="hover:underline cursor-pointer text-left"
                          >
                            {r.orderNo}
                          </button>
                        </td>
                        <td className="p-2 font-sans text-white truncate max-w-[160px]">{r.model}</td>
                        <td className="p-2 font-sans text-amber-200">{r.color}</td>
                        <td className="p-2 text-cyan-200">{r.rost || '—'}</td>
                        <td className="p-2 text-right font-bold text-sky-300">{dist.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold text-emerald-400">{pack.toLocaleString()}</td>
                        <td className="p-2 text-right text-rose-400">{def > 0 ? def.toLocaleString() : '0'}</td>
                        <td className={`p-2 text-right font-black ${diff < 0 ? 'text-rose-400 bg-rose-950/40' : diff === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                        </td>
                        <td className={`p-2 text-center font-black ${diffPct < 0 ? 'text-rose-400' : 'text-purple-300'}`}>
                          {diffPct.toFixed(1)}%
                        </td>
                        <td className="p-2 text-right text-slate-200 whitespace-nowrap">
                          {defDiff.toLocaleString()} ({defDiffPct.toFixed(1)}%)
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {popSizes.length === 0 ? (
                              <span className="text-slate-500 font-sans">—</span>
                            ) : (
                              popSizes.map(sz => {
                                const c = m?.values?.[sz];
                                if (!c) return null;
                                const d = (c.dist || 0) - (c.pack || 0);
                                const pct = c.dist > 0 ? ((d / c.dist) * 100).toFixed(0) : '0';
                                return (
                                  <span
                                    key={sz}
                                    className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                      d < 0
                                        ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                                        : d === 0
                                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                                        : 'bg-slate-900 border-amber-500/40 text-amber-200'
                                    }`}
                                  >
                                    {sz}: {d > 0 ? `+${d}` : d} ({pct}%)
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="bg-[#080e1d] border-t-2 border-slate-700 font-black text-white">
                  <tr>
                    <td colSpan={6} className="p-2.5 text-right font-sans">ИТОГО:</td>
                    <td className="p-2.5 text-right text-sky-300">{summary.distQty.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-emerald-400">{summary.packQty.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-rose-400">{summary.defectQty.toLocaleString()}</td>
                    <td className={`p-2.5 text-right ${summary.pureDiff < 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                      {summary.pureDiff > 0 ? `+${summary.pureDiff.toLocaleString()}` : summary.pureDiff.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center text-purple-300">{summary.pureDiffPct.toFixed(1)}%</td>
                    <td className="p-2.5 text-right">
                      {summary.withDefectDiff.toLocaleString()} ({summary.withDefectDiffPct.toFixed(1)}%)
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
