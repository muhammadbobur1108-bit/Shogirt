import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  X, 
  Check, 
  FileSpreadsheet, 
  Clipboard, 
  AlertCircle,
  Palette
} from 'lucide-react';
import { Language } from '../locales';
import { OrderColorVariant } from '../types';

interface ExcelStageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageType: 'zakaz' | 'raskroy' | 'razdacha' | 'upakovka';
  stageTitle: string;
  availableSizes: string[];
  colorVariants?: OrderColorVariant[];
  onApply: (parsedSizes: { [size: string]: number }, targetColorIdx?: number) => void;
  lang: Language;
}

export default function ExcelStageImportModal({
  isOpen,
  onClose,
  stageType,
  stageTitle,
  availableSizes,
  colorVariants,
  onApply,
  lang
}: ExcelStageImportModalProps) {
  const [pasteText, setPasteText] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [parsedPreview, setParsedPreview] = useState<{ [size: string]: number }>({});
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Helper to normalize size strings (e.g., 'xl', 'XL', '2xl', '116')
  const normalizeSize = (raw: string): string => {
    return raw.trim().toUpperCase();
  };

  // Parse text pasted from Excel (TSV or CSV or plain text)
  const parseRawText = (text: string) => {
    if (!text.trim()) {
      setParsedPreview({});
      setImportStatus(null);
      return;
    }

    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    const result: { [size: string]: number } = {};

    // Case 1: Horizontal header & values (Line 0 = Sizes, Line 1 = Numbers)
    if (lines.length >= 2) {
      const headerTokens = lines[0].split(/[\t;,]/).map(t => t.trim()).filter(Boolean);
      const valueTokens = lines[1].split(/[\t;,]/).map(t => t.trim().replace(/[^\d-]/g, ''));

      // Check if headerTokens look like sizes
      let matchCount = 0;
      headerTokens.forEach(token => {
        const norm = normalizeSize(token);
        if (availableSizes.some(s => normalizeSize(s) === norm) || /^(2?XS|S|M|L|2?XL|3XL|4XL|5XL|\d{2,3})$/i.test(token)) {
          matchCount++;
        }
      });

      if (matchCount >= 2 && headerTokens.length === valueTokens.length) {
        headerTokens.forEach((hdr, idx) => {
          const matchedSize = availableSizes.find(s => normalizeSize(s) === normalizeSize(hdr)) || hdr.toUpperCase();
          const qty = Math.max(0, parseInt(valueTokens[idx], 10) || 0);
          if (qty > 0) {
            result[matchedSize] = qty;
          }
        });
        setParsedPreview(result);
        setImportStatus(lang === 'uz' ? `Gorizontal jadval aniqlandi: ${Object.keys(result).length} ta o'lcham` : `Горизонтальная таблица: распознано ${Object.keys(result).length} размеров`);
        return;
      }
    }

    // Case 2: Vertical list (Size \t Quantity or Size: Quantity per line)
    let verticalMatched = 0;
    lines.forEach(line => {
      const tokens = line.split(/[\t;,:=]+/).map(t => t.trim()).filter(Boolean);
      if (tokens.length >= 2) {
        const sizeCandidate = tokens[0];
        const numCandidate = tokens[1].replace(/[^\d-]/g, '');
        const qty = parseInt(numCandidate, 10);
        if (!isNaN(qty) && qty > 0) {
          const matchedSize = availableSizes.find(s => normalizeSize(s) === normalizeSize(sizeCandidate)) || sizeCandidate.toUpperCase();
          result[matchedSize] = (result[matchedSize] || 0) + qty;
          verticalMatched++;
        }
      }
    });

    if (verticalMatched > 0) {
      setParsedPreview(result);
      setImportStatus(lang === 'uz' ? `Vertikal ustun aniqlandi: ${Object.keys(result).length} ta o'lcham` : `Вертикальный список: распознано ${Object.keys(result).length} размеров`);
      return;
    }

    // Case 3: Just a row of numbers pasted (e.g. 10 20 50 100...) mapped to availableSizes
    const singleRowTokens = lines[0].split(/[\t\s;,]+/).map(t => t.trim().replace(/[^\d-]/g, '')).filter(Boolean);
    if (singleRowTokens.length > 0) {
      singleRowTokens.forEach((tok, idx) => {
        if (idx < availableSizes.length) {
          const qty = Math.max(0, parseInt(tok, 10) || 0);
          if (qty > 0) {
            result[availableSizes[idx]] = qty;
          }
        }
      });
      if (Object.keys(result).length > 0) {
        setParsedPreview(result);
        setImportStatus(lang === 'uz' ? `Ketma-ket sonlar o'lchamlarga moslashtirildi: ${Object.keys(result).length} ta o'lcham` : `Последовательные числа сопоставлены с размерами: ${Object.keys(result).length} размеров`);
        return;
      }
    }

    setParsedPreview({});
    setImportStatus(lang === 'uz' ? "Ma'lumotlar formati aniqlanmadi. Iltimos, Excel dan kataklarni to'g'ri nusxalang." : "Формат не распознан. Пожалуйста, скопируйте ячейки из Excel.");
  };

  // Handle Excel file upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to rows
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!rows || rows.length === 0) {
          setImportStatus(lang === 'uz' ? 'Fayl bo\'sh' : 'Файл пуст');
          return;
        }

        // Search for size row and numbers
        const result: { [size: string]: number } = {};

        // Find header row that matches sizes
        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const row = rows[r];
          if (!row) continue;
          let matchCount = 0;
          row.forEach((cell: any) => {
            const val = String(cell || '').trim();
            if (availableSizes.some(s => normalizeSize(s) === normalizeSize(val))) {
              matchCount++;
            }
          });
          if (matchCount >= 2) {
            headerRowIdx = r;
            break;
          }
        }

        if (headerRowIdx !== -1 && rows[headerRowIdx + 1]) {
          const headerRow = rows[headerRowIdx];
          const valRow = rows[headerRowIdx + 1];
          headerRow.forEach((cell: any, cIdx: number) => {
            const sizeStr = String(cell || '').trim();
            const val = parseInt(String(valRow[cIdx] || '').replace(/[^\d-]/g, ''), 10) || 0;
            if (sizeStr && val > 0) {
              const matchedSize = availableSizes.find(s => normalizeSize(s) === normalizeSize(sizeStr)) || sizeStr.toUpperCase();
              result[matchedSize] = val;
            }
          });
        } else {
          // Check vertical: column A = size, column B = qty
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            if (!row || row.length < 2) continue;
            const sizeCandidate = String(row[0] || '').trim();
            const numCandidate = parseInt(String(row[1] || '').replace(/[^\d-]/g, ''), 10) || 0;
            if (sizeCandidate && numCandidate > 0) {
              const matchedSize = availableSizes.find(s => normalizeSize(s) === normalizeSize(sizeCandidate)) || sizeCandidate.toUpperCase();
              result[matchedSize] = (result[matchedSize] || 0) + numCandidate;
            }
          }
        }

        if (Object.keys(result).length > 0) {
          setParsedPreview(result);
          setImportStatus(lang === 'uz' ? `${file.name} faylidan ${Object.keys(result).length} ta o'lcham o'qildi` : `Из файла ${file.name} прочитано ${Object.keys(result).length} размеров`);
        } else {
          setImportStatus(lang === 'uz' ? 'Faylda o\'lchamlar va sonlar topilmadi' : 'В файле не найдены размеры и количества');
        }
      } catch (err) {
        setImportStatus(lang === 'uz' ? 'Faylni o\'qishda xatolik yuz berdi' : 'Ошибка при чтении файла Excel');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyImport = () => {
    if (Object.keys(parsedPreview).length === 0) return;
    onApply(parsedPreview, selectedColorIdx);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 600);
  };

  const totalImportQty = Object.values(parsedPreview).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-60 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 text-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>{stageTitle}</span>
                <span className="text-emerald-400 font-mono text-xs bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {lang === 'uz' ? 'Excel Import' : 'Импорт Excel'}
                </span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {lang === 'uz' 
                  ? "Excel'dan kataklarni nusxalab (Ctrl+V) joylang yoki .xlsx faylni yuklang" 
                  : "Скопируйте ячейки из Excel (Ctrl+V) или загрузите .xlsx файл"}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Variant selection if stage is zakaz and variants exist */}
        {stageType === 'zakaz' && colorVariants && colorVariants.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-1.5">
            <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              {lang === 'uz' ? "Qaysi rang uchun import qilmoqchisiz?" : "Для какого цвета импортировать?"}
            </label>
            <select
              value={selectedColorIdx}
              onChange={(e) => setSelectedColorIdx(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-400 font-bold"
            >
              {colorVariants.map((v, idx) => (
                <option key={idx} value={idx}>
                  {idx + 1}. {v.color || `Rang ${idx + 1}`} ({Object.values(v.sizes || {}).reduce((a, b) => a + (b || 0), 0)} шт)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload or Paste options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option A: File Upload */}
          <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-900/80 group">
            <Upload className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 text-center">
              {lang === 'uz' ? "Excel faylni yuklash" : "Загрузить Excel файл"}
            </span>
            <span className="text-[10px] text-slate-400">.xlsx, .xls, .csv</span>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>

          {/* Option B: Direct Copy Helper */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5 text-sky-400" />
                {lang === 'uz' ? "Tezkor nusxa olish formati:" : "Формат быстрой вставки:"}
              </span>
              <p className="text-[10px] text-slate-400 leading-tight">
                {lang === 'uz' 
                  ? "Excel'da o'lchamlar qatori va sonlarni belgilab nusxa oling (Ctrl+C), so'ng pastdagi oynaga qo'ying (Ctrl+V)." 
                  : "Выделите размеры и числа в Excel (Ctrl+C), затем вставьте в поле ниже (Ctrl+V)."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const sample = `${availableSizes.slice(0, 6).join('\t')}\n${availableSizes.slice(0, 6).map((_, i) => (i + 1) * 20).join('\t')}`;
                setPasteText(sample);
                parseRawText(sample);
              }}
              className="mt-2 text-[10px] text-sky-400 hover:text-sky-300 font-bold underline text-left cursor-pointer"
            >
              {lang === 'uz' ? "Namunani kiritish" : "Вставить пример"}
            </button>
          </div>
        </div>

        {/* Paste Input Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>{lang === 'uz' ? "Excel ma'lumotlarini bu yerga joylang (Ctrl+V):" : "Вставьте данные из Excel сюда (Ctrl+V):"}</span>
            {pasteText && (
              <button 
                type="button" 
                onClick={() => { setPasteText(''); setParsedPreview({}); setImportStatus(null); }}
                className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                {lang === 'uz' ? "Tozalash" : "Очистить"}
              </button>
            )}
          </label>
          <textarea
            rows={3}
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.target.value);
              parseRawText(e.target.value);
            }}
            placeholder={lang === 'uz' ? "Excel jadvalidan nusxalangan kataklarni bu yerga qo'ying..." : "Вставьте скопированные ячейки из таблицы Excel сюда..."}
            className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Status indicator */}
        {importStatus && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300">{importStatus}</span>
          </div>
        )}

        {/* Parsed Preview Table */}
        {Object.keys(parsedPreview).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {lang === 'uz' ? "Aniqlangan o'lchamlar natijasi (Preview):" : "Результат распознанных размеров (Preview):"}
              </span>
              <span className="text-xs font-extrabold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800/40">
                {lang === 'uz' ? 'JAMI' : 'ИТОГО'}: {totalImportQty.toLocaleString()} шт
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto max-h-44">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                    <th className="p-2 text-left">{lang === 'uz' ? "O'lcham" : "Размер"}</th>
                    <th className="p-2 text-right">{lang === 'uz' ? "Soni" : "Количество"}</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {Object.entries(parsedPreview).map(([sz, qty]) => (
                    <tr key={sz} className="hover:bg-slate-900/40">
                      <td className="p-1.5 text-left font-mono font-bold text-amber-400">{sz}</td>
                      <td className="p-1.5 text-right font-mono font-black text-emerald-400">
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setParsedPreview(prev => ({ ...prev, [sz]: val }));
                          }}
                          className="w-24 px-2 py-0.5 text-right bg-slate-900 border border-slate-700 rounded font-mono font-bold text-xs text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setParsedPreview(prev => {
                              const copy = { ...prev };
                              delete copy[sz];
                              return copy;
                            });
                          }}
                          className="text-slate-500 hover:text-rose-400 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
          </button>

          <button
            type="button"
            disabled={Object.keys(parsedPreview).length === 0}
            onClick={handleApplyImport}
            className={`px-5 py-2 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg ${
              Object.keys(parsedPreview).length > 0
                ? isSuccess 
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Check className="w-4 h-4" />
            {isSuccess 
              ? (lang === 'uz' ? 'Qo\'shildi!' : 'Применено!') 
              : (lang === 'uz' ? 'Qo\'llash (Import qilish)' : 'Применить импорт')}
          </button>
        </div>

      </div>
    </div>
  );
}
