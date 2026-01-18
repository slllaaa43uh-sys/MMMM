
import React from 'react';
import { Settings, MapPin, Bell, PlusCircle, Sparkles, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getDisplayLocation } from '../data/locations';

interface HeaderProps {
  currentLocation: { country: string; city: string | null };
  onLocationClick: () => void;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
  onDiscoveryClick: () => void;
  onAddCVClick: () => void; 
  onAIChatClick: () => void;
  onSearchClick: () => void; // New Prop
  unreadCount?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  currentLocation, 
  onLocationClick, 
  onSettingsClick,
  onNotificationsClick,
  onAddCVClick,
  onAIChatClick,
  onSearchClick,
  unreadCount
}) => {
  const { language } = useLanguage();
  
  // Helper to format location string
  const getLocationLabel = () => {
    // currentLocation contains Arabic values. 
    // We use getDisplayLocation to translate them for display only.
    const { countryDisplay, cityDisplay, flag } = getDisplayLocation(
      currentLocation.country, 
      currentLocation.city, 
      language as 'ar' | 'en'
    );

    const flagStr = flag ? `${flag} ` : '';

    if (cityDisplay) {
        return `${flagStr}${countryDisplay} | ${cityDisplay}`;
    }
    return `${flagStr}${countryDisplay}`;
  };

  return (
    <div className="bg-white px-4 pt-3 pb-1 flex justify-between items-center">
      
      {/* Location Selector */}
      <button 
        onClick={onLocationClick}
        className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 py-1.5 px-3 rounded-full transition-colors border border-gray-100"
      >
        <MapPin size={16} className="text-blue-600" fill="currentColor" fillOpacity={0.2} />
        <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">
          {getLocationLabel()}
        </span>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* NEW: Search Button */}
        <button 
          onClick={onSearchClick}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors relative active:scale-90"
        >
          <Search size={24} strokeWidth={2} />
        </button>

        {/* CV/Global Card Button (Plus Icon) - Cyan Color */}
        <button 
          onClick={onAddCVClick}
          className="p-2 rounded-full hover:bg-cyan-50 text-cyan-600 transition-colors relative active:scale-90"
        >
          <PlusCircle size={24} strokeWidth={2} />
        </button>

        {/* AI Search Button */}
        <button 
          onClick={onAIChatClick}
          className="p-2 rounded-full hover:bg-cyan-50 text-cyan-600 transition-colors relative active:scale-90 group"
        >
          <Sparkles size={24} strokeWidth={2} className="group-hover:animate-pulse" />
        </button>

        <button 
          onClick={onNotificationsClick}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 relative"
        >
          <Bell size={24} strokeWidth={2} />
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button 
          onClick={onSettingsClick}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
        >
          <Settings size={24} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default Header;
