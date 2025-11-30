import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { formatCurrency } from '../services/dataService';
import { Language, Currency } from '../types';
import { getTranslation } from '../utils/translations';

interface KPICardsProps {
  totalSales: number;
  totalQuantity: number;
  avgTicket: number;
  totalProfit: number;
  lang: Language;
  currency: Currency;
  conversionFactor: number;
}

const KPICards: React.FC<KPICardsProps> = ({ 
  totalSales, 
  totalQuantity, 
  avgTicket, 
  totalProfit, 
  lang,
  currency,
  conversionFactor 
}) => {
  const t = getTranslation(lang);
  
  // Resolve Locale based on Currency for proper formatting
  let locale = 'en-US';
  if (currency === 'BRL') locale = 'pt-BR';
  if (currency === 'ARS') locale = 'es-AR';
  if (currency === 'PYG') locale = 'es-PY';
  if (currency === 'UYU') locale = 'es-UY';

  // Math logic: If conversionFactor > 1, it usually means Multiplier (for weaker currencies vs BRL)
  // If conversionFactor < 1, it might be Division.
  // HOWEVER, the logic from App.tsx calculates the FINAL multiplier.
  // We just multiply the base BRL value by the factor.
  
  const displayValue = (val: number) => formatCurrency(val * conversionFactor, currency, locale);

  const cards = [
    {
      title: t.kpiRevenue,
      value: displayValue(totalSales),
      icon: <DollarSign className="w-6 h-6 text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: t.kpiItems,
      value: totalQuantity.toLocaleString(locale),
      icon: <Package className="w-6 h-6 text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: t.kpiTicket,
      value: displayValue(avgTicket),
      icon: <ShoppingCart className="w-6 h-6 text-orange-500" />,
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800'
    },
    {
      title: t.kpiProfit,
      value: displayValue(totalProfit),
      icon: <TrendingUp className={`w-6 h-6 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />,
      bg: totalProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
      border: totalProfit >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className={`p-6 rounded-xl border ${card.border} ${card.bg} shadow-sm transition-all hover:shadow-md`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl font-bold mt-2 text-gray-800 dark:text-gray-100">{card.value}</h3>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
