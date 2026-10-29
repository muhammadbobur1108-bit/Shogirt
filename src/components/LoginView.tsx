import React, { useState } from 'react';
import { AppUser } from '../types';
import { TRANSLATIONS, Language } from '../locales';
import { Shield, Key, ChevronRight, Cpu } from 'lucide-react';
import TexLogo from './TexLogo';

interface LoginViewProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  lang: Language;
}

export default function LoginView({ users, onLoginSuccess, lang }: LoginViewProps) {
  const t = TRANSLATIONS[lang];

  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleNumClick = (num: string) => {
    if (pinInput.length < 4) {
      setPinInput(prev => prev + num);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4) return;

    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    if (user.pin === pinInput) {
      onLoginSuccess(user);
    } else {
      setErrorMsg(t.loginError);
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans antialiased" id="login-screen-view">
      
      {/* Top Brand Title with New Logo */}
      <div className="mb-8">
        <TexLogo size="lg" variant="light" />
      </div>

      {/* Main card */}
      <div className="bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-sm w-full shadow-2xl space-y-6" id="login-container-card">
        
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-gray-100">{t.loginTitle}</h2>
          <p className="text-xs text-slate-400">{t.loginSub}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* User selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.selectUser}</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setPinInput('');
                setErrorMsg('');
              }}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3.5 py-3 text-xs focus:outline-hidden focus:border-indigo-500 font-bold cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({t[u.role as keyof typeof t] || u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Secure Pin input indicator */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">{t.enterPin}</label>
            
            <div className="flex justify-center space-x-3 py-1.5">
              {[0, 1, 2, 3].map(idx => (
                <div 
                  key={idx} 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pinInput.length > idx 
                      ? 'bg-indigo-500 border-indigo-500 scale-110 shadow-indigo-500/50 shadow-md' 
                      : 'border-slate-500 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-rose-500 text-[11px] font-semibold text-center animate-bounce">{errorMsg}</p>
            )}
          </div>

          {/* Visual numeric keypad for fast touch typing */}
          <div className="grid grid-cols-3 gap-2.5 pt-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumClick(num)}
                className="py-2.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-650 rounded-xl text-base font-black text-gray-200 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 bg-slate-750 hover:bg-slate-700 text-rose-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleNumClick('0')}
              className="py-2.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-650 rounded-xl text-base font-black text-gray-200 hover:text-white transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 bg-slate-750 hover:bg-slate-700 text-slate-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              ⌫
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pinInput.length !== 4}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            {t.loginBtn} <ChevronRight className="w-4 h-4" />
          </button>

          {/* Direct 1-Click login without PIN */}
          <button
            type="button"
            onClick={() => {
              const defaultUser = users.find(u => u.id === selectedUserId) || users[0];
              if (defaultUser) onLoginSuccess(defaultUser);
            }}
            className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            ✓ To'g'ridan-to'g'ri kirish (Parolsiz)
          </button>
        </form>

      </div>

    </div>
  );
}
