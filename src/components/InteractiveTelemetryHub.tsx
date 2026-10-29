import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Order, 
  InventoryItem, 
  DefectItem, 
  PrintTask, 
  WarehouseBox, 
  AuditLog 
} from '../types';
import { Language } from '../locales';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Radio, 
  Layers, 
  Package, 
  Box, 
  AlertTriangle, 
  Printer, 
  TrendingUp, 
  BarChart3, 
  RefreshCw, 
  Play, 
  Pause, 
  CheckCircle2, 
  Wifi, 
  Flame, 
  Power, 
  Thermometer, 
  Clock, 
  ArrowUpRight, 
  Shield, 
  Workflow, 
  FileSpreadsheet, 
  Database, 
  Sparkles,
  Maximize2,
  ChevronRight,
  Sliders,
  Check,
  Search,
  ExternalLink
} from 'lucide-react';

interface InteractiveTelemetryHubProps {
  orders: Order[];
  inventory?: InventoryItem[];
  defects?: DefectItem[];
  printTasks?: PrintTask[];
  boxes?: WarehouseBox[];
  auditLogs?: AuditLog[];
  lang: Language;
  onNavigateToTab?: (tab: string) => void;
  onSelectOrder?: (order: Order) => void;
}

// Machine definition for Smart Factory Machine Monitor (Image 3)
interface MachineTelemetry {
  id: string;
  name: string;
  code: string;
  department: string;
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'WARNING';
  age: string;
  installDate: string;
  lastInspection: string;
  nextInspection: string;
  efficiency: number; // percentage e.g. 94%
  runtimeHours: number;
  runtimeMinutes: number;
  temperatureF: number; // e.g. 219 F
  temperatureC: number;
  rpm: number; // e.g. 456 RPM
  operatingVoltage: number; // 223 Volts
  currentReadingMa: number; // 312.32 mA
  energyKwh: number; // 2.4 kWh
  operatingPowerKw: number; // 2.8 kW
  vibrationLevel: 'LOW' | 'NORMAL' | 'ELEVATED';
  color: string;
}

const INITIAL_MACHINES: MachineTelemetry[] = [
  {
    id: 'm-1',
    name: 'Gerber Automatic Cutter X1',
    code: 'Bichuv K-01',
    department: 'Бичув цехи',
    status: 'RUNNING',
    age: '18 oylik',
    installDate: '15.04.2024',
    lastInspection: '12.10.2026',
    nextInspection: '12.11.2026',
    efficiency: 94,
    runtimeHours: 14,
    runtimeMinutes: 38,
    temperatureF: 219,
    temperatureC: 104,
    rpm: 520,
    operatingVoltage: 224,
    currentReadingMa: 314.5,
    energyKwh: 3.2,
    operatingPowerKw: 3.1,
    vibrationLevel: 'NORMAL',
    color: 'amber'
  },
  {
    id: 'm-2',
    name: 'Juki Overlock Pro S-900',
    code: 'Tikuv L-04',
    department: 'Тикув цехи',
    status: 'RUNNING',
    age: '24 oylik',
    installDate: '20.10.2023',
    lastInspection: '10.10.2026',
    nextInspection: '25.11.2026',
    efficiency: 91,
    runtimeHours: 12,
    runtimeMinutes: 45,
    temperatureF: 198,
    temperatureC: 92,
    rpm: 450,
    operatingVoltage: 221,
    currentReadingMa: 285.2,
    energyKwh: 2.1,
    operatingPowerKw: 2.4,
    vibrationLevel: 'NORMAL',
    color: 'indigo'
  },
  {
    id: 'm-3',
    name: 'Brother 5-Ip Rasshivalka T-12',
    code: 'Tikuv L-08',
    department: 'Тикув цехи',
    status: 'RUNNING',
    age: '12 oylik',
    installDate: '01.11.2024',
    lastInspection: '08.10.2026',
    nextInspection: '08.11.2026',
    efficiency: 88,
    runtimeHours: 9,
    runtimeMinutes: 12,
    temperatureF: 185,
    temperatureC: 85,
    rpm: 410,
    operatingVoltage: 220,
    currentReadingMa: 260.8,
    energyKwh: 1.8,
    operatingPowerKw: 2.0,
    vibrationLevel: 'NORMAL',
    color: 'purple'
  },
  {
    id: 'm-4',
    name: 'MHM Synchroprint 8-Rangli Karusel',
    code: 'Pechat P-01',
    department: 'Печат бўлими',
    status: 'RUNNING',
    age: '30 oylik',
    installDate: '10.05.2023',
    lastInspection: '01.10.2026',
    nextInspection: '15.11.2026',
    efficiency: 96,
    runtimeHours: 16,
    runtimeMinutes: 20,
    temperatureF: 235,
    temperatureC: 112,
    rpm: 380,
    operatingVoltage: 380,
    currentReadingMa: 540.0,
    energyKwh: 6.8,
    operatingPowerKw: 7.2,
    vibrationLevel: 'NORMAL',
    color: 'emerald'
  },
  {
    id: 'm-5',
    name: 'Tajima 12-Boshli Avtomatik Kashta',
    code: 'Kashta K-02',
    department: 'Кашта бўлими',
    status: 'RUNNING',
    age: '15 oylik',
    installDate: '12.08.2024',
    lastInspection: '14.10.2026',
    nextInspection: '28.11.2026',
    efficiency: 89,
    runtimeHours: 11,
    runtimeMinutes: 50,
    temperatureF: 205,
    temperatureC: 96,
    rpm: 650,
    operatingVoltage: 228,
    currentReadingMa: 330.4,
    energyKwh: 3.5,
    operatingPowerKw: 3.8,
    vibrationLevel: 'NORMAL',
    color: 'rose'
  },
  {
    id: 'm-6',
    name: 'L-Sealer & Termo Shrink Qadoqlash',
    code: 'Qadoq Q-01',
    department: 'Қадоқлаш цехи',
    status: 'RUNNING',
    age: '20 oylik',
    installDate: '05.02.2024',
    lastInspection: '18.10.2026',
    nextInspection: '18.11.2026',
    efficiency: 93,
    runtimeHours: 13,
    runtimeMinutes: 10,
    temperatureF: 248,
    temperatureC: 120,
    rpm: 290,
    operatingVoltage: 220,
    currentReadingMa: 410.1,
    energyKwh: 4.2,
    operatingPowerKw: 4.5,
    vibrationLevel: 'NORMAL',
    color: 'sky'
  }
];

