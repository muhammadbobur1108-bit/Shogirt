import React, { useState, useMemo } from 'react';
import { AuditLog, AuditActionType, AppUser } from '../types';
import { Language } from '../locales';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Layers, 
  Eye, 
  X, 
  Download, 
  Code, 
  CheckCircle2, 
  Clock, 
  Database,
  ArrowRight,
  FileText,
  Copy,
  Check
} from 'lucide-react';

interface HistoryViewProps {
  logs: AuditLog[];
  users: AppUser[];
  lang: Language;
}

export default function HistoryView({ logs, users, lang }: HistoryViewProps) {
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected Log for Comparison Modal
  const [activeModalLog, setActiveModalLog] = useState<AuditLog | null>(null);

  // Supabase Code Modal state
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Departments list extracted from logs
  const departments = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.department) set.add(l.department);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesEntity = log.entityName.toLowerCase().includes(query);
        const matchesDesc = log.description.toLowerCase().includes(query);
        const matchesUser = log.userName.toLowerCase().includes(query);
        const matchesId = log.id.toLowerCase().includes(query);
        if (!matchesEntity && !matchesDesc && !matchesUser && !matchesId) return false;
      }

      // User filter
      if (selectedUser !== 'all' && log.userName !== selectedUser) {
        return false;
      }

      // Dept filter
      if (selectedDept !== 'all' && log.department !== selectedDept) {
        return false;
      }

      // Action type filter
      if (selectedAction !== 'all' && log.actionType !== selectedAction) {
        return false;
      }

      // Date Range filter
      if (startDate) {
        const logDate = log.timestamp.split(' ')[0];
        if (logDate < startDate) return false;
      }
      if (endDate) {
        const logDate = log.timestamp.split(' ')[0];
        if (logDate > endDate) return false;
      }

      return true;
    });
  }, [logs, searchQuery, selectedUser, selectedDept, selectedAction, startDate, endDate]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedUser('all');
    setSelectedDept('all');
    setSelectedAction('all');
    setStartDate('');
    setEndDate('');
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            DELETE
          </span>
        );
      default:
        return null;
    }
  };

  const formatDataPreview = (data: any) => {
    if (data === null || data === undefined) return <span className="text-slate-500 italic">Bo'sh</span>;
    if (typeof data === 'string') return <span className="truncate max-w-[200px] inline-block font-mono text-[11px]">{data}</span>;
    const str = JSON.stringify(data);
    return <span className="truncate max-w-[220px] inline-block font-mono text-[11px] text-slate-300">{str}</span>;
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Vaqt', 'Foydalanuvchi', 'Lavozim', "Bo'lim", 'Harakat', 'Obyekt', 'Tavsif', 'Eski qiymat', 'Yangi qiymat'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.userName,
      l.userRole || '',
      l.department,
      l.actionType,
      l.entityName,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.oldData || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.newData || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tranzaksiya_tarixi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const supabaseCodeSnippet = `// app/history/page.tsx - Shogirt ERP Audit History Page
// Next.js App Router + Supabase audit_logs

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuditLogItem {
  id: string;
  created_at: string;
  user_name: string;
  user_role: string;
  department: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_name: string;
  entity_id: string;
  description: string;
  old_data: any;
  new_data: any;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate, selectedDept, selectedUser]);

  async function fetchLogs() {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');
    if (selectedDept !== 'all') query = query.eq('department', selectedDept);
    if (selectedUser !== 'all') query = query.eq('user_name', selectedUser);

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-black text-white">Tranzaksiya tarixi (Audit Logs)</h1>
        {/* Table & Modal Implementation */}
      </div>
    </div>
  );
}`;

  return (
    <div className="space-y-5" id="history-audit-view">
      
      {/* 1. TOP HEADER */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight uppercase">
                {lang === 'uz' ? 'Tranzaksiya tarixi' : 'История транзакций'}
              </h2>
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                Supabase audit_logs
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'uz' 
                ? "Tizimda foydalanuvchilar tomonidan amalga oshirilgan barcha o'zgarishlar, yaratish va o'chirishlar xronologiyasi" 
                : "Полный хронологический журнал всех действий пользователей, изменений и удалений в системе"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setShowCodeModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Next.js app/history/page.tsx kodini ko'rish"
          >
            <Code className="w-4 h-4 text-cyan-400" />
            <span>app/history/page.tsx</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-900/30"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'uz' ? 'CSV Export' : 'Экспорт CSV'}</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROLS */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Text Search */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'uz' ? "Qidiruv (Obyekt, ID, Tavsif)..." : "Поиск (Объект, ID, Описание)..."}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* User Filter */}
          <div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="all">{lang === 'uz' ? "Barcha foydalanuvchilar" : "Все пользователи"}</option>
              {Array.from(new Set(logs.map(l => l.userName))).map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="all">{lang === 'uz' ? "Barcha bo'limlar" : "Все отделы"}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="all">{lang === 'uz' ? "Barcha harakat turlari" : "Все типы действий"}</option>
              <option value="CREATE">CREATE (Yashil / Яшил)</option>
              <option value="UPDATE">UPDATE (Sariq / Сариқ)</option>
              <option value="DELETE">DELETE (Qizil / Қизил)</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-[11px] text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                title="Boshlanish sanasi"
              />
            </div>
            <span className="text-slate-500">-</span>
            <div className="relative flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-[11px] text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                title="Tugash sanasi"
              />
            </div>
          </div>

        </div>

        {/* Filter Summary & Clear */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
          <span>
            {lang === 'uz' ? 'Topilgan yozuvlar:' : 'Найдено записей:'} <strong className="text-white">{filteredLogs.length}</strong> ta
          </span>
          {(searchQuery || selectedUser !== 'all' || selectedDept !== 'all' || selectedAction !== 'all' || startDate || endDate) && (
            <button
              onClick={resetFilters}
              className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              {lang === 'uz' ? 'Filtrlarni tozalash' : 'Сбросить фильтры'}
            </button>
          )}
        </div>
      </div>

      {/* 3. AUDIT LOGS TABLE */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden" id="audit-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                <th className="p-3.5 font-mono">{lang === 'uz' ? 'VAQT' : 'ВРЕМЯ'}</th>
                <th className="p-3.5">{lang === 'uz' ? 'FOYDALANUVCHI' : 'ПОЛЬЗОВАТЕЛЬ'}</th>
                <th className="p-3.5">{lang === 'uz' ? "BO'LIM" : 'ОТДЕЛ'}</th>
                <th className="p-3.5 text-center">{lang === 'uz' ? 'HARAKAT TURI' : 'ДЕЙСТВИЕ'}</th>
                <th className="p-3.5">{lang === 'uz' ? 'ESKI QIYMAT' : 'СТАРОЕ ЗНАЧЕНИЕ'}</th>
                <th className="p-3.5">{lang === 'uz' ? 'YANGI QIYMAT' : 'НОВОЕ ЗНАЧЕНИЕ'}</th>
                <th className="p-3.5 text-right">{lang === 'uz' ? 'AMALLAR' : 'ДЕЙСТВИЯ'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 font-bold space-y-2">
                    <Database className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>{lang === 'uz' ? 'Tranzaksiya ma\'lumotlari topilmadi' : 'Транзакции не найдены'}</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* 1. Vaqt */}
                    <td className="p-3.5 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    {/* 2. Foydalanuvchi */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center text-[10px] font-black text-indigo-300 shrink-0">
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs leading-none">{log.userName}</p>
                          {log.userRole && (
                            <span className="text-[9px] text-slate-400 capitalize">{log.userRole}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Bo'lim */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[10px] font-bold border border-slate-700">
                        {log.department}
                      </span>
                    </td>

                    {/* 4. Harakat turi */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {getActionBadge(log.actionType)}
                    </td>

                    {/* 5. Eski qiymat */}
                    <td className="p-3.5 max-w-[200px]">
                      <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                        {formatDataPreview(log.oldData)}
                      </div>
                    </td>

                    {/* 6. Yangi qiymat */}
                    <td className="p-3.5 max-w-[200px]">
                      <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                        {formatDataPreview(log.newData)}
                      </div>
                    </td>

                    {/* 7. Batafsil tugmasi */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActiveModalLog(log)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === 'uz' ? 'Batafsil' : 'Подробнее'}</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BATAFSIL COMPARISON MODAL (OLD DATA VS NEW DATA) */}
      {activeModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getActionBadge(activeModalLog.actionType)}
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {activeModalLog.entityName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {activeModalLog.description}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                  <span>📅 {activeModalLog.timestamp}</span>
                  <span>👤 {activeModalLog.userName} ({activeModalLog.userRole || 'foydalanuvchi'})</span>
                  <span>🏢 {activeModalLog.department}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalLog(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Old Data vs New Data Side-by-Side Comparison */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Old Data (Eski qiymat) */}
                <div className="bg-slate-950/90 border border-rose-900/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {lang === 'uz' ? 'Eski qiymat (Old Data)' : 'Старое значение (Old Data)'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {activeModalLog.oldData ? 'JSON / Record' : 'Mavjud emas'}
                    </span>
                  </div>

                  <pre className="text-xs font-mono text-rose-200/90 bg-rose-950/20 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-rose-900/20 max-h-[350px]">
                    {activeModalLog.oldData 
                      ? JSON.stringify(activeModalLog.oldData, null, 2) 
                      : (lang === 'uz' ? "— Yangi yaratilgan (Eski ma'lumot yo'q) —" : "— Создано с нуля (Предыдущих данных нет) —")
                    }
                  </pre>
                </div>

                {/* Right: New Data (Yangi qiymat) */}
                <div className="bg-slate-950/90 border border-emerald-900/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {lang === 'uz' ? 'Yangi qiymat (New Data)' : 'Новое значение (New Data)'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {activeModalLog.newData ? 'JSON / Record' : 'O\'chirilgan'}
                    </span>
                  </div>

                  <pre className="text-xs font-mono text-emerald-200/90 bg-emerald-950/20 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-emerald-900/20 max-h-[350px]">
                    {activeModalLog.newData 
                      ? JSON.stringify(activeModalLog.newData, null, 2) 
                      : (lang === 'uz' ? "— Butunlay o'chirilgan (Yangi ma'lumot yo'q) —" : "— Полностью удалено (Новых данных нет) —")
                    }
                  </pre>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Log ID: {activeModalLog.id}
              </span>
              <button
                onClick={() => setActiveModalLog(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'uz' ? 'Yopish' : 'Закрыть'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. SUPABASE / NEXT.JS CODE MODAL */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111827] border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">
                  app/history/page.tsx (Next.js & Supabase audit_logs)
                </h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    Supabase SQL Schema (audit_logs jadvali)
                  </span>
                </div>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-xl overflow-x-auto">
{`CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_name TEXT NOT NULL,
  user_role TEXT,
  department TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
  entity_name TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  description TEXT,
  old_data JSONB,
  new_data JSONB
);

-- Real-time subscription yoqish:
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;`}
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Next.js App Router Page kodi
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(supabaseCodeSnippet);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Nusxa olindi!' : 'Nusxa olish'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-xl overflow-x-auto max-h-[250px]">
                  {supabaseCodeSnippet}
                </pre>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end shrink-0">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'uz' ? 'Tushunarli' : 'Понятно'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
