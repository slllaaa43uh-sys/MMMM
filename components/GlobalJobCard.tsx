import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  MapPin, DollarSign, Users, Calendar, ExternalLink, Globe, 
  Briefcase, MoreHorizontal, Languages, Settings, Loader2, Flag, 
  Link as LinkIcon, X, Check, Search
} from 'lucide-react';
import { Post } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../constants';
import Avatar from './Avatar';
import Logo from './Logo';

const TARGET_LANGUAGES = [
  { code: "ar", label: "العربية (Arabic)", flag: "🇸🇦" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ur", label: "أردو (Urdu)", flag: "🇵🇰" },
  { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা (Bengali)", flag: "🇧🇩" },
  { code: "ne", label: "नेपाली (Nepali)", flag: "🇳🇵" },
  { code: "tl", label: "Tagalog (Philippines)", flag: "🇵🇭" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ml", label: "മലയാളം (Malayalam)", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ் (Tamil)", flag: "🇱🇰" },
  { code: "te", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
  { code: "si", label: "සිංහල (Sinhala)", flag: "🇱🇰" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
  { code: "mr", label: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "zh", label: "中文 (Chinese)", flag: "🇨🇳" },
  { code: "es", label: "Español (Spanish)", flag: "🇪🇸" },
  { code: "fr", label: "Français (French)", flag: "🇫🇷" },
  { code: "de", label: "Deutsch (German)", flag: "🇩🇪" },
  { code: "ru", label: "Русский (Russian)", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe (Turkish)", flag: "🇹🇷" },
  { code: "pt", label: "Português (Portuguese)", flag: "🇵🇹" },
  { code: "it", label: "Italiano (Italian)", flag: "🇮🇹" },
  { code: "ja", label: "日本語 (Japanese)", flag: "🇯🇵" },
  { code: "ko", label: "한국어 (Korean)", flag: "🇰🇷" },
  { code: "vi", label: "Tiếng Việt (Vietnamese)", flag: "🇻🇳" },
  { code: "th", label: "ไทย (Thai)", flag: "🇹🇭" },
  { code: "ms", label: "Melayu (Malay)", flag: "🇲🇾" },
  { code: "fa", label: "فارسی (Persian)", flag: "🇮🇷" },
  { code: "ps", label: "پښتو (Pashto)", flag: "🇦🇫" },
  { code: "ku", label: "Kurdî (Kurdish)", flag: "🇹🇯" },
  { code: "am", label: "አማርኛ (Amharic)", flag: "🇪🇹" },
  { code: "so", label: "Soomaali (Somali)", flag: "🇸🇴" },
  { code: "sw", label: "Kiswahili (Swahili)", flag: "🇰🇪" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
  { code: "yo", label: "Yoruba", flag: "🇳🇬" },
  { code: "ig", label: "Igbo", flag: "🇳🇬" },
  { code: "om", label: "Oromoo", flag: "🇪🇹" },
  { code: "ti", label: "ትግርኛ (Tigrinya)", flag: "🇪🇷" },
];

interface GlobalJobCardProps {
  post: Post;
  onApplyClick: (url: string) => void;
  onReport: (type: 'post' | 'comment' | 'reply' | 'video', id: string, name: string) => void;
}

const DARK_GRADIENTS = [
  'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900',
  'bg-gradient-to-br from-green-600 via-green-700 to-green-900',
  'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900',
  'bg-gradient-to-br from-orange-600 via-orange-700 to-orange-900',
  'bg-gradient-to-br from-pink-600 via-pink-700 to-pink-900',
  'bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900',
  'bg-gradient-to-br from-red-600 via-red-700 to-red-900',
  'bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900',
  'bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-900',
  'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900',
];

const getGradientClass = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DARK_GRADIENTS.length;
  return DARK_GRADIENTS[index];
};

const GlobalJobCard: React.FC<GlobalJobCardProps> = ({ 
  post, 
  onApplyClick,
  onReport
}) => {
  const { language, t, translationTarget, setTranslationTarget } = useLanguage();
  const globalData = post.globalJobData;
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [translation, setTranslation] = useState<{text: string; show: boolean; lang: string} | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLangSheetOpen, setIsLangSheetOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  const filteredLanguages = TARGET_LANGUAGES.filter(lang => 
    lang.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    lang.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  if (!globalData) return null;

  // Extract Media URL
  const rawMediaUrl = post.media && post.media.length > 0 ? post.media[0].url : post.image;
  const mainMediaUrl = rawMediaUrl && !rawMediaUrl.startsWith('http') 
    ? `${API_BASE_URL}${rawMediaUrl}` 
    : rawMediaUrl;

  const hasMedia = !!mainMediaUrl;
  const isVideo = post.media && post.media.length > 0 && post.media[0].type === 'video';
  
  // Check if content is long
  const contentLength = post.content.length;
  const shouldTruncate = contentLength > 150;
  const displayContent = (!isExpanded && shouldTruncate) 
    ? post.content.substring(0, 150) + '...' 
    : post.content;

  // Translation Handler
  const handleTranslate = async () => {
    if (translation && translation.lang === translationTarget) {
      setTranslation({ ...translation, show: !translation.show });
      return;
    }

    setIsTranslating(true);

    try {
      const target = translationTarget;
      const textToTranslate = post.content;
      
      if (!textToTranslate) throw new Error("No text");

      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=ar|${target}`);
      const data = await response.json();
      
      if (data.responseData && data.responseData.translatedText) {
        setTranslation({
          text: data.responseData.translatedText,
          show: true,
          lang: target
        });
      } else {
        alert("Could not translate");
      }
    } catch (error) {
      alert("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${API_BASE_URL}/share/post/${post.id}`);
    setShowMenu(false);
    alert(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied');
  };

  const handleReportClick = () => {
    setShowMenu(false);
    onReport('post', post.id, post.user.name);
  };

  return (
    <>
    <div className="bg-white pb-3">
      
      {/* 1. MEDIA HEADER */}
      <div className={`relative w-full ${hasMedia ? 'aspect-square md:aspect-video' : 'h-48'} overflow-hidden bg-gray-50 group`}>
        
        {/* Visual Content or Gradient */}
        {hasMedia ? (
          <>
            {isVideo ? (
              <video 
                src={mainMediaUrl} 
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <img 
                src={mainMediaUrl} 
                alt="Job" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
            
            {/* Title Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-6 text-center text-white">
              <div className="mb-3 opacity-80 drop-shadow-md">
                <Globe className="w-12 h-12" />
              </div>
              <span className="font-bold text-lg leading-tight drop-shadow-md opacity-90 max-w-[80%]">
                {language === 'ar' ? 'وظيفة عالمية' : 'Global Job'}
              </span>
            </div>
          </>
        ) : (
          // Fallback Gradient
          <div className={`w-full h-full ${getGradientClass(post.id)} flex flex-col items-center justify-center p-6 text-center text-white relative`}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
            <Globe className="w-12 h-12 mb-3 opacity-80" />
            <span className="font-bold text-lg leading-tight drop-shadow-md opacity-90 max-w-[80%]">
              {language === 'ar' ? 'وظيفة عالمية' : 'Global Job'}
            </span>
          </div>
        )}

        {/* OVERLAYS */}
        
        {/* Top Left: Avatar */}
        <div className="absolute top-3 left-3 z-20">
          <div className="p-1 bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
            <Avatar name={post.user.name} src={post.user.avatar} className="w-9 h-9 rounded-lg" textClassName="text-xs" />
          </div>
        </div>

        {/* Top Right: Menu */}
        <div className="absolute top-3 right-3 z-20">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(true);
            }}
            className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors border border-white/10"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Bottom Right: Tools */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-2 z-20">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleTranslate();
            }}
            className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-blue-600 transition-colors shadow-sm border border-white/10"
          >
            {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsLangSheetOpen(true);
            }}
            className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-gray-700 transition-colors shadow-sm border border-white/10"
          >
            <Settings size={16} />
          </button>

          <div className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white shadow-sm border border-white/20">
            <Logo className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom Left: Global Job Badge */}
        <div className="absolute bottom-3 left-3 z-20">
          <span className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-[10px] px-2 py-1 rounded-lg font-bold shadow-sm flex items-center gap-1 backdrop-blur-sm">
            <Globe size={10} /> {language === 'ar' ? 'وظيفة عالمية' : 'Global Job'}
          </span>
        </div>

        {/* Bottom Center: Job Details Badges */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap gap-1.5 justify-center">
          {/* Salary */}
          {globalData.salary && (
            <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-white/50 shadow-sm">
              <DollarSign size={12} className="text-yellow-600" />
              <span className="text-[10px] font-bold text-gray-800" dir="auto">
                {globalData.salary}
              </span>
            </div>
          )}

          {/* Number of Employees */}
          {globalData.numberOfEmployees && (
            <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-white/50 shadow-sm">
              <Users size={12} className="text-purple-600" />
              <span className="text-[10px] font-bold text-gray-800">
                {globalData.numberOfEmployees}
              </span>
            </div>
          )}

          {/* Age Requirement */}
          {globalData.ageRequirement && (
            <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-white/50 shadow-sm">
              <Calendar size={12} className="text-pink-600" />
              <span className="text-[10px] font-bold text-gray-800">
                {globalData.ageRequirement}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. USER INFO BAR with Apply Button */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={post.user.name} src={post.user.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm truncate">{post.user.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={10} className="text-gray-400" />
                <span className="truncate" dir="auto">{globalData.workLocation}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{post.timeAgo}</p>
          </div>
        </div>
        
        {/* Apply Button - Right Side */}
        <button
          onClick={() => onApplyClick(globalData.applicationUrl)}
          className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 active:scale-95 text-sm"
        >
          <ExternalLink size={16} className={language === 'ar' ? 'rotate-180' : ''} />
          <span>{language === 'ar' ? 'قدّم الآن' : 'Apply Now'}</span>
        </button>
      </div>

      {/* 3. CONTENT */}
      <div className="px-4 py-3 bg-white">
        <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed" dir="auto">
          {translation?.show ? translation.text : displayContent}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 text-xs font-bold mt-1 hover:underline"
          >
            {isExpanded 
              ? (language === 'ar' ? 'عرض أقل' : 'Show less')
              : (language === 'ar' ? 'عرض المزيد' : 'Show more')
            }
          </button>
        )}
      </div>
    </div>

    {/* MENU MODAL */}
    {showMenu && createPortal(
      <div className="fixed inset-0 z-[10001] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
        <div className="bg-white w-full max-w-md rounded-t-3xl relative z-10 animate-in slide-in-from-bottom duration-300 pb-6">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
          <div className="px-4 space-y-2">
            <button
              onClick={handleReportClick}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Flag size={20} className="text-red-600" />
              <span className="font-bold text-gray-800">
                {language === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report Problem'}
              </span>
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <LinkIcon size={20} className="text-blue-600" />
              <span className="font-bold text-gray-800">
                {language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
              </span>
            </button>
          </div>
        </div>
      </div>, document.body
    )}

    {/* LANGUAGE SELECTION SHEET */}
    {isLangSheetOpen && createPortal(
      <div className="fixed inset-0 z-[10002] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setIsLangSheetOpen(false)} />
        <div className="bg-white w-full max-w-md h-[80vh] rounded-t-2xl relative z-10 animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">
              {language === 'ar' ? 'إعدادات الترجمة' : 'Translation Settings'}
            </h3>
            <button type="button" onClick={() => setIsLangSheetOpen(false)} className="bg-gray-100 p-1 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder={language === 'ar' ? 'بحث عن لغة...' : 'Search language...'}
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
              <span className="text-xs text-gray-500 font-bold mb-2 block">
                {language === 'ar' ? 'اللغة المصدر' : 'Source Language'}
              </span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">
                  {language === 'ar' ? 'كشف تلقائي' : 'Auto Detect'}
                </span>
                <Check size={18} className="text-gray-400" />
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 p-3 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-bold">
                  {language === 'ar' ? 'اللغة المستهدفة' : 'Target Language'}
                </span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang) => (
                    <button 
                      type="button"
                      key={lang.code} 
                      onClick={(e) => { 
                        e.preventDefault();
                        e.stopPropagation();
                        setTranslationTarget(lang.code); 
                        setIsLangSheetOpen(false); 
                      }} 
                      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors text-start ${translationTarget === lang.code ? 'bg-blue-50' : 'bg-white'}`}
                    >
                      <div className="flex items-center gap-2">
                        {lang.flag && <span className="text-lg">{lang.flag}</span>}
                        <span className={`font-bold text-sm ${translationTarget === lang.code ? 'text-blue-700' : 'text-gray-700'}`}>{lang.label}</span>
                      </div>
                      {translationTarget === lang.code && <Check size={18} className="text-blue-600" />}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    {language === 'ar' ? 'لا توجد نتائج' : 'No results'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>, document.body
    )}
  </>
  );
};

export default GlobalJobCard;
