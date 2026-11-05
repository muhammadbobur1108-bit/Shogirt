import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, DefectItem } from '../types';
import { Language } from '../locales';

interface GenerateReportPdfParams {
  orders: Order[];
  defects: DefectItem[];
  lang: Language;
  reportMode: 'kpi' | 'general' | 'orders' | 'colors';
  trendDateRange: '7' | '30' | '90';
  productionTrendMetric: 'output' | 'oee';
  productionTrendData: Array<{
    dateKey: string;
    label: string;
    dayOfWeek: string;
    actualOutput: number;
    targetOutput: number;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    defectCount: number;
  }>;
  trendStats: {
    totalPeriodOutput: number;
    avgPeriodOutput: number;
    avgPeriodOEE: number;
    peakDay: { label: string; actualOutput: number };
    peakOeeDay: { label: string; oee: number };
    achievementPercent: number;
  };
  kpiMetrics: {
    realTimeOEE: number;
    availability: number;
    performanceRate: number;
    qualityRate: number;
    oeeStatus: string;
    totalDailyOutput: number;
    dailyTarget: number;
    dailyProgressPercent: number;
    pendingOrdersCount: number;
    pendingTotalUnits: number;
    pendingByStage: { yangi: number; bichuv: number; tikuv: number; qadoqlash: number };
    averageDefectRate: number;
    totalDefectsCount: number;
    defectStatus: string;
  };
  colorRows?: Array<{
    mosCode: string;
    modelCode: string;
    brandName: string;
    colorName: string;
    sizes: { [size: string]: number };
    qtyOrder: number;
    qtyCut: number;
    qtyPackaging: number;
    qtyRemaining: number;
    completionPercent: number;
  }>;
  filteredOrders?: Order[];
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function loadAndRegisterFonts(doc: jsPDF): Promise<boolean> {
  try {
    const [resRegular, resBold] = await Promise.all([
      fetch('/fonts/LiberationSans-Regular.ttf'),
      fetch('/fonts/LiberationSans-Bold.ttf')
    ]);

    if (resRegular.ok) {
      const regBuf = await resRegular.arrayBuffer();
      const regBase64 = arrayBufferToBase64(regBuf);
      doc.addFileToVFS('LiberationSans-Regular.ttf', regBase64);
      doc.addFont('LiberationSans-Regular.ttf', 'LiberationSans', 'normal');
    }

    if (resBold.ok) {
      const boldBuf = await resBold.arrayBuffer();
      const boldBase64 = arrayBufferToBase64(boldBuf);
      doc.addFileToVFS('LiberationSans-Bold.ttf', boldBase64);
      doc.addFont('LiberationSans-Bold.ttf', 'LiberationSans', 'bold');
    }

    if (resRegular.ok || resBold.ok) {
      doc.setFont('LiberationSans', 'normal');
      return true;
    }
  } catch (err) {
    console.warn('Could not load custom LiberationSans font, using fallback helvetica', err);
  }
  doc.setFont('helvetica', 'normal');
  return false;
}

export async function generateProductionReportPdf({
  orders,
  defects,
  lang,
  reportMode,
  trendDateRange,
  productionTrendMetric,
  productionTrendData,
  trendStats,
  kpiMetrics,
  colorRows = [],
  filteredOrders = orders
}: GenerateReportPdfParams): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const fontLoaded = await loadAndRegisterFonts(doc);
  const fontName = fontLoaded ? 'LiberationSans' : 'helvetica';

  const isRu = lang === 'ru';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // --- 1. BRANDED HEADER BANNER ---
  doc.setFillColor(15, 23, 42); // slate-900 / dark navy
  doc.rect(margin, currentY, pageWidth - margin * 2, 28, 'F');

  // Accent cyan top border line
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(margin, currentY, pageWidth - margin * 2, 1.5, 'F');

