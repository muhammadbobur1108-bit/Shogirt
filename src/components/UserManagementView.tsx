import React, { useState, useRef } from 'react';
import { AppUser, UserRole } from '../types';
import { TRANSLATIONS, Language } from '../locales';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Phone, 
  Key, 
  Activity, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Trash2,
  Download,
  Upload,
  Printer,
  Edit3,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';

interface UserManagementViewProps {
  users: AppUser[];
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (updated: AppUser) => void;
  onDeleteUser?: (id: string) => void;
  currentUser?: AppUser | null;
  lang: Language;
}

export const ALL_SYSTEM_TABS = [
  { id: 'dashboard', nameUz: 'Дашбоард', nameRu: 'Дашборд' },
  { id: 'buyurtmalar', nameUz: 'Заказлар (Buyurtmalar)', nameRu: 'Заказы' },
  { id: 'ombor', nameUz: 'Омборхона (Тайёр маҳсулот)', nameRu: 'Склад готовой продукции' },
  { id: 'hisobotlar', nameUz: 'Ҳисоботлар (Отчеты)', nameRu: 'Отчеты' },
  { id: 'brak', nameUz: 'Брак (Дефектлар)', nameRu: 'Брак' },
  { id: 'print', nameUz: 'Вышивка ва Печатних цех', nameRu: 'Вышивка и Печатный цех' },
  { id: 'users', nameUz: 'Фойдаланувчилар (Xodimlar)', nameRu: 'Пользователи' },
  { id: 'settings', nameUz: 'Созламалар (Настройки)', nameRu: 'Настройки' }
];

