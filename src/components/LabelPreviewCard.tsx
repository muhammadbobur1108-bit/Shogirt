/**
 * Chust Textile ERP - 40x58 mm Jonli Etiketka Prevyu Komponenti
 * 
 * Ushbu komponent tanlangan etiketkaning haqiqiy vektor (SVG) ko'rinishini
 * ekranda 40x58 mm nisbatida jonli chizib ko'rsatadi.
 */

import React, { useMemo } from 'react';
import { BarcodeItem } from '../lib/barcode/types';
import { encodeGS1_128_SSCC } from '../lib/barcode/code128';
import { formatSSCC } from '../lib/barcode/sscc';

interface LabelPreviewCardProps {
  item: BarcodeItem | null;
  widthMm?: number;
  heightMm?: number;
  formatType?: '40x58' | '80x50';
  barcodeWidthMm?: number;
  barcodeHeightMm?: number;
}

export default function LabelPreviewCard({
  item,
  widthMm = 40,
  heightMm = 58,
  formatType = '40x58',
  barcodeWidthMm = 42,
  barcodeHeightMm = 51
}: LabelPreviewCardProps) {
  const is80x50 = formatType === '80x50' || 
    (widthMm === 80 && heightMm === 50) || 
    (widthMm === 50 && heightMm === 80) || 
    heightMm >= 75;
  const currentWidthMm = is80x50 ? 50 : widthMm;
  const currentHeightMm = is80x50 ? 80 : heightMm;

  const effBarWidthMm = barcodeWidthMm < 10 ? barcodeWidthMm * 10 : barcodeWidthMm;
  const effBarHeightMm = barcodeHeightMm < 10 ? barcodeHeightMm * 10 : barcodeHeightMm;

  // SVG koordinatalari: 1 mm = 10 SVG birligi
  const svgWidth = currentWidthMm * 10;
  const svgHeight = currentHeightMm * 10;

  const encoded = useMemo(() => {
    if (!item || !item.sscc || item.sscc.length !== 18) return null;
    try {
      return encodeGS1_128_SSCC(item.sscc);
    } catch {
      return null;
    }
  }, [item?.sscc]);

  // Ranglar ro'yxati
  const rawColors = useMemo(() => {
    if (!item?.color) return [];
    return item.color.split(/[/,;]/).map(s => s.trim()).filter(Boolean);
  }, [item?.color]);

  if (!item) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 flex flex-col items-center justify-center min-h-[340px]">
        <p className="text-sm font-semibold">Ko'rish uchun jadvaldan etiketka tanlang</p>
        <p className="text-xs text-slate-500 mt-1">{is80x50 ? '80x50 mm' : '40x58 mm'} haqiqiy vektor prevyu bu yerda ko'rinadi</p>
      </div>
    );
  }

  const binary = encoded?.binaryModules || '';
  const isMultiColor = rawColors.length > 1;
  const formattedNumber = formatSSCC(item.sscc || item.rawCode);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3 text-xs">
        <span className="font-bold text-slate-300">
          {is80x50 ? '80x50 mm (Vertikal)' : '40x58 mm (Gorizontal)'} Jonli Etiketka
        </span>
        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[11px] font-mono">
          {item.copies || 4} nusxa
        </span>
      </div>

      {/* Haqiqiy oq qog'ozli etiketka maketi - 3-rasm bo'yicha chekka hoshiyalarsiz */}
      <div 
        className="bg-white shadow-2xl p-0 relative overflow-hidden border border-gray-300 flex items-center justify-center transition-all"
        style={{ 
          width: '240px', 
          height: `${(240 / currentWidthMm) * currentHeightMm}px` 
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full select-none"
          style={{ fontFamily: 'Liberation Sans, Arial, sans-serif' }}
        >
          {/* Oq fon */}
          <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#FFFFFF" />

          {is80x50 ? (
            // =========================================================
            // 80x50 mm VERTIKAL MAKET (3-rasmdagi aniq proporsiya)
            // =========================================================
            <g id="layout-80x50">
              {/* 1. Yuqorida baland vertikal shtrix-kod chiziqlari (Eni: 44 mm, Bo'yi: 57 mm) */}
              {binary ? (
                (() => {
                  const rects: React.ReactNode[] = [];
                  const totalBarWidth = 440; // 44.0 mm * 10
                  const barLeft = (svgWidth - totalBarWidth) / 2; // 30 (3.0 mm)
                  const moduleW = totalBarWidth / 156;
                  const barH = 570; // 57.0 mm * 10 (3-rasmdagi balandlik)
                  const startY = 30; // 3.0 mm * 10

                  let runStart = -1;
                  for (let k = 0; k <= binary.length; k++) {
                    const isOne = k < binary.length && binary[k] === '1';
                    if (isOne && runStart === -1) {
                      runStart = k;
                    } else if (!isOne && runStart !== -1) {
                      const runLen = k - runStart;
                      rects.push(
                        <rect
                          key={`vbar-${runStart}`}
                          x={barLeft + runStart * moduleW}
                          y={startY}
                          width={runLen * moduleW}
                          height={barH}
                          fill="#000000"
                        />
                      );
                      runStart = -1;
                    }
                  }
                  return <g id="v-barcode-bars">{rects}</g>;
                })()
              ) : (
                <text x="250" y="280" textAnchor="middle" fill="#DC2626" fontSize="22" fontWeight="bold">
                  KOD XATO
                </text>
              )}

              {/* 2. Shtrix-kod tagida oraliqli 20 xonali raqamlar: AI "00" + 18 xonali SSCC */}
              {(() => {
                const full20Digits = ('00' + (item.sscc || item.rawCode)).slice(0, 20);
                const totalBarWidth = 440;
                const barLeft = (svgWidth - totalBarWidth) / 2;
                const digitStep = totalBarWidth / 20;
                const digitY = 30 + 570 + 20; // 620

                return (
                  <g id="v-spaced-digits">
                    {full20Digits.split('').map((ch, idx) => (
                      <text
                        key={`sp-digit-${idx}`}
                        x={barLeft + idx * digitStep + digitStep / 2}
                        y={digitY}
                        textAnchor="middle"
                        fontSize="23"
                        fontWeight="bold"
                        fill="#000000"
                      >
                        {ch}
                      </text>
                    ))}
                  </g>
                );
              })()}

              {/* 3. Markazlashgan (00)046602509310827968 */}
              <text
                x="250"
                y="675"
                textAnchor="middle"
                fontSize="26"
                fill="#000000"
                letterSpacing="0.2"
              >
                {formattedNumber}
              </text>

              {/* 4. Pastki 3 ta ustun: Цвет: | Размер: | Рост: (3-rasm) */}
              <g id="v-footer-columns">
                {/* Headers */}
                <text x="110" y="735" textAnchor="middle" fontSize="22" fill="#000000">
                  Цвет:
                </text>
                <text x="250" y="735" textAnchor="middle" fontSize="22" fill="#000000">
                  Размер:
                </text>
                <text x="390" y="735" textAnchor="middle" fontSize="22" fill="#000000">
                  Рост:
                </text>

                {/* Values */}
                <text x="110" y="770" textAnchor="middle" fontSize="25" fontWeight="bold" fill="#000000">
                  {rawColors[0] || item.color || 'Зеленый'}
                </text>
                <text x="250" y="770" textAnchor="middle" fontSize="26" fontWeight="bold" fill="#000000">
                  {item.size || '104'}
                </text>
                <text x="390" y="770" textAnchor="middle" fontSize="25" fontWeight="bold" fill="#000000">
                  {item.rost || '170-176'}
                </text>
              </g>
            </g>
          ) : (
            // =========================================================
            // 40x58 mm GORIZONTAL STANDART MAKET (90° burilgan)
            // =========================================================
            <g id="layout-40x58">
              {/* 1. SHTRIX-KOD: 90° burilgan, gorizontal chiziqlar */}
              {binary ? (
                (() => {
                  const rects: React.ReactNode[] = [];
                  const barLeft = 35; // 3.5 mm * 10
                  const barWidth = 330; // 33 mm * 10
                  const moduleH = 2.7; // 0.27 mm * 10
                  const startY = 25; // 2.5 mm * 10

                  let runStart = -1;
                  for (let k = 0; k <= binary.length; k++) {
                    const isOne = k < binary.length && binary[k] === '1';
                    if (isOne && runStart === -1) {
                      runStart = k;
                    } else if (!isOne && runStart !== -1) {
                      const runLen = k - runStart;
                      const rectY = startY + runStart * moduleH;
                      const rectH = runLen * moduleH;
                      rects.push(
                        <rect
                          key={`bar-${runStart}`}
                          x={barLeft}
                          y={rectY}
                          width={barWidth}
                          height={rectH}
                          fill="#000000"
                        />
                      );
                      runStart = -1;
                    }
                  }
                  return <g id="barcode-bars">{rects}</g>;
                })()
              ) : (
                <text x="200" y="240" textAnchor="middle" fill="#DC2626" fontSize="18" fontWeight="bold">
                  KOD XATO
                </text>
              )}

              {/* 2. MATNLAR (Pastki qism) */}
              {!isMultiColor ? (
                <g id="single-color-text">
                  <text
                    x="200"
                    y="505"
                    textAnchor="middle"
                    fontSize="18"
                    fill="#000000"
                    letterSpacing="0.2"
                  >
                    {formattedNumber}
                  </text>
                  <text
                    x="50"
                    y="545"
                    textAnchor="start"
                    fontSize="22"
                    fontWeight="bold"
                    fill="#000000"
                  >
                    {rawColors[0] || item.color || ''}
                  </text>
                  <text
                    x="230"
                    y="545"
                    textAnchor="start"
                    fontSize="22"
                    fontWeight="bold"
                    fill="#000000"
                  >
                    {item.size || ''}
                  </text>
                </g>
              ) : (
                <g id="multi-color-text">
                  {rawColors.map((col, idx) => {
                    const isLast = idx === rawColors.length - 1;
                    const txt = col + (isLast ? '.' : ',');
                    const lineSpacing = 26;
                    const fontSize = Math.max(16, 21 - (rawColors.length - 2) * 2);
                    const y = 560 - (rawColors.length - 1 - idx) * lineSpacing;

                    return (
                      <text
                        key={`col-${idx}`}
                        x="115"
                        y={y}
                        textAnchor="middle"
                        fontSize={fontSize}
                        fontWeight="bold"
                        fill="#000000"
                      >
                        {txt}
                      </text>
                    );
                  })}

                  <text
                    x="230"
                    y={560 - ((rawColors.length - 1) / 2) * 26}
                    textAnchor="start"
                    fontSize="22"
                    fontWeight="bold"
                    fill="#000000"
                  >
                    {item.size || ''}
                  </text>

                  <text
                    x="200"
                    y={505 - (rawColors.length - 1) * 20}
                    textAnchor="middle"
                    fontSize="18"
                    fill="#000000"
                    letterSpacing="0.2"
                  >
                    {formattedNumber}
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>
      </div>

      <div className="mt-3 text-center space-y-0.5">
        <p className="text-xs font-mono font-bold text-slate-200">
          {item.formattedCode || item.sscc}
        </p>
        <p className="text-[11px] text-slate-400">
          {item.color || 'Rang belgilanmagan'} · {item.size || 'O\'lcham yo\'q'} {item.rost ? `· Рост: ${item.rost}` : ''}
        </p>
      </div>
    </div>
  );
}

