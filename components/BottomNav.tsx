
import React from 'react';
import { Home, Briefcase, Store, Globe, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreate: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenCreate }) => {
  const { t } = useLanguage();
  
  const navContainerClass = "bg-white border-gray-200 border-t pb-safe pt-1";
    
  const getButtonClass = (tabName: string) => {
    const isActive = activeTab === tabName;
    
    if (isActive) {
        if (tabName === 'haraj') return "text-orange-600";
        if (tabName === 'jobs') return "text-purple-600";
        if (tabName === 'world') return "text-green-600";
        if (tabName === 'urgent') return "text-red-600"; // Color for Urgent
        return "text-blue-600";
    }
    return "text-gray-400";
  };

  return (
    <nav className={`fixed bottom-0 w-full max-w-md z-50 ${navContainerClass}`}>
      <div className="flex justify-around items-center px-2 pb-1 h-[48px]">
        
        {/* Home */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 w-14 active:scale-95 transition-transform ${getButtonClass('home')}`}
        >
          <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className={`text-[9px] ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>{t('nav_home')}</span>
        </button>

        {/* Jobs (Wazaef) */}
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`flex flex-col items-center gap-0.5 w-14 active:scale-95 transition-transform ${getButtonClass('jobs')}`}
        >
          <Briefcase size={24} strokeWidth={activeTab === 'jobs' ? 2.5 : 2} />
          <span className={`text-[9px] ${activeTab === 'jobs' ? 'font-bold' : 'font-medium'}`}>{t('nav_jobs')}</span>
        </button>

        {/* CENTER BUTTON: URGENT JOBS (Replaces Create) */}
        <button 
          onClick={() => setActiveTab('urgent')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 active:scale-90 transition-transform ${getButtonClass('urgent')}`}
        >
          {/* Logo container with active state styling */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all ${activeTab === 'urgent' ? 'border-red-500 shadow-md scale-110' : 'border-gray-200 bg-gray-50'}`}>
             <Logo className="w-full h-full" />
          </div>
          <span className={`text-[9px] ${activeTab === 'urgent' ? 'font-bold' : 'font-medium'}`}>
            {t('nav_urgent')}
          </span>
        </button>

        {/* World (Global Jobs) */}
        <button 
          onClick={() => setActiveTab('world')}
          className={`flex flex-col items-center gap-0.5 w-14 active:scale-95 transition-transform ${getButtonClass('world')}`}
        >
          <Globe size={24} strokeWidth={activeTab === 'world' ? 2.5 : 2} />
          <span className={`text-[9px] ${activeTab === 'world' ? 'font-bold' : 'font-medium'}`}>{t('nav_world')}</span>
        </button>

         {/* Haraj (Marketplace) */}
         <button 
          onClick={() => setActiveTab('haraj')}
          className={`flex flex-col items-center gap-0.5 w-14 active:scale-95 transition-transform ${getButtonClass('haraj')}`}
        >
          <Store size={24} strokeWidth={activeTab === 'haraj' ? 2.5 : 2} />
          <span className={`text-[9px] ${activeTab === 'haraj' ? 'font-bold' : 'font-medium'}`}>{t('nav_haraj')}</span>
        </button>

      </div>
    </nav>
  );
};

export default BottomNav;
