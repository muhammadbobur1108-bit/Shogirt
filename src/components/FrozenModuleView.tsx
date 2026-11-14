import React from 'react';
import { Lock, Clock, ArrowRight, ShieldCheck, Layers } from 'lucide-react';
import { Language } from '../locales';

interface FrozenModuleViewProps {
  titleRu: string;
  titleUz: string;
  lang: Language;
  onGoToOrders: () => void;
}

export default function FrozenModuleView({
  titleRu,
  titleUz,
  lang,
  onGoToOrders
}: FrozenModuleViewProps) {
  const isUz = lang === 'uz';

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 max-w-4xl mx-auto py-10">
      <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-slate-900 border border-amber-500/40 rounded-3xl flex items-center justify-center text-amber-400 shadow-xl">
            <Lock className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2.5 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{isUz ? 'BO‘LIM VAQTINCA MUZLATILGAN' : 'РАЗДЕЛ ВРЕМЕННО ЗАМОРОЖЕН'}</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight pt-1">
            {isUz ? `«${titleUz}» bo‘limi muzlatilgan` : `Раздел «${titleRu}» заморожен`}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isUz
              ? "Hozirda tizimdagi barca ma'lumotlar faqat «Zakazlar → Размеры по заказу» bo‘limi orqali kiritiladi va Dasbordga uzatiladi. Qolgan yordamci bo‘limlar texnik yangilanisgaca vaqtinca muzlatildi."
              : 'В настоящий момент все производственные данные вводятся исключительно в разделе «Заказы → Размеры по заказу» и автоматически синхронизируются с Дашбордом. Остальные модули временно заморожены.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2 text-xs font-mono">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-2 justify-center text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{isUz ? 'Manba: Размеры по заказу' : 'Источник: Размеры по заказу'}</span>
          </div>
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-2 justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>{isUz ? 'Ma’lumotlar xavfsiz' : 'Данные защищены'}</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToOrders}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <span>{isUz ? 'Zakazlar (Размеры по заказу) ga o‘tis' : 'Перейти в Заказы (Размеры по заказу)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
