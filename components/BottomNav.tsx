
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
  
  // YouTube style: ~48px height content + safe area
  const navContainerClass = "bg-white border-t border-gray-100 pb-safe fixed bottom-0 w-full max-w-md z-50";
    
  const getButtonClass = (tabName: string) => {
    const isActive = activeTab === tabName;
    
    // YouTube logic: Active is darker/colored, Inactive is gray
    if (isActive) {
        if (tabName === 'haraj') return "text-black font-bold"; // Or specific brand color
        if (tabName === 'jobs') return "text-black font-bold";
        if (tabName === 'world') return "text-black font-bold";
        if (tabName === 'urgent') return "text-black font-bold";
        return "text-black font-bold"; // Home
    }
    return "text-gray-600 font-normal";
  };

  const getIconStroke = (tabName: string) => {
      return activeTab === tabName ? 2.5 : 1.5; // Thicker stroke for active (mimics filled state)
  };

  return (
    <nav className={navContainerClass}>
      <div className="flex justify-around items-center h-[48px] px-1">
        
        {/* Home */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('home')}`}
        >
          <Home size={24} strokeWidth={getIconStroke('home')} />
          <span className="text-[10px] leading-none tracking-tight">{t('nav_home')}</span>
        </button>

        {/* Jobs (Wazaef) */}
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('jobs')}`}
        >
          <Briefcase size={24} strokeWidth={getIconStroke('jobs')} />
          <span className="text-[10px] leading-none tracking-tight">{t('nav_jobs')}</span>
        </button>

        {/* CENTER BUTTON: URGENT JOBS - Sized to match icons */}
        <button 
          onClick={() => setActiveTab('urgent')}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('urgent')}`}
        >
          {/* Container size matches icon optical size (24px~28px) */}
          <div className="w-6 h-6 flex items-center justify-center">
             <Logo className="w-full h-full" />
          </div>
          <span className="text-[10px] leading-none tracking-tight">
            {t('nav_urgent')}
          </span>
        </button>

        {/* World (Global Jobs) */}
        <button 
          onClick={() => setActiveTab('world')}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('world')}`}
        >
          <Globe size={24} strokeWidth={getIconStroke('world')} />
          <span className="text-[10px] leading-none tracking-tight">{t('nav_world')}</span>
        </button>

         {/* Haraj (Marketplace) */}
         <button 
          onClick={() => setActiveTab('haraj')}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('haraj')}`}
        >
          <Store size={24} strokeWidth={getIconStroke('haraj')} />
          <span className="text-[10px] leading-none tracking-tight">{t('nav_haraj')}</span>
        </button>

      </div>
    </nav>
  );
};

export default BottomNav;
