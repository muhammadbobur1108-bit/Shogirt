import React, { useState } from 'react';
import { TRANSLATIONS, Language } from '../locales';
import { 
  AppUser, 
  Order, 
  InventoryItem, 
  Customer, 
  DefectItem, 
  PrintTask, 
  WarehouseBox, 
  AuditLog 
} from '../types';
import UserManagementView from './UserManagementView';
import HistoryView from './HistoryView';
import { 
  Settings, 
  Users, 
  Database, 
  Globe, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  SlidersHorizontal,
  RotateCcw,
  Download,
  FileJson,
  Copy,
  CheckCircle2,
  Layers,
  Package,
  Box,
  AlertTriangle,
  Printer,
  History,
  Eye,
  X,
  FileSpreadsheet,
  Search,
  HardDriveDownload,
  Info
} from 'lucide-react';

interface SettingsViewProps {
  lang: Language;
  onChangeLanguage: (newLang: Language) => void;
  langList: Language[];
  onResetAllData?: () => void;
  onLoadDemoData?: () => void;
  // Users management inside Settings
  users?: AppUser[];
  onAddUser?: (user: AppUser) => void;
  onUpdateUser?: (user: AppUser) => void;
  onDeleteUser?: (id: string) => void;
  currentUser?: AppUser | null;
  // Data collections for JSON export
  orders?: Order[];
  inventory?: InventoryItem[];
  customers?: Customer[];
  defects?: DefectItem[];
  printTasks?: PrintTask[];
  boxes?: WarehouseBox[];
  auditLogs?: AuditLog[];
}

interface PreviewModalState {
  isOpen: boolean;
  sectionKey: string;
  sectionTitle: string;
  jsonString: string;
  recordCount: number;
  byteSize: number;
}

