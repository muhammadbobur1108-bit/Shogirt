'use client';

import React from 'react';
import NakladnoyView from '../../src/components/NakladnoyView';

/**
 * Next.js App Router: /nakladnoy sahifasi
 * Chust Textile ERP: Markirovka suratini o'qib, nakladnoy (накладная) hosil qiluvchi modul.
 */
export default function NakladnoyPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded">
            Next.js App Router (/nakladnoy)
          </span>
          <span className="text-xs text-slate-500">
            Chust Textile ERP (Production-ready)
          </span>
        </div>
      </div>
      <NakladnoyView />
    </div>
  );
}
