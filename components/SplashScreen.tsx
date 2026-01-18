
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

const SplashScreen: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col items-center justify-between pb-10 pt-safe">
      
      {/* الجزء العلوي - فارغ للموازنة */}
      <div className="flex-1"></div>

      {/* المنتصف - شعار التطبيق واسمه */}
      <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
        <div className="w-32 h-32 mb-6 flex items-center justify-center relative">
           {/* Glow Effect behind logo */}
           <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
           <Logo className="w-full h-full drop-shadow-xl relative z-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2">{t('app_name')}</h1>
      </div>

      {/* الأسفل - شعار الشركة والمطور */}
      <div className="flex-1 flex flex-col justify-end items-center w-full pb-8">
        <div className="flex flex-col items-center gap-3 opacity-60">
          <span className="text-gray-400 text-[10px] tracking-widest font-medium uppercase">From</span>
          
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-gray-800 dark:text-gray-200 font-sans tracking-wide">
              مهدلي
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SplashScreen;
