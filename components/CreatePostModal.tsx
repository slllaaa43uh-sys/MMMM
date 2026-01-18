
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ArrowRight, Image as ImageIcon, 
  MapPin, Globe, ChevronDown, Store, Briefcase, Tag, Plus,
  ChevronUp, ChevronLeft, Phone, Mail, Star, Check, Eye, Loader2,
  Clock, Calendar, Crown, Coins, Zap, Info, Lock, AlertTriangle
} from 'lucide-react';
import { HARAJ_CATEGORIES, JOB_CATEGORIES } from '../data/categories';
import { ARAB_LOCATIONS, getDisplayLocation } from '../data/locations';
import { API_BASE_URL } from '../constants';
import Avatar from './Avatar';
import { useLanguage } from '../contexts/LanguageContext';

interface CreatePostModalProps {
  onClose: () => void;
  onPostSubmit: (payload: any) => Promise<void>;
}

const convertUrgentTagToArabic = (tag: string | null, t: any): string | null => {
    if (!tag) return null;
    if (tag === t('urgent_opt_now')) return 'مطلوب الآن';
    if (tag === t('urgent_opt_temp')) return 'عقود مؤقتة';
    if (tag === t('urgent_opt_daily')) return 'دفع يومي';
    return null;
};

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostSubmit }) => {
  const { t, language } = useLanguage();
  const userName = localStorage.getItem('userName') || 'مستخدم';
  const userAvatar = localStorage.getItem('userAvatar');
  const avatarSrc = userAvatar ? (userAvatar.startsWith('http') ? userAvatar : `${API_BASE_URL}${userAvatar}`) : null;

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [text, setText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<{ url: string, type: 'image' | 'video' }[]>([]);
  const [mediaFileObjects, setMediaFileObjects] = useState<File[]>([]);
  const [location, setLocation] = useState<string | null>(null); 
  const [isLocating, setIsLocating] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [scope, setScope] = useState<'local' | 'global'>('local');
  const [selectedCountry, setSelectedCountry] = useState<string>(''); 
  const [selectedCity, setSelectedCity] = useState<string>('');       
  
  const [isCountryDrawerOpen, setIsCountryDrawerOpen] = useState(false);
  const [isCityDrawerOpen, setIsCityDrawerOpen] = useState(false);

  const [publishScope, setPublishScope] = useState<'home_and_category' | 'category_only' | 'urgent_page'>('home_and_category');
  
  // Urgent Drawer State
  const [isUrgentDrawerOpen, setIsUrgentDrawerOpen] = useState(false);
  const [urgentTag, setUrgentTag] = useState<string | null>(null);
  const [showUrgentWarning, setShowUrgentWarning] = useState(false); // New warning state

  const [jobType, setJobType] = useState<'employer' | 'seeker'>('employer');
  
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMethods, setContactMethods] = useState<{whatsapp: boolean, call: boolean, email: boolean}>({
    whatsapp: true,
    call: true,
    email: false
  });
  
  const [isPremium, setIsPremium] = useState(false);
  const [isPremiumDrawerOpen, setIsPremiumDrawerOpen] = useState(false);
  const [promotionType, setPromotionType] = useState<'free' | 'weekly' | 'monthly' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsDrawerOpen(false);
      const newFileObjects = Array.from(e.target.files);
      const newMediaURLs = newFileObjects.map((file: File) => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' as const : 'image' as const
      }));
      setMediaFileObjects(prev => [...prev, ...newFileObjects]);
      setMediaFiles(prev => [...prev, ...newMediaURLs]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaFileObjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleAutoLocation = () => {
    setIsDrawerOpen(false);
    setIsLocating(true);
    if (!("geolocation" in navigator)) {
      alert("Browser does not support geolocation.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${language}`
          );
          const data = await response.json();
          if (data && data.address) {
             const addr = data.address;
             const formattedLocation = [addr.country, addr.city || addr.town || addr.state].filter(Boolean).join(', ');
             setLocation(formattedLocation || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
             setLocation("Current Location");
          }
        } catch (error) { setLocation("Current Location"); } finally { setIsLocating(false); }
      },
      (error) => { setIsLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCategorySelect = (catName: string, type: 'haraj' | 'job') => {
    setCategory(`${type === 'haraj' ? t('nav_haraj') : t('nav_jobs')}: ${catName}`);
    setIsDrawerOpen(false);
  };

  const handleNext = () => {
    if (!category) {
      alert(t('post_category') + " required");
      setIsDrawerOpen(true); 
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handlePublishScopeChange = (newScope: 'home_and_category' | 'category_only' | 'urgent_page') => {
      setPublishScope(newScope);
      if (newScope === 'urgent_page') {
          setIsUrgentDrawerOpen(true);
      } else {
          setUrgentTag(null);
      }
  };

  const handleUrgentTagSelect = (tag: string) => {
      setUrgentTag(tag);
      setIsUrgentDrawerOpen(false);

      // FORCE SWITCH LOGIC: 
      // If user is currently set as 'seeker', switch them to 'employer' and show warning.
      if (jobType === 'seeker') {
          setJobType('employer');
          setTimeout(() => setShowUrgentWarning(true), 300); // Small delay to ensure drawer closes first
      } else {
          // Even if they are already employer, ensure state is set correctly
          setJobType('employer');
      }
  };

  const handleFinalPost = async () => {
    const isJobPost = category?.startsWith(t('nav_jobs'));
    
    // Strict Validation for Urgent Posts
    if (publishScope === 'urgent_page' && !urgentTag) {
        alert(language === 'ar' ? 'يجب اختيار نوع الاستعجال للنشر في الصفحة المستعجلة' : 'Please select an urgency type');
        setIsUrgentDrawerOpen(true);
        return;
    }

    try {
      const activeContactMethods = Object.entries(contactMethods)
        .filter(([, value]) => value)
        .map(([key]) => {
          if (key === 'whatsapp') return 'واتساب';
          if (key === 'call') return 'اتصال';
          if (key === 'email') return 'بريد إلكتروني';
          return null;
        })
        .filter(Boolean) as string[];
  
      let finalTitle = '';
      if (isJobPost) {
          // CRITICAL FIX: Force title if Urgent Page is selected, regardless of UI state
          if (publishScope === 'urgent_page') {
              finalTitle = 'أبحث عن موظفين';
          } else {
              finalTitle = jobType === 'seeker' ? 'ابحث عن وظيفة' : 'ابحث عن موظفين';
          }
      }

      const cityToSend = selectedCity === 'All Cities' ? 'كل المدن' : selectedCity;
      let type = 'general';
      if (category?.startsWith(t('nav_jobs'))) type = 'job';
      else if (category?.startsWith(t('nav_haraj'))) type = 'haraj';

      let displayPage = 'all';
      if (publishScope === 'category_only') {
          if (type === 'job') displayPage = 'jobs';
          else if (type === 'haraj') displayPage = 'haraj';
          else displayPage = 'home'; 
      } else if (publishScope === 'urgent_page') {
          displayPage = 'urgent';
      }

      const postPayload = {
        content: text,
        type: type,
        isFeatured: isPremium,
        promotionType: promotionType,
        displayPage: displayPage,
        category: category ? category.split(': ')[1] : null, 
        specialTag: convertUrgentTagToArabic(urgentTag, t), 
        media: [], 
        rawMedia: mediaFileObjects, 
        scope: scope,
        country: scope === 'local' ? selectedCountry : null,
        city: scope === 'local' ? (cityToSend || 'كل المدن') : null,
        contactPhone: contactPhone,
        contactEmail: contactEmail,
        contactMethods: activeContactMethods, 
        isShort: false, 
        title: finalTitle,
        location: location || undefined,
      };
  
      onPostSubmit(postPayload);
  
    } catch (e) {
      console.error("Submission error in modal", e);
      alert('Failed to prepare post.');
    }
  };

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const toggleContactMethod = (method: 'whatsapp' | 'call' | 'email') => setContactMethods(prev => ({...prev, [method]: !prev[method]}));
  const handlePremiumClick = () => setIsPremiumDrawerOpen(true);
  const selectPromotionType = (type: 'free' | 'weekly' | 'monthly') => {
      setPromotionType(type);
      setIsPremium(true);
      setIsPremiumDrawerOpen(false);
  };

  const getPremiumLabel = () => {
      if (!isPremium) return t('premium_subtitle');
      if (promotionType === 'free') return t('premium_24h');
      if (promotionType === 'weekly') return t('premium_1w');
      if (promotionType === 'monthly') return t('premium_1m');
      return t('post_premium');
  };

  const getSelectedCountryDisplay = () => {
      if (!selectedCountry) return t('location_select_country');
      const data = getDisplayLocation(selectedCountry, null, language as 'ar'|'en');
      return data.countryDisplay;
  };

  const getSelectedCityDisplay = () => {
      if (!selectedCity) return t('location_select_city_opt');
      if (selectedCity === 'All Cities' || selectedCity === 'كل المدن') return t('location_all_cities');
      const data = getDisplayLocation(selectedCountry, selectedCity, language as 'ar'|'en');
      return data.cityDisplay;
  };

  if (step === 1) {
      return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-black animate-in slide-in-from-bottom duration-300 flex flex-col">
          {/* Step 1 Content (Same as before) */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#121212] z-10 pt-safe">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} className="text-gray-600 dark:text-gray-200" />
                </button>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('post_publish')}</h2>
              </div>
              <button 
                onClick={handleNext}
                disabled={(!text && mediaFiles.length === 0) || !category}
                className={`px-6 py-1.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-1 ${
                  (text || mediaFiles.length > 0) && category ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                }`}
              >
                {t('post_next')}
                <ChevronLeft size={16} className={`mt-0.5 ${language === 'en' ? 'rotate-180' : ''}`} />
              </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-[100px]">
              <div className="px-4 py-4 flex items-center gap-3">
                <Avatar name={userName} src={avatarSrc} className="w-12 h-12 border border-gray-100 dark:border-gray-800" />
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{userName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <button className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded-md">
                        <Globe size={10} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">{t('visibility_public')}</span>
                      </button>
                      {category && (
                        <button onClick={() => setCategory(null)} className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 px-2 py-0.5 rounded-md animate-in zoom-in">
                          <Tag size={10} className="text-purple-600 dark:text-purple-400" />
                          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium max-w-[120px] truncate">
                             {category.includes(': ') ? `${category.split(': ')[0]}: ${t(category.split(': ')[1])}` : category}
                          </span>
                          <X size={10} className="text-purple-600 dark:text-purple-400" />
                        </button>
                      )}
                      {!category && (
                        <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 px-2 py-0.5 rounded-md animate-pulse">
                          <Plus size={10} className="text-red-500" />
                          <span className="text-xs font-bold text-red-500">{t('post_category')} *</span>
                        </button>
                      )}
                    </div>
                </div>
              </div>
              <div className="px-4">
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`${t('post_header_create')} ${userName.split(' ')[0]}?`}
                  className="w-full text-lg placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-transparent text-gray-900 dark:text-white border-none outline-none resize-none min-h-[120px] dir-auto text-start"
                />
              </div>
              <div className="px-4 flex flex-wrap gap-2 mb-4">
                {(location || isLocating) && (
                  <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold animate-in zoom-in">
                      {isLocating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                      <span>{isLocating ? t('loading') : location}</span>
                      {!isLocating && <button onClick={() => setLocation(null)}><X size={12} /></button>}
                  </div>
                )}
              </div>
              {mediaFiles.length > 0 && (
                <div className="px-4 pb-4">
                  <div className={`grid gap-2 ${mediaFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {mediaFiles.map((file, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                          {file.type === 'video' ? (
                            <video src={file.url} className="w-full h-full max-h-[300px] object-cover" controls />
                          ) : (
                            <img src={file.url} alt="upload" className="w-full h-full max-h-[300px] object-cover" />
                          )}
                          <button onClick={() => handleRemoveMedia(idx)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>

          <div 
            className={`fixed inset-0 bg-black/40 z-[40] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsDrawerOpen(false)}
          />

          <div 
            className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] z-[50] rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-5px_30px_rgba(0,0,0,0.5)] flex flex-col h-[70vh] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] will-change-transform transform-gpu border-t border-gray-100 dark:border-gray-800`}
            style={{ 
              transform: isDrawerOpen ? 'translateY(0)' : 'translateY(calc(100% - 65px - env(safe-area-inset-bottom)))'
            }}
          >
            <div 
                onClick={toggleDrawer} 
                className="flex items-center justify-between px-5 h-[65px] cursor-pointer active:bg-gray-50 dark:active:bg-white/5 rounded-t-3xl transition-colors duration-200 flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('post_add_to')}</span>
                <ChevronUp size={16} className={`text-gray-500 dark:text-gray-400 transition-transform duration-500 ${isDrawerOpen ? 'rotate-180' : ''}`} />
              </div>
              <div className="flex items-center gap-4 text-green-600">
                <ImageIcon size={22} className="text-green-600 dark:text-green-500" />
                <MapPin size={22} className="text-red-500 dark:text-red-500" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-5 pt-2">
              <div className="grid grid-cols-2 gap-3 mb-6">
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-4 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                    <div className="bg-green-200 dark:bg-green-800 p-2 rounded-full"><ImageIcon size={24} className="text-green-700 dark:text-green-200" /></div>
                    <span className="text-xs font-bold text-green-800 dark:text-green-300">{t('post_media')}</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleMediaUpload} />

                  <button onClick={handleAutoLocation} className="flex flex-col items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl p-4 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                    <div className="bg-red-200 dark:bg-red-800 p-2 rounded-full"><MapPin size={24} className="text-red-700 dark:text-red-200" /></div>
                    <span className="text-xs font-bold text-red-800 dark:text-red-300">{t('post_location')}</span>
                  </button>
              </div>

              <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <Briefcase size={16} className="text-purple-600 dark:text-purple-400" />
                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">{t('nav_jobs')}</h4>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {JOB_CATEGORIES.map((cat, i) => (
                        <button key={i} onClick={() => handleCategorySelect(cat.name, 'job')} className="flex flex-col items-center gap-1.5 group">
                          <div className={`${cat.bg} p-2.5 rounded-xl group-hover:scale-105 transition-transform dark:opacity-80 dark:hover:opacity-100`}>
                              <cat.icon size={18} className={cat.color} />
                          </div>
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center line-clamp-1">{t(cat.name)}</span>
                        </button>
                    ))}
                  </div>
              </div>

              <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <Store size={16} className="text-orange-600 dark:text-orange-400" />
                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">{t('nav_haraj')}</h4>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {HARAJ_CATEGORIES.map((cat, i) => (
                        <button key={i} onClick={() => handleCategorySelect(cat.name, 'haraj')} className="flex flex-col items-center gap-1.5 group">
                          <div className={`${cat.lightColor} p-2.5 rounded-xl group-hover:scale-105 transition-transform dark:opacity-80 dark:hover:opacity-100`}>
                              <cat.icon size={18} className={cat.iconColor} />
                          </div>
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center line-clamp-1">{t(cat.name)}</span>
                        </button>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </div>
      );
  }

  const isJobPost = category?.startsWith(t('nav_jobs'));
  const isPublishDisabled = isSubmitting || (scope === 'local' && !selectedCity);
  const isUrgentMode = publishScope === 'urgent_page';

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-black animate-in slide-in-from-left duration-300 flex flex-col">
       
       <div className="px-4 py-3 flex items-center justify-between sticky top-0 bg-white dark:bg-[#121212] z-10 pt-safe border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 hover:bg-gray-50 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300">
              <ArrowRight className={language === 'en' ? 'rotate-180' : ''} size={22} />
            </button>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('post_settings')}</h2>
          </div>
          <button 
            onClick={handleFinalPost}
            disabled={isPublishDisabled}
            className={`px-6 py-1.5 rounded-full font-bold text-sm bg-blue-600 text-white transition-colors shadow-sm shadow-blue-200 dark:shadow-none ${isPublishDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t('post_publish')}
          </button>
       </div>

       <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6 pb-[50px]">
          
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block px-1">{t('scope_label')}</label>
            <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-xl flex gap-1">
              <button onClick={() => setScope('local')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${scope === 'local' ? 'bg-white dark:bg-[#1e1e1e] text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-600'}`}>
                 <MapPin size={16} /> <span>{t('scope_local')}</span>
              </button>
              <button onClick={() => setScope('global')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${scope === 'global' ? 'bg-white dark:bg-[#1e1e1e] text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-600'}`}>
                 <Globe size={16} /> <span>{t('scope_global')}</span>
              </button>
            </div>
          </div>

          {scope === 'local' && (
             <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
                <div onClick={() => setIsCountryDrawerOpen(true)} className="w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm font-bold rounded-xl py-3 px-4 flex justify-between items-center cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                   <span className={selectedCountry ? "text-gray-900 dark:text-white" : "text-gray-400"}>{getSelectedCountryDisplay()}</span>
                   <ChevronDown size={16} className="text-gray-400" />
                </div>
                <div onClick={() => { if(!selectedCountry) { alert(t('location_select_country') + " first"); setIsCountryDrawerOpen(true); return; } setIsCityDrawerOpen(true); }} className={`w-full bg-gray-50 dark:bg-gray-900 text-sm font-bold rounded-xl py-3 px-4 flex justify-between items-center cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors ${!selectedCountry ? 'opacity-50' : ''}`}>
                   <span className={selectedCity ? "text-gray-900 dark:text-white" : "text-gray-400"}>{getSelectedCityDisplay()}</span>
                   <ChevronDown size={16} className="text-gray-400" />
                </div>
             </div>
          )}
          
          <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

          {isJobPost && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 px-1"><Briefcase size={16} className="text-purple-600" />{t('job_type_title')}</h3>
              
              <div className="space-y-2">
                <button 
                    onClick={() => setJobType('employer')} 
                    className={`w-full p-4 rounded-xl border-2 transition-all text-start flex items-center justify-between ${
                        jobType === 'employer' 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                    }`}
                >
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{t('job_type_hiring')}</h4>
                  {jobType === 'employer' && <Check size={18} className="text-purple-600" />}
                </button>

                {/* Seeker Button - Disabled if Urgent Mode */}
                <button 
                    onClick={() => {
                        if (!isUrgentMode) setJobType('seeker');
                    }} 
                    className={`w-full p-4 rounded-xl border-2 transition-all text-start flex items-center justify-between relative overflow-hidden ${
                        isUrgentMode 
                        ? 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 opacity-60 cursor-not-allowed'
                        : jobType === 'seeker' 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                            : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                    }`}
                >
                  <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{t('job_type_seeking')}</h4>
                      {isUrgentMode && <Lock size={14} className="text-gray-400" />}
                  </div>
                  {jobType === 'seeker' && !isUrgentMode && <Check size={18} className="text-purple-600" />}
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 px-1"><Eye size={16} className="text-purple-600" />{t('scope_visibility')}</h3>
            <div className="space-y-2">
              <button onClick={() => handlePublishScopeChange('home_and_category')} className={`w-full p-4 rounded-xl border-2 transition-all text-start ${publishScope === 'home_and_category' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'}`}>
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{t('scope_home_category')}</h4>
                <p className="text-xs text-gray-500 mt-1">{t('scope_home_desc')}</p>
              </button>
              
              <button onClick={() => handlePublishScopeChange('category_only')} className={`w-full p-4 rounded-xl border-2 transition-all text-start ${publishScope === 'category_only' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'}`}>
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{t('scope_category_only')}</h4>
                <p className="text-xs text-gray-500 mt-1">{t('scope_category_desc')}</p>
              </button>

              <button onClick={() => handlePublishScopeChange('urgent_page')} className={`w-full p-4 rounded-xl border-2 transition-all text-start flex justify-between items-center ${publishScope === 'urgent_page' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-red-300'}`}>
                <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                        {t('scope_urgent_page')}
                        <Zap size={14} className="text-red-500 fill-current" />
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{urgentTag ? urgentTag : t('scope_urgent_desc')}</p>
                </div>
                {publishScope === 'urgent_page' && urgentTag && <Check size={18} className="text-red-600" />}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

          <div>
             <h3 className="text-xs font-bold text-gray-400 mb-3 px-1">{t('contact_info_title')}</h3>
             <div className="space-y-3 mb-4">
                <div className="relative">
                   <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input type="tel" placeholder={t('contact_phone_placeholder')} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl py-2.5 pr-10 pl-3 text-sm font-bold outline-none focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-1 focus:ring-blue-500 transition-all dir-ltr dark:text-white" />
                </div>
                <div className="relative">
                   <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input type="email" placeholder={t('contact_email_placeholder')} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl py-2.5 pr-10 pl-3 text-sm font-bold outline-none focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-1 focus:ring-blue-500 transition-all dir-ltr dark:text-white" />
                </div>
             </div>
             <div className="flex flex-wrap gap-2">
                 <button onClick={() => toggleContactMethod('whatsapp')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${contactMethods.whatsapp ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400'}`}>{t('contact_method_whatsapp')}</button>
                 <button onClick={() => toggleContactMethod('call')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${contactMethods.call ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400'}`}>{t('contact_method_call')}</button>
                 <button onClick={() => toggleContactMethod('email')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${contactMethods.email ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400'}`}>{t('contact_method_email')}</button>
             </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

          <div onClick={handlePremiumClick} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 border ${isPremium ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}>
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full transition-colors ${isPremium ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}><Star size={18} fill={isPremium ? "currentColor" : "none"} /></div>
                <div><h3 className={`text-sm font-bold ${isPremium ? 'text-amber-900 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>{t('post_premium')}</h3><p className="text-[10px] text-gray-400">{getPremiumLabel()}</p></div>
             </div>
             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isPremium ? 'bg-amber-500 border-amber-500' : 'border-gray-300 dark:border-gray-600'}`}>{isPremium && <Check size={12} className="text-white" strokeWidth={3} />}</div>
          </div>
       </div>

       {isUrgentDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-[120]" onClick={() => setIsUrgentDrawerOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] z-[130] rounded-t-3xl transition-transform animate-in slide-in-from-bottom duration-300 flex flex-col shadow-2xl border-t-4 border-red-500">
               <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2"><Zap size={20} className="text-red-500 fill-current" />{t('select_urgent_type')}</span>
                  <button onClick={() => setIsUrgentDrawerOpen(false)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={20} className="text-gray-600 dark:text-gray-300" /></button>
               </div>
               <div className="p-5 space-y-3 pb-safe">
                  <button onClick={() => handleUrgentTagSelect(t('urgent_opt_now'))} className={`w-full p-4 rounded-xl font-bold text-sm text-start flex justify-between items-center transition-all ${urgentTag === t('urgent_opt_now') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100'}`}><span>{t('urgent_opt_now')}</span>{urgentTag === t('urgent_opt_now') && <Check size={18} />}</button>
                  <button onClick={() => handleUrgentTagSelect(t('urgent_opt_temp'))} className={`w-full p-4 rounded-xl font-bold text-sm text-start flex justify-between items-center transition-all ${urgentTag === t('urgent_opt_temp') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100'}`}><span>{t('urgent_opt_temp')}</span>{urgentTag === t('urgent_opt_temp') && <Check size={18} />}</button>
                  <button onClick={() => handleUrgentTagSelect(t('urgent_opt_daily'))} className={`w-full p-4 rounded-xl font-bold text-sm text-start flex justify-between items-center transition-all ${urgentTag === t('urgent_opt_daily') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100'}`}><span>{t('urgent_opt_daily')}</span>{urgentTag === t('urgent_opt_daily') && <Check size={18} />}</button>
               </div>
            </div>
          </>
       )}

       {/* NEW: Urgent Employer Warning Modal */}
       {showUrgentWarning && createPortal(
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowUrgentWarning(false)} />
              <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-50/50 dark:ring-blue-900/10 animate-bounce">
                          <AlertTriangle size={32} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">
                          {t('urgent_employer_switch_title')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-loose whitespace-pre-wrap font-medium">
                          {t('urgent_employer_switch_msg')}
                      </p>
                      
                      <button 
                          onClick={() => setShowUrgentWarning(false)}
                          className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                      >
                          {t('understood')}
                      </button>
                  </div>
              </div>
          </div>, document.body
       )}

       {isPremiumDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-[120] transition-opacity" onClick={() => setIsPremiumDrawerOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] z-[130] rounded-t-3xl transition-transform animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[70vh] shadow-2xl">
               <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{t('premium_title')}</span>
                  <button onClick={() => setIsPremiumDrawerOpen(false)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={20} className="text-gray-600 dark:text-gray-300" /></button>
               </div>
               <div className="p-5 space-y-4 overflow-y-auto no-scrollbar pb-10">
                  <button onClick={() => selectPromotionType('free')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${promotionType === 'free' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-800 hover:border-amber-200'}`}><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-full flex items-center justify-center ${promotionType === 'free' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}><Clock size={24} /></div><div className="text-start"><h4 className="font-bold text-gray-900 dark:text-white">{t('premium_24h')}</h4><p className="text-xs text-green-600 font-bold mt-0.5">{t('premium_free')} ({t('special_offer_free_24h')})</p></div></div>{promotionType === 'free' && <div className="bg-amber-500 text-white rounded-full p-1"><Check size={16} strokeWidth={3} /></div>}</button>
                  <button onClick={() => selectPromotionType('weekly')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${promotionType === 'weekly' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-800 hover:border-amber-200'}`}><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-full flex items-center justify-center ${promotionType === 'weekly' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}><Calendar size={24} /></div><div className="text-start"><h4 className="font-bold text-gray-900 dark:text-white">{t('premium_1w')}</h4><div className="flex items-center gap-2 mt-0.5"><span className="text-xs font-bold text-gray-400 line-through">10 {t('premium_coins')}</span><span className="text-xs font-bold text-green-600">{t('premium_free')}</span></div></div></div>{promotionType === 'weekly' && <div className="bg-amber-500 text-white rounded-full p-1"><Check size={16} strokeWidth={3} /></div>}</button>
                  <button onClick={() => selectPromotionType('monthly')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${promotionType === 'monthly' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-800 hover:border-amber-200'}`}><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-full flex items-center justify-center ${promotionType === 'monthly' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}><Crown size={24} /></div><div className="text-start"><h4 className="font-bold text-gray-900 dark:text-white">{t('premium_1m')}</h4><div className="flex items-center gap-2 mt-0.5"><span className="text-xs font-bold text-gray-400 line-through">30 {t('premium_coins')}</span><span className="text-xs font-bold text-green-600">{t('premium_free')}</span></div></div></div>{promotionType === 'monthly' && <div className="bg-amber-500 text-white rounded-full p-1"><Check size={16} strokeWidth={3} /></div>}</button>
               </div>
            </div>
          </>
       )}

       {isCountryDrawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-[120]" onClick={() => setIsCountryDrawerOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] z-[130] rounded-t-3xl h-[60vh] flex flex-col animate-in slide-in-from-bottom duration-300">
               <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-800 dark:text-white">{t('location_select_country')}</span>
                  <button onClick={() => setIsCountryDrawerOpen(false)} className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full"><X size={20} className="text-gray-600 dark:text-gray-300" /></button>
               </div>
               <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                 {ARAB_LOCATIONS.map((loc) => (
                    <button key={loc.countryAr} onClick={() => { setSelectedCountry(loc.countryAr); setSelectedCity(''); setIsCountryDrawerOpen(false); }} className="w-full text-start p-4 border-b border-gray-50 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex justify-between items-center"><div className="flex items-center gap-3"><span className="text-2xl">{loc.flag}</span><span>{language === 'en' ? loc.countryEn : loc.countryAr}</span></div>{selectedCountry === loc.countryAr && <Check size={16} className="text-blue-600" />}</button>
                 ))}
               </div>
            </div>
          </>
       )}

       {isCityDrawerOpen && selectedCountry && (
          <>
            <div className="fixed inset-0 bg-black/40 z-[120]" onClick={() => setIsCityDrawerOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] z-[130] rounded-t-3xl h-[60vh] flex flex-col animate-in slide-in-from-bottom duration-300">
               <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-gray-800 dark:text-white">{t('location_cities_in')} {getSelectedCountryDisplay()}</span>
                  <button onClick={() => setIsCityDrawerOpen(false)} className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full"><X size={20} className="text-gray-600 dark:text-gray-300" /></button>
               </div>
               <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                 <button onClick={() => { setSelectedCity('All Cities'); setIsCityDrawerOpen(false); }} className="w-full text-start p-4 border-b border-gray-50 dark:border-gray-800 text-blue-600 font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex justify-between items-center"><span>{t('location_all_cities')}</span>{(selectedCity === 'All Cities' || selectedCity === 'كل المدن') && <Check size={16} className="text-blue-600" />}</button>
                 {ARAB_LOCATIONS.find(l => l.countryAr === selectedCountry)?.cities.map((city) => (
                    <button key={city.ar} onClick={() => { setSelectedCity(city.ar); setIsCityDrawerOpen(false); }} className="w-full text-start p-4 border-b border-gray-50 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex justify-between items-center"><span>{language === 'en' ? city.en : city.ar}</span>{selectedCity === city.ar && <Check size={16} className="text-blue-600" />}</button>
                 ))}
               </div>
            </div>
          </>
       )}

    </div>
  );
};

export default CreatePostModal;
