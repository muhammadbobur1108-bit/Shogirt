import React, { useState } from 'react';
import { InventoryItem, Order } from '../types';
import { TRANSLATIONS, Language } from '../locales';
import { 
  Calculator, 
  HelpCircle, 
  TrendingUp, 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Cpu,
  Search,
  QrCode,
  FileText,
  Database,
  Palette,
  Layers,
  ArrowRight,
  Sliders,
  Settings,
  PlusCircle,
  Tag
} from 'lucide-react';
import { COLORS } from '../mockData';

interface CalculatorViewProps {
  inventory: InventoryItem[];
  orders: Order[];
  lang: Language;
}

interface ParsedModel {
  artikul: string;
  skladCode: string;
  category: string;
  modelNum: string;
  density: string;
  brand: string;
  yarnGrade: string;
  fabricComposition: string;
  colorName: string;
  colorHex: string;
}

export default function CalculatorView({ inventory, orders, lang }: CalculatorViewProps) {
  const t = TRANSLATIONS[lang];

  // Active Tab: 'spec_identifier' or 'calculator' or 'ai_advisor'
  const [activeTab, setActiveTab] = useState<'spec_identifier' | 'calculator' | 'ai_advisor'>('spec_identifier');

  // Spec Identifier State
  const [modelSearchQuery, setModelSearchQuery] = useState('SM-OW-1111/160-TA.LMP.OE');
  const [selectedOrderSpecId, setSelectedOrderSpecId] = useState<string>('');

  // Code Constructor Builder State
  const [builderBrand, setBuilderBrand] = useState('SM');
  const [builderType, setBuilderType] = useState('OW');
  const [builderModelId, setBuilderModelId] = useState('2026');
  const [builderDensity, setBuilderDensity] = useState('160');
  const [builderClient, setBuilderClient] = useState('TA');
  const [builderComp, setBuilderComp] = useState('LMP');
  const [builderYarn, setBuilderYarn] = useState('OE');
  const [builderColorIndex, setBuilderColorIndex] = useState(0);

  // Translations helpers inside view
  const calcT = {
    uz: {
      title: "Mato va Ip Sarfi Kalkulyatori",
      sub: "Andozalar va bichuv chiqindisi asosida xomashyo talabini hisoblang",
      piecesCount: "Kiyim soni (Dona)",
      singleWeight: "Bitta og'irligi (kg)",
      cuttingWastage: "Bichuv chiqindisi (%)",
      estimatedMaterials: "Hisoblangan xomashyo ehtiyoji:",
      totalFabric: "JAMI MATO MIQDORI",
      estimatedYarn: "TAXMINIY IP SARFI",
      ribanaOffer: "Yoqa/Manzhet uchun Ribana taklifi:",
      compareStock: "📊 Ombordagi zaxira bilan solishtirish",
      stockAnalysis: "Ombardagi mavjudlik tahlili",
      stockEnough: "Zaxira Etarli",
      stockShortage: "Kamchilik:",
      fabricNotFound: "Omborda mos keladigan mato topilmadi! Iltimos, xarid ro'yxatini shakllantiring.",
      aiTitle: "Shogirt ERP Smart AI Maslahatchi",
      aiSub: "Gemini 3.5-Flash tomonidan boshqariladigan ekspert",
      aiWelcome: "Salom! Men to'qimachilik ERP tizimingizning sun'iy intellekt maslahatchisiman. Men sizga mato sarfini hisoblash, iplar sifati, bo'yash jarayoni yoki tikuvchilik texnologiyalari bo'yicha maslahat bera olaman. Quyidagi tayyor savollardan birini tanlang yoki o'zingiz yozing.",
      aiWelcomeRu: "Здравствуйте! Я ИИ-консультант вашей текстильной ERP-системы. Я могу проконсультировать вас по расчету расхода ткани, качеству пряжи, процессу крашения или технологиям пошива.",
      quickQueries: "Tezkor so'rovlar:",
      customOption: "Custom (Boshqa)",
      inputPlaceholder: "Mato, ip, texnologiya yoki sarf bo'yicha savol bering...",
      wastageOption1: "5% (Yuqori sifatli andoza)",
      wastageOption2: "8% (Tejamkor bichuv)",
      wastageOption3: "10% (Standart me'yor)",
      wastageOption4: "12% (Katta naqsh / murakkab)",
      wastageOption5: "15% (Keng oversayz xudi)",
      yarnDetail: "Trikotaj uchun 30/1 yoki 40/1 ip",
      closeBtn: "Yopish",
      
      // Spec identifier keys
      specTitle: "Model & Sklad Kod Aniqlovchi",
      specSub: "Artikul, Sklad kodi, Model va Rang ko'rsatkichlarini real-vaqtda tahlil qilish",
      enterCode: "Model kodi yoki Artikulni kiriting:",
      selectActiveOrder: "Yoki tizimdagi faol buyurtmalardan tanlang:",
      searchPlaceholder: "Masalan: SM-OW-1111/160-TA.LMP.OE...",
      constructorTitle: "🛠️ Model Kodi Konstruktori (Generator)",
      constructorSub: "Parametrlarni tanlang va mos keladigan kodlarni yarating",
      artikulLabel: "Generatsiya qilingan Artikul (Model kodi):",
      skladLabel: "Sklad kodi (MOS):",
      parsedDetails: "Parsed Specifications (Aniqlovchi ma'lumotlari):",
      paramBrand: "Brend / Buyurtmachi",
      paramType: "Kiyim Turi",
      paramModelNo: "Model Raqami",
      paramDensity: "Mato Zichligi",
      paramYarn: "Ip Sifati (Yarn Grade)",
      paramComp: "Tarkibi",
      paramColor: "Rangi",
      matchedStockTitle: "📦 Sklad (Ombor) zaxiralari tahlili",
      matchedStockSub: "Ushbu model va rangga mos keladigan tayyor mahsulotlar hamda xomashyo holati",
      noStockMatch: "Omborda ushbu rang va modelga mos zaxiralar topilmadi.",
      calculateWithCode: "Ushbu model uchun mato sarfini hisoblash"
    },
    ru: {
      title: "Калькулятор расхода ткани и пряжи",
      sub: "Рассчитайте потребность в сырье на основе лекал и отходов кроя за секунды",
      piecesCount: "Количество изделий (шт)",
      singleWeight: "Вес одной штуки (кг)",
      cuttingWastage: "Отходы кроя (%)",
      estimatedMaterials: "Рассчитанная потребность в сырье:",
      totalFabric: "ОБЩЕЕ КОЛИЧЕСТВО ТКАНИ",
      estimatedYarn: "ОРИЕНТИРОВОЧНЫЙ РАСХОД ПРЯЖИ",
      ribanaOffer: "Предложение по рибане для воротника/манжеты:",
      compareStock: "📊 Сравнить с запасами на складе",
      stockAnalysis: "Анализ наличия на складе",
      stockEnough: "Запасов достаточно",
      stockShortage: "Недостача:",
      fabricNotFound: "Подходящая ткань на складе не найдена! Пожалуйста, сформируйте список закупок.",
      aiTitle: "Умный ИИ-консультант Shogirt ERP",
      aiSub: "Эксперт на базе Gemini 3.5-Flash",
      aiWelcome: "Здравствуйте! Я ИИ-консультант вашей текстильной ERP-системы. Я могу помочь с расчетами расхода ткани, проконсультировать по качеству пряжи, окрашиванию или технологии пошива. Выберите готовый вопрос или введите свой.",
      aiWelcomeRu: "Здравствуйте! Я ИИ-консультант вашей текстильной ERP-системы. Я могу помочь с расчетами расхода ткани, проконсультировать по качеству пряжи, окрашиванию или технологии пошива.",
      quickQueries: "Быстрые запросы:",
      customOption: "Другое (Custom)",
      inputPlaceholder: "Спросите про ткань, пряжу, технологии или расход...",
      wastageOption1: "5% (Высококачественное лекало)",
      wastageOption2: "8% (Экономный крой)",
      wastageOption3: "10% (Стандартная норма)",
      wastageOption4: "12% (Сложный / крупный принт)",
      wastageOption5: "15% (Свободный оверсайз худи)",
      yarnDetail: "Пряжа 30/1 или 40/1 для трикотажа",
      closeBtn: "Закрыть",

      // Spec identifier keys
      specTitle: "Определитель моделей и Складских кодов",
      specSub: "Анализ Артикула, Складского кода, Модели и Цвета в реальном времени",
      enterCode: "Введите код модели или Артикул:",
      selectActiveOrder: "Или выберите из активных заказов в системе:",
      searchPlaceholder: "Например: SM-OW-1111/160-TA.LMP.OE...",
      constructorTitle: "🛠️ Конструктор кодов моделей (Генератор)",
      constructorSub: "Выбирайте параметры и генерируйте соответствующие коды",
      artikulLabel: "Сгенерированный Артикул (Код модели):",
      skladLabel: "Складской код (MOS):",
      parsedDetails: "Расшифрованные характеристики (Спецификация):",
      paramBrand: "Бренд / Заказчик",
      paramType: "Тип изделия",
      paramModelNo: "Номер модели",
      paramDensity: "Плотность ткани",
      paramYarn: "Качество пряжи (Yarn Grade)",
      paramComp: "Состав ткани",
      paramColor: "Цвет",
      matchedStockTitle: "📦 Анализ складских запасов",
      matchedStockSub: "Наличие готовой продукции и сырья, подходящего под эту модель и цвет",
      noStockMatch: "На складе не найдены подходящие запасы данного цвета и модели.",
      calculateWithCode: "Рассчитать расход ткани для этой модели"
    }
  }[lang];

  const PRESETS = [
    { name: lang === 'uz' ? 'T-Shirt (Futbolka)' : 'Футболка (T-Shirt)', weight: 0.17, fabric: 'Suprem', fabricRu: 'Супрем', collarRibana: true },
    { name: lang === 'uz' ? 'Polo (Yoqali futbolka)' : 'Футболка поло (Polo)', weight: 0.23, fabric: 'Pike', fabricRu: 'Пике', collarRibana: true },
    { name: lang === 'uz' ? 'Hoodie (Xudi)' : 'Худи (Hoodie)', weight: 0.52, fabric: 'Futra 3-iplik', fabricRu: 'Футер 3-нитка', collarRibana: false },
    { name: lang === 'uz' ? 'Sport shim (Joggers)' : 'Спортивные штаны (Joggers)', weight: 0.36, fabric: 'Futra 2-iplik', fabricRu: 'Футер 2-нитка', collarRibana: false },
    { name: lang === 'uz' ? 'Bolalar kiyimi' : 'Детская одежда', weight: 0.13, fabric: 'Interlok', fabricRu: 'Интерлок', collarRibana: false }
  ];

  const QUICK_QUESTIONS = lang === 'uz' ? [
    "Futbolka uchun qanday mato ma'qul?",
    "Ne 30/1 paxta ipi nima?",
    "Futra 3-iplik nachesli kiyim qalinligi qanday?"
  ] : [
    "Какая ткань лучше для футболок?",
    "Что такое хлопковая пряжа Ne 30/1?",
    "Какова плотность футера 3-нитки с начесом?"
  ];

  // Helper parser function
  const parseCode = (input: string): ParsedModel => {
    const clean = input.trim().toUpperCase();
    
    // Check if there is an exact match in current orders
    const matchedOrder = orders.find(o => 
      o.modelCode.toUpperCase() === clean || 
      o.orderNumber.toUpperCase() === clean ||
      o.mosCode.toUpperCase() === clean
    );

    // Initial defaults
    let brand = "Stark Cotton";
    let category = lang === 'uz' ? "T-Shirt (Futbolka)" : "Футболка (T-Shirt)";
    let modelNum = "1111";
    let density = "160g";
    let yarnGrade = "Open End (OE) - Standart";
    let fabricComposition = "Suprem (100% Paxta)";
    let colorName = "Oq (Pure White)";
    let colorHex = "#FFFFFF";
    let skladCode = "MOS-539.7.1 SZ";

    if (matchedOrder) {
      brand = matchedOrder.brandName;
      category = matchedOrder.productType;
      modelNum = matchedOrder.modelCode.split('-')[2]?.split('/')[0] || "1111";
      density = matchedOrder.fabricType.match(/\d+g/) ? matchedOrder.fabricType.match(/\d+g/)?.[0] || "160g" : "160g";
      
      const lastPart = matchedOrder.modelCode.split('.').pop() || '';
      if (lastPart === 'OE') {
        yarnGrade = "Open End (OE) - Standart";
      } else if (lastPart === 'MP') {
        yarnGrade = "Carded / Ring (MP) - O'rta Sifat";
      } else {
        yarnGrade = "Combed / Penye (LMP) - Oliy Sifat";
      }
      
      fabricComposition = matchedOrder.fabricType;
      colorName = matchedOrder.color;
      colorHex = matchedOrder.colorCode;
      skladCode = matchedOrder.mosCode;
    } else {
      // Manual regex / string split parsing for synthetic inputs
      const parts = clean.split('-');
      
      // 1. Brand prefix parsing (e.g. SM -> Stark Cotton, TX -> Texnoavia, etc.)
      if (parts[0]) {
        if (parts[0] === 'SM') brand = "Stark Cotton";
        else if (parts[0] === 'TX') brand = "Texnoavia";
        else if (parts[0] === 'TM') brand = "Todomoda";
        else if (parts[0] === 'SB') brand = "Sab collection";
        else brand = `${parts[0]} Brand`;
      }

      // 2. Product Category (e.g. OW -> Hoodie, TS -> T-shirt, PL -> Polo, etc.)
      if (parts[1]) {
        if (parts[1] === 'OW') {
          category = lang === 'uz' ? "Hoodie (Xudi)" : "Худи (Hoodie)";
        } else if (parts[1] === 'TS') {
          category = lang === 'uz' ? "T-Shirt (Futbolka)" : "Футболка (T-Shirt)";
        } else if (parts[1] === 'PL') {
          category = lang === 'uz' ? "Polo (Yoqali futbolka)" : "Футболка поло (Polo)";
        } else if (parts[1] === 'JS') {
          category = lang === 'uz' ? "Sport shim (Joggers)" : "Спортивные штаны (Joggers)";
        } else {
          category = `${parts[1]} Category`;
        }
      }

      // 3. Model number & fabric weight (density) e.g. 1111/160
      if (parts[2]) {
        const subParts = parts[2].split('/');
        modelNum = subParts[0] || "1111";
        if (subParts[1]) {
          density = `${subParts[1]}g`;
        }
      }

      // 4. Client, Composition and Yarn quality
      if (parts[3]) {
        const endParts = parts[3].split('.');
        if (endParts[0] === 'TA') brand = "Texnoavia";
        else if (endParts[0] === 'SC') brand = "Stark Cotton";
        
        if (endParts[1] === 'LMP') {
          fabricComposition = "Laykra-Modal-Polyester (LMP)";
        } else {
          fabricComposition = "Suprem (100% Paxta)";
        }

        if (endParts[2] === 'OE') {
          yarnGrade = "Open End (OE) - Standart Sifat";
        } else if (endParts[2] === 'MP') {
          yarnGrade = "Carded / Ring (MP) - O'rta Sifat";
        } else {
          yarnGrade = "Penye / Combed (LMP) - Premium Sifat";
        }
      }

      // Match a warehouse/Sklad code format heuristically based on numbers
      const numSum = modelNum.split('').reduce((sum, char) => sum + (parseInt(char) || 0), 0);
      skladCode = `MOS-${400 + numSum}.${numSum % 9 + 1}.${numSum % 3 + 1} SZ`;
    }

    return {
      artikul: clean,
      skladCode,
      category,
      modelNum,
      density,
      brand,
      yarnGrade,
      fabricComposition,
      colorName,
      colorHex
    };
  };

  // Live parsed result
  const currentParsed = parseCode(modelSearchQuery);

  // Sync builder parameters to generate code string
  const handleGenerateBuilderCode = () => {
    const colorObj = COLORS[builderColorIndex];
    const generatedArtikul = `${builderBrand}-${builderType}-${builderModelId}/${builderDensity}-${builderClient}.${builderComp}.${builderYarn}`;
    setModelSearchQuery(generatedArtikul);
  };

  // Calculator Form State
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customWeight, setCustomWeight] = useState(0.17);
  const [piecesCount, setPiecesCount] = useState(1000);
  const [wastagePercent, setWastagePercent] = useState(10);
  const [isCustomWeight, setIsCustomWeight] = useState(false);

  // Check Inventory State
  const [showStockCheck, setShowStockCheck] = useState(false);

  // AI Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { 
      sender: 'ai', 
      text: calcT.aiWelcome 
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const activePreset = PRESETS[selectedPresetIndex];
  const weightPerUnit = isCustomWeight ? customWeight : activePreset.weight;

  // Estimation calculations
  const netFabricWeight = piecesCount * weightPerUnit; // kg
  const wastageWeight = netFabricWeight * (wastagePercent / 100); // kg
  const totalFabricRequired = netFabricWeight + wastageWeight; // kg

  // Ribana cuff/collar is usually 12% of total weight if collarRibana is checked
  const ribanaRequired = activePreset.collarRibana ? (totalFabricRequired * 0.12) : 0;
  const mainFabricRequired = activePreset.collarRibana ? (totalFabricRequired - ribanaRequired) : totalFabricRequired;
  
  const estimatedYarnNeeded = totalFabricRequired * 0.96; // 4% loss

  // Select preset and sync weight
  const handlePresetChange = (idx: number) => {
    setSelectedPresetIndex(idx);
    setCustomWeight(PRESETS[idx].weight);
    setIsCustomWeight(false);
    setShowStockCheck(false);
  };

  // Trigger quick estimation setup from Parsed Model Code!
  const handleApplySpecToCalculator = () => {
    // Determine which preset matches parsed category
    const catUpper = currentParsed.category.toUpperCase();
    let matchedPresetIdx = 0;
    if (catUpper.includes('POLO')) matchedPresetIdx = 1;
    else if (catUpper.includes('HOODIE') || catUpper.includes('XUDI')) matchedPresetIdx = 2;
    else if (catUpper.includes('JOGGERS') || catUpper.includes('SHIM')) matchedPresetIdx = 3;
    else if (catUpper.includes('BOLALAR') || catUpper.includes('KID')) matchedPresetIdx = 4;

    setSelectedPresetIndex(matchedPresetIdx);
    
    // Extract numerical weight from density e.g., "160g" -> 0.16kg
    const parsedDensityNum = parseInt(currentParsed.density) || 160;
    const estimatedKg = parsedDensityNum / 1000; // e.g. 160g/1000 = 0.16kg
    setCustomWeight(estimatedKg);
    setIsCustomWeight(true);
    
    // Switch to calculator tab
    setActiveTab('calculator');
  };

  // Inventory comparison check
  const performStockCheck = () => {
    setShowStockCheck(true);
  };

  // Find matching products in stock
  const findMatchingProductStock = () => {
    let targetCategory: 'fabric' | 'yarn' | 'accessory' = 'fabric';
    if (selectedPresetIndex === 2) {
      targetCategory = 'yarn';
    } else if (selectedPresetIndex === 3 || selectedPresetIndex === 4) {
      targetCategory = 'accessory';
    }

    return inventory.filter(item => item.category === targetCategory);
  };

  // Find matching items for the parsed model (Spec Identifier)
  const findSpecMatchedStock = () => {
    const matches: InventoryItem[] = [];
    const colorLower = currentParsed.colorName.toLowerCase();
    
    // 1. Search by exact color match
    inventory.forEach(item => {
      const itemNameLower = item.name.toLowerCase();
      if (itemNameLower.includes(colorLower) || (item.color && item.color.toLowerCase().includes(colorLower))) {
        matches.push(item);
      }
    });

    // 2. Search category match
    if (matches.length === 0) {
      const isWarm = currentParsed.category.includes('Hoodie') || currentParsed.category.includes('Xudi');
      inventory.forEach(item => {
        if (isWarm && item.category === 'yarn') {
          matches.push(item);
        } else if (!isWarm && item.category === 'fabric') {
          matches.push(item);
        }
      });
    }

    return matches;
  };

  // AI query handler
  const handleAskAI = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message to state
    const newChatHistory = [...chatHistory, { sender: 'user' as const, text: textToSend }];
    setChatHistory(newChatHistory);
    setAiPrompt('');
    setIsAiLoading(true);

    try {
      // Build current factory context to pass to backend Gemini API
      const context = {
        parsedModel: currentParsed,
        calculatedEstimate: {
          presetName: activePreset.name,
          pieces: piecesCount,
          totalFabricNeeded: totalFabricRequired.toFixed(1),
          wastageKg: wastageWeight.toFixed(1),
          yarnEstimated: estimatedYarnNeeded.toFixed(1)
        },
        inventoryStatus: inventory.map(i => ({ name: i.name, qty: i.quantity, unit: i.unit })),
        activeOrdersCount: orders.length,
        language: lang
      };

      const response = await fetch('/api/ai/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend, context, lang })
      });

      const data = await response.json();
      if (data.error) {
        setChatHistory(prev => [...prev, { sender: 'ai', text: lang === 'uz' ? `⚠️ Xatolik yuz berdi: ${data.error}` : `⚠️ Произошла ошибка: ${data.error}` }]);
      } else {
        setChatHistory(prev => [...prev, { sender: 'ai', text: data.text }]);
      }
    } catch (err: any) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: lang === 'uz' ? `⚠️ Serverga ulanishda xatolik yuz berdi: ${err.message}` : `⚠️ Ошибка подключения к серверу: ${err.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleAskAI(q);
  };

  return (
    <div className="space-y-6" id="calculator-and-model-specs-root">
      
      {/* NAVIGATION TABS FOR CALCULATOR SECTION */}
      <div className="flex bg-[#0f172a] p-1 rounded-2xl border border-slate-800 shadow-lg justify-start max-w-lg">
        <button
          onClick={() => setActiveTab('spec_identifier')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'spec_identifier' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>{calcT.specTitle}</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'calculator' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{lang === 'uz' ? "Mato Hisoblagich" : "Калькулятор расхода"}</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_advisor')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'ai_advisor' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>{lang === 'uz' ? "AI Maslahatchi" : "ИИ Консультант"}</span>
        </button>
      </div>

      {/* ======================= TAB 1: MODEL & CODE IDENTIFIER (ANIQLOVCHI) ======================= */}
      {activeTab === 'spec_identifier' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="spec-identifier-view">
          
          {/* LEFT PANEL: INPUT CODE AND CONSTRUCTOR (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SEARCH / INPUT CODE SECTION */}
            <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-white text-sm uppercase tracking-tight">{calcT.specTitle}</h3>
                  <p className="text-xs text-slate-400 mt-1">{calcT.specSub}</p>
                </div>
              </div>

              {/* Direct query code input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">{calcT.enterCode}</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder={calcT.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-[#06b6d4] font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Select active system order */}
              <div className="space-y-1.5 pt-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{calcT.selectActiveOrder}</label>
                <select
                  value={selectedOrderSpecId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedOrderSpecId(val);
                    if (val) {
                      setModelSearchQuery(val);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- {lang === 'uz' ? 'Tizimdagi buyurtmani tanlash' : 'Выберите заказ в системе'} --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.modelCode}>
                      {o.brandName} - {o.mosCode} ({o.modelCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* INTERACTIVE CODE CONSTRUCTOR GENERATOR */}
            <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <Sliders className="w-4.5 h-4.5 text-[#06b6d4]" />
                <div>
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">{calcT.constructorTitle}</h4>
                  <p className="text-[10px] text-slate-400">{calcT.constructorSub}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Brand */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase block">Brend Kodi</label>
                  <select 
                    value={builderBrand} 
                    onChange={(e) => { setBuilderBrand(e.target.value); setTimeout(handleGenerateBuilderCode, 50); }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    <option value="SM">SM (Stark Cotton / Smart)</option>
                    <option value="TX">TX (Texnoavia Corp)</option>
                    <option value="TM">TM (Todomoda Co)</option>
                    <option value="SB">SB (Sab Collection)</option>
                  </select>
                </div>

                {/* 2. Type */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase block">Kiyim Turi</label>
                  <select 
                    value={builderType} 
                    onChange={(e) => { setBuilderType(e.target.value); setTimeout(handleGenerateBuilderCode, 50); }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    <option value="TS">TS (Futbolka)</option>
                    <option value="PL">PL (Polo)</option>
                    <option value="OW">OW (Hoodie / Issiq)</option>
                    <option value="JS">JS (Joggers)</option>
                  </select>
                </div>

                {/* 3. Model ID */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase block">Model ID</label>
                  <input 
                    type="text" 
                    value={builderModelId}
                    onChange={(e) => { setBuilderModelId(e.target.value); setTimeout(handleGenerateBuilderCode, 50); }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-mono text-center font-bold"
                  />
                </div>

                {/* 4. Density */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase block">Mato Zichligi</label>
                  <select 
                    value={builderDensity} 
                    onChange={(e) => { setBuilderDensity(e.target.value); setTimeout(handleGenerateBuilderCode, 50); }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    <option value="150">150g (Yengil)</option>
                    <option value="160">160g (Suprem)</option>
                    <option value="200">200g (Polo / Pike)</option>
                    <option value="240">240g (2-iplik)</option>
                    <option value="320">320g (3-iplik)</option>
                  </select>
                </div>

                {/* 5. Client */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase block">Buyurtmachi</label>
                  <select 
                    value={builderClient} 
                    onChange={(e) => { setBuilderClient(e.target.value); setTimeout(handleGenerateBuilderCode, 50); }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    <option value="TA">TA (Texnoavia)</option>
                    <option value="SC">SC (Stark Cotton)</option>
                    <option value="TM">TM (Todomoda)</option>
                  </select>
                </div>

                {/* 6. Composition */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase block">Tarkibi</label>
                  <select 
                    value={builderComp} 
                    onChange={(e) => { setBuilderComp(e.target.value); setTimeout(handleGenerateBuilderCode, 50); }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    <option value="LMP">LMP (Lycra Modal Poly)</option>
                    <option value="OE">OE (100% Paxta)</option>
                  </select>
                </div>

                {/* 7. Yarn Grade */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase block">Ip Sifati</label>
                  <select 
                    value={builderYarn} 
                    onChange={(e) => { setBuilderYarn(e.target.value); setTimeout(handleGenerateBuilderCode, 50); }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-bold"
                  >
                    <option value="OE">OE (Open End)</option>
                    <option value="MP">MP (Carded Ring)</option>
                    <option value="LMP">LMP (Penye Combed)</option>
                  </select>
                </div>

                {/* 8. Color Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase block">{calcT.paramColor}</label>
                  <select 
                    value={builderColorIndex} 
                    onChange={(e) => { setBuilderColorIndex(Number(e.target.value)); setTimeout(handleGenerateBuilderCode, 50); }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {COLORS.map((c, idx) => (
                      <option key={c.name} value={idx}>{c.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateBuilderCode}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-indigo-400 font-black cursor-pointer uppercase tracking-wider"
                >
                  ⚙️ {lang === 'uz' ? "Konstruktorni yangilash va kod kiritish" : "Обновить конструктор и применить"}
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: PARSED PASSPORT & STOCK CHECK (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* VISUAL MODEL PASSPORT */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              
              {/* Subtle top color tag */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 transition-colors" 
                style={{ backgroundColor: currentParsed.colorHex }} 
              />

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">
                  📄 {lang === 'uz' ? "MODEL PASPORTI" : "ПАСПОРТ МОДЕЛИ"}
                </span>
                <span className="text-[9px] bg-indigo-600/20 text-indigo-400 font-mono font-extrabold px-2 py-0.5 rounded border border-indigo-500/30">
                  {currentParsed.skladCode.split(' ')[0]}
                </span>
              </div>

              {/* Parsed spec items */}
              <div className="space-y-3.5 mt-4 text-xs">
                
                {/* Artikul code */}
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{calcT.artikulLabel}</span>
                  <p className="text-sm font-black text-white font-mono break-all text-indigo-300">
                    {currentParsed.artikul}
                  </p>
                </div>

                {/* Sklad code */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{calcT.skladLabel}</span>
                    <p className="text-sm font-black text-[#06b6d4] font-mono">
                      {currentParsed.skladCode}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{calcT.paramModelNo}</span>
                    <p className="text-sm font-black text-white font-mono">
                      #{currentParsed.modelNum}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 space-y-2">
                  {/* Brand */}
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>{calcT.paramBrand}:</span>
                    <strong className="text-white text-right">{currentParsed.brand}</strong>
                  </div>

                  {/* Category */}
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>{calcT.paramType}:</span>
                    <strong className="text-[#fbbf24] text-right">{currentParsed.category}</strong>
                  </div>

                  {/* Fabric Comp */}
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>{calcT.paramComp}:</span>
                    <strong className="text-slate-200 text-right">{currentParsed.fabricComposition}</strong>
                  </div>

                  {/* Density */}
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>{calcT.paramDensity}:</span>
                    <strong className="text-sky-400 text-right">{currentParsed.density}</strong>
                  </div>

                  {/* Yarn Grade */}
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>{calcT.paramYarn}:</span>
                    <strong className="text-emerald-400 text-right">{currentParsed.yarnGrade}</strong>
                  </div>

                  {/* Color */}
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>{calcT.paramColor}:</span>
                    <div className="flex items-center space-x-1.5 justify-end">
                      <span className="w-2.5 h-2.5 rounded-full border border-slate-600 block" style={{ backgroundColor: currentParsed.colorHex }} />
                      <strong className="text-white">{currentParsed.colorName.split(' ')[0]}</strong>
                    </div>
                  </div>
                </div>

                {/* Calculate using spec button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplySpecToCalculator}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center space-x-2 shadow-md transition-all"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{calcT.calculateWithCode}</span>
                  </button>
                </div>

              </div>

            </div>

            {/* LIVE INVENTORY MATCHING ANALYSIS */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  {calcT.matchedStockTitle}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{calcT.matchedStockSub}</p>
              </div>

              <div className="space-y-2">
                {(() => {
                  const matches = findSpecMatchedStock();
                  if (matches.length === 0) {
                    return (
                      <p className="text-slate-400 text-xs italic p-3 bg-slate-900 rounded-xl text-center border border-slate-800">
                        {calcT.noStockMatch}
                      </p>
                    );
                  }

                  return matches.map(item => (
                    <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block truncate max-w-[150px]">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono capitalize">Cat: {item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-400 block">{item.quantity} {item.unit}</span>
                        <span className="text-[8px] text-slate-400">Min: {item.minThreshold}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================= TAB 2: EXSITING MATO SARFI KALKULYATORI ======================= */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" id="material-calculator-panel">
          
          {/* CALCULATOR INPUT FORM */}
          <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between" id="material-calculator-section">
            <div>
              <div className="flex items-center space-x-2.5 pb-4 border-b border-gray-100">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-tight">{calcT.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{calcT.sub}</p>
                </div>
              </div>

              <div className="space-y-4 mt-5">
                {/* 1. Select Preset */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.selectProduct}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESETS.map((p, idx) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handlePresetChange(idx)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                          selectedPresetIndex === idx && !isCustomWeight
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {p.name.split(' (')[0]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomWeight(true);
                        setShowStockCheck(false);
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                        isCustomWeight
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {calcT.customOption}
                    </button>
                  </div>
                </div>

                {/* 2. Numeric inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{calcT.piecesCount} *</label>
                    <input 
                      type="number"
                      min="1"
                      value={piecesCount}
                      onChange={(e) => {
                        setPiecesCount(parseInt(e.target.value) || 0);
                        setShowStockCheck(false);
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{calcT.singleWeight}</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      disabled={!isCustomWeight}
                      value={weightPerUnit}
                      onChange={(e) => {
                        setCustomWeight(parseFloat(e.target.value) || 0);
                        setShowStockCheck(false);
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-bold disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{calcT.cuttingWastage}</label>
                    <select 
                      value={wastagePercent}
                      onChange={(e) => {
                        setWastagePercent(parseInt(e.target.value) || 0);
                        setShowStockCheck(false);
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={5}>{calcT.wastageOption1}</option>
                      <option value={8}>{calcT.wastageOption2}</option>
                      <option value={10}>{calcT.wastageOption3}</option>
                      <option value={12}>{calcT.wastageOption4}</option>
                      <option value={15}>{calcT.wastageOption5}</option>
                    </select>
                  </div>
                </div>

                {/* 3. Output estimation cards */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3 mt-4" id="calculator-results-panel">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{calcT.estimatedMaterials}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{calcT.totalFabric}</p>
                      <h3 className="text-xl font-black text-indigo-700 mt-1">{totalFabricRequired.toFixed(1)} {t.kg}</h3>
                      <span className="text-[9px] text-gray-400 font-medium">Brak/Wastage: {wastageWeight.toFixed(1)} {t.kg} ({wastagePercent}%)</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{calcT.estimatedYarn}</p>
                      <h3 className="text-xl font-black text-emerald-700 mt-1">{estimatedYarnNeeded.toFixed(1)} {t.kg}</h3>
                      <span className="text-[9px] text-gray-400 font-medium">{calcT.yarnDetail}</span>
                    </div>
                  </div>

                  {activePreset.collarRibana && (
                    <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50 text-[11px] text-amber-800 flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span>{calcT.ribanaOffer}</span>
                      <strong className="text-amber-950">{ribanaRequired.toFixed(1)} kg ribana + {(mainFabricRequired).toFixed(1)} kg {lang === 'uz' ? activePreset.fabric : activePreset.fabricRu}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Inventory comparison section */}
            <div className="mt-6 pt-4 border-t border-gray-150">
              {!showStockCheck ? (
                <button
                  onClick={performStockCheck}
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-700 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                >
                  {calcT.compareStock}
                </button>
              ) : (
                <div className="space-y-3 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 animate-fade-in" id="stock-check-result">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider flex items-center">
                      <Package className="w-4 h-4 mr-1 text-indigo-600" /> {calcT.stockAnalysis}
                    </h4>
                    <button onClick={() => setShowStockCheck(false)} className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">{calcT.closeBtn}</button>
                  </div>

                  {(() => {
                    const stockMatches = findMatchingProductStock();
                    if (stockMatches.length === 0) {
                      return (
                        <div className="text-xs text-rose-700 flex items-start gap-1.5 p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{lang === 'uz' ? 'Omborda ushbu toifadagi tayyor mahsulotlar topilmadi!' : 'На складе не найдены готовые изделия данной категории!'}</span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {stockMatches.map(stockItem => {
                          const shortage = piecesCount - stockItem.quantity;
                          const hasEnough = shortage <= 0;
                          return (
                            <div key={stockItem.id} className="text-xs bg-white p-3 rounded-lg border border-gray-150 flex items-center justify-between shadow-xs">
                              <div className="space-y-0.5">
                                <span className="font-bold text-gray-800">{stockItem.name}</span>
                                <p className="text-[10px] text-gray-400">
                                  {lang === 'uz' ? 'Kerak:' : 'Нужно:'} {piecesCount} {t.pcs || 'dona'} | {lang === 'uz' ? 'Omborda mavjud:' : 'На складе:'} {stockItem.quantity} {t.pcs || 'dona'}
                                </p>
                              </div>
                               
                              <div>
                                {hasEnough ? (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {calcT.stockEnough}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-md flex items-center">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {calcT.stockShortage} {Math.abs(shortage)} {t.pcs || 'dona'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* QUICK ADVICE FOR MATERIAL CONSUMPTION */}
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-xs text-slate-300">
            <h4 className="font-extrabold text-white text-sm uppercase tracking-tight flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              {lang === 'uz' ? "Mato Sarfi Me'yorlari & Yo'riqnomalar" : "Нормативы расхода сырья"}
            </h4>

            <p className="text-slate-400 text-xs">
              {lang === 'uz' 
                ? "Trikotaj fabrikalarida mato sarfi andoza murakkabligi va xodim malakasiga bog'liq. Standart yo'riqnomalar:" 
                : "Расход ткани на трикотажном производстве зависит от сложности лекал и квалификации сотрудников. Стандарты:"}
            </p>

            <div className="space-y-3 pt-2">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <strong className="text-[#fbbf24] block mb-0.5">Suprem (Futbolkalar uchun)</strong>
                <p className="text-slate-400 text-[11px]">Bitta kiyim uchun 150-180g (0.15 - 0.18 kg) sarflanadi. Bichuv chiqindisi odatda 8-10% dan oshmasligi lozim.</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <strong className="text-emerald-400 block mb-0.5">Pike / Lakos (Polo uchun)</strong>
                <p className="text-slate-400 text-[11px]">Polo yoqalari va manzhetlar uchun maxsus Ribana talab etiladi, bu kiyim umumiy og'irligining taxminan 12% ini tashkil qiladi.</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <strong className="text-sky-400 block mb-0.5">Futra 3-iplik (Xudi/Keng sviter)</strong>
                <p className="text-slate-400 text-[11px]">Og'ir kiyim segmenti, bitta xudi uchun 450g dan 600g gacha mato sarflanadi. Oversayz bichimlar uchun chiqindi foizini 12-15% qilib belgilash tavsiya etiladi.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================= TAB 3: SMART AI TEXTILE TECHNOLOGY ADVISOR ======================= */}
      {activeTab === 'ai_advisor' && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between h-[580px] animate-fade-in" id="ai-advisor-chat-section">
          
          {/* Chat header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-100">{calcT.aiTitle}</h3>
                <p className="text-[10px] text-slate-400">{calcT.aiSub}</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-700 uppercase">
              {lang === 'uz' ? "O'zbekcha AI" : "Русский ИИ"}
            </span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto space-y-3.5 my-4 pr-1 text-xs" id="chat-messages-container">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-gray-200 rounded-bl-none border border-slate-700 shadow-xs'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-gray-400 border border-slate-700 rounded-xl p-3 rounded-bl-none flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span className="text-[11px] italic font-semibold">{lang === 'uz' ? 'Tahlil qilinmoqda...' : 'Анализируем...'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggestion Quick Chips */}
          <div className="space-y-1.5 pb-3">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{calcT.quickQueries}</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map(chip => (
                <button
                  key={chip}
                  disabled={isAiLoading}
                  onClick={() => handleQuickQuestion(chip)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold px-2.5 py-1 rounded-md border border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                >
                  💡 {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAI(aiPrompt);
            }}
            className="flex items-center space-x-2 border-t border-slate-800 pt-3"
          >
            <input 
              type="text"
              disabled={isAiLoading}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={calcT.inputPlaceholder}
              className="flex-1 bg-slate-800 text-white border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs focus:outline-hidden focus:border-indigo-500 placeholder-slate-500 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isAiLoading || !aiPrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