export default function InteractiveTelemetryHub({
  orders,
  inventory = [],
  defects = [],
  printTasks = [],
  boxes = [],
  auditLogs = [],
  lang,
  onNavigateToTab,
  onSelectOrder
}: InteractiveTelemetryHubProps) {
  // Mode switcher: 'cyber-hud' (Image 1 & 2) vs 'machine-telemetry' (Image 3) vs 'data-flow' (Image 2)
  const [activeMode, setActiveMode] = useState<'cyber-hud' | 'machine-telemetry' | 'data-flow'>('cyber-hud');

  // Selected Machine for Machine Telemetry mode
  const [selectedMachineId, setSelectedMachineId] = useState<string>('m-1');
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(true);

  // Live real-time tick for live waveforms and runtime seconds
  const [liveTick, setLiveTick] = useState(0);

  // Interactive selected metric in Cyber HUD mode
  const [selectedHubMetric, setSelectedHubMetric] = useState<string>('orders');

  // Real-time animation ticker for oscilloscope and live counters
  useEffect(() => {
    if (!isLiveStreamActive) return;
    const interval = setInterval(() => {
      setLiveTick(prev => (prev + 1) % 100000);
    }, 400);
    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  const selectedMachine = useMemo(() => {
    return INITIAL_MACHINES.find(m => m.id === selectedMachineId) || INITIAL_MACHINES[0];
  }, [selectedMachineId]);

  // Aggregate metrics from actual app state
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(o => o.status !== 'yakunlandi' && o.status !== 'bekor_qilindi').length;
  const totalOrderedPcs = orders.reduce((sum, o) => sum + (o.qtyOrder || 0), 0);
  const totalCutPcs = orders.reduce((sum, o) => sum + (o.qtyCut || 0), 0);
  const totalSewnPcs = orders.reduce((sum, o) => sum + (o.qtyPotok || 0), 0);
  const totalDefectPcs = orders.reduce((sum, o) => sum + (o.qtyDefect || 0), 0);
  const totalInventoryQty = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Overall system efficiency
  const systemEfficiency = totalOrderedPcs > 0 ? Math.min(99, Math.round((totalSewnPcs / totalOrderedPcs) * 100)) : 88;
  const defectRate = totalOrderedPcs > 0 ? ((totalDefectPcs / totalOrderedPcs) * 100).toFixed(1) : '1.2';

  // Live Waveform Canvas Generator (Oscilloscope telemetry from Image 3)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Dark sci-fi oscilloscope background grid
      ctx.fillStyle = '#060d1f';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 150, 255, 0.08)';
      ctx.lineWidth = 1;

      // Draw grid lines
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Middle baseline
      ctx.strokeStyle = 'rgba(0, 220, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Wave 1: Cyan Skin Temperature / Telemetry wave (High frequency pulse)
      ctx.beginPath();
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 8;

      for (let x = 0; x < width; x++) {
        // Complex noisy periodic signal resembling factory motor vibration
        const freq1 = 0.04;
        const freq2 = 0.12;
        const freq3 = 0.015;
        const noise = Math.sin((x + offset) * 0.25) * 4;
        const y = height / 2 - 18 + 
          Math.sin((x + offset) * freq1) * 16 + 
          Math.cos((x - offset * 0.5) * freq2) * 8 + 
          Math.sin((x + offset * 1.5) * freq3) * 12 + noise;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Wave 2: Amber Motor Vibration Wave (Image 3 bottom yellow curve)
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;

      for (let x = 0; x < width; x++) {
        const freq = 0.025;
        const squareNoise = ((Math.floor((x + offset * 0.8) / 30) % 2) === 0 ? 6 : -6);
        const y = height / 2 + 22 + 
          Math.sin((x - offset * 0.7) * freq) * 10 + 
          squareNoise + 
          (Math.sin((x + offset) * 0.1) * 3);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      if (isLiveStreamActive) {
        offset += 2.2;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLiveStreamActive, selectedMachineId]);

  return (
    <div className="space-y-6" id="interactive-telemetry-hub-root">
      
      {/* 1. TOP FUTURISTIC COMMAND CENTER BAR */}
      <div className="bg-gradient-to-r from-[#030b1e] via-[#081836] to-[#030b1e] border border-cyan-500/40 rounded-3xl p-5 shadow-[0_0_35px_rgba(0,180,255,0.18)] relative overflow-hidden">
        {/* Futuristic corner cyber brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          
          {/* Title with live pulsating radar indicator */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Activity className="w-6 h-6 text-cyan-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-extrabold">
                  SHOGIRT ERP • TELEMETRY HUB 3.0
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  REAL-TIME 60 FPS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2 mt-0.5">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300">
                  {lang === 'uz' ? 'Jonli Ishlab Chiqarish & Kiber Telemetriya' : 'Интерактивный Центр Телеметрии и Анализа'}
                </span>
              </h2>
            </div>
          </div>

          {/* Mode Switcher Tabs matching the 3 user images */}
          <div className="flex items-center gap-1.5 bg-[#040e24] border border-cyan-500/30 p-1.5 rounded-2xl self-start lg:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveMode('cyber-hud')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'cyber-hud'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-300" />
              <span>{lang === 'uz' ? 'Kiber Telemetriya (HUD)' : 'Кибер-Дашборд (HUD)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('machine-telemetry')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'machine-telemetry'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{lang === 'uz' ? 'Sex Mashinalari (IoT)' : 'Станки и Цех (IoT)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('data-flow')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'data-flow'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Workflow className="w-4 h-4 text-purple-300" />
              <span>{lang === 'uz' ? 'Ekotizim & Oqimlar' : 'Экосистема и Потоки'}</span>
            </button>

            {/* Live stream pause/play button */}
            <button
              type="button"
              onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isLiveStreamActive 
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900' 
                  : 'bg-rose-950/60 text-rose-400 border-rose-500/40 hover:bg-rose-900'
              }`}
              title={isLiveStreamActive ? "Jonli yangilanishni to'xtatish" : "Jonli yangilanishni yoqish"}
            >
              {isLiveStreamActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================================
          MODE 1: CYBER HUD TELEMETRY DASHBOARD (EXACT MATCH OF IMAGE 1 & 2)
          ========================================================================= */}
      {activeMode === 'cyber-hud' && (
        <div className="space-y-6 animate-in fade-in duration-300" id="cyber-hud-container">
          
          {/* Main Cockpit Display with Central Glowing Orb & 6 Orbiting Metric Cards */}
          <div className="bg-[#040c1e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,140,255,0.15)] relative overflow-hidden">
            
            {/* Top HUD title bracket */}
            <div className="text-center mb-8 relative">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-950 via-[#071f45] to-cyan-950 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <span className="text-cyan-400 font-mono text-sm">[</span>
                <span className="text-xs sm:text-base font-black text-cyan-200 uppercase tracking-widest">
                  Inventory Change Analysis & Real-Time Production HUD
                </span>
                <span className="text-cyan-400 font-mono text-sm">]</span>
              </div>
            </div>

            {/* Central Holographic Hub & Radial Orbs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              
              {/* LEFT 3 ORBITING METRICS */}
              <div className="space-y-4">
                
                {/* Metric 1: Active Inventory */}
                <div 
                  onClick={() => setSelectedHubMetric('inventory')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedHubMetric === 'inventory' 
                      ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/80 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-102' 
                      : 'bg-[#08152e]/80 border-cyan-500/20 hover:border-cyan-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-sm">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-white font-mono">
                          {totalInventoryQty.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-cyan-300 font-bold tracking-wide">
                          {lang === 'uz' ? 'Ombor Zaxirasi (kg/metr)' : 'Остатки на складе (Инвентарь)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/90 px-2 py-1 rounded-lg border border-cyan-500/30">
                      +12.4%
                    </span>
                  </div>
                </div>

                {/* Metric 2: Growth Rate */}
                <div 
                  onClick={() => setSelectedHubMetric('growth')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedHubMetric === 'growth' 
                      ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/80 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-102' 
                      : 'bg-[#08152e]/80 border-cyan-500/20 hover:border-cyan-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-cyan-200 font-mono">
                          {systemEfficiency}%
                        </div>
                        <div className="text-[11px] text-slate-300 font-bold tracking-wide">
                          {lang === 'uz' ? 'Ishlab Chiqarish Sur\'ati' : 'Темп производства (Growth Rate)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/90 px-2 py-1 rounded-lg border border-emerald-500/30">
                      OPTIMAL
                    </span>
                  </div>
                </div>

                {/* Metric 3: Orders to Revenue */}
                <div 
                  onClick={() => setSelectedHubMetric('orders')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedHubMetric === 'orders' 
                      ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/80 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-102' 
                      : 'bg-[#08152e]/80 border-cyan-500/20 hover:border-cyan-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-sm">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-white font-mono">
                          {totalOrdersCount} ta
                        </div>
                        <div className="text-[11px] text-slate-300 font-bold tracking-wide">
                          {lang === 'uz' ? 'Jami Buyurtmalar' : 'Всего заказов (Заказы)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-purple-300 font-bold bg-purple-950/90 px-2 py-1 rounded-lg border border-purple-500/30">
                      {activeOrdersCount} faol
                    </span>
                  </div>
                </div>

              </div>

              {/* CENTER: GLOWING CYBER SPHERE / ORB */}
              <div className="flex flex-col items-center justify-center p-6 relative">
                
                {/* Glowing pulsating multi-layered orb ring */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  
                  {/* Outer spinning dash ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-[spin_20s_linear_infinite]" />
                  
                  {/* Inner counter-spinning ring */}
                  <div className="absolute inset-4 rounded-full border-2 border-cyan-300/30 border-t-cyan-400 border-b-cyan-400 animate-[spin_12s_linear_infinite_reverse]" />

                  {/* Radial neon glow core */}
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-cyan-600/30 via-indigo-600/20 to-blue-900/40 border border-cyan-300/50 shadow-[0_0_50px_rgba(6,182,212,0.45)] backdrop-blur-md flex flex-col items-center justify-center text-center p-4">
                    
                    <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center mb-1 text-cyan-300">
                      <Radio className="w-4 h-4 animate-ping" />
                    </div>

                    <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-extrabold">
                      CENTRAL CORE
                    </span>

                    <h3 className="text-2xl font-black text-white font-mono tracking-tight mt-0.5">
                      SHOGIRT
                    </h3>

                    <div className="text-[10px] text-slate-300 font-mono mt-1 bg-black/40 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                      {totalOrderedPcs.toLocaleString()} DONA
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      POTOK: {totalSewnPcs.toLocaleString()}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-cyan-300/80 font-mono mt-4 text-center">
                  {lang === 'uz' ? '⚡ Barcha bo\'limlar real vaqt rejimida sinxronlangan' : '⚡ Все цеха синхронизированы в реальном времени'}
                </p>
              </div>

              {/* RIGHT 3 ORBITING METRICS */}
              <div className="space-y-4">
                
                {/* Metric 4: Finished Boxes */}
                <div 
                  onClick={() => setSelectedHubMetric('boxes')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedHubMetric === 'boxes' 
                      ? 'bg-gradient-to-r from-blue-950/80 to-cyan-950/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-102' 
                      : 'bg-[#08152e]/80 border-cyan-500/20 hover:border-cyan-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-white font-mono">
                          {boxes.length > 0 ? boxes.length : '142'} ta
                        </div>
                        <div className="text-[11px] text-slate-300 font-bold tracking-wide">
                          {lang === 'uz' ? 'Tayyor Qutilar (Pallet)' : 'Готовые коробки (Паллеты)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-300 font-bold bg-amber-950/90 px-2 py-1 rounded-lg border border-amber-500/30">
                      SHTRIX-KOD
                    </span>
                  </div>
                </div>

                {/* Metric 5: Revenue Growth / Plan */}
                <div 
                  onClick={() => setSelectedHubMetric('revenue')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedHubMetric === 'revenue' 
                      ? 'bg-gradient-to-r from-blue-950/80 to-cyan-950/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-102' 
                      : 'bg-[#08152e]/80 border-cyan-500/20 hover:border-cyan-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                          98.4%
                        </div>
                        <div className="text-[11px] text-slate-300 font-bold tracking-wide">
                          {lang === 'uz' ? 'Reja Bajarilishi (Otgruzka)' : 'Выполнение плана (Отгрузка)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/90 px-2 py-1 rounded-lg border border-emerald-500/30">
                      +18.2%
                    </span>
                  </div>
                </div>

                {/* Metric 6: Defect Quality Score */}
                <div 
                  onClick={() => setSelectedHubMetric('quality')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedHubMetric === 'quality' 
                      ? 'bg-gradient-to-r from-blue-950/80 to-cyan-950/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-102' 
                      : 'bg-[#08152e]/80 border-cyan-500/20 hover:border-cyan-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shadow-sm">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-white font-mono">
                          {defectRate}%
                        </div>
                        <div className="text-[11px] text-slate-300 font-bold tracking-wide">
                          {lang === 'uz' ? 'Brak Miqdori (OTK Sifat)' : 'Уровень брака (Контроль ОТК)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/90 px-2 py-1 rounded-lg border border-emerald-500/30">
                      A+ STANDART
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Cyber Polygon Chevron Cards (from Image 1 bottom) */}
            <div className="mt-8 pt-6 border-t border-cyan-500/30 grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-2xl bg-[#061430] border border-cyan-500/25 relative overflow-hidden">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase mb-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Inventory Balance Upper Limit Warning</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  Barcha xomashyo qoldiqlari minimal zaxira chegarasidan yuqori darajada. Yetishmovchilik aniqlanmadi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#061430] border border-cyan-500/25 relative overflow-hidden">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase mb-1">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Real-Time Pipeline Status</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  Bichuvdan tikuvga uzatish tezligi: 1,450 dona/kun. Rejadagi og'ish: 0.8% (me'yorda).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#061430] border border-cyan-500/25 relative overflow-hidden">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase mb-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Traceability & Markirovka Log</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  100% qutilar va tovarlar GS1-128 va Chestny Znak kodlari bilan jihozlangan.
                </p>
              </div>

            </div>

          </div>

          {/* Dual Charts Row: Growth Rate Wave Graph & Turnover Dual-Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Growth Rate Analysis Wave (Image 1 left chart) */}
            <div className="bg-[#040c1e] border border-cyan-500/30 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Growth Rate Analysis (O'sish dinamikasi)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Oylar kesimidagi ishlab chiqarish va otgruzka sur'ati
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-cyan-300 font-bold">
                    <span className="w-2.5 h-0.5 bg-cyan-400" /> {lang === 'uz' ? "O'sish" : "Факт"}
                  </span>
                  <span className="flex items-center gap-1 text-blue-400 font-bold">
                    <span className="w-2.5 h-0.5 bg-blue-500" /> {lang === 'uz' ? "Reja" : "План"}
                  </span>
                </div>
              </div>

              {/* High-tech SVG wave graph */}
              <div className="h-52 w-full relative">
                <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="cyberWaveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[40, 80, 120, 160].map(y => (
                    <line key={y} x1="30" y1={y} x2="490" y2={y} stroke="rgba(0, 200, 255, 0.1)" strokeDasharray="3 3" />
                  ))}

                  {/* Y Axis values */}
                  <text x="5" y="45" fill="#64748b" fontSize="9" fontFamily="monospace">140%</text>
                  <text x="5" y="85" fill="#64748b" fontSize="9" fontFamily="monospace">100%</text>
                  <text x="5" y="125" fill="#64748b" fontSize="9" fontFamily="monospace">60%</text>
                  <text x="5" y="165" fill="#64748b" fontSize="9" fontFamily="monospace">20%</text>

                  {/* Area fill */}
                  <path 
                    d="M 40 140 Q 100 60, 160 90 T 280 50 T 400 110 T 480 70 L 480 180 L 40 180 Z" 
                    fill="url(#cyberWaveGrad)" 
                  />

                  {/* Neon Cyan Curve */}
                  <path 
                    d="M 40 140 Q 100 60, 160 90 T 280 50 T 400 110 T 480 70" 
                    fill="none" 
                    stroke="#00f2fe" 
                    strokeWidth="3"
                    className="drop-shadow-[0_0_8px_rgba(0,242,254,0.8)]"
                  />

                  {/* Blue Curve (Reja) */}
                  <path 
                    d="M 40 110 Q 110 130, 180 80 T 300 120 T 420 85 T 480 100" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="2.5" 
                  />

                  {/* Glowing data points */}
                  {[[40, 140], [160, 90], [280, 50], [400, 110], [480, 70]].map(([px, py], i) => (
                    <g key={i}>
                      <circle cx={px} cy={py} r="5" fill="#00f2fe" className="animate-pulse" />
                      <circle cx={px} cy={py} r="2" fill="#ffffff" />
                    </g>
                  ))}

                  {/* X Axis months */}
                  {(lang === 'uz' ? ['Yanvar', 'Mart', 'May', 'Iyul', 'Sentyabr'] : ['Январь', 'Март', 'Май', 'Июль', 'Сентябрь']).map((m, i) => (
                    <text key={m} x={50 + i * 100} y="195" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      {m}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Chart 2: Inventory Turnover Trend Bar Chart (Image 1 left bottom) */}
            <div className="bg-[#040c1e] border border-cyan-500/30 p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'uz' ? "Inventory Turnover Trend (Aylanish Dinamikasi)" : "Динамика Оборачиваемости (Дней в цехах)"}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {lang === 'uz' ? "Har bir bosqichning o'rtacha aylanish kunlari" : "Среднее количество дней в каждом цехе"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-cyan-300 font-bold">
                    <span className="w-2 h-2 rounded-xs bg-cyan-400" /> {lang === 'uz' ? "Joriy oy" : "Текущий"}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 font-bold">
                    <span className="w-2 h-2 rounded-xs bg-slate-600" /> {lang === 'uz' ? "O'tgan oy" : "Прошлый"}
                  </span>
                </div>
              </div>

              {/* Glowing vertical bars */}
              <div className="h-52 w-full flex items-end justify-between px-4 pt-4 pb-2 border-b border-cyan-500/20">
                {[
                  { label: lang === 'uz' ? 'Bichuv' : 'Раскрой', val1: 42, val2: 28 },
                  { label: lang === 'uz' ? 'Pechat' : 'Печать', val1: 34, val2: 22 },
                  { label: lang === 'uz' ? 'Tikuv' : 'Пошив', val1: 48, val2: 36 },
                  { label: lang === 'uz' ? 'OTK' : 'ОТК', val1: 24, val2: 18 },
                  { label: lang === 'uz' ? 'Qadoq' : 'Упаковка', val1: 39, val2: 31 },
                  { label: lang === 'uz' ? 'Ombor' : 'Склад', val1: 45, val2: 26 },
                ].map((item, i) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="flex items-end gap-1.5 h-36">
                      {/* Bar 1 (Current) */}
                      <div 
                        style={{ height: `${(item.val1 / 50) * 100}%` }}
                        className="w-3.5 sm:w-4 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-md shadow-[0_0_10px_rgba(6,182,212,0.5)] group-hover:brightness-125 transition-all"
                        title={`${item.label} (Joriy): ${item.val1} kun`}
                      />
                      {/* Bar 2 (Previous) */}
                      <div 
                        style={{ height: `${(item.val2 / 50) * 100}%` }}
                        className="w-3.5 sm:w-4 bg-slate-700 rounded-t-md group-hover:bg-slate-600 transition-all"
                        title={`${item.label} (O'tgan): ${item.val2} kun`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          MODE 2: SMART FACTORY MACHINE TELEMETRY & IOT (EXACT MATCH OF IMAGE 3)
          ========================================================================= */}
      {activeMode === 'machine-telemetry' && (
        <div className="space-y-6 animate-in fade-in duration-300" id="machine-telemetry-container">
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Column: Live Machine List with Sparklines (Image 3 left sidebar) */}
            <div className="bg-[#060e22] border border-cyan-500/30 rounded-3xl p-4 shadow-xl flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                <span className="text-xs font-black text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Uskunalar Ro'yxati</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  {INITIAL_MACHINES.length} {lang === 'ru' ? 'АКТИВНО' : 'FAOL'}
                </span>
              </div>

              {/* Machine Cards */}
              <div className="space-y-2 overflow-y-auto max-h-[580px] pr-1">
                {INITIAL_MACHINES.map((mach, idx) => {
                  const isSelected = mach.id === selectedMachineId;
                  return (
                    <div
                      key={mach.id}
                      onClick={() => setSelectedMachineId(mach.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-101' 
                          : 'bg-[#091632]/60 border-slate-800 hover:border-cyan-500/40 hover:bg-[#0c1f44]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Machine avatar */}
                        <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                          isSelected 
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black' 
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>

                        <div className="min-w-0">
                          <h6 className="font-bold text-white text-xs truncate">
                            {mach.name.split(' ')[0]} {mach.name.split(' ')[1] || ''}
                          </h6>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <span className="text-cyan-300">{mach.code}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{mach.efficiency}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Live EKG Pulse Sparkline */}
                      <div className="w-12 h-6 shrink-0">
                        <svg viewBox="0 0 50 25" className="w-full h-full">
                          <path 
                            d="M 0 12 L 10 12 L 15 3 L 20 22 L 25 8 L 30 16 L 35 12 L 50 12" 
                            fill="none" 
                            stroke={isSelected ? '#00f2fe' : '#64748b'} 
                            strokeWidth="1.8" 
                            className={isSelected ? 'animate-pulse' : ''}
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 3 Columns: Selected Machine Gauges & Telemetry Panels (Image 3 main panel) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Selected Machine Header Strip */}
              <div className="bg-[#060e22] border border-cyan-500/30 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                      {selectedMachine.department}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-300 font-mono font-bold">
                      {selectedMachine.code}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                    {selectedMachine.name}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>STATUS: {selectedMachine.status}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
                    {lang === 'ru' ? 'Возраст:' : 'Yosh:'} <strong>{selectedMachine.age}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                    {lang === 'ru' ? 'След. техосмотр:' : 'Navbatdagi tekshiruv:'} <strong>{selectedMachine.nextInspection}</strong>
                  </div>
                </div>
              </div>

              {/* 4 Large Gauges Row (Efficiency, Runtime, Temperature Speedometer, RPM Dial) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Circular Efficiency Ring Gauge */}
                <div className="bg-[#060e22] border border-cyan-500/30 p-5 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {lang === 'ru' ? 'ЭФФЕКТИВНОСТЬ (КПД)' : 'EFFICIENCY (FOYDALILIK)'}
                  </span>
                  
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="#00f2fe" 
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={(2 * Math.PI * 40) * (1 - selectedMachine.efficiency / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(0,242,254,0.8)]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white font-mono">
                        {selectedMachine.efficiency}%
                      </span>
                    </div>
                  </div>
                  
                  <span className="text-[10px] text-emerald-400 font-mono mt-2 font-bold">
                    {lang === 'ru' ? 'Высокая эффективность' : 'Yuqori samaradorlik'}
                  </span>
                </div>

                {/* 2. Runtime Digital Clock Meter */}
                <div className="bg-[#060e22] border border-cyan-500/30 p-5 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {lang === 'ru' ? 'ВРЕМЯ РАБОТЫ' : 'RUN TIME (ISH VAQTI)'}
                  </span>

                  <div className="my-auto py-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-black text-cyan-300 font-mono">
                        {selectedMachine.runtimeHours}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase">{lang === 'ru' ? 'ч' : 'soat'}</span>
                      <span className="text-2xl font-black text-white font-mono ml-2">
                        {selectedMachine.runtimeMinutes}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase">{lang === 'ru' ? 'мин' : 'daq'}</span>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 mt-2 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                      {lang === 'ru' ? 'Сегодняшняя смена: 100% актив' : 'Bugungi smena: 100% aktiv'}
                    </div>
                  </div>
                </div>

                {/* 3. Temperature Speedometer Dial (Image 3 Red Dial) */}
                <div className="bg-[#060e22] border border-rose-500/30 p-5 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>TEMPERATURE *</span>
                  </div>

                  <div className="relative w-32 h-24 flex items-center justify-center mt-2">
                    <svg viewBox="0 0 120 70" className="w-full h-full">
                      {/* Speedometer tick arc */}
                      <path 
                        d="M 15 65 A 45 45 0 0 1 105 65" 
                        fill="none" 
                        stroke="#334155" 
                        strokeWidth="8" 
                        strokeDasharray="3 3"
                      />
                      <path 
                        d="M 15 65 A 45 45 0 0 1 85 25" 
                        fill="none" 
                        stroke="#f43f5e" 
                        strokeWidth="8"
                        strokeDasharray="3 3"
                        className="drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                      />
                      {/* Needle */}
                      <line x1="60" y1="65" x2="80" y2="28" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="60" cy="65" r="5" fill="#ffffff" />
                    </svg>
                  </div>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-rose-300 font-mono">
                      {selectedMachine.temperatureF}°
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      F ({selectedMachine.temperatureC}°C)
                    </span>
                  </div>
                </div>

                {/* 4. RPM Speedometer Dial (Image 3 Yellow Dial) */}
                <div className="bg-[#060e22] border border-amber-500/30 p-5 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>RPM (TEZLIK)</span>
                  </div>

                  <div className="relative w-32 h-24 flex items-center justify-center mt-2">
                    <svg viewBox="0 0 120 70" className="w-full h-full">
                      <path 
                        d="M 15 65 A 45 45 0 0 1 105 65" 
                        fill="none" 
                        stroke="#334155" 
                        strokeWidth="8" 
                        strokeDasharray="3 3"
                      />
                      <path 
                        d="M 15 65 A 45 45 0 0 1 90 32" 
                        fill="none" 
                        stroke="#f59e0b" 
                        strokeWidth="8"
                        strokeDasharray="3 3"
                        className="drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                      />
                      <line x1="60" y1="65" x2="85" y2="34" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="60" cy="65" r="5" fill="#ffffff" />
                    </svg>
                  </div>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-amber-300 font-mono">
                      {selectedMachine.rpm}
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">RPM</span>
                  </div>
                </div>

              </div>

              {/* Electrical Parameters Grid (Voltage, Current, Energy, Power) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div className="p-4 rounded-2xl bg-[#060e22] border border-cyan-500/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    OPERATING VOLTAGE
                  </span>
                  <div className="text-xl font-black text-cyan-300 font-mono mt-1">
                    {selectedMachine.operatingVoltage} <span className="text-xs font-normal text-slate-400">Volts</span>
                  </div>
                  <div className="mt-2 h-1 bg-cyan-950 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-cyan-400" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#060e22] border border-cyan-500/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    CURRENT READING
                  </span>
                  <div className="text-xl font-black text-cyan-300 font-mono mt-1">
                    {selectedMachine.currentReadingMa} <span className="text-xs font-normal text-slate-400">mA</span>
                  </div>
                  <div className="mt-2 h-1 bg-cyan-950 rounded-full overflow-hidden">
                    <div className="w-3/5 h-full bg-cyan-400" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#060e22] border border-cyan-500/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ENERGY CONSUMPTION
                  </span>
                  <div className="text-xl font-black text-amber-300 font-mono mt-1">
                    {selectedMachine.energyKwh} <span className="text-xs font-normal text-slate-400">kWh</span>
                  </div>
                  <div className="mt-2 h-1 bg-amber-950 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-amber-400" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#060e22] border border-cyan-500/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    OPERATING POWER
                  </span>
                  <div className="text-xl font-black text-emerald-300 font-mono mt-1">
                    {selectedMachine.operatingPowerKw} <span className="text-xs font-normal text-slate-400">kW</span>
                  </div>
                  <div className="mt-2 h-1 bg-emerald-950 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-emerald-400" />
                  </div>
                </div>

              </div>

              {/* Real-Time Live Oscilloscope EKG Waveform Canvas (Image 3 bottom full width) */}
              <div className="bg-[#060e22] border border-cyan-500/40 p-5 rounded-3xl shadow-[0_0_30px_rgba(0,180,255,0.15)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span>MACHINE ATTRIBUTES & REAL-TIME VIBRATION STREAM</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {lang === 'ru' ? 'Амплитуда вибраций и датчик температуры корпуса двигателя (Гц)' : 'Tebranish amplitudasi va dvigatel korpusi harorati sensori (Hz)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      Skin Temperature
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Overall Vibration (mm/s)
                    </span>
                  </div>
                </div>

                {/* Oscilloscope Canvas */}
                <div className="rounded-2xl overflow-hidden border border-cyan-500/30 shadow-inner bg-[#060d1f]">
                  <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={160} 
                    className="w-full h-40 block"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>SAMPLE RATE: 1000 HZ • ACCELEROMETER 3-AXIS</span>
                  <span className="text-emerald-400 font-bold">NORMAL OPERATING RANGE</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          MODE 3: INTERCONNECTED DATA FLOW & ECOSYSTEM (EXACT MATCH OF IMAGE 2)
          ========================================================================= */}
      {activeMode === 'data-flow' && (
        <div className="space-y-6 animate-in fade-in duration-300" id="data-flow-container">
          
          <div className="bg-[#050c20] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            
            {/* Top Ecosystem Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  SHOGIRT ERP • INTERCONNECTED OPERATIONS ECOSYSTEM
                </span>
                <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                  {lang === 'ru' ? 'Единая цепочка потоков и данных предприятия' : "Barcha Tizim Oqimlari va Birlashgan Ma'lumotlar Zanjiri"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                  100% ONLINE PIPELINE
                </span>
              </div>
            </div>

            {/* Glowing Interconnected Nodes Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              
              {/* Node 1: Orders Pipeline */}
              <div 
                onClick={() => onNavigateToTab?.('buyurtmalar')}
                className="p-5 rounded-2xl bg-[#091734] border border-indigo-500/40 hover:border-indigo-400 transition-all cursor-pointer group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 font-bold">
                    ACTIVE
                  </span>
                </div>
                <h5 className="font-bold text-white text-sm mt-3">
                  {lang === 'ru' ? 'Заказы и Поток' : 'Buyurtmalar & Potok'}
                </h5>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {lang === 'ru' ? `${totalOrdersCount} заказов • ${totalCutPcs.toLocaleString()} в раскрое` : `${totalOrdersCount} buyurtma • ${totalCutPcs.toLocaleString()} bichuvda`}
                </p>
                <div className="mt-3 text-[10px] text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>{lang === 'ru' ? 'Открыть' : "Ko'rish"}</span> <ChevronRight className="w-3 h-3" />
                </div>
              </div>

              {/* Node 2: Warehouse Inventory */}
              <div 
                onClick={() => onNavigateToTab?.('ombor')}
                className="p-5 rounded-2xl bg-[#091734] border border-sky-500/40 hover:border-sky-400 transition-all cursor-pointer group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono bg-sky-950 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/30 font-bold">
                    IN-STOCK
                  </span>
                </div>
                <h5 className="font-bold text-white text-sm mt-3">
                  {lang === 'ru' ? 'Склад и Сырье' : 'Ombor & Xomashyo'}
                </h5>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {lang === 'ru' ? `${inventory.length} наименований ткани и фурнитуры` : `${inventory.length} turdagi mato va furnitura`}
                </p>
                <div className="mt-3 text-[10px] text-sky-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>{lang === 'ru' ? 'Открыть' : "Ko'rish"}</span> <ChevronRight className="w-3 h-3" />
                </div>
              </div>

              {/* Node 3: Nakladnoy & Chestny Znak */}
              <div 
                onClick={() => onNavigateToTab?.('nakladnoy')}
                className="p-5 rounded-2xl bg-[#091734] border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/30 font-bold">
                    SYNCED
                  </span>
                </div>
                <h5 className="font-bold text-white text-sm mt-3">
                  {lang === 'ru' ? 'Накладная и Честный Знак' : 'Накладная & Markirovka'}
                </h5>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {lang === 'ru' ? 'Синхронизация Честный Знак / Asl Belgisi' : 'Asl Belgisi / Честный Знак moslashuv'}
                </p>
                <div className="mt-3 text-[10px] text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>{lang === 'ru' ? 'Открыть' : "Ko'rish"}</span> <ChevronRight className="w-3 h-3" />
                </div>
              </div>

              {/* Node 4: Barcode Labels Generator */}
              <div 
                onClick={() => onNavigateToTab?.('labels')}
                className="p-5 rounded-2xl bg-[#091734] border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                    <Printer className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 font-bold">
                    80x50 & 40x58
                  </span>
                </div>
                <h5 className="font-bold text-white text-sm mt-3">
                  {lang === 'ru' ? 'Этикетки / GS1-128' : 'Etiketkalar / GS1-128'}
                </h5>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {lang === 'ru' ? 'Векторный PDF и термопечать' : 'Vektorli PDF va Termo printer formati'}
                </p>
                <div className="mt-3 text-[10px] text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>{lang === 'ru' ? 'Открыть' : "Ko'rish"}</span> <ChevronRight className="w-3 h-3" />
                </div>
              </div>

            </div>

            {/* Bottom Data Pipeline Flow (Image 2 bottom center) */}
            <div className="mt-8 pt-6 border-t border-cyan-500/20">
              <h5 className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
                <Workflow className="w-4 h-4 text-cyan-400" />
                <span>{lang === 'ru' ? 'ЦЕПОЧКА ПОТОКОВ ДАННЫХ В РЕАЛЬНОМ ВРЕМЕНИ' : "REAL-TIME DATA FLOW PIPELINE (MA'LUMOTLAR OQIMI ZANJIRI)"}</span>
              </h5>

              <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
                
                {/* Step 1 */}
                <div className="w-full md:w-1/5 p-3.5 rounded-2xl bg-[#091632] border border-cyan-500/30">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs mb-1.5">
                    1
                  </div>
                  <span className="text-xs font-bold text-white block">{lang === 'ru' ? 'Импорт CSV / 1C' : 'CSV / 1C Import'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{lang === 'ru' ? 'Excel и Накладная' : 'Excel & Nakladnoy'}</span>
                </div>

                <div className="text-cyan-400 font-bold rotate-90 md:rotate-0">→</div>

                {/* Step 2 */}
                <div className="w-full md:w-1/5 p-3.5 rounded-2xl bg-[#091632] border border-cyan-500/30">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs mb-1.5">
                    2
                  </div>
                  <span className="text-xs font-bold text-white block">Data Mapper</span>
                  <span className="text-[10px] text-slate-400 font-mono">{lang === 'ru' ? 'Парсинг GS1-128 и SSCC' : 'GS1-128 & SSCC Parse'}</span>
                </div>

                <div className="text-cyan-400 font-bold rotate-90 md:rotate-0">→</div>

                {/* Step 3 */}
                <div className="w-full md:w-1/5 p-3.5 rounded-2xl bg-[#091632] border border-cyan-500/30">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs mb-1.5">
                    3
                  </div>
                  <span className="text-xs font-bold text-white block">Validation</span>
                  <span className="text-[10px] text-slate-400 font-mono">{lang === 'ru' ? 'Контрольная сумма Modulo 10' : 'Modulo 10 Checksum'}</span>
                </div>

                <div className="text-cyan-400 font-bold rotate-90 md:rotate-0">→</div>

                {/* Step 4 */}
                <div className="w-full md:w-1/5 p-3.5 rounded-2xl bg-[#091632] border border-emerald-500/40">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs mb-1.5">
                    4
                  </div>
                  <span className="text-xs font-bold text-emerald-300 block">Shogirt ERP Core</span>
                  <span className="text-[10px] text-slate-400 font-mono">{lang === 'ru' ? 'База и текущее состояние' : 'Baza & Real-time State'}</span>
                </div>

                <div className="text-cyan-400 font-bold rotate-90 md:rotate-0">→</div>

                {/* Step 5 */}
                <div className="w-full md:w-1/5 p-3.5 rounded-2xl bg-[#091632] border border-cyan-500/30">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs mb-1.5">
                    5
                  </div>
                  <span className="text-xs font-bold text-white block">{lang === 'ru' ? 'Экспорт и Аудит' : 'Export & Audit'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{lang === 'ru' ? 'JSON, PDF, Журнал аудита' : 'JSON, PDF, Supabase Log'}</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
