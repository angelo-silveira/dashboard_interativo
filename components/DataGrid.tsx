import React, { useState, useMemo, useEffect } from 'react';
import { Download, ArrowUpDown, ArrowUp, ArrowDown, ArrowUpCircle } from 'lucide-react';
import { SaleRecord, Language, Theme, Currency } from '../types';
import { formatDate, formatCurrency } from '../services/dataService';
import { getTranslation, getDataTranslation } from '../utils/translations';

interface DataGridProps {
  data: SaleRecord[];
  lang: Language;
  theme: Theme;
  currency: Currency;
  conversionFactor: number;
}

const DataGrid: React.FC<DataGridProps> = ({ data, lang, theme, currency, conversionFactor }) => {
  const t = getTranslation(lang);
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState<{ key: keyof SaleRecord; direction: 'asc' | 'desc' } | null>(null);

  // State for Date Filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Scroll to Top visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll for Floating Action Button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 200) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    const tableContainer = document.getElementById('table-container');
    if (tableContainer) {
      tableContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Resolve Locale
  let locale = 'en-US';
  if (currency === 'BRL') locale = 'pt-BR';
  if (currency === 'ARS') locale = 'es-AR';
  if (currency === 'PYG') locale = 'es-PY';
  if (currency === 'UYU') locale = 'es-UY';

  // Helper to calculate color intensity for "heatmap" effect
  const getBackgroundColor = (value: number, min: number, max: number, type: 'positive' | 'diverging') => {
    // Dark mode opacity adjustments
    const baseOpacity = theme === 'dark' ? 0.3 : 0.1;
    const maxOpacity = theme === 'dark' ? 0.7 : 0.5;

    if (type === 'positive') {
      const percentage = (value - min) / (max - min);
      // Light blue to Deep Blue
      return `rgba(59, 130, 246, ${baseOpacity + percentage * (maxOpacity - baseOpacity)})`; 
    } else {
      // Diverging for profit (Red to Green)
      if (value < 0) return `rgba(239, 68, 68, ${baseOpacity + 0.1})`;
      const percentage = value / max;
      return `rgba(34, 197, 94, ${baseOpacity + percentage * (maxOpacity - baseOpacity)})`;
    }
  };

  // Sorting Logic
  const handleSort = (key: keyof SaleRecord) => {
    let direction: 'asc' | 'desc' = 'asc';

    // Smart default: Numbers and Dates often wanted High-to-Low first
    if (!sortConfig || sortConfig.key !== key) {
        if (['sales', 'profit', 'quantity', 'date'].includes(key)) {
            direction = 'desc';
        } else {
            direction = 'asc';
        }
    } else {
        // Toggle if same key
        direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  // 1. Filter Data by Date Range (if selected)
  const filteredByDateData = useMemo(() => {
    if (!startDate && !endDate) return data;

    // Convert inputs to midnight timestamps for comparison
    const startTs = startDate ? new Date(startDate).setHours(0,0,0,0) : -Infinity;
    const endTs = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;

    return data.filter(item => {
      const itemTs = new Date(item.date).getTime();
      return itemTs >= startTs && itemTs <= endTs;
    });
  }, [data, startDate, endDate]);

  // 2. Sort the Filtered Data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredByDateData;

    return [...filteredByDateData].sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      // Sort by the localized string for Category and Region
      if (sortConfig.key === 'category' || sortConfig.key === 'region') {
          aValue = getDataTranslation(aValue, lang);
          bValue = getDataTranslation(bValue, lang);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredByDateData, sortConfig, lang]);

  const SortIcon = ({ columnKey }: { columnKey: keyof SaleRecord }) => {
      if (sortConfig?.key !== columnKey) {
          return <ArrowUpDown className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
      }
      return sortConfig.direction === 'asc' 
        ? <ArrowUp className="w-3 h-3 text-blue-500" /> 
        : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  // Min/Max for Heatmap logic (based on filtered data)
  const maxSales = Math.max(...sortedData.map(d => d.sales), 0);
  const minSales = Math.min(...sortedData.map(d => d.sales), 0);
  const maxProfit = Math.max(...sortedData.map(d => d.profit), 0);
  
  const handleExportCSV = () => {
    const headers = [t.colDate, t.colCat, t.colProd, t.colReg, t.colSales, t.colQty, t.colProfit];
    // Export the sorted data if sorting is active
    const rows = sortedData.map(row => [
      formatDate(row.date, locale),
      getDataTranslation(row.category, lang),
      row.product,
      getDataTranslation(row.region, lang),
      (row.sales * conversionFactor).toFixed(2),
      row.quantity,
      (row.profit * conversionFactor).toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dashboard_export_${currency}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors relative">
      <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
             <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t.gridTitle}</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400">{t.gridSub}</p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {t.export}
          </button>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-wrap items-end gap-3 bg-gray-50 dark:bg-slate-700/30 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.dateStart}</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.dateEnd}</label>
            <input 
              type="date" 
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={clearDateFilter}
              className="mb-[1px] px-3 py-1.5 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              {t.clearFilter}
            </button>
          )}
          
          <div className="flex-1 text-right text-xs text-gray-400 self-center">
            {sortedData.length} records found
          </div>
        </div>
      </div>
      
      {/* Scrollable Container with Sticky Header */}
      <div 
        id="table-container"
        className="overflow-auto max-h-[600px] relative scroll-smooth"
        onScroll={handleScroll}
      >
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 relative border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold uppercase tracking-wider">
            <tr>
              <th 
                className="sticky top-0 z-20 px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group select-none bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                    {t.colDate}
                    <SortIcon columnKey="date" />
                </div>
              </th>
              <th 
                className="sticky top-0 z-20 px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group select-none bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
                onClick={() => handleSort('category')}
              >
                 <div className="flex items-center gap-2">
                    {t.colCat}
                    <SortIcon columnKey="category" />
                </div>
              </th>
              <th 
                className="sticky top-0 z-20 px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group select-none bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
                onClick={() => handleSort('region')}
              >
                <div className="flex items-center gap-2">
                    {t.colReg}
                    <SortIcon columnKey="region" />
                </div>
              </th>
              <th 
                className="sticky top-0 z-20 px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group select-none bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
                onClick={() => handleSort('product')}
              >
                <div className="flex items-center gap-2">
                    {t.colProd}
                    <SortIcon columnKey="product" />
                </div>
              </th>
              <th 
                className="sticky top-0 z-20 px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group select-none bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
                onClick={() => handleSort('sales')}
              >
                <div className="flex items-center justify-end gap-2">
                    {t.colSales}
                    <SortIcon columnKey="sales" />
                </div>
              </th>
              <th 
                className="sticky top-0 z-20 px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group select-none bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center justify-end gap-2">
                    {t.colQty}
                    <SortIcon columnKey="quantity" />
                </div>
              </th>
              <th 
                className="sticky top-0 z-20 px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group select-none bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
                onClick={() => handleSort('profit')}
              >
                <div className="flex items-center justify-end gap-2">
                    {t.colProfit}
                    <SortIcon columnKey="profit" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {sortedData.length > 0 ? (
              sortedData.slice(0, 100).map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap">{formatDate(row.date, locale)}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                      {getDataTranslation(row.category, lang)}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">{getDataTranslation(row.region, lang)}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{row.product}</td>
                  <td 
                    className="px-6 py-3 text-right font-medium text-gray-900 dark:text-gray-100"
                    style={{ backgroundColor: getBackgroundColor(row.sales, minSales, maxSales, 'positive') }}
                  >
                    {formatCurrency(row.sales * conversionFactor, currency, locale)}
                  </td>
                  <td className="px-6 py-3 text-right">{row.quantity}</td>
                  <td 
                    className="px-6 py-3 text-right font-medium"
                    style={{ backgroundColor: getBackgroundColor(row.profit, 0, maxProfit, 'diverging') }}
                  >
                    <span className={row.profit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                      {formatCurrency(row.profit * conversionFactor, currency, locale)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
               <tr>
                 <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                   No data found for the selected range.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
        {sortedData.length > 100 && (
          <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
            Showing first 100 rows of {sortedData.length} records. Export to see all.
          </div>
        )}
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all animate-in fade-in zoom-in duration-300 z-20"
          title={t.back}
        >
          <ArrowUpCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default DataGrid;