export default function UserManagementView({ 
  users, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser, 
  currentUser, 
  lang 
}: UserManagementViewProps) {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('tikuvchi');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [selectedTabs, setSelectedTabs] = useState<string[]>([
    'dashboard', 'buyurtmalar', 'ombor', 'hisobotlar', 'brak', 'print', 'users', 'settings'
  ]);

  const [showPins, setShowPins] = useState<{ [userId: string]: boolean }>({});

  const usrT = {
    uz: {
      subTitle: "Xodimlar ro'yxati, lavozimlar, login-parollar va bo'limlar ruxsati boshqaruvi (Faqat Super Admin)",
      addBtn: "Yangi Xodim Qo'shish",
      activeStatusLabel: "Holati:",
      activeStatusFaol: "Faol (Active)",
      activeStatusNofaol: "Nofaol (Inactive)",
      toggleStatusDeactivate: "Nofaol qilish",
      toggleStatusActivate: "Faollashtirish",
      modalTitleAdd: "Yangi xodim qo'shish (Super Admin)",
      modalTitleEdit: "Xodim ma'lumotlari, Login/Parol va Ruxsatlarni tahrirlash",
      fullNameLabel: "To'liq Ismi (F.I.SH) *",
      fullNamePl: "Masalan: Sardor Komilov",
      usernameLabel: "Tizimdagi logini (Username / Login) *",
      usernamePl: "Masalan: sardor_k",
      roleLabel: "Lavozimi (Rol)",
      phoneLabel: "Telefon raqami *",
      phonePl: "Masalan: +998 90 123-45-67",
      pinLabel: "Kirish Paroli / PIN (4 raqam) *",
      pinPl: "Masalan: 7788",
      allowedTabsLabel: "Foydalanuvchiga ko'rinadigan tizim bo'limlari (Ruxsatlar):",
      selectAll: "Hamma bo'limlarni tanlash",
      deselectAll: "Tozalash",
      validationAlert: "Iltimos, ism, login, telefon va 4-raqamli PIN/Parol kiriting!",
      superAdminNotice: "Faqat Super Admin foydalanuvchilarning loginlari, parollari va bo'lim ruxsatlarini o'zgartirishi mumkin!",
      superAdminRole: "Super Admin (Bosh boshqaruvchi)",
      adminRole: "Administrator",
      bichuvchiRole: "Bichuvchi (Cutter)",
      tikuvchiRole: "Tikuvchi (Tailor)",
      printerRole: "Bosmachi (Printer)",
      omborchiRole: "Omborchi (Storekeeper)",
      factoryManagerRole: "Fabrika Menejeri",
      showPin: "Ko'rsatish",
      hidePin: "Yashirish",
      excelExport: "Eksport",
      excelImport: "Import",
      printBtn: "Chop etish (PDF)",
      editBtn: "Tahrirlash",
      accessPermissions: "Bo'limlar ruxsati:"
    },
    ru: {
      subTitle: "Список сотрудников, роли, логины/пароли и управление правами доступа (Только Супер Админ)",
      addBtn: "Добавить сотрудника",
      activeStatusLabel: "Статус:",
      activeStatusFaol: "Активен (Active)",
      activeStatusNofaol: "Неактивен (Inactive)",
      toggleStatusDeactivate: "Деактивировать",
      toggleStatusActivate: "Активировать",
      modalTitleAdd: "Добавить нового сотрудника (Супер Админ)",
      modalTitleEdit: "Редактирование логина, пароля и прав доступа",
      fullNameLabel: "Полное имя (Ф.И.О.) *",
      fullNamePl: "Например: Сардор Комилов",
      usernameLabel: "Логин в системе (Username / Логин) *",
      usernamePl: "Например: sardor_k",
      roleLabel: "Должность (Роль)",
      phoneLabel: "Номер телефона *",
      phonePl: "Например: +998 90 123-45-67",
      pinLabel: "Пароль / ПИН-код (4 цифры) *",
      pinPl: "Например: 7788",
      allowedTabsLabel: "Разделы системы, доступные пользователю (Права):",
      selectAll: "Выбрать все разделы",
      deselectAll: "Очистить",
      validationAlert: "Пожалуйста, введите имя, логин, телефон и 4-значный ПИН/Пароль!",
      superAdminNotice: "Только Супер Админ может изменять логины, пароли и права доступа к разделам!",
      superAdminRole: "Супер Админ (Главный управляющий)",
      adminRole: "Администратор",
      bichuvchiRole: "Раскройщик (Cutter)",
      tikuvchiRole: "Швея (Tailor)",
      printerRole: "Печатник (Printer)",
      omborchiRole: "Кладовщик (Storekeeper)",
      factoryManagerRole: "Менеджер фабрики",
      showPin: "Показать",
      hidePin: "Скрыть",
      excelExport: "Экспорт",
      excelImport: "Импорт",
      printBtn: "Печать (PDF)",
      editBtn: "Редактировать",
      accessPermissions: "Доступ к разделам:"
    }
  }[lang];

  const handleTogglePin = (userId: string) => {
    setShowPins(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleToggleStatus = (user: AppUser) => {
    if (!isSuperAdmin) {
      alert(usrT.superAdminNotice);
      return;
    }
    onUpdateUser({
      ...user,
      activeStatus: !user.activeStatus
    });
  };

  const openAddModal = () => {
    if (!isSuperAdmin) {
      alert(usrT.superAdminNotice);
      return;
    }
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setRole('tikuvchi');
    setPhone('');
    setPin('');
    setSelectedTabs(['dashboard', 'buyurtmalar', 'ombor', 'hisobotlar', 'brak', 'print', 'users', 'settings']);
    setIsAddOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    if (!isSuperAdmin) {
      alert(usrT.superAdminNotice);
      return;
    }
    setEditingUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setRole(user.role);
    setPhone(user.phone);
    setPin(user.pin);
    setSelectedTabs(user.allowedTabs || ALL_SYSTEM_TABS.map(t => t.id));
    setIsAddOpen(true);
  };

  const handleToggleTab = (tabId: string) => {
    if (selectedTabs.includes(tabId)) {
      setSelectedTabs(prev => prev.filter(id => id !== tabId));
    } else {
      setSelectedTabs(prev => [...prev, tabId]);
    }
  };

  const handleSelectAllTabs = () => {
    setSelectedTabs(ALL_SYSTEM_TABS.map(t => t.id));
  };

  const handleDeselectAllTabs = () => {
    setSelectedTabs([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert(usrT.superAdminNotice);
      return;
    }

    if (!fullName.trim() || !username.trim() || !phone.trim() || pin.length !== 4) {
      alert(usrT.validationAlert);
      return;
    }

    if (editingUser) {
      // Update existing user
      const updatedUser: AppUser = {
        ...editingUser,
        fullName,
        username: username.toLowerCase().replace(/\s+/g, ''),
        role,
        phone,
        pin,
        allowedTabs: selectedTabs
      };
      onUpdateUser(updatedUser);
    } else {
      // Add new user
      const newUser: AppUser = {
        id: `usr-${Date.now()}`,
        username: username.toLowerCase().replace(/\s+/g, ''),
        fullName,
        role,
        phone,
        activeStatus: true,
        pin,
        allowedTabs: selectedTabs
      };
      onAddUser(newUser);
    }

    // Reset & Close
    setIsAddOpen(false);
    setEditingUser(null);
  };

  const handleExportExcel = () => {
    const headers = "ID,FullName,Username,Role,Phone,PIN,ActiveStatus,AllowedTabs\n";
    const rows = users.map(u => `"${u.id}","${u.fullName}","${u.username}","${u.role}","${u.phone}","${u.pin}",${u.activeStatus},"${(u.allowedTabs || []).join(';')}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) {
      alert(usrT.superAdminNotice);
      return;
    }
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
        if (parts.length >= 6) {
          const fullNameVal = parts[1];
          const usernameVal = parts[2];
          const roleVal = parts[3];
          const phoneVal = parts[4];
          const pinVal = parts[5];
          const activeStatusVal = parts[6] === 'true';
          const tabsVal = parts[7] ? parts[7].split(';') : undefined;

          if (fullNameVal && usernameVal && phoneVal && pinVal) {
            onAddUser({
              id: `usr-imported-${Date.now()}-${index}`,
              fullName: fullNameVal,
              username: usernameVal,
              role: (roleVal as any) || 'tikuvchi',
              phone: phoneVal,
              pin: pinVal,
              activeStatus: activeStatusVal,
              allowedTabs: tabsVal
            });
            addedCount++;
          }
        }
      });
      alert(lang === 'uz' ? `${addedCount} ta xodim muvaffaqiyatli import qilindi.` : `Успешно импортировано ${addedCount} сотрудников.`);
    };
    reader.readAsText(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const userRows = users.map((u, i) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${u.fullName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${u.username}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-transform: uppercase;">${u.role}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${u.phone}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${u.pin}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${u.activeStatus ? 'Active' : 'Inactive'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${lang === 'uz' ? "Xodimlar ro'yxati" : "Список сотрудников"}</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 20px; }
            h2 { text-transform: uppercase; letter-spacing: -0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f3f4f6; padding: 10px; border: 1px solid #ddd; text-align: left; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>${lang === 'uz' ? "KORXONA XODIMLARI RO'YXATI" : "СПИСОК СОТРУДНИКОВ ПРЕДПРИЯТИЯ"}</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">№</th>
                <th>${lang === 'uz' ? "To'liq ism" : "Полное имя"}</th>
                <th>${lang === 'uz' ? "Login" : "Логин"}</th>
                <th>${lang === 'uz' ? "Lavozim" : "Должность"}</th>
                <th>${lang === 'uz' ? "Telefon" : "Телефон"}</th>
                <th style="text-align: center;">PIN</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${userRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getRoleLabel = (r: string) => {
    switch(r) {
      case 'super_admin': return usrT.superAdminRole;
      case 'admin': return usrT.adminRole;
      case 'bichuvchi': return usrT.bichuvchiRole;
      case 'tikuvchi': return usrT.tikuvchiRole;
      case 'printer': return usrT.printerRole;
      case 'omborchi': return usrT.omborchiRole;
      case 'factory_manager': return usrT.factoryManagerRole;
      default: return r;
    }
  };

  return (
    <div className="space-y-6" id="user-management-view-module">
      
      {/* Super Admin Status Warning Banner */}
      {!isSuperAdmin ? (
        <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 p-4 rounded-xl flex items-center gap-3 text-xs shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="font-bold leading-relaxed">
            {usrT.superAdminNotice}
          </p>
        </div>
      ) : (
        <div className="bg-indigo-950/50 border border-indigo-500/40 text-indigo-200 p-3.5 rounded-xl flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-extrabold uppercase tracking-wide">
              {lang === 'uz' ? 'Super Admin Rejimi Faol' : 'Режим Супер Админа Активен'}
            </span>
          </div>
          <span className="text-[11px] text-indigo-300 font-semibold">
            {lang === 'uz' ? 'Barcha foydalanuvchilar login, parol va bo\'limlar ruxsatini tahrirlash imkoniyati mavjud' : 'Доступно редактирование логинов, паролей и прав доступа всех пользователей'}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-lg uppercase tracking-tight flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-600" /> {t.userManagement}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{usrT.subTitle}</p>
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
            onClick={() => {
              if (!isSuperAdmin) {
                alert(usrT.superAdminNotice);
                return;
              }
              fileInputRef.current?.click();
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            {usrT.excelImport}
          </button>

          {/* Excel Export button */}
          <button 
            onClick={handleExportExcel}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            {usrT.excelExport}
          </button>

          {/* Print button */}
          <button 
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-200 text-slate-100 font-bold text-xs px-3 py-2 rounded-xl flex items-center shadow-xs cursor-pointer gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            {usrT.printBtn}
          </button>

          <button
            onClick={openAddModal}
            className={`font-bold text-xs px-4 py-2.5 rounded-lg flex items-center shadow-xs cursor-pointer justify-center transition-transform hover:scale-[1.01] ${
              isSuperAdmin 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> {usrT.addBtn}
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="users-grid">
        {users.map(user => {
          const isPinVisible = showPins[user.id];
          const userAllowedTabs = user.allowedTabs || ALL_SYSTEM_TABS.map(t => t.id);

          return (
            <div key={user.id} className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      {user.fullName}
                      {user.role === 'super_admin' && (
                        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Super Admin" />
                      )}
                    </h4>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold">@{user.username}</span>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase ${
                    user.role === 'super_admin'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
                      : user.role === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : user.role === 'bichuvchi'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : user.role === 'tikuvchi'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : user.role === 'printer'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-gray-600 border-t border-b border-gray-50 py-3">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {user.phone}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-indigo-500" /> 
                      <span>Login/Parol: <strong className="font-mono font-bold text-gray-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{isPinVisible ? user.pin : '••••'}</strong></span>
                    </div>
                    <button 
                      onClick={() => handleTogglePin(user.id)}
                      className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {isPinVisible ? usrT.hidePin : usrT.showPin}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <Activity className="w-3.5 h-3.5 text-gray-400" />
                    <span>{usrT.activeStatusLabel}</span>
                    <span className={`font-bold ${user.activeStatus ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {user.activeStatus ? usrT.activeStatusFaol : usrT.activeStatusNofaol}
                    </span>
                  </div>

                  {/* Section Access Badges */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {usrT.accessPermissions}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {ALL_SYSTEM_TABS.map(tab => {
                        const isAllowed = user.role === 'super_admin' || userAllowedTabs.includes(tab.id);
                        return (
                          <span 
                            key={tab.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              isAllowed 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
                            }`}
                          >
                            {lang === 'uz' ? tab.nameUz : tab.nameRu}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <button
                  onClick={() => openEditModal(user)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                    isSuperAdmin
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                  title={usrT.editBtn}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{usrT.editBtn}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                      user.activeStatus 
                        ? 'bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-700 border-gray-200 hover:border-rose-200' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {user.activeStatus ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    {user.activeStatus ? usrT.toggleStatusDeactivate : usrT.toggleStatusActivate}
                  </button>

                  {isSuperAdmin && onDeleteUser && user.role !== 'super_admin' && (
                    <button
                      onClick={() => {
                        setDeletePassword('');
                        setDeletePasswordError('');
                        setUserToDelete(user);
                      }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center border border-rose-200 cursor-pointer"
                      title={lang === 'uz' ? "O'chirish" : 'Удалить'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ==================================== MODAL: ADD / EDIT USER ==================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100" id="add-edit-user-modal">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">
                  {editingUser ? usrT.modalTitleEdit : usrT.modalTitleAdd}
                </h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-900 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              
              <div className="space-y-1">
                <label className="block font-bold text-gray-700">{usrT.fullNameLabel}</label>
                <input 
                  type="text"
                  required
                  placeholder={usrT.fullNamePl}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-700">{usrT.usernameLabel}</label>
                  <input 
                    type="text"
                    required
                    placeholder={usrT.usernamePl}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-500 text-indigo-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-700">{usrT.roleLabel}</label>
                  <select 
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <option value="super_admin">{usrT.superAdminRole}</option>
                    <option value="admin">{usrT.adminRole}</option>
                    <option value="factory_manager">{usrT.factoryManagerRole}</option>
                    <option value="bichuvchi">{usrT.bichuvchiRole}</option>
                    <option value="tikuvchi">{usrT.tikuvchiRole}</option>
                    <option value="printer">{usrT.printerRole}</option>
                    <option value="omborchi">{usrT.omborchiRole}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-700">{usrT.phoneLabel}</label>
                  <input 
                    type="text"
                    required
                    placeholder={usrT.phonePl}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-700">{usrT.pinLabel}</label>
                  <input 
                    type="text"
                    maxLength={4}
                    required
                    placeholder={usrT.pinPl}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono tracking-widest font-black focus:outline-hidden focus:border-indigo-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Allowed Tabs Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-indigo-900 text-xs uppercase tracking-tight">
                    {usrT.allowedTabsLabel}
                  </label>
                  <div className="flex gap-2 text-[10px]">
                    <button 
                      type="button" 
                      onClick={handleSelectAllTabs}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      {usrT.selectAll}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      type="button" 
                      onClick={handleDeselectAllTabs}
                      className="text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      {usrT.deselectAll}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {ALL_SYSTEM_TABS.map(tab => {
                    const isChecked = selectedTabs.includes(tab.id);
                    return (
                      <label 
                        key={tab.id}
                        onClick={() => handleToggleTab(tab.id)}
                        className={`flex items-center p-2 rounded-lg border text-xs font-bold cursor-pointer transition-all select-none ${
                          isChecked 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 mr-2 text-white shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                        )}
                        <span>{lang === 'uz' ? tab.nameUz : tab.nameRu}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-bold cursor-pointer hover:bg-gray-50"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-md"
                >
                  {editingUser ? (lang === 'uz' ? "Saqlash" : "Сохранить") : t.add}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================================== MODAL: DELETE USER PASSWORD ==================================== */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  {lang === 'uz' ? "Foydalanuvchini o'chirish" : "Удаление пользователя"}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{userToDelete.fullName} (@{userToDelete.username})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {lang === 'uz' 
                ? `Haqiqatan ham "${userToDelete.fullName}" xodimini tizimdan o'chirib tashlamoqchimisiz?`
                : `Вы действительно хотите удалить пользователя "${userToDelete.fullName}"?`}
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
                onClick={() => setUserToDelete(null)}
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
                  if (onDeleteUser) {
                    onDeleteUser(userToDelete.id);
                  }
                  setUserToDelete(null);
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
