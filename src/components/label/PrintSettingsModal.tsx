import React, { useState } from 'react';
import {
  X,
  Printer,
  SlidersHorizontal,
  Maximize2,
  Check,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { LABEL_SIZE_PRESETS, LabelSizePreset } from '../LabelDesignerView';

export interface PrinterCalibrationSettings {
  labelWidthMm: number;        // default 40
  labelHeightMm: number;       // default 58
  offsetXmm: number;           // horizontal calibration offset in mm (e.g. -10 to +10, default 0)
  offsetYmm: number;           // vertical calibration offset in mm (e.g. -10 to +10, default 0)
  paddingMm: number;           // inner safety padding in mm (default 2)
  gapMm: number;               // label gap pitch in mm (default 2)
  printerModel: 'xprinter' | 'godex' | 'tsc' | 'zebra' | 'other';
  darknessContrast: 'normal' | 'high' | 'ultra'; // thermal print contrast
  orientation: 'portrait' | 'landscape';
}

export const DEFAULT_PRINTER_SETTINGS: PrinterCalibrationSettings = {
  labelWidthMm: 40,
  labelHeightMm: 58,
  offsetXmm: 0,
  offsetYmm: 0,
  paddingMm: 2,
  gapMm: 2,
  printerModel: 'xprinter',
  darknessContrast: 'high',
  orientation: 'portrait'
};

export const PRINTER_MODELS = [
  { id: 'xprinter', name: 'Xprinter XP-365B / XP-420B', desc: 'Tekstil korxonalari uchun eng ommabop termo printer' },
  { id: 'godex', name: 'Godex G500 / RT700 / GE300', desc: 'Sanoat termo-transfer va termo printeri' },
  { id: 'tsc', name: 'TSC TE200 / TE244 / DA210', desc: 'Yuqori tezlikdagi shtrix-kod printeri' },
  { id: 'zebra', name: 'Zebra ZD888 / ZD220 / ZT230', desc: 'Xalqaro standartdagi professional printer' },
  { id: 'other', name: 'Boshqa termo printer (Custom)', desc: 'Ixtiyoriy drayver va Windows printeri' }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: PrinterCalibrationSettings;
  onSave: (newSettings: PrinterCalibrationSettings) => void;
  lang?: 'uz' | 'ru';
}

export default function PrintSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  lang = 'uz'
}: Props) {
  const [activeTab, setActiveTab] = useState<'dimensions' | 'calibration' | 'printer'>('dimensions');
  const [tempSettings, setTempSettings] = useState<PrinterCalibrationSettings>(settings);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: LabelSizePreset) => {
    setTempSettings(prev => ({
      ...prev,
      labelWidthMm: preset.widthMm,
      labelHeightMm: preset.heightMm,
      orientation: preset.widthMm > preset.heightMm ? 'landscape' : 'portrait'
    }));
  };

  const handleResetDefaults = () => {
    setTempSettings(DEFAULT_PRINTER_SETTINGS);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('tex_erp_printer_calibration_settings', JSON.stringify(tempSettings));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    onSave(tempSettings);
    setSaveSuccessNotice(lang === 'uz' ? "Sozlamalar saqlandi va brauzer xotirasiga yozildi!" : "Настройки сохранены в памяти браузера!");
    setTimeout(() => {
      setSaveSuccessNotice(null);
      onClose();
    }, 1200);
  };

  const handleRunCalibrationTest = () => {
    // Vaqtinchalik sozlamalar bilan sinov chop etish
    onSave(tempSettings);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Chop Etish Sozlamalari & Kalibratsiya</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  {tempSettings.labelWidthMm} x {tempSettings.labelHeightMm} mm
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Stiker o'lchamlari, termo printer siljishi (X/Y) va doimiy xotira (localStorage)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex bg-slate-950 px-6 pt-3 border-b border-slate-800 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('dimensions')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dimensions'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
            <span>1. Stiker O'lchamlari (mm)</span>
          </button>

          <button
            onClick={() => setActiveTab('calibration')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'calibration'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>2. Kalibratsiya & Siljish (X / Y)</span>
          </button>

          <button
            onClick={() => setActiveTab('printer')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'printer'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>3. Printer Modeli & Kontrast</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {saveSuccessNotice && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* TAB 1: STIKER O'LCHAMLARI */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              
              {/* Standart andazalar */}
              <div>
                <label className="font-bold text-slate-200 block mb-2">
                  Standart Termo Qog'oz Shablonlari (1-klikda o'rnatish):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LABEL_SIZE_PRESETS.map((preset) => {
                    const isSelected = tempSettings.labelWidthMm === preset.widthMm && tempSettings.labelHeightMm === preset.heightMm;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {preset.isPopular && (
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold">
                            Asosiy
                          </span>
                        )}
                        <div className="font-black text-sm text-slate-100">{preset.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{preset.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Qo'lda kiritish (Eni va Bo'yi mm) */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span>Aniq O'lchamlarni Millimetrda (mm) Qo'lda Kiritish:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Eni (Width) */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-300">Stiker Eni (Width):</label>
                      <span className="font-mono text-cyan-400 font-bold">{tempSettings.labelWidthMm} mm</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min="15"
                        max="200"
                        value={tempSettings.labelWidthMm}
                        onChange={(e) => setTempSettings({ ...tempSettings, labelWidthMm: Math.max(10, parseInt(e.target.value, 10) || 10) })}
                        className="w-24 p-2 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono font-black text-base text-cyan-300 focus:border-cyan-500 focus:outline-none"
                      />
                      <input
                        type="range"
                        min="20"
                        max="120"
                        value={tempSettings.labelWidthMm}
                        onChange={(e) => setTempSettings({ ...tempSettings, labelWidthMm: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Bo'yi (Height) */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-300">Stiker Bo'yi (Height):</label>
                      <span className="font-mono text-cyan-400 font-bold">{tempSettings.labelHeightMm} mm</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min="15"
                        max="250"
                        value={tempSettings.labelHeightMm}
                        onChange={(e) => setTempSettings({ ...tempSettings, labelHeightMm: Math.max(10, parseInt(e.target.value, 10) || 10) })}
                        className="w-24 p-2 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono font-black text-base text-cyan-300 focus:border-cyan-500 focus:outline-none"
                      />
                      <input
                        type="range"
                        min="20"
                        max="150"
                        value={tempSettings.labelHeightMm}
                        onChange={(e) => setTempSettings({ ...tempSettings, labelHeightMm: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Ichki chet qoldig'i (Padding mm) */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-300">Ichki chet qoldig'i (Padding):</label>
                      <span className="font-mono text-emerald-400 font-bold">{tempSettings.paddingMm} mm</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={tempSettings.paddingMm}
                        onChange={(e) => setTempSettings({ ...tempSettings, paddingMm: parseFloat(e.target.value) })}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <span className="w-12 text-center font-mono font-bold text-slate-300">{tempSettings.paddingMm} mm</span>
                    </div>
                  </div>

                  {/* Stiker oralig'i (Gap mm) */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-300">Stikerlar orasidagi masofa (Gap):</label>
                      <span className="font-mono text-emerald-400 font-bold">{tempSettings.gapMm} mm</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="0.5"
                        value={tempSettings.gapMm}
                        onChange={(e) => setTempSettings({ ...tempSettings, gapMm: parseFloat(e.target.value) })}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <span className="w-12 text-center font-mono font-bold text-slate-300">{tempSettings.gapMm} mm</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: KALIBRATSIYA VA SILJISHLAR (X / Y OFFSETS) */}
          {activeTab === 'calibration' && (
            <div className="space-y-4">
              
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Printer Boshchasi Kalibratsiyasi (Siljish sozlamalari):</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Agar termo printer stikerni chapga/o'ngga yoki tepaga/pastga surib chop etayotgan bo'lsa, quyidagi mm ko'rsatkichlari bilan markazga to'g'irlab oling.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* Sliders: X va Y */}
                <div className="sm:col-span-7 space-y-4">
                  {/* Gorizontal X offset */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">Gorizontal siljish (X Offset):</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        tempSettings.offsetXmm === 0 ? 'bg-slate-800 text-slate-300' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {tempSettings.offsetXmm > 0 ? `+${tempSettings.offsetXmm}` : tempSettings.offsetXmm} mm
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Manfiy (-) chapga siljitadi, musbat (+) o'ngga siljitadi
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500">-10mm</span>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.5"
                        value={tempSettings.offsetXmm}
                        onChange={(e) => setTempSettings({ ...tempSettings, offsetXmm: parseFloat(e.target.value) })}
                        className="flex-1 accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-500">+10mm</span>
                    </div>
                    <div className="flex justify-center gap-1 pt-1">
                      {[-2, -1, 0, 1, 2].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setTempSettings({ ...tempSettings, offsetXmm: val })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                            tempSettings.offsetXmm === val ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {val === 0 ? '0' : val > 0 ? `+${val}` : val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vertikal Y offset */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">Vertikal siljish (Y Offset):</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        tempSettings.offsetYmm === 0 ? 'bg-slate-800 text-slate-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {tempSettings.offsetYmm > 0 ? `+${tempSettings.offsetYmm}` : tempSettings.offsetYmm} mm
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Manfiy (-) yuqoriga siljitadi, musbat (+) pastga siljitadi
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500">-10mm</span>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.5"
                        value={tempSettings.offsetYmm}
                        onChange={(e) => setTempSettings({ ...tempSettings, offsetYmm: parseFloat(e.target.value) })}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-500">+10mm</span>
                    </div>
                    <div className="flex justify-center gap-1 pt-1">
                      {[-2, -1, 0, 1, 2].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setTempSettings({ ...tempSettings, offsetYmm: val })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                            tempSettings.offsetYmm === val ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {val === 0 ? '0' : val > 0 ? `+${val}` : val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visual Calibration Target Box */}
                <div className="sm:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-[11px] font-bold text-slate-300 mb-2">
                    Vizual Kalibratsiya Markazi (Target)
                  </div>
                  
                  {/* Target Graphic */}
                  <div className="w-36 h-48 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg relative overflow-hidden flex items-center justify-center shadow-inner">
                    {/* Center crosshairs */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-px bg-slate-700/60" />
                      <div className="h-full w-px bg-slate-700/60 absolute" />
                    </div>

                    {/* Stiker ramkasi (Real siljish bilan) */}
                    <div 
                      className="w-28 h-40 bg-white/95 rounded shadow-md border border-cyan-400 p-1.5 flex flex-col justify-between text-black transition-transform duration-150"
                      style={{
                        transform: `translate(${tempSettings.offsetXmm * 2.2}px, ${tempSettings.offsetYmm * 2.2}px)`
                      }}
                    >
                      <div className="text-[8px] font-black leading-none text-center">Размер S</div>
                      <div className="text-[6.5px] font-bold text-center text-slate-700">40x58 mm</div>
                      <div className="h-4 bg-black/10 rounded flex items-center justify-center text-[7px] font-mono">
                        ||||||||||||||
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-2 font-mono">
                    Siljish: X={tempSettings.offsetXmm}mm, Y={tempSettings.offsetYmm}mm
                  </div>
                </div>

              </div>

              {/* Kalibratsiya testi tugmasi */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Kalibratsiyani tekshirish (Sinov varaqasi):</div>
                  <div className="text-[10px] text-slate-400">Joriy siljish parametrlarida 1 dona sinov stikerini chop etadi</div>
                </div>
                <button
                  type="button"
                  onClick={handleRunCalibrationTest}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Sinov Chop Etish</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: PRINTER MODELI VA KONTRAST */}
          {activeTab === 'printer' && (
            <div className="space-y-4">
              
              <div>
                <label className="font-bold text-slate-200 block mb-2">
                  Ishlatilayotgan Termo Printer Modeli:
                </label>
                <div className="space-y-2">
                  {PRINTER_MODELS.map(pm => {
                    const isSelected = tempSettings.printerModel === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setTempSettings({ ...tempSettings, printerModel: pm.id as any })}
                        className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                            <span>{pm.name}</span>
                            {isSelected && <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 rounded text-[9px] font-black">Faol</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{pm.desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Termo Zichlik / Qoralik kontrasti */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <label className="font-bold text-slate-200 block">
                  Termo Boshcha Zichligi va Kontrasti (Darkness):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', name: 'Standart', desc: 'Oddiy qora' },
                    { id: 'high', name: 'Yuqori (150%)', desc: 'Toza shtrix-kod' },
                    { id: 'ultra', name: 'Maksimal (200%)', desc: 'Qop-qora tekstil' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTempSettings({ ...tempSettings, darknessContrast: c.id as any })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        tempSettings.darknessContrast === c.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-black text-xs">{c.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Standart 40x58 mm va 0 siljishga qaytarish"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Standartga tiklash (40x58)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Bekor qilish
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 border border-emerald-400/40"
            >
              <Check className="w-4 h-4 text-emerald-100" />
              <span>Sozlamalarni Saqlash (localStorage)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
