'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  History, 
  Search, 
  Calendar, 
  Filter, 
  Eye, 
  X, 
  Download, 
  Database, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogItem {
  id: string;
  created_at: string;
  user_name: string;
  user_role?: string;
  department: string;
  action_type: ActionType;
  entity_name: string;
  entity_id: string;
  description: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
}

export default function TransactionHistoryPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModalLog, setActiveModalLog] = useState<AuditLogItem | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch from Supabase audit_logs table
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      if (supabase) {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');
        if (selectedDept !== 'all') query = query.eq('department', selectedDept);
        if (selectedUser !== 'all') query = query.eq('user_name', selectedUser);
        if (selectedAction !== 'all') query = query.eq('action_type', selectedAction);

        const { data, error } = await query;
        if (!error && data) {
          setLogs(data);
        }
      } else {
        // Fallback demo data if Supabase keys not set
        setLogs([
          {
            id: 'log-1',
            created_at: new Date().toISOString(),
            user_name: 'Dilshod Rahimjonov',
            user_role: 'admin',
            department: 'Заказы',
            action_type: 'UPDATE',
            entity_name: 'Заказ MOS-525.4',
            entity_id: 'ord-1',
            description: "План отгрузкиga qo'shildi va holati 'Tayyor' etib belgilandi",
            old_data: { inShipmentPlan: false, qtyPackaging: 4800 },
            new_data: { inShipmentPlan: true, qtyPackaging: 5000 }
          },
          {
            id: 'log-2',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            user_name: 'Zafar Karimov',
            user_role: 'bichuvchi',
            department: 'Раскрой',
            action_type: 'CREATE',
            entity_name: 'Раскройный лист #526',
            entity_id: 'kroy-526',
            description: "3,500 dona polo futbolka kroy qilindi",
            old_data: null,
            new_data: { totalCut: 3500, fabricKg: 780 }
          }
        ]);
      }
    } catch (err) {
      console.error('Audit logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [startDate, endDate, selectedDept, selectedUser, selectedAction]);

  // Client-side text filter
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEntity = log.entity_name?.toLowerCase().includes(q);
        const matchesDesc = log.description?.toLowerCase().includes(q);
        const matchesUser = log.user_name?.toLowerCase().includes(q);
        if (!matchesEntity && !matchesDesc && !matchesUser) return false;
      }
      return true;
    });
  }, [logs, searchQuery]);

  const getBadge = (action: ActionType) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            DELETE
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Tranzaksiya tarixi (Audit Logs)
              </h1>
              <p className="text-xs text-slate-400">
                Supabase audit_logs jadvalidan olingan operatsiyalar xronologiyasi
              </p>
            </div>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidiruv..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Barcha bo'limlar</option>
              <option value="Заказы">Заказы</option>
              <option value="Раскрой">Раскрой</option>
              <option value="Пошив">Пошив</option>
              <option value="Упаковка">Упаковка</option>
              <option value="Склад">Склад</option>
            </select>

            {/* Action Type */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Barcha harakatlar</option>
              <option value="CREATE">CREATE (Yashil)</option>
              <option value="UPDATE">UPDATE (Sariq)</option>
              <option value="DELETE">DELETE (Qizil)</option>
            </select>

            {/* Date Range Start */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />

            {/* Date Range End */}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  <th className="p-3.5 font-mono">VAQT</th>
                  <th className="p-3.5">FOYDALANUVCHI</th>
                  <th className="p-3.5">BO'LIM</th>
                  <th className="p-3.5 text-center">HARAKAT TURI</th>
                  <th className="p-3.5">ESKI QIYMAT</th>
                  <th className="p-3.5">YANGI QIYMAT</th>
                  <th className="p-3.5 text-right">AMALLAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-bold text-white">
                      {log.user_name}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {log.department}
                      </span>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {getBadge(log.action_type)}
                    </td>
                    <td className="p-3.5 max-w-[200px] truncate font-mono text-slate-400 text-[11px]">
                      {log.old_data ? JSON.stringify(log.old_data) : '—'}
                    </td>
                    <td className="p-3.5 max-w-[200px] truncate font-mono text-emerald-400 text-[11px]">
                      {log.new_data ? JSON.stringify(log.new_data) : '—'}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActiveModalLog(log)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Batafsil</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Old vs New Data */}
        {activeModalLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {getBadge(activeModalLog.action_type)}
                  <h3 className="text-base font-bold text-white">{activeModalLog.entity_name}</h3>
                </div>
                <button 
                  onClick={() => setActiveModalLog(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/30">
                  <h4 className="text-xs font-bold text-rose-400 uppercase mb-2">Eski qiymat (Old Data)</h4>
                  <pre className="text-xs font-mono text-rose-200 whitespace-pre-wrap">
                    {activeModalLog.old_data ? JSON.stringify(activeModalLog.old_data, null, 2) : 'Mavjud emas'}
                  </pre>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/30">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Yangi qiymat (New Data)</h4>
                  <pre className="text-xs font-mono text-emerald-200 whitespace-pre-wrap">
                    {activeModalLog.new_data ? JSON.stringify(activeModalLog.new_data, null, 2) : 'Mavjud emas'}
                  </pre>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setActiveModalLog(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
