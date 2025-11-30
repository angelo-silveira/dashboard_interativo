import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateMockData, filterData, parseUploadedFile } from './services/dataService';
import { dbService } from './services/databaseService';
import { SaleRecord, Language, Theme, Currency } from './types';
import KPICards from './components/KPICards';
import ChartsSection from './components/ChartsSection';
import DataGrid from './components/DataGrid';
import ExportMenu from './components/ExportMenu';
import { LayoutDashboard, Table, Filter, RefreshCw, BarChart2, Upload, Settings, Moon, Sun, Share2 } from 'lucide-react';
import { getTranslation, getDataTranslation } from './utils/translations';

const App: React.FC = () => {
  // App Data State
  const [rawData, setRawData] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingFile, setProcessingFile] = useState<boolean>(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'charts' | 'data'>('charts');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Settings State
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('light');
  
  // Currency State
  const [currency, setCurrency] = useState<Currency>('BRL');
  
  // Rates (Base is BRL)
  const [rates, setRates] = useState({
    USD: 5.75,
    ARS: 215.00, // Approx 1 BRL = 215 ARS
    PYG: 1400.00, // Approx 1 BRL = 1400 PYG
    UYU: 7.60 // Approx 1 BRL = 7.6 UYU
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Translation helper
  const t = getTranslation(language);

  // 1. Initial Data Load on Mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-switch currency on language change
  useEffect(() => {
    if (language === 'pt') setCurrency('BRL');
    if (language === 'en') setCurrency('USD');
    if (language === 'es') {
      if (currency !== 'ARS' && currency !== 'PYG' && currency !== 'UYU') {
         setCurrency('ARS');
      }
    }
  }, [language]);

  // Load Data Logic (DB or Mock)
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Try loading from "Database" first (Local persistence)
      const dbData = await dbService.getDashboardData();
      
      if (dbData && dbData.length > 0) {
        setRawData(dbData);
      } else {
        // Fallback to Mock if DB empty
        setRawData(generateMockData(500));
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      const newData = generateMockData(500);
      setRawData(newData);
      setLoading(false);
    }, 600);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingFile(true);
    try {
      const data = await parseUploadedFile(file);
      setRawData(data);
      // Reset filters
      setSelectedRegions([]);
      setSelectedCategories([]);
      
      // Save to "Database" for persistence
      await dbService.saveDashboardData(data);
      
    } catch (error) {
      console.error("Upload failed", error);
      alert(t.errorFile);
    } finally {
      setProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Derived Filters Lists
  const uniqueRegions = useMemo(() => Array.from(new Set(rawData.map(d => d.region))).filter(Boolean).sort(), [rawData]);
  const uniqueCategories = useMemo(() => Array.from(new Set(rawData.map(d => d.category))).filter(Boolean).sort(), [rawData]);

  // Filter Data Logic
  const filteredData = useMemo(() => {
    return filterData(rawData, selectedRegions, selectedCategories);
  }, [rawData, selectedRegions, selectedCategories]);

  // Calculate Conversion Factor (Multiplier)
  const conversionFactor = useMemo(() => {
    if (currency === 'BRL') return 1;
    if (currency === 'USD') return 1 / rates.USD;
    return rates[currency]; 
  }, [currency, rates]);

  // Aggregated Metrics
  const metrics = useMemo(() => {
    return {
      totalSales: filteredData.reduce((sum, item) => sum + item.sales, 0),
      totalQuantity: filteredData.reduce((sum, item) => sum + item.quantity, 0),
      totalProfit: filteredData.reduce((sum, item) => sum + item.profit, 0),
      avgTicket: filteredData.length > 0 
        ? filteredData.reduce((sum, item) => sum + item.sales, 0) / filteredData.length 
        : 0
    };
  }, [filteredData]);

  // Toggle Selection Helper
  const toggleSelection = (item: string, currentList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(i => i !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  // --- RENDER LOGIC ---

  return (
    <div className={`${theme}`}>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        
        {/* Sidebar / Controls */}
        <aside className="w-full md:w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex-shrink-0 z-10 transition-colors duration-300">
          <div className="p-6 h-full flex flex-col">
            
            {/* Header with Title and Theme Toggle */}
            <div className="flex items-center justify-between mb-6 gap-2">
              <div className="flex items-center gap-3">
                 <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30 shrink-0">
                   <BarChart2 className="text-white w-6 h-6" />
                 </div>
                 <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight whitespace-pre-line">{t.title}</h1>
              </div>
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                title={theme === 'light' ? t.dark : t.light}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-8">
              <button 
                onClick={refreshData}
                disabled={loading || processingFile}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 py-2.5 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? t.loading : t.refresh}
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".csv, .xlsx, .xls"
                  className="hidden" 
                />
                <button 
                  onClick={handleUploadClick}
                  disabled={processingFile}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 py-2.5 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  <Upload className={`w-4 h-4 ${processingFile ? 'animate-bounce' : ''}`} />
                  {processingFile ? t.processing : t.upload}
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-1">{t.uploadHint}</p>
              </div>

               <button 
                  onClick={() => setShowExportMenu(true)}
                  className="w-full flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 py-2.5 px-4 rounded-lg transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  {t.shareMenu}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              
              {/* Region Filter */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Filter className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.filterRegion}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueRegions.map(region => (
                    <button
                      key={region}
                      onClick={() => toggleSelection(region, selectedRegions, setSelectedRegions)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors border ${
                        selectedRegions.includes(region) 
                          ? 'bg-slate-800 text-white border-slate-800 dark:bg-blue-600 dark:border-blue-600' 
                          : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {getDataTranslation(region, language)}
                    </button>
                  ))}
                  {selectedRegions.length === 0 && <span className="text-xs text-gray-400 italic">{t.allRegions}</span>}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                 <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Filter className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.filterCategory}</span>
                </div>
                <div className="space-y-2">
                  {uniqueCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                         selectedCategories.includes(cat) 
                         ? 'bg-blue-500 border-blue-500' 
                         : 'border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700'
                      }`}>
                        {selectedCategories.includes(cat) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleSelection(cat, selectedCategories, setSelectedCategories)}
                      />
                      <span className={`text-sm ${selectedCategories.includes(cat) ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                        {getDataTranslation(cat, language)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
            
            {/* Settings Area */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
               <div className="flex items-center gap-2 mb-4 text-gray-400">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.settings}</span>
               </div>
               
               {/* Language Toggle */}
               <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-3">
                  <button 
                    onClick={() => setLanguage('pt')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                      language === 'pt' ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    🇧🇷 PT
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                      language === 'en' ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    🇺🇸 EN
                  </button>
                  <button 
                    onClick={() => setLanguage('es')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                      language === 'es' ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    🇪🇸 ES
                  </button>
               </div>

               {/* Currency & Rates Section */}
               <div className="mb-3 bg-gray-50 dark:bg-slate-700/30 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2">{t.exchangeRateTitle}</label>
                  
                  {/* Currency Selector */}
                  <div className="mb-2">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{t.currency}</div>
                    <select 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="w-full bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-gray-800 dark:text-white text-xs rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="BRL">🇧🇷 Real (BRL)</option>
                      <option value="USD">🇺🇸 Dollar (USD)</option>
                      <option value="ARS">🇦🇷 Peso Arg (ARS)</option>
                      <option value="PYG">🇵🇾 Guarani (PYG)</option>
                      <option value="UYU">🇺🇾 Peso Uru (UYU)</option>
                    </select>
                  </div>

                  {/* Dynamic Rate Input (Hidden if BRL) */}
                  {currency !== 'BRL' && (
                    <div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        {currency === 'USD' ? t.rateLabelUSD : `${t.rateLabelOther} ${currency}`}
                      </div>
                      <div className="flex items-center bg-white dark:bg-slate-600 rounded overflow-hidden border border-gray-200 dark:border-slate-500">
                        <span className="pl-2 text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          value={rates[currency]}
                          onChange={(e) => setRates(prev => ({...prev, [currency]: Math.max(0.0001, parseFloat(e.target.value) || 0) }))}
                          step={currency === 'USD' || currency === 'UYU' ? "0.01" : "1.00"}
                          className="w-full bg-transparent border-none focus:ring-0 text-xs py-1.5 px-1 text-gray-800 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  )}
               </div>

            </div>

            <div className="mt-4 pt-4 text-xs text-gray-400 border-t border-gray-100 dark:border-slate-700">
               {t.lastUpdated}: {new Date().toLocaleTimeString(language === 'pt' ? 'pt-BR' : (language === 'es' ? 'es-ES' : 'en-US'))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-screen custom-scrollbar" ref={contentRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
            
            {loading && !rawData.length ? (
              <div className="h-[80vh] w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">{t.loading}</p>
                </div>
              </div>
            ) : (
              <>
                <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">{t.execOverview}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">{t.execSubtitle}</p>
                  </div>
                  
                  {/* Tabs */}
                  <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 flex gap-1 shadow-sm transition-colors">
                    <button
                      onClick={() => setActiveTab('charts')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'charts' 
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t.tabVisual}
                    </button>
                    <button
                      onClick={() => setActiveTab('data')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'data' 
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Table className="w-4 h-4" />
                      {t.tabData}
                    </button>
                  </div>
                </header>

                <KPICards 
                  totalSales={metrics.totalSales}
                  totalQuantity={metrics.totalQuantity}
                  avgTicket={metrics.avgTicket}
                  totalProfit={metrics.totalProfit}
                  lang={language}
                  currency={currency}
                  conversionFactor={conversionFactor}
                />

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {activeTab === 'charts' ? (
                    <ChartsSection 
                      data={filteredData} 
                      lang={language} 
                      theme={theme} 
                      currency={currency}
                      conversionFactor={conversionFactor}
                    />
                  ) : (
                    <DataGrid 
                      data={filteredData} 
                      lang={language} 
                      theme={theme} 
                      currency={currency}
                      conversionFactor={conversionFactor}
                    />
                  )}
                </div>
              </>
            )}
            
          </div>
        </main>
      </div>
      
      {/* Export Modal */}
      {showExportMenu && (
        <ExportMenu 
          targetRef={contentRef} 
          lang={language} 
          onClose={() => setShowExportMenu(false)} 
        />
      )}
    </div>
  );
};

export default App;