import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, Activity } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { Language } from '../types';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  lang: Language;
  onLanguageChange: (l: Language) => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang, onLanguageChange, isLoading }) => {
  const t = getTranslation(lang);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t.authError);
      return;
    }

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(t.authError);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="p-8 pb-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-center">
           <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/40 mb-4 transform rotate-3">
             <Activity className="text-white w-8 h-8" />
           </div>
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.title}</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t.loginSub}</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Language Switcher */}
            <div className="flex justify-center gap-2 mb-6">
               {(['pt', 'en', 'es'] as Language[]).map(l => (
                 <button 
                  key={l}
                  type="button"
                  onClick={() => onLanguageChange(l)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${lang === l ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                 >
                   {l.toUpperCase()}
                 </button>
               ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 ml-1">{t.email}</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                  placeholder="admin@admin.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 ml-1">{t.password}</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg text-center animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t.loginButton}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-400 pt-2">
              {t.authMockHint}
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;