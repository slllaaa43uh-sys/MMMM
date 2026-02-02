
import React, { useEffect, useState } from 'react';
import { Home, Briefcase, Store, Globe, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';
import { BadgeCounterService } from '../services/badgeCounterService';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreate: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenCreate }) => {
  const { t } = useLanguage();
  
  // Badge counts state
  // Initialize from last-known in-memory counts to avoid flicker on remount.
  const [jobsCount, setJobsCount] = useState(() => BadgeCounterService.getJobsTotalCount());
  const [harajCount, setHarajCount] = useState(() => BadgeCounterService.getHarajTotalCount());
  const [urgentCount, setUrgentCount] = useState(() => BadgeCounterService.getUrgentTotalCount());
  const [globalCount, setGlobalCount] = useState(() => BadgeCounterService.getGlobalJobsTotalCount());
  
  console.log('🔵 [BottomNav] Component rendered');
  console.log('🔵 [BottomNav] Current badge counts:', { jobsCount, harajCount, urgentCount, globalCount });
  
  // Fetch badge counts on mount and poll
  useEffect(() => {
    console.log('🔵 [BottomNav] useEffect triggered - Starting badge count fetch');
    
    const updateCounts = () => {
      console.log('🔵 [BottomNav] updateCounts called');
      
      const jobs = BadgeCounterService.getJobsTotalCount();
      const haraj = BadgeCounterService.getHarajTotalCount();
      const urgent = BadgeCounterService.getUrgentTotalCount();
      const global = BadgeCounterService.getGlobalJobsTotalCount();
      
      console.log('🔵 [BottomNav] Raw values from service:', { jobs, haraj, urgent, global });
      
      setJobsCount(jobs);
      setHarajCount(haraj);
      setUrgentCount(urgent);
      setGlobalCount(global);
      
      console.log('🔵 [BottomNav] State updated with:', { jobs, haraj, urgent, global });
    };
    
    const fetchAndUpdate = async () => {
      await BadgeCounterService.fetchPostCounts();
      updateCounts();
    };

    const onCountsUpdated = () => {
      updateCounts();
    };

    // Initial fetch
    fetchAndUpdate();
    console.log('🔵 [BottomNav] Initial fetch completed');

    // Update immediately when counts change
    window.addEventListener('badge-counts-updated', onCountsUpdated as EventListener);
    
    // Poll every 30 seconds as fallback
    const interval = setInterval(() => {
      console.log('🔵 [BottomNav] Polling for badge updates...');
      fetchAndUpdate();
    }, 30000);
    
    return () => {
      console.log('🔵 [BottomNav] Cleaning up interval');
      clearInterval(interval);
      window.removeEventListener('badge-counts-updated', onCountsUpdated as EventListener);
    };
  }, []);
  
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

        {/* Jobs (Wazaef) - WITH BADGE */}
        <button 
          onClick={() => {
            console.log('🔵 [BottomNav] Jobs button clicked');
            setActiveTab('jobs');
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('jobs')}`}
        >
          <div className="relative">
            <Briefcase size={24} strokeWidth={getIconStroke('jobs')} />
            {jobsCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1"
                style={{ fontSize: '10px', lineHeight: '1' }}
              >
                {jobsCount > 99 ? '99+' : jobsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none tracking-tight">{t('nav_jobs')}</span>
        </button>

        {/* CENTER BUTTON: URGENT JOBS - WITH BADGE */}
        <button 
          onClick={() => {
            console.log('🔵 [BottomNav] Urgent button clicked');
            setActiveTab('urgent');
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('urgent')}`}
        >
          <div className="relative">
            <div className="w-6 h-6 flex items-center justify-center">
              <Logo className="w-full h-full" />
            </div>
            {urgentCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1"
                style={{ fontSize: '10px', lineHeight: '1' }}
              >
                {urgentCount > 99 ? '99+' : urgentCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none tracking-tight">
            {t('nav_urgent')}
          </span>
        </button>

        {/* World (Global Jobs) - WITH BADGE */}
        <button 
          onClick={() => {
            console.log('🔵 [BottomNav] Global button clicked');
            setActiveTab('world');
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('world')}`}
        >
          <div className="relative">
            <Globe size={24} strokeWidth={getIconStroke('world')} />
            {globalCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1"
                style={{ fontSize: '10px', lineHeight: '1' }}
              >
                {globalCount > 99 ? '99+' : globalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none tracking-tight">{t('nav_world')}</span>
        </button>

         {/* Haraj (Marketplace) - WITH BADGE */}
         <button 
          onClick={() => {
            console.log('🔵 [BottomNav] Haraj button clicked');
            setActiveTab('haraj');
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] active:bg-gray-100/50 h-full ${getButtonClass('haraj')}`}
        >
          <div className="relative">
            <Store size={24} strokeWidth={getIconStroke('haraj')} />
            {harajCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1"
                style={{ fontSize: '10px', lineHeight: '1' }}
              >
                {harajCount > 99 ? '99+' : harajCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none tracking-tight">{t('nav_haraj')}</span>
        </button>

      </div>
    </nav>
  );
};

export default BottomNav;
