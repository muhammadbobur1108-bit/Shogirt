import React, { useState, useRef } from 'react';
import { PrintTask, Order, AppUser } from '../types';
import { TRANSLATIONS, Language } from '../locales';
import { 
  Printer, 
  Plus, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  User, 
  FileText, 
  Palette,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

interface PrintShopViewProps {
  printTasks: PrintTask[];
  orders: Order[];
  onAddPrintTask: (task: PrintTask) => void;
  onUpdatePrintTask: (updated: PrintTask) => void;
  onDeletePrintTask?: (id: string) => void;
  currentUser?: AppUser | null;
  lang: Language;
}

export default function PrintShopView({ printTasks, orders, onAddPrintTask, onUpdatePrintTask, onDeletePrintTask, currentUser, lang }: PrintShopViewProps) {
  const t = TRANSLATIONS[lang];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [printType, setPrintType] = useState<'silk-screen' | 'sublimatsiya' | 'termo-trans' | 'nakleyka'>('silk-screen');
  const [designName, setDesignName] = useState('');
  const [colorsInput, setColorsInput] = useState(lang === 'uz' ? 'Oq, Qora' : 'Белый, Черный');
  const [assigned, setAssigned] = useState('');
  const [notes, setNotes] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<PrintTask | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // Translations helpers inside view
  const prtT = {
    uz: {
      addQueueBtn: "Pechat navbatini qo'shish",
      taskModalTitle: "Pechat bo'limiga yangi vazifa qo'shish",
      orderSelectLabel: "Buyurtmani tanlang *",
      assignedOperatorLabel: "Mas'ul bosmachi (Printer) *",
      assignedOperatorPl: "Masalan: Akmal T.",
      inkColorsLabel: "Bo'yoq ranglari (Vergül bilan ajrating) *",
      inkColorsPl: "Masalan: Oq, To'q qizil, Oltin",
      notesLabel: "Maxsus texnologik talablar/Izohlar",
      notesPl: "Kelistirib olingan harorat, quritish vaqti yoki uslublar...",
      validationAlert: "Iltimos, barcha maydonlarni to'ldiring!",
      printProgress: "Bosish progressi:",
      startBtn: "Bosishni boshlash",
      completeBtn: "Bosib bo'lindi",
      addBtn: "Qo'shish",
      activeJobs: "Mavjud bosmalar",
      totalJobs: "Jami topshiriqlar",
      completedJobs: "Tugallangan",
      excelExport: "Eksport",
      excelImport: "Import",
      printBtn: "Chop etish (PDF)"
    },
    ru: {
      addQueueBtn: "Добавить очередь печати",
      taskModalTitle: "Добавить задачу в печатный цех",
      orderSelectLabel: "Выберите заказ *",
      assignedOperatorLabel: "Ответственный печатник (Принтер) *",
      assignedOperatorPl: "Например: Акмаль Т.",
      inkColorsLabel: "Цвета красок (Разделяйте запятой) *",
      inkColorsPl: "Например: Белый, Красный, Золото",
      notesLabel: "Особые технологические требования / Примечания",
      notesPl: "Согласованная температура, время сушки или особенности...",
      validationAlert: "Пожалуйста, заполните все обязательные поля!",
      printProgress: "Прогресс печати:",
      startBtn: "Начать печать",
      completeBtn: "Печать завершена",
      addBtn: "Добавить",
      activeJobs: "Активные задания",
      totalJobs: "Всего заданий",
      completedJobs: "Завершено",
      excelExport: "Экспорт",
      excelImport: "Импорт",
      printBtn: "Печать (PDF)"
    }
  }[lang];

  // Handle printing increments
  const handleUpdateCompleted = (taskId: string, increment: number) => {
    const task = printTasks.find(p => p.id === taskId);
    if (!task) return;

    const newCompleted = Math.min(task.totalQuantity, Math.max(0, task.completedQty + increment));
    let newStatus = task.status;
    if (newCompleted >= task.totalQuantity) {
      newStatus = 'yakunlandi';
    } else if (newCompleted > 0) {
      newStatus = 'bosilmoqda';
    }

    onUpdatePrintTask({
      ...task,
      completedQty: newCompleted,
      status: newStatus
    });
  };

  const handleStatusChange = (taskId: string, newStatus: any) => {
    const task = printTasks.find(p => p.id === taskId);
    if (!task) return;

    onUpdatePrintTask({
      ...task,
      status: newStatus,
      completedQty: newStatus === 'yakunlandi' ? task.totalQuantity : task.completedQty
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !designName.trim() || !assigned.trim()) {
      alert(prtT.validationAlert);
      return;
    }

    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const newTask: PrintTask = {
      id: `prt-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      productType: order.productType,
      totalQuantity: order.totalQuantity,
      printType,
      printDesignName: designName,
      inkColors: colorsInput.split(',').map(s => s.trim()),
      status: 'kutilmoqda',
      assignedOperator: assigned,
      completedQty: 0,
      notes
    };

    onAddPrintTask(newTask);

    // Reset
    setSelectedOrderId('');
    setDesignName('');
    setColorsInput(lang === 'uz' ? 'Oq, Qora' : 'Белый, Черный');
    setAssigned('');
    setNotes('');
    setIsAddOpen(false);
  };

  const handleExportExcel = () => {
    const headers = "ID,OrderID,OrderNumber,CustomerName,ProductType,TotalQuantity,PrintType,PrintDesignName,InkColors,Status,AssignedOperator,CompletedQty,Notes\n";
    const rows = printTasks.map(t => `"${t.id}","${t.orderId}","${t.orderNumber}","${t.customerName}","${t.productType}",${t.totalQuantity},"${t.printType}","${t.printDesignName}","${t.inkColors.join(';') || ''}","${t.status}","${t.assignedOperator}",${t.completedQty},"${t.notes || ''}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `print_tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split("\n");
      let addedCount = 0;
      lines.forEach((line, index) => {
        if (index === 0) return; // skip header
        const parts = line.split(",").map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 8) {
          const orderNumber = parts[2] || 'ORD-IMPORT';
          const customerName = parts[3] || 'Customer-Import';
          const productType = parts[4] || 'Product';
          const totalQuantity = parseInt(parts[5]) || 100;
          const pType = parts[6] || 'silk-screen';
          const design = parts[7] || 'Design';
          const inks = parts[8] ? parts[8].split(';') : ['Oq'];
          const statusVal = parts[9] || 'kutilmoqda';
          const operatorVal = parts[10] || 'Operator';
          const compQty = parseInt(parts[11]) || 0;
          const noteVal = parts[12] || '';

          onAddPrintTask({
            id: `prt-imported-${Date.now()}-${index}`,
            orderId: parts[1] || `ord-${Date.now()}`,
            orderNumber,
            customerName,
            productType,
            totalQuantity,
            printType: pType as any,
            printDesignName: design,
            inkColors: inks,
            status: statusVal as any,
            assignedOperator: operatorVal,
            completedQty: compQty,
            notes: noteVal
          });
          addedCount++;
        }
      });
      alert(lang === 'uz' ? `${addedCount} ta vazifa muvaffaqiyatli import qilindi.` : `Успешно импортировано ${addedCount} заданий.`);
    };
    reader.readAsText(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const taskRows = printTasks.map((task, i) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${task.orderNumber}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.productType}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.customerName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${task.printType}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.printDesignName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.inkColors.join(', ')}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.assignedOperator}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${task.completedQty} / ${task.totalQuantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; text-transform: uppercase;">${task.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${lang === 'uz' ? "Pechat Bo'limi" : "Печатный Цех"}</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 20px; }
            h2 { text-transform: uppercase; letter-spacing: -0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f3f4f6; padding: 10px; border: 1px solid #ddd; text-align: left; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>${lang === 'uz' ? "PECHAT BO'LIMI TOPShIRIQLARI" : "ЗАДАНИЯ ПЕЧАТНОГО ЦЕХА"}</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">№</th>
                <th>${lang === 'uz' ? "Buyurtma" : "Заказ"}</th>
                <th>${lang === 'uz' ? "Mahsulot" : "Изделие"}</th>
                <th>${lang === 'uz' ? "Mijoz" : "Клиент"}</th>
                <th style="text-align: center;">${lang === 'uz' ? "Turi" : "Тип"}</th>
                <th>${lang === 'uz' ? "Dizayn" : "Дизайн"}</th>
                <th>${lang === 'uz' ? "Ranglar" : "Цвета"}</th>
                <th>${lang === 'uz' ? "Bosmachi" : "Печатник"}</th>
                <th style="text-align: center;">${lang === 'uz' ? "Progress" : "Прогресс"}</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${taskRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // KPIs
  const totalPrinters = printTasks.length;
  const activePrinters = printTasks.filter(t => t.status === 'bosilmoqda').length;
  const finishedPrinters = printTasks.filter(t => t.status === 'yakunlandi').length;

  return (
    <div className="space-y-6" id="print-shop-view-module">
      
      {/* 1. Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-lg uppercase tracking-tight flex items-center">
            <Printer className="w-5 h-5 mr-2 text-indigo-600 animate-pulse" /> {t.printShopTitle}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{t.printShopSub}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Excel Import button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".csv,.txt" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            {prtT.excelImport}
          </button>

          {/* Excel Export button */}
          <button 
            onClick={handleExportExcel}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            {prtT.excelExport}
          </button>

          {/* Print button */}
          <button 
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            {prtT.printBtn}
          </button>

          <button
            onClick={() => {
              const printOrders = orders.filter(o => o.printRequired);
              if (printOrders.length > 0) {
                setSelectedOrderId(printOrders[0].id);
              } else if (orders.length > 0) {
                setSelectedOrderId(orders[0].id);
              }
              setIsAddOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center shadow-xs cursor-pointer w-full md:w-auto justify-center transition-transform hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> {prtT.addQueueBtn}
          </button>
        </div>
      </div>

      {/* 2. Micro KPIs */}
      <div className="grid grid-cols-3 gap-4" id="print-shop-kpi-row">
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{prtT.totalJobs}</span>
          <h3 className="text-lg font-black text-indigo-950 mt-1">{totalPrinters}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{prtT.activeJobs}</span>
          <h3 className="text-lg font-black text-blue-700 mt-1">{activePrinters}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">{prtT.completedJobs}</span>
          <h3 className="text-lg font-black text-emerald-800 mt-1">{finishedPrinters}</h3>
        </div>
      </div>

      {/* 3. Printing queue lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="print-tasks-grid">
        {printTasks.map(task => {
          const pct = Math.round((task.completedQty / task.totalQuantity) * 100);
          
          return (
            <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              
              <div className="space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-700 font-bold block">{lang === 'uz' ? 'Buyurtma' : 'Заказ'}: {task.orderNumber}</span>
                    <h4 className="text-xs font-black text-gray-900 mt-0.5">{task.productType}</h4>
                    <p className="text-[11px] text-gray-400 font-medium">Mijoz/Клиент: {task.customerName}</p>
                  </div>
                  
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded border uppercase tracking-wide ${
                    task.status === 'yakunlandi' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : task.status === 'bosilmoqda'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {t[task.status as keyof typeof t] || task.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">{t.printType}</span>
                    <strong className="text-gray-700">{task.printType}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">{t.printDesignName}</span>
                    <strong className="text-gray-700">{task.printDesignName}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">{t.inkColors}</span>
                    <strong className="text-gray-700">{task.inkColors.join(', ')}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">{t.activeOperator}</span>
                    <strong className="text-indigo-900">{task.assignedOperator}</strong>
                  </div>
                </div>

                {task.notes && (
                  <p className="text-[11px] text-gray-500 bg-amber-50/40 p-2 rounded border border-amber-100 flex items-start">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0 mt-0.5" />
                    <span>{task.notes}</span>
                  </p>
                )}

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-700">
                    <span>{t.completedPcs}: {task.completedQty} / {task.totalQuantity} {t.pcs}</span>
                    <span className="text-indigo-600">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${task.status === 'yakunlandi' ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Printing Controls */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100 justify-between items-center text-xs">
                <div className="flex gap-1.5 w-full sm:w-auto">
                  {task.status === 'kutilmoqda' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'bosilmoqda')}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg flex items-center justify-center border border-indigo-200 cursor-pointer text-xs"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" /> {t.startPrint}
                    </button>
                  )}
                  {task.status === 'bosilmoqda' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'yakunlandi')}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg flex items-center justify-center border border-emerald-200 cursor-pointer text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t.completePrint}
                    </button>
                  )}
                  {currentUser?.role === 'super_admin' && onDeletePrintTask && (
                    <button
                      onClick={() => {
                        setDeletePassword('');
                        setDeletePasswordError('');
                        setTaskToDelete(task);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center border border-rose-200 cursor-pointer text-xs"
                      title={lang === 'uz' ? "O'chirish" : 'Удалить'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {task.status === 'bosilmoqda' && (
                  <div className="flex items-center space-x-1 w-full sm:w-auto justify-end">
                    <span className="text-[10px] text-gray-400 font-bold">{prtT.addBtn}:</span>
                    <button 
                      onClick={() => handleUpdateCompleted(task.id, 50)} 
                      className="px-2 py-1 bg-gray-150 hover:bg-gray-200 rounded text-[10px] font-black text-gray-700 cursor-pointer"
                    >
                      +50
                    </button>
                    <button 
                      onClick={() => handleUpdateCompleted(task.id, 100)} 
                      className="px-2 py-1 bg-gray-150 hover:bg-gray-200 rounded text-[10px] font-black text-gray-700 cursor-pointer"
                    >
                      +100
                    </button>
                    <button 
                      onClick={() => handleUpdateCompleted(task.id, 250)} 
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-[10px] font-black text-white shadow-xs cursor-pointer"
                    >
                      +250
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* ==================================== MODAL: ADD PRINT TASK ==================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100" id="add-print-task-modal">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight flex items-center">
                <Palette className="w-4 h-4 mr-1.5 text-indigo-600" /> {prtT.taskModalTitle}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-900 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              
              <div className="space-y-1">
                <label className="block font-bold text-gray-600">{prtT.orderSelectLabel}</label>
                <select 
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs cursor-pointer"
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName} ({o.productType}) - {o.totalQuantity} {t.pcs}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{t.printType}</label>
                  <select 
                    value={printType}
                    onChange={(e: any) => setPrintType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="silk-screen">Silk Screen (Shlyop)</option>
                    <option value="sublimatsiya">Sublimatsiya</option>
                    <option value="termo-trans">Termo-transfer</option>
                    <option value="nakleyka">Nakleyka / Sticker</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{t.printDesignName} *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Masalan: Kids Lion Front"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{prtT.inkColorsLabel}</label>
                  <input 
                    type="text"
                    required
                    placeholder={prtT.inkColorsPl}
                    value={colorsInput}
                    onChange={(e) => setColorsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{prtT.assignedOperatorLabel}</label>
                  <input 
                    type="text"
                    required
                    placeholder={prtT.assignedOperatorPl}
                    value={assigned}
                    onChange={(e) => setAssigned(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-600">{prtT.notesLabel}</label>
                <textarea 
                  rows={2}
                  placeholder={prtT.notesPl}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  {t.add}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  {lang === 'uz' ? "Pechat topshirig'ini o'chirish" : "Удаление задачи печати"}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{taskToDelete.designName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {lang === 'uz' 
                ? `Haqiqatan ham ushbu pechat topshirig'ini (${taskToDelete.designName}) o'chirib tashlamoqchimisiz?`
                : `Вы действительно хотите удалить эту задачу печати (${taskToDelete.designName})?`}
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                {lang === 'uz' ? "Super Admin paroli (harf/raqam):" : "Пароль Супер Админа (буквы/цифры):"}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeletePasswordError('');
                }}
                placeholder={lang === 'uz' ? "Parolni kiriting..." : "Введите пароль..."}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-hidden focus:border-amber-500"
                autoFocus
              />
              {deletePasswordError && (
                <p className="text-rose-500 text-xs font-semibold">{deletePasswordError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  const superAdminPin = currentUser?.pin || '0000';
                  if (deletePassword.trim() !== superAdminPin) {
                    setDeletePasswordError(lang === 'uz' ? "Noto'g'ri parol! Ma'lumot o'chirilmadi." : "Неверный пароль! Данные не удалены.");
                    return;
                  }
                  if (onDeletePrintTask) {
                    onDeletePrintTask(taskToDelete.id);
                  }
                  setTaskToDelete(null);
                  setDeletePassword('');
                  setDeletePasswordError('');
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {lang === 'uz' ? "Ha, o'chirish" : "Да, удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