  // Title & Subtitle inside banner
  doc.setFont(fontName, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('SHOGIRT ERP — ' + (isRu ? 'ОТЧЕТ ПРОИЗВОДСТВЕННОГО АНАЛИЗА' : 'ISHLAB CHIQARISH VA ANALITIKA HISOBOTI'), margin + 5, currentY + 11);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  const generationDate = new Date().toLocaleString(isRu ? 'ru-RU' : 'uz-UZ');
  const modeLabel = reportMode === 'kpi' 
    ? (isRu ? 'KPI и OEE Аналитика' : 'Real-Vaqt KPI & OEE')
    : reportMode === 'general'
    ? (isRu ? 'Общий свод по цехам' : 'Umumiy hisobot')
    : reportMode === 'orders'
    ? (isRu ? 'В разрезе заказов' : 'Buyurtmalar kesimida')
    : (isRu ? 'В разрезе цветов и размеров' : 'Ranglar kesimida');

  doc.text(
    (isRu ? 'Дата формирования: ' : 'Sana: ') + generationDate + '  |  ' +
    (isRu ? 'Режим: ' : 'Rejim: ') + modeLabel + '  |  ' +
    (isRu ? 'Период динамики: ' : 'Davr: ') + trendDateRange + (isRu ? ' дн.' : ' kun'),
    margin + 5,
    currentY + 20
  );

  currentY += 33;

  // --- 2. EXECUTIVE 4-CARD SUMMARY SCORECARD ---
  doc.setFont(fontName, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(isRu ? 'СВОДНЫЕ ПОКАЗАТЕЛИ ЭФФЕКТИВНОСТИ (KPI)' : 'ASOSIY SAMARADORLIK KO\'RSATKICHLARI (KPI)', margin, currentY);
  currentY += 4;

  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 22;

  // Card 1: Real-Time OEE
  doc.setFillColor(240, 253, 250); // cyan tint
  doc.setDrawColor(6, 182, 212);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont(fontName, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Real-Time OEE (%)', margin + 3, currentY + 5);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(8, 145, 178); // cyan-600
  doc.text(`${kpiMetrics.realTimeOEE}%`, margin + 3, currentY + 12);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`A:${kpiMetrics.availability}% P:${kpiMetrics.performanceRate}% Q:${kpiMetrics.qualityRate}%`, margin + 3, currentY + 18);

  // Card 2: Total Daily Output
  const card2X = margin + cardWidth + 3;
  doc.setFillColor(236, 253, 245); // emerald tint
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont(fontName, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(isRu ? 'Суточный выпуск' : 'Kunlik chiqarish', card2X + 3, currentY + 5);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`${kpiMetrics.totalDailyOutput.toLocaleString()}`, card2X + 3, currentY + 12);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`${isRu ? 'План' : 'Reja'}: ${kpiMetrics.dailyTarget.toLocaleString()} (${kpiMetrics.dailyProgressPercent}%)`, card2X + 3, currentY + 18);

  // Card 3: Pending Orders
  const card3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(255, 251, 235); // amber tint
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont(fontName, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(isRu ? 'Заказы в работе' : 'Kutilayotgan zakazlar', card3X + 3, currentY + 5);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(`${kpiMetrics.pendingOrdersCount} ${isRu ? 'зак.' : 'ta'}`, card3X + 3, currentY + 12);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`${kpiMetrics.pendingTotalUnits.toLocaleString()} ${isRu ? 'шт. в процессе' : 'dona qoldiq'}`, card3X + 3, currentY + 18);

  // Card 4: Average Defect Rate
  const card4X = margin + (cardWidth + 3) * 3;
  doc.setFillColor(254, 242, 242); // rose tint
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont(fontName, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(isRu ? 'Уровень брака (ОТК)' : 'O\'rtacha brak foizi', card4X + 3, currentY + 5);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(220, 38, 38); // rose-600
  doc.text(`${kpiMetrics.averageDefectRate}%`, card4X + 3, currentY + 12);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`${kpiMetrics.totalDefectsCount.toLocaleString()} ${isRu ? 'шт. дефектов' : 'dona brak'} (≤2%)`, card4X + 3, currentY + 18);

  currentY += cardHeight + 8;

  // --- 3. PRODUCTION TREND ANALYSIS TABLE (7, 30, or 90 DAYS) ---
  doc.setFont(fontName, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(
    (isRu ? 'ДИНАМИКА ПРОИЗВОДСТВА ЗА ПОСЛЕДНИЕ ' : 'ISHLAB CHIQARISH DINAMIKASI: OXIRGI ') +
    trendDateRange +
    (isRu ? ' ДНЕЙ' : ' KUN'),
    margin,
    currentY
  );

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${isRu ? 'Итого выпуск' : 'Jami'}: ${trendStats.totalPeriodOutput.toLocaleString()} ${isRu ? 'шт.' : 'dona'}  |  ` +
    `${isRu ? 'Среднесуточно' : 'O\'rtacha'}: ${trendStats.avgPeriodOutput.toLocaleString()}  |  ` +
    `OEE avg: ${trendStats.avgPeriodOEE}%  |  ` +
    `${isRu ? 'Пик' : 'Pik'}: ${trendStats.peakDay.actualOutput.toLocaleString()} (${trendStats.peakDay.label})`,
    margin,
    currentY + 4
  );

  currentY += 7;

  // Trend Table Rows
  const trendTableHead = [
    [
      isRu ? 'Дата' : 'Sana',
      isRu ? 'День' : 'Kun',
      isRu ? 'Факт (шт)' : 'Fakt (dona)',
      isRu ? 'План (шт)' : 'Reja (dona)',
      isRu ? 'Вып. %' : 'Bajarilish %',
      'OEE %',
      isRu ? 'Доступность A' : 'A (Bandlik)',
      isRu ? 'Темп P' : 'P (Unum)',
      isRu ? 'Качество Q' : 'Q (Sifat)',
      isRu ? 'Брак (шт)' : 'Brak'
    ]
  ];

  // For 30 or 90 days, we can show all days or key rows to fit nicely
  const trendRows = productionTrendData.map(d => [
    d.label,
    d.dayOfWeek,
    d.actualOutput.toLocaleString(),
    d.targetOutput.toLocaleString(),
    `${Math.round((d.actualOutput / Math.max(1, d.targetOutput)) * 100)}%`,
    `${d.oee}%`,
    `${d.availability}%`,
    `${d.performance}%`,
    `${d.quality}%`,
    d.defectCount > 0 ? d.defectCount.toString() : '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: trendTableHead,
    body: trendRows,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- 4. DETAILED DATA TABLES (BY ORDERS OR GENERAL DEPARTMENT) ---
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont(fontName, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);

  if (reportMode === 'orders' || reportMode === 'colors') {
    doc.text(
      isRu ? 'ДЕТАЛЬНАЯ ВЕДОМОСТЬ ВЫПУСКА ЗАКАЗОВ' : 'BUYURTMALAR BO\'YICHA ISHLAB CHIQARISH HISOBOTI',
      margin,
      currentY
    );
    currentY += 5;

    const ordersTableHead = [
      [
        'MOS Kod',
        isRu ? 'Модель / Артикул' : 'Model / Artikul',
        isRu ? 'Бренд' : 'Brend',
        isRu ? 'Заказ' : 'Buyurtma',
        isRu ? 'Крой' : 'Kroy',
        isRu ? 'Раздача' : 'Razdacha',
        isRu ? 'Пошив' : 'Tikuv',
        isRu ? 'Упаковка' : 'Upakovka',
        isRu ? 'Брак' : 'Brak',
        isRu ? 'Остаток' : 'Qoldiq',
        '%'
      ]
    ];

    const ordersRows = filteredOrders.slice(0, 40).map(o => {
      const sewnQty = Object.values(o.poshivSizes || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0) || o.qtyPotok || 0;
      const remain = Math.max(0, o.qtyOrder - o.qtyPackaging);
      const percent = o.qtyOrder > 0 ? Math.round((o.qtyPackaging / o.qtyOrder) * 100) : 0;
      return [
        o.mosCode || '-',
        o.modelCode || o.orderNumber,
        o.brandName || '-',
        o.qtyOrder.toLocaleString(),
        o.qtyCut.toLocaleString(),
        o.qtyPotok.toLocaleString(),
        sewnQty.toLocaleString(),
        o.qtyPackaging.toLocaleString(),
        o.qtyDefect.toString(),
        remain.toLocaleString(),
        `${percent}%`
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: ordersTableHead,
      body: ordersRows,
      theme: 'grid',
      styles: {
        font: fontName,
        fontSize: 6.5,
        cellPadding: 1.5,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  } else {
    // KPI / General Mode: Department Aggregate Table & Defect Summary
    doc.text(
      isRu ? 'СВОДКА ВЫПОЛНЕНИЯ ПО ЦЕХАМ И ПОДРАЗДЕЛЕНИЯМ' : 'BO\'LIMLAR VA SEXLAR KESIMIDAGI ISHLAB CHIQARISH',
      margin,
      currentY
    );
    currentY += 5;

    const totalOrdersQty = orders.reduce((sum, o) => sum + (o.qtyOrder || 0), 0);
    const totalCut = orders.reduce((sum, o) => sum + (o.qtyCut || 0), 0);
    const totalPotok = orders.reduce((sum, o) => sum + (o.qtyPotok || 0), 0);
    const totalSewn = orders.reduce((sum, o) => {
      const pSizes = Object.values(o.poshivSizes || {}).reduce((s, v) => s + (v || 0), 0);
      return sum + (pSizes || o.qtyPotok || 0);
    }, 0);
    const totalPacked = orders.reduce((sum, o) => sum + (o.qtyPackaging || 0), 0);
    const totalDefect = defects.reduce((sum, d) => sum + (d.quantity || 0), 0) + orders.reduce((sum, o) => sum + (o.qtyDefect || 0), 0);
    const totalRemain = Math.max(0, totalOrdersQty - totalPacked);

    const deptHead = [
      [
        isRu ? 'Цех / Этап производства' : 'Bo\'lim / Bosqich',
        isRu ? 'Объем (шт)' : 'Hajm (dona)',
        isRu ? 'Доля от заказа %' : 'Buyurtmaga nisbatan %',
        isRu ? 'Статус готовности' : 'Holat'
      ]
    ];

    const deptBody = [
      [isRu ? '1. Общий портфель заказов' : '1. Jami buyurtmalar portfeli', totalOrdersQty.toLocaleString(), '100%', isRu ? 'Утвержден' : 'Tasdiqlangan'],
      [isRu ? '2. Раскройный цех (Крой)' : '2. Bichuv sexi (Kroy)', totalCut.toLocaleString(), `${Math.round((totalCut / Math.max(1, totalOrdersQty)) * 100)}%`, isRu ? 'В работе' : 'Jarayonda'],
      [isRu ? '3. Раздача в потоки (Раздача)' : '3. Razdacha (Potok)', totalPotok.toLocaleString(), `${Math.round((totalPotok / Math.max(1, totalOrdersQty)) * 100)}%`, isRu ? 'Распределено' : 'Tarqatildi'],
      [isRu ? '4. Швейный цех (Пошив)' : '4. Tikuv sexi (Poshiv)', totalSewn.toLocaleString(), `${Math.round((totalSewn / Math.max(1, totalOrdersQty)) * 100)}%`, isRu ? 'Сшито' : 'Tikildi'],
      [isRu ? '5. Упаковка и маркировка (Готово)' : '5. Qadoqlash va markirovka', totalPacked.toLocaleString(), `${Math.round((totalPacked / Math.max(1, totalOrdersQty)) * 100)}%`, isRu ? 'Готовая продукция' : 'Tayyor mahsulot'],
      [isRu ? '6. Незавершенное производство (Остаток)' : '6. Tugallanmagan ishlab chiqarish (Qoldiq)', totalRemain.toLocaleString(), `${Math.round((totalRemain / Math.max(1, totalOrdersQty)) * 100)}%`, isRu ? 'В процессе сборки' : 'Jarayonda'],
      [isRu ? '7. Брак и рекламации (ОТК)' : '7. Brak va shikastlanishlar (OTK)', totalDefect.toLocaleString(), `${((totalDefect / Math.max(1, totalOrdersQty)) * 100).toFixed(1)}%`, isRu ? 'Контроль качества' : 'Sifat nazorati']
    ];

    autoTable(doc, {
      startY: currentY,
      head: deptHead,
      body: deptBody,
      theme: 'grid',
      styles: {
        font: fontName,
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- 5. PAGE NUMBERING & FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Shogirt ERP • ' + (isRu ? 'Система управления текстильным и швейным производством' : 'To\'qimachilik va tikuvchilik boshqaruv tizimi'),
      margin,
      pageHeight - 6
    );

    const pageStr = `${isRu ? 'Стр.' : 'Sahifa'} ${i} / ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 6);
  }

  // Save the PDF
  const safeDate = new Date().toISOString().split('T')[0];
  const filename = `Shogirt_Production_Report_${reportMode}_${safeDate}.pdf`;
  doc.save(filename);
}
