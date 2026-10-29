import React, { useState, useRef } from 'react';
import { Customer, AppUser } from '../types';
import { TRANSLATIONS, Language } from '../locales';
import { 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  Building, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Award, 
  ShieldCheck,
  Trash2,
  Download,
  Upload,
  Printer
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
  currentUser?: AppUser | null;
  lang: Language;
}

export default function CustomersView({ customers, onAddCustomer, onDeleteCustomer, currentUser, lang }: CustomersViewProps) {
  const t = TRANSLATIONS[lang];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // Translations helpers inside view
  const cT = {
    uz: {
      searchPlaceholder: "Mijoz ismi yoki kompaniya qidirish...",
      addCustomer: "Yangi Mijoz Qo'shish",
      title: "Mijozlar Bazasi (CRM)",
      sub: "Buyurtmachilar ro'yxati, aloqa ma'lumotlari hamda moliyaviy hisob-kitoblar jurnali",
      totalCustomers: "JAMI MIJOZLAR",
      totalSpent: "JAMI SUMMA",
      withOrders: "BUYURTMALI",
      corporate: "YURIDIK SHAXSLAR",
      personalClient: "Shaxsiy buyurtmachi",
      noCustomers: "Mijozlar topilmadi. Qidiruv so'rovini tekshiring yoki yangi mijoz qo'shing.",
      fullName: "Mijozning To'liq Ismi (F.I.SH)",
      companyName: "Kompaniya / Korxona nomi",
      phoneLabel: "Telefon Raqami",
      emailLabel: "Elektron pochta (Email)",
      saveBtn: "Saqlash",
      validationAlert: "Iltimos, ism va telefon raqamini kiriting!",
      excelExport: "Eksport",
      excelImport: "Import",
      printBtn: "Chop etish (PDF)"
    },
    ru: {
      searchPlaceholder: "Поиск клиента или компании...",
      addCustomer: "Добавить Клиента",
      title: "База Клиентов (CRM)",
      sub: "Список заказчиков, контактные данные и журнал финансовых расчетов",
      totalCustomers: "ВСЕГО КЛИЕНТОВ",
      totalSpent: "ОБЩИЙ ОБОРОТ",
      withOrders: "С ЗАКАЗАМИ",
      corporate: "ЮР. ЛИЦА",
      personalClient: "Частный заказчик",
      noCustomers: "Клиенты не найдены. Проверьте запрос или добавьте нового клиента.",
      fullName: "Полное имя клиента (Ф.И.О)",
      companyName: "Название компании / предприятия",
      phoneLabel: "Номер телефона",
      emailLabel: "Электронная почта (Email)",
      saveBtn: "Сохранить",
      validationAlert: "Пожалуйста, введите имя и номер телефона!",
      excelExport: "Экспорт",
      excelImport: "Импорт",
      printBtn: "Печать (PDF)"
    }
  }[lang];

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert(cT.validationAlert);
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: formName,
      company: formCompany || cT.personalClient,
      phone: formPhone,
      email: formEmail || undefined,
      totalOrders: 0,
      totalSpent: 0
    };

    onAddCustomer(newCust);

    // reset
    setFormName('');
    setFormCompany('');
    setFormPhone('');
    setFormEmail('');
    setIsAddModalOpen(false);
  };

  const handleExportExcel = () => {
    const headers = "ID,Name,Company,Phone,Email,TotalOrders,TotalSpent\n";
    const rows = customers.map(c => `"${c.id}","${c.name}","${c.company}","${c.phone}","${c.email || ''}",${c.totalOrders},${c.totalSpent}`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
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
        if (parts.length >= 4) {
          const name = parts[1];
          const company = parts[2];
          const phone = parts[3];
          const email = parts[4] || undefined;
          if (name && phone) {
            onAddCustomer({
              id: `cust-imported-${Date.now()}-${index}`,
              name,
              company: company || cT.personalClient,
              phone,
              email,
              totalOrders: parseInt(parts[5]) || 0,
              totalSpent: parseFloat(parts[6]) || 0
            });
            addedCount++;
          }
        }
      });
      alert(lang === 'uz' ? `${addedCount} ta mijoz muvaffaqiyatli import qilindi.` : `Успешно импортировано ${addedCount} клиентов.`);
    };
    reader.readAsText(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const customerRows = filteredCustomers.map((c, i) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${c.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${c.company}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${c.phone}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${c.email || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.totalOrders}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #16a34a; font-weight: bold;">$${c.totalSpent.toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${cT.title}</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 20px; }
            h2 { text-transform: uppercase; letter-spacing: -0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f3f4f6; padding: 10px; border: 1px solid #ddd; text-align: left; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>${cT.title}</h2>
          <p>${cT.sub}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">№</th>
                <th>${lang === 'uz' ? "Mijoz nomi" : "Имя клиента"}</th>
                <th>${lang === 'uz' ? "Kompaniya" : "Компания"}</th>
                <th>${lang === 'uz' ? "Telefon" : "Телефон"}</th>
                <th>Email</th>
                <th style="text-align: center;">${lang === 'uz' ? "Buyurtmalar" : "Заказы"}</th>
                <th style="text-align: right;">${lang === 'uz' ? "Aylanma" : "Оборот"}</th>
              </tr>
            </thead>
            <tbody>
              ${customerRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // KPI Metrics
  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const corporateCount = customers.filter(c => c.company && c.company !== 'Shaxsiy buyurtmachi' && c.company !== 'Частный заказчик').length;
  const customersWithOrders = customers.filter(c => c.totalOrders > 0).length;

  return (
    <div className="space-y-6" id="customers-view-module">
      
      {/* Header Panel */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-lg uppercase tracking-tight flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-600" /> {cT.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{cT.sub}</p>
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
            {cT.excelImport}
          </button>

          {/* Excel Export button */}
          <button 
            onClick={handleExportExcel}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            {cT.excelExport}
          </button>

          {/* Print button */}
          <button 
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            {cT.printBtn}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center shadow-sm cursor-pointer justify-center transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> {cT.addCustomer}
          </button>
        </div>
      </div>

      {/* KPI Visual Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="customers-kpi-row">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{cT.totalCustomers}</span>
          <h3 className="text-xl font-black text-gray-900 mt-1">{customers.length}</h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{cT.totalSpent}</span>
          <h3 className="text-xl font-black text-emerald-600 mt-1">${totalSpentAll.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{cT.withOrders}</span>
          <h3 className="text-xl font-black text-indigo-600 mt-1">{customersWithOrders} <span className="text-[10px] text-gray-400 font-medium">/{customers.length}</span></h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{cT.corporate}</span>
          <h3 className="text-xl font-black text-purple-600 mt-1">{corporateCount}</h3>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            type="text"
            placeholder={cT.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="customers-grid">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs space-y-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between">
            
            <div className="space-y-3">
              {/* Customer identity details */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-gray-900 leading-snug">{customer.name}</h4>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 shrink-0 text-gray-400" /> {customer.company}
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100 shadow-xs">
                    {customer.name.slice(0, 2).toUpperCase()}
                  </span>
                  {currentUser?.role === 'super_admin' && onDeleteCustomer && (
                    <button
                      onClick={() => {
                        setDeletePassword('');
                        setDeletePasswordError('');
                        setCustomerToDelete(customer);
                      }}
                      className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center border border-rose-100 shadow-xs cursor-pointer transition-colors"
                      title={lang === 'uz' ? "O'chirish" : 'Удалить'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact numbers */}
              <div className="space-y-2 border-t border-b border-gray-50 py-3 text-[11px]">
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <span className="font-semibold">{customer.phone}</span>
                </p>
                {customer.email && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <span className="truncate">{customer.email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Financial & Order Counts */}
            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wide">{t.orders}</span>
                <span className="text-xs font-black text-indigo-950 flex items-center justify-center mt-0.5">
                  <ShoppingBag className="w-3.5 h-3.5 mr-1 text-indigo-500" /> {customer.totalOrders} {t.pcs}
                </span>
              </div>
              
              <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wide">{t.spent}</span>
                <span className="text-xs font-black text-emerald-800 flex items-center justify-center mt-0.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> ${customer.totalSpent.toLocaleString()}
                </span>
              </div>
            </div>

          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-gray-400 bg-white border border-dashed rounded-xl p-8">
            {cT.noCustomers}
          </div>
        )}
      </div>

      {/* ==================================== MODAL: ADD CUSTOMER ==================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100" id="add-customer-modal">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight flex items-center">
                <UserPlus className="w-4 h-4 mr-1.5 text-indigo-600" /> {cT.addCustomer}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4 text-xs">
              
              <div className="space-y-1">
                <label className="block font-bold text-gray-600">{cT.fullName} *</label>
                <input 
                  type="text"
                  required
                  placeholder="Masalan: Sardor Rahimjonov"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-600">{cT.companyName}</label>
                <input 
                  type="text"
                  placeholder="Masalan: Oqshom Tekstil MCHJ"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{cT.phoneLabel} *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Masalan: +998 90 123-45-67"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-600">{cT.emailLabel}</label>
                  <input 
                    type="email"
                    placeholder="Masalan: info@oqshom.uz"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  {cT.saveBtn}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Customer Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  {lang === 'uz' ? "Mijozni o'chirish" : "Удаление клиента"}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{customerToDelete.name} ({customerToDelete.company})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {lang === 'uz' 
                ? `Haqiqatan ham "${customerToDelete.name}" mijozini tizimdan o'chirib tashlamoqchimisiz?`
                : `Вы действительно хотите удалить клиента "${customerToDelete.name}"?`}
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
                onClick={() => setCustomerToDelete(null)}
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
                  if (onDeleteCustomer) {
                    onDeleteCustomer(customerToDelete.id);
                  }
                  setCustomerToDelete(null);
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
