import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { SaleRecord, Language, Theme, Currency } from '../types';
import { formatCurrency } from '../services/dataService';
import { getTranslation, getDataTranslation } from '../utils/translations';
import { BarChart2, PieChart as PieIcon, Activity, TrendingUp, Hexagon } from 'lucide-react';

interface ChartsSectionProps {
  data: SaleRecord[];
  lang: Language;
  theme: Theme;
  currency: Currency;
  conversionFactor: number;
}

// Consistent Color Palette
const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#ec4899', '#06b6d4'];

const ChartsSection: React.FC<ChartsSectionProps> = ({ data, lang, theme, currency, conversionFactor }) => {
  const t = getTranslation(lang);
  
  // Resolve Locale
  let locale = 'en-US';
  if (currency === 'BRL') locale = 'pt-BR';
  if (currency === 'ARS') locale = 'es-AR';
  if (currency === 'PYG') locale = 'es-PY';
  if (currency === 'UYU') locale = 'es-UY';
  
  // Chart Type States
  const [categoryChartType, setCategoryChartType] = useState<'bar' | 'pie' | 'donut'>('bar');
  const [trendChartType, setTrendChartType] = useState<'line' | 'area'>('area');
  
  // Dynamic colors based on theme
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // slate-400 : slate-500
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipText = theme === 'dark' ? '#f1f5f9' : '#1e293b';

  // --- DATA PREPARATION ---

  // 1. Sales by Category
  const categoryData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.sales;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ 
        name: getDataTranslation(name, lang), 
        originalName: name,
        value: value * conversionFactor 
      }))
      .sort((a, b) => b.value - a.value); // Sort for better pie chart
  }, [data, lang, conversionFactor]);

  // 2. Sales over Time
  const timeData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      const key = curr.date.toISOString().split('T')[0]; 
      acc[key] = (acc[key] || 0) + curr.sales;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, sales]) => ({ date, sales: sales * conversionFactor }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, conversionFactor]);

  // 3. Regional Performance (Radar)
  const regionData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      acc[curr.region] = (acc[curr.region] || 0) + curr.sales;
      return acc;
    }, {} as Record<string, number>);
    
    // Normalize for Radar if needed, but here we just show total value
    return Object.entries(grouped).map(([name, value]) => ({
      subject: getDataTranslation(name, lang),
      A: value * conversionFactor,
      fullMark: Math.max(...Object.values(grouped)) * conversionFactor
    }));
  }, [data, lang, conversionFactor]);

  // 4. Scatter Data
  const scatterData = useMemo(() => {
    return data.map(item => ({
      x: item.sales * conversionFactor,
      y: item.profit * conversionFactor,
      z: item.quantity,
      category: getDataTranslation(item.category, lang),
      region: getDataTranslation(item.region, lang)
    }));
  }, [data, lang, conversionFactor]);


  // --- HELPERS ---

  const formatValue = (val: number) => {
     if (val >= 1000000) return `${(val/1000000).toFixed(1)}M`;
     if (val >= 1000) return `${(val/1000).toFixed(0)}k`;
     return val.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} className="p-3 border shadow-lg rounded-lg text-sm z-50">
          <p className="font-bold mb-1">{label || payload[0].name}</p>
          {payload.map((p: any, idx: number) => (
             <p key={idx} style={{ color: p.color || p.fill }}>
               {p.name}: {typeof p.value === 'number' ? formatCurrency(p.value, currency, locale) : p.value}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartToggle = ({ options, active, onChange }: { options: {id: string, label: string, icon: React.ReactNode}[], active: string, onChange: (v: any) => void }) => (
    <div className="flex bg-gray-100 dark:bg-slate-700/50 p-1 rounded-lg">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            active === opt.id 
              ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          title={opt.label}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* ROW 1: CATEGORY & TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: SALES BY CATEGORY */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t.chartRevCat}</h3>
            <ChartToggle 
              active={categoryChartType}
              onChange={setCategoryChartType}
              options={[
                { id: 'bar', label: t.typeBar, icon: <BarChart2 className="w-3.5 h-3.5" /> },
                { id: 'pie', label: t.typePie, icon: <PieIcon className="w-3.5 h-3.5" /> },
                { id: 'donut', label: t.typeDonut, icon: <Activity className="w-3.5 h-3.5" /> },
              ]}
            />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {categoryChartType === 'bar' ? (
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: textColor, fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: textColor, fontSize: 12}} tickFormatter={formatValue} />
                  <Tooltip cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9'}} content={<CustomTooltip />} />
                  <Bar dataKey="value" name={t.colSales} radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={categoryChartType === 'donut' ? 60 : 0}
                    outerRadius={100}
                    paddingAngle={categoryChartType === 'donut' ? 5 : 0}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: SALES TREND */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t.chartTrend}</h3>
             <ChartToggle 
              active={trendChartType}
              onChange={setTrendChartType}
              options={[
                { id: 'line', label: t.typeLine, icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { id: 'area', label: t.typeArea, icon: <Activity className="w-3.5 h-3.5" /> },
              ]}
            />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {trendChartType === 'area' ? (
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: textColor, fontSize: 12}} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(locale, {month:'short', day:'numeric'})}
                    minTickGap={40}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: textColor, fontSize: 12}} tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" name={t.colSales} stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              ) : (
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: textColor, fontSize: 12}} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(locale, {month:'short', day:'numeric'})}
                    minTickGap={40}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: textColor, fontSize: 12}} tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    name={t.colSales} 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: SCATTER & RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 3: SCATTER (Takes up 2/3) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t.chartScatter}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t.chartScatterSub}</p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name={t.colSales} 
                  unit="" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: textColor, fontSize: 12}}
                  tickFormatter={formatValue}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name={t.colProfit} 
                  unit="" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: textColor, fontSize: 12}}
                  tickFormatter={formatValue}
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name={t.colQty} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                   if (active && payload && payload.length) {
                     const data = payload[0].payload;
                     return (
                       <div style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} className="p-3 border shadow-lg rounded-lg text-xs">
                          <p className="font-bold mb-1">{data.category} - {data.region}</p>
                          <p>{t.colSales}: {formatCurrency(data.x, currency, locale)}</p>
                          <p>{t.colProfit}: {formatCurrency(data.y, currency, locale)}</p>
                          <p>{t.colQty}: {data.z}</p>
                       </div>
                     );
                   }
                   return null;
                }} />
                <Scatter name="Transactions" data={scatterData} fill="#f97316" fillOpacity={0.6} stroke="#f97316" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: REGION RADAR (New!) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t.chartRegion}</h3>
            <Hexagon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t.typeRadar}</p>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={regionData}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: textColor, fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: textColor, fontSize: 10 }} stroke="transparent" />
                <Radar
                  name={t.colSales}
                  dataKey="A"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.5}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} className="p-2 border shadow rounded text-xs">
                          <p className="font-bold">{payload[0].payload.subject}</p>
                          <p>{t.colSales}: {formatCurrency(payload[0].value as number, currency, locale)}</p>
                        </div>
                      )
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChartsSection;
