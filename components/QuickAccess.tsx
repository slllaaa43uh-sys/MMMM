
import React from 'react';
import { Store, Briefcase, Globe, User, Bell, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface QuickAccessProps {
  onNavigate: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenNotifs: () => void;
  onOpenSettings: () => void;
}

const QuickAccess: React.FC<QuickAccessProps> = ({ onNavigate, onOpenProfile, onOpenNotifs, onOpenSettings }) => {
  const { t, language } = useLanguage();

  const items = [
    { id: 'haraj', label: t('nav_haraj'), icon: Store, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', action: () => onNavigate('haraj') },
    { id: 'jobs', label: t('nav_jobs'), icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', action: () => onNavigate('jobs') },
    { id: 'world', label: t('nav_world'), icon: Globe, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', action: () => onNavigate('world') },
    { id: 'profile', label: language === 'ar' ? 'ملفي' : 'Profile', icon: User, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', action: onOpenProfile },
    { id: 'notifs', label: language === 'ar' ? 'تنبيهات' : 'Alerts', icon: Bell, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', action: onOpenNotifs },
    { id: 'settings', label: t('settings_title'), icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', action: onOpenSettings },
  ];

  return (
    <div className="bg-white py-4 border-b border-gray-100 mb-2">
       <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar min-w-max">
          {items.map((item) => (
             <button key={item.id} onClick={item.action} className="flex flex-col items-center gap-2 group min-w-[64px]">
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center shadow-sm group-active:scale-95 transition-transform border ${item.border}`}>
                    <item.icon size={24} className={item.color} />
                </div>
                <span className="text-[10px] font-bold text-gray-700">{item.label}</span>
             </button>
          ))}
       </div>
    </div>
  );
};

export default QuickAccess;
