import React, { useState, useRef, useEffect } from 'react';
import { SystemNotification } from '../types';
import { Language } from '../locales';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Info, 
  X, 
  CheckCheck, 
  Trash2, 
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  toasts: SystemNotification[];
  onDismissToast: (id: string) => void;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectOrder?: (orderId: string) => void;
  lang: Language;
  onSimulateStatusChange?: () => void;
}

export default function NotificationCenter({
  notifications,
  toasts,
  onDismissToast,
  onMarkAllAsRead,
  onMarkAsRead,
  onClearAll,
  onSelectOrder,
  lang,
  onSimulateStatusChange
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const t = {
    uz: {
      title: "Bildirishnomalar Markazi",
      sub: "Buyurtmalar holati va tizim yangilanishlari",
      unread: "ta yangi",
      markAllRead: "Barchasini o'qish",
      clearAll: "Tozalash",
      empty: "Hozircha yangi bildirishnomalar yo'q",
      emptySub: "Buyurtma holati o'zgarganda (masalan, 'Tayyor' bo'lganda) bu yerda aks etadi.",
      viewOrder: "Buyurtmani ko'rish",
      simulateBtn: "⚡ Sinov: 'Tayyor' holati bildirishnomasi"
    },
    ru: {
      title: "Центр Уведомлений",
      sub: "Изменения статусов заказов и системы",
      unread: "новых",
      markAllRead: "Прочитать все",
      clearAll: "Очистить",
      empty: "Новых уведомлений пока нет",
      emptySub: "Когда статус заказа изменится (например, на 'Готов'), он появится здесь.",
      viewOrder: "Открыть заказ",
      simulateBtn: "⚡ Тест: Уведомление со статусом 'Готов'"
    }
  }[lang];

  // Helper for type-based icon & style
  const getNotificationVisuals = (notif: SystemNotification) => {
    const isTayyor = notif.statusTo === 'tayyor' || notif.statusTo === 'yakunlandi' || notif.title.toLowerCase().includes('tayyor') || notif.title.toLowerCase().includes('готов');

    if (isTayyor || notif.type === 'success') {
      return {
        icon: CheckCircle2,
        badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        badgeText: lang === 'uz' ? 'TAYYOR' : 'ГОТОВ',
        accentColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'
      };
    }

    if (notif.type === 'warning') {
      return {
        icon: AlertTriangle,
        badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        badgeText: lang === 'uz' ? 'OGOHLANTIRISH' : 'ВНИМАНИЕ',
        accentColor: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
      };
    }

    return {
      icon: Clock,
      badgeColor: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      badgeText: notif.statusTo ? notif.statusTo.toUpperCase() : (lang === 'uz' ? 'YANGILANISH' : 'ОБНОВЛЕНИЕ'),
      accentColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]'
    };
  };

  return (
    <>
      {/* 1. BELL ICON BUTTON & POPUP CONTAINER */}
      <div className="relative" ref={dropdownRef} id="notification-center-trigger">
        
        {/* Header Bell Button */}
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
            isOpen 
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
              : unreadCount > 0 
                ? 'bg-slate-800/90 text-slate-200 hover:text-white border border-slate-700/80 hover:border-cyan-500/40' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
          }`}
          title={t.title}
          aria-label={t.title}
        >
          <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-400 animate-[bounce_2s_infinite]' : ''}`} />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-mono font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* 2. DROPDOWN POPOVER MENU */}
        {isOpen && (
          <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-[#0b1329] border border-cyan-500/40 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm tracking-tight flex items-center gap-2">
                    <span>{t.title}</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} {t.unread}
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400">{t.sub}</p>
                </div>
              </div>

              {/* Quick actions: Mark all read & Clear */}
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                    title={t.markAllRead}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title={t.clearAll}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Test Simulation Button */}
            {onSimulateStatusChange && (
              <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between">
                <span className="text-[10px] text-indigo-300 font-mono">
                  {lang === 'ru' ? 'Тест смены статуса:' : 'Holat o\'zgarishi testi:'}
                </span>
                <button
                  type="button"
                  onClick={onSimulateStatusChange}
                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>{lang === 'ru' ? 'Сделать "Готов"' : '"Tayyor" qilish'}</span>
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80 select-none">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-300">{t.empty}</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    {t.emptySub}
                  </p>
                </div>
              ) : (
                notifications.map(notif => {
                  const visuals = getNotificationVisuals(notif);
                  const Icon = visuals.icon;

                  return (
                    <div 
                      key={notif.id}
                      onClick={() => onMarkAsRead(notif.id)}
                      className={`p-3.5 transition-all cursor-pointer hover:bg-slate-800/40 flex items-start gap-3 ${
                        !notif.read ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${visuals.badgeColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h6 className="font-bold text-white text-xs truncate">
                            {notif.title}
                          </h6>
                          <span className="text-[9px] font-mono text-slate-500 shrink-0">
                            {notif.createdAt}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-extrabold ${visuals.badgeColor}`}>
                            {visuals.badgeText}
                          </span>

                          {notif.orderId && onSelectOrder && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                onSelectOrder(notif.orderId!);
                              }}
                              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{t.viewOrder}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 font-mono">
                  Shogirt ERP • Real-time Status Center
                </span>
              </div>
            )}

          </div>
        )}

      </div>

      {/* 3. TEMPORARY TOAST NOTIFICATION CONTAINER (BOTTOM-RIGHT FLOATING) */}
      <div 
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none" 
        id="toast-notification-dock"
      >
        {toasts.map(toast => {
          const visuals = getNotificationVisuals(toast);
          const Icon = visuals.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto bg-[#071328]/95 border ${visuals.borderColor} ${visuals.glowColor} rounded-2xl p-4 backdrop-blur-xl shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200 transition-all`}
            >
              {/* Progress bar countdown */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
                <div 
                  className={`h-full ${
                    visuals.badgeText === 'TAYYOR' || visuals.badgeText === 'ГОТОВ' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  } animate-[pulse_1s_infinite]`} 
                />
              </div>

              <div className="flex items-start gap-3 pt-1">
                {/* Visual Icon */}
                <div className={`p-2.5 rounded-xl border shrink-0 ${visuals.badgeColor}`}>
                  <Icon className="w-5 h-5 animate-pulse" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-black uppercase tracking-wider ${visuals.badgeColor}`}>
                      {visuals.badgeText}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDismissToast(toast.id)}
                      className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h5 className="font-black text-white text-xs sm:text-sm tracking-tight mt-1">
                    {toast.title}
                  </h5>

                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {toast.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                    <span className="text-slate-500 font-mono">
                      {toast.createdAt}
                    </span>

                    {toast.orderId && onSelectOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          onDismissToast(toast.id);
                          onSelectOrder(toast.orderId!);
                        }}
                        className="font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{t.viewOrder}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
