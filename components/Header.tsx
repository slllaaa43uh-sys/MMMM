
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
  hasActiveSubscriptions?: boolean; // New: badge for settings
  isVisible?: boolean; // New prop for visibility
  areActionsVisible?: boolean; // New prop for actions visibility
}

const Header: React.FC<HeaderProps> = ({ 
  currentLocation, 
  onLocationClick, 
  onSettingsClick,
  onNotificationsClick,
  onAddCVClick,
  onAIChatClick,
  onSearchClick,
  unreadCount,
  hasActiveSubscriptions,
  isVisible = true, // Default to visible
  areActionsVisible = true // Default to visible
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
    <div 
      className={`bg-white px-4 pt-3 pb-1 flex justify-between items-center transition-all duration-200 ease-out shadow-sm ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 50,
        willChange: 'transform, opacity'
      }}
    >
      
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

      {/* Actions - with separate visibility control */}
      <div className={`flex items-center gap-1 transition-all duration-200 ${
        areActionsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}>
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
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 relative"
        >
          <Settings size={24} strokeWidth={2} />
          {hasActiveSubscriptions && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse border-2 border-white shadow-lg" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Header;
