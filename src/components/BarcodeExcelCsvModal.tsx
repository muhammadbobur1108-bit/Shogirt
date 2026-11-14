/**
 * Chust Textile ERP - Excel va CSV dan Shtrix-kod Navbatiga Import Qilish Modali
 * 
 * Model, Size, Quantity (Chop navbati), Color va Barcode ustunlarini avtomatik
 * aniqlaydi va foydalanuvchiga tasdiqlab navbatga qo'shish imkonini beradi.
 */

import React, { useState, useRef, useId } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  Download, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Sparkles,
  Hash,
  Palette,
  Ruler,
  PackageCheck
} from 'lucide-react';
import { BarcodeItem } from '../lib/barcode/types';
import { 
  ParsedSheetData, 
  ColumnMapping, 
  parseExcelOrCsvFile, 
  convertMappedRowsToBarcodeItems, 
  generateSampleBarcodeTemplate 
} from '../lib/barcode/excelCsvParser';

interface BarcodeExcelCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToQueue: (items: BarcodeItem[], summary: { count: number; totalCopies: number }) => void;
  defaultCopies?: number;
}

export default function BarcodeExcelCsvModal({
  isOpen,
  onClose,
  onImportToQueue,
  defaultCopies = 4
}: BarcodeExcelCsvModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);

  // Sozlamalar va mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    modelCol: '',
    sizeCol: '',
    quantityCol: '',
    colorCol: '',
    barcodeCol: '',
    rostCol: '',
    notesCol: ''
  });

  const [autoGenerateBarcodes, setAutoGenerateBarcodes] = useState<boolean>(true);
  const [fallbackCopies, setFallbackCopies] = useState<number>(defaultCopies);
  const [companyPrefix, setCompanyPrefix] = useState<string>('04640014380');
  const [activeStep, setActiveStep] = useState<'upload' | 'mapping'>('upload');

  const modelId = useId();
  const sizeId = useId();
  const quantityId = useId();
  const colorId = useId();
  const barcodeId = useId();
  const rostId = useId();

  if (!isOpen) return null;

  // Fayl yuklash va tahlil qilish
  const handleFileUpload = async (file: File) => {
    try {
      setIsParsing(true);
      setErrorMsg(null);

      const data = await parseExcelOrCsvFile(file, file.name);
      if (data.rows.length === 0) {
        setErrorMsg('Faylda ma\'lumotlar qatori topilmadi.');
        setIsParsing(false);
        return;
      }

      setParsedData(data);
      setMapping(data.detectedMapping);
      setActiveStep('mapping');
      setIsParsing(false);
    } catch (err: any) {
      setIsParsing(false);
      setErrorMsg(err?.message || 'Faylni o\'qishda xatolik yuz berdi');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  // Tanlangan mapping bo'yicha jonli prevyu va hisob-kitoblar
  const previewResult = parsedData ? convertMappedRowsToBarcodeItems(
    parsedData.rows.slice(0, 10),
    {
      mapping,
      autoGenerateBarcodes,
      barcodePrefix: companyPrefix,
      defaultCopies: fallbackCopies
    },
    parsedData.fileName
  ) : null;

  // Jami chop etiladigan nusxalar soni
  const fullStats = parsedData ? convertMappedRowsToBarcodeItems(
    parsedData.rows,
    {
      mapping,
      autoGenerateBarcodes,
      barcodePrefix: companyPrefix,
      defaultCopies: fallbackCopies
    },
    parsedData.fileName
  ) : null;

  // Navbatga qo'shish
  const handleConfirmImport = () => {
    if (!parsedData || !fullStats) return;

    onImportToQueue(fullStats.items, {
      count: fullStats.items.length,
      totalCopies: fullStats.stats.totalLabelCopies
    });
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setParsedData(null);
    setErrorMsg(null);
    setActiveStep('upload');
    onClose();
  };

  // Namuna fayl yuklab olish
  const handleDownloadSample = (type: 'xlsx' | 'csv') => {
    const blob = generateSampleBarcodeTemplate(type);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chust_Tekstil_Shtrixkod_Namuna.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Excel / CSV Import va Ustunlarni Avto-Bog'lash
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  Model · Size · Quantity
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1C yoki boshqa tizimdan olingan Excel/CSV jadvallarini shtrix-kod chop etish navbatiga avtomatik kiritish
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6">

          {/* XATOLIK XABARI */}
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeStep === 'upload' ? (
            /* ====================================================
               1-QADAM: FAYL YUKLASH (DRAG & DROP)
               ==================================================== */
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-800/40 hover:bg-slate-800/70 rounded-3xl p-10 text-center transition-all cursor-pointer group space-y-4"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                <div className="w-16 h-16 mx-auto bg-slate-800 border border-slate-700 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 rounded-3xl flex items-center justify-center transition-transform shadow-lg">
                  {isParsing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-200">
                    {isParsing ? 'Fayl o\'qilmoqda va tahlil qilinmoqda...' : 'Excel (.xlsx, .xls) yoki CSV (.csv, .tsv) faylni tanlang yoki tashlang'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tizim ustunlarni (Model, O'lcham, Soni, Rang, Shtrixkod) avtomatik aniqlaydi
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-[11px] font-mono border border-slate-700">
                    .XLSX
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-[11px] font-mono border border-slate-700">
                    .XLS
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-[11px] font-mono border border-slate-700">
                    .CSV (Vergul / Nuqta-vergul / Tab)
                  </span>
                </div>
              </div>

              {/* NAMUNA FAYLLAR BLOKI */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 text-center sm:text-left">
                  <h4 className="font-bold text-slate-200">Tayyor namuna kerakmi?</h4>
                  <p className="text-slate-400 text-[11px]">
                    To'g'ri ustunlar bilan to'ldirilgan andaza faylni yuklab olib, o'z ma'lumotlaringizni qo'yishingiz mumkin.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('xlsx')}
                    className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Namuna Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('csv')}
                    className="flex items-center gap-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Namuna CSV</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ====================================================
               2-QADAM: USTUNLARNI XARITAGA TUSHIRISH VA PREVYU
               ==================================================== */
            <div className="space-y-6">
              
              {/* Fayl haqida ma'lumot */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 border border-slate-700 px-4 py-3 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-bold">{parsedData?.fileName}</span>
                  <span className="text-slate-400 font-mono">({parsedData?.rows.length} qator topildi)</span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStep('upload')}
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors text-[11px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Boshqa fayl tanlash
                </button>
              </div>

              {/* 1. USTUNLARNI SOZLASH (MAPPING GRID) */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Ustunlarni moslashtirish (Fayldagi sarlavhalar)
                  </h3>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Tizim avtomatik aniqladi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  
                  {/* Model / Mahsulot */}
                  <div className="space-y-1">
                    <label htmlFor={modelId} className="block text-slate-400 font-medium text-[11px] flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      Model / Nomi / Artikul:
                    </label>
                    <select
                      id={modelId}
                      value={mapping.modelCol}
                      onChange={(e) => setMapping({ ...mapping, modelCol: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-hidden text-xs"
                    >
                      <option value="">(Tanlanmagan / Bo'sh)</option>
                      {parsedData?.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* O'lcham (Size) */}
                  <div className="space-y-1">
                    <label htmlFor={sizeId} className="block text-slate-400 font-medium text-[11px] flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-amber-400" />
                      O'lcham (Размер / Size):
                    </label>
                    <select
                      id={sizeId}
                      value={mapping.sizeCol}
                      onChange={(e) => setMapping({ ...mapping, sizeCol: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-hidden text-xs"
                    >
                      <option value="">(Tanlanmagan / Bo'sh)</option>
                      {parsedData?.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Soni / Miqdori (Quantity -> Copies) */}
                  <div className="space-y-1">
                    <label htmlFor={quantityId} className="block text-slate-300 font-bold text-[11px] flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Soni / Zakaz (Quantity):
                      <span className="text-[10px] text-emerald-400 font-normal">→ Navbatga</span>
                    </label>
                    <select
                      id={quantityId}
                      value={mapping.quantityCol}
                      onChange={(e) => setMapping({ ...mapping, quantityCol: e.target.value })}
                      className="w-full bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 font-bold rounded-xl px-2.5 py-1.5 focus:border-emerald-400 focus:outline-hidden text-xs"
                    >
                      <option value="">(Mavjud emas - standart nusxa olinadi)</option>
                      {parsedData?.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rang (Color) */}
                  <div className="space-y-1">
                    <label htmlFor={colorId} className="block text-slate-400 font-medium text-[11px] flex items-center gap-1">
                      <Palette className="w-3 h-3 text-rose-400" />
                      Rang (Цвет / Color):
                    </label>
                    <select
                      id={colorId}
                      value={mapping.colorCol}
                      onChange={(e) => setMapping({ ...mapping, colorCol: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-hidden text-xs"
                    >
                      <option value="">(Tanlanmagan / Bo'sh)</option>
                      {parsedData?.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Shtrix-kod (Barcode / SSCC) */}
                  <div className="space-y-1">
                    <label htmlFor={barcodeId} className="block text-slate-400 font-medium text-[11px] flex items-center gap-1">
                      <Hash className="w-3 h-3 text-sky-400" />
                      Shtrix-kod (Штрихкод / SSCC):
                    </label>
                    <select
                      id={barcodeId}
                      value={mapping.barcodeCol}
                      onChange={(e) => setMapping({ ...mapping, barcodeCol: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-hidden text-xs"
                    >
                      <option value="">(Mavjud emas - avtomatik yaratish)</option>
                      {parsedData?.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bo'y (Rost) */}
                  <div className="space-y-1">
                    <label htmlFor={rostId} className="block text-slate-400 font-medium text-[11px] flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-slate-400" />
                      Bo'y (Рост / Height):
                    </label>
                    <select
                      id={rostId}
                      value={mapping.rostCol}
                      onChange={(e) => setMapping({ ...mapping, rostCol: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-hidden text-xs"
                    >
                      <option value="">(Tanlanmagan / Standart 170-176)</option>
                      {parsedData?.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* QO'SHIMCHA SOZLAMALAR */}
                <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoGenerateBarcodes}
                      onChange={(e) => setAutoGenerateBarcodes(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Shtrix-kod ustuni bo'lmasa, avtomatik to'g'ri GS1-128/SSCC (Modulo 10) yaratish
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Soni bo'lmaganda standart nusxa:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={fallbackCopies}
                      onChange={(e) => setFallbackCopies(parseInt(e.target.value, 10) || 1)}
                      className="w-14 bg-slate-900 border border-slate-700 text-white text-center font-bold font-mono px-1 py-1 rounded-lg text-xs"
                    />
                  </div>
                </div>

              </div>

              {/* 2. JONLI NATIJA PREVYUSI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <h3 className="font-bold text-slate-200">
                    Natija Prevyusi (Dastlabki {previewResult?.items.length || 0} ta qator):
                  </h3>
                  <span className="text-slate-400 text-[11px]">
                    Jami qatorlar: <strong className="text-white font-mono">{parsedData?.rows.length}</strong> · 
                    Chop etiladigan jami etiketkalar soni: <strong className="text-emerald-400 font-mono">{fullStats?.stats.totalLabelCopies || 0} dona</strong>
                  </span>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800/90 text-slate-400 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">№</th>
                          <th className="py-2.5 px-3 min-w-[140px]">Model / Mahsulot</th>
                          <th className="py-2.5 px-3 w-24">Rang</th>
                          <th className="py-2.5 px-3 w-20">O'lcham</th>
                          <th className="py-2.5 px-3 w-20">Bo'y</th>
                          <th className="py-2.5 px-3 w-24 text-center bg-emerald-950/30 text-emerald-300">Zakaz (Nusxa)</th>
                          <th className="py-2.5 px-3 min-w-[180px]">Shtrix-kod (SSCC)</th>
                          <th className="py-2.5 px-3 w-24">Holati</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 font-mono text-[11px]">
                        {previewResult?.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 text-slate-200 font-sans font-medium">{item.model || item.fileName}</td>
                            <td className="py-2 px-3 text-slate-300 font-sans">{item.color || '—'}</td>
                            <td className="py-2 px-3 text-white font-bold">{item.size || '—'}</td>
                            <td className="py-2 px-3 text-slate-400">{item.rost || '170-176'}</td>
                            <td className="py-2 px-3 text-center font-bold text-emerald-400 bg-emerald-950/20">
                              {item.copies} dona
                            </td>
                            <td className="py-2 px-3 text-indigo-300 font-mono text-[11px]">
                              {item.formattedCode || item.sscc || '—'}
                            </td>
                            <td className="py-2 px-3 font-sans">
                              {item.status === 'OK' && (
                                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  OK
                                </span>
                              )}
                              {item.status === 'tuzatildi' && (
                                <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  Tuzatildi
                                </span>
                              )}
                              {item.status === 'nazorat_mos_emas' && (
                                <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  Xato
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadSample('xlsx')}
              className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Namuna yuklab olish</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>

            {activeStep === 'mapping' && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!parsedData || (fullStats?.items.length || 0) === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  Navbatga qo'shish ({fullStats?.items.length || 0} ta qator · {fullStats?.stats.totalLabelCopies || 0} dona etiketka)
                </span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