export default function SettingsView({ 
  lang, 
  onChangeLanguage, 
  langList,
  onResetAllData,
  onLoadDemoData,
  users = [],
  onAddUser = () => {},
  onUpdateUser = () => {},
  onDeleteUser = () => {},
  currentUser,
  orders = [],
  inventory = [],
  customers = [],
  defects = [],
  printTasks = [],
  boxes = [],
  auditLogs = []
}: SettingsViewProps) {
  const t = TRANSLATIONS[lang];

  // Active sub-tab inside Settings: history, users, export, general, data
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'users' | 'export' | 'general' | 'data'>('history');

  // Search filter for sections inside export tab
  const [exportSearch, setExportSearch] = useState('');

  // Backup loading states
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupDone, setBackupDone] = useState(false);

  // Toast feedback state for downloads
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // JSON Preview Modal State
  const [previewModal, setPreviewModal] = useState<PreviewModalState>({
    isOpen: false,
    sectionKey: '',
    sectionTitle: '',
    jsonString: '',
    recordCount: 0,
    byteSize: 0
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const setT = {
    uz: {
      tabHistory: "Аудит ва Транзакциялар тарихи",
      tabUsers: "Фойдаланувчилар ва Рухсатлар",
      tabExport: "Маълумотлар Экспорти (JSON)",
      tabGeneral: "Тил ва Асосий созламалар",
      tabData: "Маълумотлар базаси ва Заҳира",
      exportHeaderTitle: "Ҳар бир бўлим бўйича маълумотлар экспорти (JSON)",
      exportHeaderDesc: "Тизимдаги барча бўлимлар маълумотларини алоҳида ёки тўлиқ JSON файл форматида юклаб олинг ва архивда сақланг.",
      exportFullBtn: "Барча бўлимларни битта тўлиқ JSON файлда юклаш",
      downloadJson: "JSON юклаб олиш",
      previewJson: "JSON кўриш",
      copyJson: "Нусхалаш",
      copied: "Нусхаланди!",
      totalRecords: "Жами ёзувлар сони",
      searchPlaceholder: "Бўлим номи бўйича қидириш...",
      allSections: "Барча бўлимлар рўйхати",
      recordsCountLabel: "та маълумот",
      backupDesc: "Барча фаол буюртмалар, омбор материаллари, ходимлар маълумотлари ҳамда брак ҳисоботларини заҳира нусхасига юклаб олинг.",
      startBackup: "Заҳиралашни бошлаш (Backup Now)",
      resetTitle: "Барча бўлимларни 0 дан тозалаш",
      resetDesc: "Тизимдаги барча буюртмалар, омбор заҳиралари, босмахона ва брак маълумотларини бутунлай ўчириб, 0 дан нолдан тайёрлаш.",
      resetBtn: "Ҳамма бўлимни тозалаш (0 дан бошлаш)",
      loadDemoBtn: "Намуна маълумотларни қайта юклаш",
      goToExport: "Бўлимлар кесимида JSON экспортга ўтиш"
    },
    ru: {
      tabHistory: "История транзакций (Аудит)",
      tabUsers: "Пользователи и Права доступа",
      tabExport: "Экспорт данных (JSON)",
      tabGeneral: "Язык и Основные параметры",
      tabData: "База данных и Резерв",
      exportHeaderTitle: "Экспорт данных по каждому разделу (JSON)",
      exportHeaderDesc: "Скачивайте данные всех разделов системы по отдельности или единым полным JSON-файлом для резервного хранения.",
      exportFullBtn: "Скачать все разделы единым файлом JSON",
      downloadJson: "Скачать JSON",
      previewJson: "Просмотр JSON",
      copyJson: "Скопировать",
      copied: "Скопировано!",
      totalRecords: "Всего записей",
      searchPlaceholder: "Поиск по разделам...",
      allSections: "Список всех разделов",
      recordsCountLabel: "записей",
      backupDesc: "Скачайте резервную копию всех активных заказов, складских материалов, данных персонала и отчетов по браку.",
      startBackup: "Начать резервное копирование (Backup)",
      resetTitle: "Сбросить все разделы с 0",
      resetDesc: "Очистить все заказы, складские запасы, печатные задачи и отчеты по браку для запуска с чистого листа (с 0).",
      resetBtn: "Очистить все разделы (Начать с 0)",
      loadDemoBtn: "Загрузить демо-данные заново",
      goToExport: "Перейти к экспорту по разделам (JSON)"
    }
  }[lang];

  // Helper to trigger browser download of a JSON file
  const downloadJsonFile = (fileName: string, jsonString: string) => {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export specific department / section as JSON
  const handleExportSection = (sectionKey: string, sectionTitle: string, data: any) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `shogirt_${sectionKey}_${timestamp}.json`;
    
    const exportPayload = {
      appName: 'Shogirt ERP',
      exportType: 'single_section',
      section: sectionKey,
      sectionTitle,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.fullName || 'Tizim administratori',
      userRole: currentUser?.role || 'super_admin',
      totalRecords: Array.isArray(data) ? data.length : 1,
      data: data
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    downloadJsonFile(fileName, jsonString);
    showToast(
      lang === 'uz' 
        ? `"${sectionTitle}" бўлими маълумотлари (${Array.isArray(data) ? data.length : 1} та) JSON файлида сақланди!` 
        : `Данные раздела "${sectionTitle}" успешно экспортированы в JSON!`
    );
  };

  // Export complete system as full bundle JSON
  const handleExportFullBackup = () => {
    setBackupLoading(true);
    setBackupDone(false);

    setTimeout(() => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `shogirt_erp_full_backup_${timestamp}.json`;

      const fullPayload = {
        appName: 'Shogirt ERP',
        exportType: 'full_system_backup',
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.fullName || 'Tizim administratori',
        userRole: currentUser?.role || 'super_admin',
        summary: {
          totalOrders: orders.length,
          totalInventoryItems: inventory.length,
          totalWarehouseBoxes: boxes.length,
          totalCustomers: customers.length,
          totalDefects: defects.length,
          totalPrintTasks: printTasks.length,
          totalUsers: users.length,
          totalAuditLogs: auditLogs.length,
          totalRecordsCombined: orders.length + inventory.length + boxes.length + customers.length + defects.length + printTasks.length + users.length + auditLogs.length
        },
        sections: {
          orders: { count: orders.length, items: orders },
          inventory: { count: inventory.length, items: inventory },
          warehouseBoxes: { count: boxes.length, items: boxes },
          customers: { count: customers.length, items: customers },
          defects: { count: defects.length, items: defects },
          printTasks: { count: printTasks.length, items: printTasks },
          users: { count: users.length, items: users },
          auditLogs: { count: auditLogs.length, items: auditLogs }
        }
      };

      const jsonString = JSON.stringify(fullPayload, null, 2);
      downloadJsonFile(fileName, jsonString);

      setBackupLoading(false);
      setBackupDone(true);
      showToast(
        lang === 'uz'
          ? "Барча 8 та бўлим маълумотлари тўлиқ JSON архиви кўринишида юклаб олинди!"
          : "Все 8 разделов успешно выгружены в полный резервный JSON-файл!"
      );
    }, 700);
  };

  // Open Preview Modal for a section
  const handleOpenPreview = (sectionKey: string, sectionTitle: string, data: any) => {
    const exportPayload = {
      appName: 'Shogirt ERP',
      section: sectionKey,
      sectionTitle,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.fullName || 'Tizim administratori',
      totalRecords: Array.isArray(data) ? data.length : 1,
      data: data
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const byteSize = new Blob([jsonString]).size;

    setPreviewModal({
      isOpen: true,
      sectionKey,
      sectionTitle,
      jsonString,
      recordCount: Array.isArray(data) ? data.length : 1,
      byteSize
    });
  };

  // Copy JSON to clipboard
  const handleCopyJson = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    }
  };

  // Section configurations for export
  const sectionsList = [
    {
      id: 'orders',
      titleUz: "Буюртмалар (Заказлар)",
      titleRu: "Заказы и Поток производства",
      descUz: "Барча фаол, бичув, тикув, қадоқлашдаги буюртмалар ва ўлчамлар кесими",
      descRu: "Все заказы в раскрое, пошиве, упаковке и распределение по размерам",
      icon: Layers,
      color: 'indigo',
      data: orders,
      countLabelUz: `${orders.length} та буюртма`,
      countLabelRu: `${orders.length} заказов`
    },
    {
      id: 'inventory',
      titleUz: "Омборхона & Хомашё",
      titleRu: "Склад и Сырьё",
      descUz: "Газлама, мато турлари, иплар, фурнитура ва омбор қолдиқлари",
      descRu: "Ткани, трикотажные полотна, нитки, фурнитура и остатки на складе",
      icon: Package,
      color: 'sky',
      data: inventory,
      countLabelUz: `${inventory.length} хил хомашё`,
      countLabelRu: `${inventory.length} позиций сырья`
    },
    {
      id: 'boxes',
      titleUz: "Қутилар & Паллетлар (Омбор)",
      titleRu: "Коробки и Паллеты (Склад)",
      descUz: "Штрих-кодли қутилар, ўлчамлар тақсимоти, партиялар ва жўнатиш ҳолати",
      descRu: "Штрихкодированные коробки, паллеты, партии и статусы отгрузки",
      icon: Box,
      color: 'amber',
      data: boxes,
      countLabelUz: `${boxes.length} та қути`,
      countLabelRu: `${boxes.length} коробок`
    },
    {
      id: 'customers',
      titleUz: "Мижозлар & Брендлар (CRM)",
      titleRu: "Клиенты и Бренды (CRM)",
      descUz: "Ҳамкор брендлар, буюртмачи корхоналар ва алоқа маълумотлари",
      descRu: "Клиенты-заказчики, бренды, контактные данные и реквизиты",
      icon: Users,
      color: 'emerald',
      data: customers,
      countLabelUz: `${customers.length} та ҳамкор`,
      countLabelRu: `${customers.length} клиентов`
    },
    {
      id: 'defects',
      titleUz: "Брак & Сифат Назорати (ОТК)",
      titleRu: "Брак и Контроль Качества (ОТК)",
      descUz: "Аниқланган нуқсонлар, брак сабаблари, айбдорлар ва миқдорлар",
      descRu: "Журнал дефектов, причины брака, ответственные и объемы потерь",
      icon: AlertTriangle,
      color: 'rose',
      data: defects,
      countLabelUz: `${defects.length} та нуқсон қайди`,
      countLabelRu: `${defects.length} записей брака`
    },
    {
      id: 'printTasks',
      titleUz: "Печат & Кашта Бўлими",
      titleRu: "Печатный и Вышивальный Цех",
      descUz: "Босмахона ва каштачилик вазифалари, тиражлар ва бажарилиш ҳолати",
      descRu: "Задачи шелкографии, вышивки, принтов, тиражи и статусы выполнения",
      icon: Printer,
      color: 'purple',
      data: printTasks,
      countLabelUz: `${printTasks.length} та босма вазифаси`,
      countLabelRu: `${printTasks.length} задач печати`
    },
    {
      id: 'users',
      titleUz: "Фойдаланувчилар & Ходимлар",
      titleRu: "Сотрудники и Доступ (RBAC)",
      descUz: "Тизим фойдаланувчилари, роллар, рухсат этилган бўлимлар ва PIN кодлар",
      descRu: "Пользователи системы, роли, назначенные разделы и PIN-коды",
      icon: ShieldCheck,
      color: 'teal',
      data: users,
      countLabelUz: `${users.length} та ходим`,
      countLabelRu: `${users.length} сотрудников`
    },
    {
      id: 'auditLogs',
      titleUz: "Аудит Журнали & Транзакциялар",
      titleRu: "Журнал Аудита и Транзакции",
      descUz: "Тизимдаги ҳар бир ҳаракат, ўзгариш, ким томонидан қилингани ва вақти",
      descRu: "Полный лог действий, изменений в базе данных и аудит операций",
      icon: History,
      color: 'blue',
      data: auditLogs,
      countLabelUz: `${auditLogs.length} та транзакция`,
      countLabelRu: `${auditLogs.length} транзакций`
    }
  ];

  // Filter sections by search query
  const filteredSections = sectionsList.filter(s => {
    if (!exportSearch.trim()) return true;
    const q = exportSearch.toLowerCase();
    return (
      s.titleUz.toLowerCase().includes(q) ||
      s.titleRu.toLowerCase().includes(q) ||
      s.descUz.toLowerCase().includes(q) ||
      s.descRu.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  const totalAllRecords = sectionsList.reduce((sum, s) => sum + s.data.length, 0);

  return (
    <div className="space-y-6" id="settings-view-module">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with Sub-tab Navigation */}
      <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-white text-lg uppercase tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            {t.settingsTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{t.settingsSub}</p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-700/80 p-1 rounded-xl self-start sm:self-auto">
          {/* History / Audit Log Tab (Moved into Settings) */}
          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-300" />
            <span>{setT.tabHistory}</span>
            {auditLogs.length > 0 && (
              <span className="text-[10px] bg-blue-500/25 border border-blue-400/40 text-blue-200 px-1.5 py-0.2 rounded-full font-mono">
                {auditLogs.length}
              </span>
            )}
          </button>

          {/* Data Export Tab */}
          <button
            type="button"
            onClick={() => setActiveSubTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'export'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span>{setT.tabExport}</span>
          </button>

          {/* Users Tab */}
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{setT.tabUsers}</span>
          </button>

          {/* General Tab */}
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'general'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{setT.tabGeneral}</span>
          </button>

          {/* Database & Backup Tab */}
          <button
            type="button"
            onClick={() => setActiveSubTab('data')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'data'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{setT.tabData}</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB CONTENT */}

      {/* 2.A: DATA EXPORT SUB-TAB (NEW FEATURE) */}
      {activeSubTab === 'export' && (
        <div className="space-y-6">
          
          {/* Top Banner Card for Full Export */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <FileJson className="w-4 h-4" />
                  <span>JSON Data Export Center (Shogirt ERP)</span>
                </div>
                
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {setT.exportHeaderTitle}
                </h4>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {setT.exportHeaderDesc}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono text-[11px] text-indigo-300">
                    {lang === 'ru' ? 'Всего разделов:' : "Jami bo'limlar:"} <strong>{lang === 'ru' ? '8 разделов' : '8 ta'}</strong>
                  </span>
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono text-[11px] text-emerald-300">
                    {lang === 'ru' ? 'Всего записей:' : "Jami ma'lumotlar:"} <strong>{totalAllRecords.toLocaleString()} {lang === 'ru' ? 'записей' : 'ta'}</strong>
                  </span>
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono text-[11px] text-amber-300">
                    Format: <strong>UTF-8 JSON (.json)</strong>
                  </span>
                </div>
              </div>

              {/* Full Bundle Download Button */}
              <div className="shrink-0 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  disabled={backupLoading}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {backupLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-white" />
                      <span>{t.loading}</span>
                    </>
                  ) : (
                    <>
                      <HardDriveDownload className="w-5 h-5 text-white" />
                      <span>{setT.exportFullBtn}</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  {lang === 'ru' ? 'Все разделы архивируются в единый файл с метаданными' : "Barcha bo'limlar metama'lumotlari bilan bitta faylda arxivlanadi"}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111827] p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{setT.allSections} ({filteredSections.length})</span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={exportSearch}
                onChange={e => setExportSearch(e.target.value)}
                placeholder={setT.searchPlaceholder}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Grid of Individual Department Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredSections.map(sec => {
              const IconComp = sec.icon;
              const count = sec.data.length;
              const title = lang === 'uz' ? sec.titleUz : sec.titleRu;
              const desc = lang === 'uz' ? sec.descUz : sec.descRu;
              const countLabel = lang === 'uz' ? sec.countLabelUz : sec.countLabelRu;

              return (
                <div
                  key={sec.id}
                  className="bg-[#111827] border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-xl flex flex-col justify-between transition-all duration-200 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-sm tracking-tight">
                            {title}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              {countLabel}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono uppercase">
                              JSON • UTF-8
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-1 bg-slate-900 text-slate-400 rounded-lg border border-slate-800">
                        {sec.id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
                      {desc}
                    </p>
                  </div>

                  {/* Actions for this section */}
                  <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                    {/* Direct JSON download button */}
                    <button
                      type="button"
                      onClick={() => handleExportSection(sec.id, title, sec.data)}
                      className="flex-1 py-2 px-3 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{setT.downloadJson}</span>
                    </button>

                    {/* Preview JSON button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(sec.id, title, sec.data)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                      title={setT.previewJson}
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{setT.previewJson}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 2.B: HISTORY / AUDIT LOG SUB-TAB (MOVED INSIDE SETTINGS) */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <HistoryView 
            logs={auditLogs} 
            users={users} 
            lang={lang} 
          />
        </div>
      )}

      {/* 2.C: USERS & PERMISSIONS SUB-TAB */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <UserManagementView 
            users={users}
            onAddUser={onAddUser}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
            currentUser={currentUser}
            lang={lang}
          />
        </div>
      )}

      {/* 2.C: GENERAL & LANGUAGE SUB-TAB */}
      {activeSubTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Language Switcher */}
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              {lang === 'uz' ? 'Tizim Tili' : 'Язык Системы'}
            </h4>

            <p className="text-slate-400 text-xs">
              {lang === 'uz' ? "Tizim interfeysi tilini tanlang:" : "Выберите язык интерфейса системы:"}
            </p>

            <div className="flex gap-3">
              {langList.map(item => (
                <button
                  key={item}
                  onClick={() => onChangeLanguage(item)}
                  className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    lang === item
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/40'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="uppercase text-sm">{item === 'uz' ? "🇺🇿 O'zbekcha" : "🇷🇺 Русский"}</span>
                  {lang === item && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* System Security Info */}
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {lang === 'uz' ? "Xavfsizlik va Ruxsatlar" : "Безопасность и Доступ"}
            </h4>

            <div className="space-y-2 text-slate-400 text-xs leading-relaxed">
              <p>
                {lang === 'uz' 
                  ? "Barcha xodimlar va bo'limlar roli bo'yicha cheklovlarga ega. PIN-kod orqali autentifikatsiya yoqilgan."
                  : "Все сотрудники и разделы имеют ролевые ограничения. Включена аутентификация по PIN-коду."}
              </p>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="text-slate-300">{lang === 'ru' ? 'Текущий пользователь:' : 'Joriy foydalanuvchi:'} <strong>{currentUser?.fullName}</strong></div>
                <div className="text-indigo-400">{lang === 'ru' ? 'Роль:' : 'Roli:'} <strong>{currentUser?.role}</strong></div>
                <div className="text-emerald-400">{lang === 'ru' ? 'Уровень доступа:' : 'Ruxsat darajasi:'} <strong>{currentUser?.role === 'super_admin' ? (lang === 'ru' ? 'Полный (Супер Админ)' : 'To\'liq (Super Admin)') : (lang === 'ru' ? 'Администратор раздела' : 'Bo\'lim administratori')}</strong></div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2.D: DATA & RESET SUB-TAB */}
      {activeSubTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Backup */}
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> {t.backupData}
              </h4>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-mono border border-emerald-500/20">
                JSON Backup
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              {setT.backupDesc}
            </p>

            <button
              onClick={handleExportFullBackup}
              disabled={backupLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {backupLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{t.loading}</span>
                </>
              ) : backupDone ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{t.backupSuccess}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>{setT.startBackup}</span>
                </>
              )}
            </button>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('export')}
                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{setT.goToExport}</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Reset / Demo data */}
          <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <h4 className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-500" /> {setT.resetTitle}
            </h4>

            <p className="text-slate-400 text-xs leading-relaxed">
              {setT.resetDesc}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (confirm(lang === 'uz' ? "Haqiqatan ham barcha bo'limlarni 0 dan tozalashni xohlaysizmi?" : "Вы действительно хотите очистить все разделы с 0?")) {
                    onResetAllData?.();
                  }
                }}
                className="flex-1 py-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-xl font-bold transition-all cursor-pointer text-center"
              >
                {setT.resetBtn}
              </button>

              <button
                onClick={() => {
                  onLoadDemoData?.();
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold transition-all cursor-pointer text-center"
              >
                {setT.loadDemoBtn}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 3. JSON PREVIEW MODAL */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    {previewModal.sectionTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="font-mono text-emerald-400">
                      {previewModal.recordCount} {lang === 'ru' ? 'записей' : 'ta yozuv'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">
                      {(previewModal.byteSize / 1024).toFixed(1)} KB
                    </span>
                    <span>•</span>
                    <span className="text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono">
                      JSON
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - JSON Code Block */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950/60 font-mono text-[11px] text-emerald-300 select-all leading-relaxed">
              <pre className="whitespace-pre-wrap break-all">
                {previewModal.jsonString}
              </pre>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                {lang === 'ru' ? 'Экспортированные данные в формате JSON' : "JSON formatida eksport qilingan ma'lumot"}
              </div>

              <div className="flex items-center gap-2">
                {/* Copy JSON */}
                <button
                  type="button"
                  onClick={() => handleCopyJson(previewModal.jsonString, 'modal')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  {copiedKey === 'modal' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">{setT.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-indigo-400" />
                      <span>{setT.copyJson}</span>
                    </>
                  )}
                </button>

                {/* Download File */}
                <button
                  type="button"
                  onClick={() => {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    const fileName = `shogirt_${previewModal.sectionKey}_${timestamp}.json`;
                    downloadJsonFile(fileName, previewModal.jsonString);
                    showToast(lang === 'ru' ? `Файл "${previewModal.sectionTitle}" JSON успешно скачан!` : `"${previewModal.sectionTitle}" JSON fayl yuklab olindi!`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>{setT.downloadJson}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
