import React from 'react';
import { Order, InventoryItem, DefectItem } from '../types';
import { Language } from '../locales';
import { 
  BarChart3, 
  Lock, 
  Clock, 
  ShieldCheck, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface ReportsViewProps {
  orders?: Order[];
  inventory?: InventoryItem[];
  defects?: DefectItem[];
  lang: Language;
}

export default function ReportsView({ lang }: ReportsViewProps) {
  const isUz = lang === 'uz';

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 max-w-4xl mx-auto py-10" id="reports-view-container">
      {/* Frozen Placeholder Card */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
        
        {/* Cyber glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-center">
          <div className="w-20 h-20 bg-indigo-950/60 border border-indigo-500/40 rounded-3xl flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/50">
            <Lock className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{isUz ? "REGLAMENT YANGILANIS REJIMI (MUZLATILGAN)" : "РЕГЛАМЕНТНОЕ ОБНОВЛЕНИЕ (ЗАМОРОЖЕНО)"}</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight pt-2">
            {isUz ? "«Hisobotlar va Analitika» Bo'limi Vaqtinca Muzlatilgan" : "Раздел «Отчеты и Аналитика» временно заморожен"}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isUz 
              ? "Uscbu modul texnik yangilanish va optimallashtiris rejimida. Barca umumiy ishlab ciqaris hisobotlari, sexlar samaradorlik grafiklari va eksport modullari yangi ma'lumotlar bazasi integrasiyasidan so'ng qayta faollashtiriladi."
              : "Данный модуль находится на плановом регламентном обновлении. Все сводные отчеты по фабрике, графики эффективности цехов и экспорт данных станут доступны после завершения синхронизации обновленной базы данных."}
          </p>
        </div>

        {/* Informational badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-4 text-xs font-mono">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-2.5 justify-center">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">{isUz ? "Grafiklar: Muzlatilgan" : "Графики: Заморожены"}</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-2.5 justify-center">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">{isUz ? "Eksport: To'xtatilgan" : "Экспорт: Приостановлен"}</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-2.5 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">{isUz ? "Tizim: Xavfsiz" : "Система: Защищена"}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
