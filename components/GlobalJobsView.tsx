
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, MapPin, Globe, Clock, ChevronRight, ExternalLink, Building2, Loader2, DollarSign, Languages, Settings, X, Check, ShieldAlert, AlertTriangle, Image as ImageIcon, Bell, BellOff, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../constants';
// Updated Imports
import { registerForPushNotifications, requestPermissions, getStoredToken } from '../services/pushNotifications';

interface ExternalJob {
  _id: string;
  jobId: string;
  title: string;
  description: string;
  employer: {
    name: string;
    logo: string | null;
    website: string | null;
  };
  location: {
    city: string;
    state: string;
    country: string;
    isRemote: boolean;
  };
  employmentType: string;
  salary: {
    min: number | null;
    max: number | null;
    currency: string;
    period: string;
  };
  applyLink: string;
  media: {
    type: 'image' | 'video';
    url: string | null;
    thumbnail: string | null;
    source: string;
  };
  postedAt: string;
  isActive: boolean;
  views: number;
  clicks: number;
  tags: string[];
}

const TARGET_LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" }, 
  { code: "ur", label: "اردو" }, 
  { code: "hi", label: "हिन्दी" }, 
  { code: "ne", label: "नेपाली" }, 
  { code: "bn", label: "বাংলা" }, 
  { code: "tr", label: "Türkçe" }, 
  { code: "ru", label: "Русский" }, 
  { code: "am", label: "አማርኛ" }, 
  { code: "so", label: "Soomaali" }, 
  { code: "fr", label: "Français" }, 
  { code: "sw", label: "Kiswahili" }, 
  { code: "swb", label: "Shikomor" }, 
  { code: "lg", label: "Luganda" }, 
  { code: "es", label: "Español" }, 
  { code: "it", label: "Italiano" }, 
  { code: "pt-BR", label: "Português (Brasil)" }, 
  { code: "ja", label: "日本語" }, 
  { code: "ko", label: "한국어" }, 
  { code: "fa", label: "فارسی" }, 
];

// --- 1. Isolated Component for Main Job Image (With Video Support) ---
const JobCardImage = ({ src, alt, type }: { src: string | null, alt: string, type?: 'image' | 'video' }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    // If no source, show placeholder immediately
    if (!src) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Briefcase className="text-gray-300 w-16 h-16 opacity-50" />
            </div>
        );
    }

    if (type === 'video') {
        return (
            <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
                <video 
                    src={src} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    className="w-full h-full object-cover opacity-90"
                    onLoadedData={() => setIsLoaded(true)}
                    onError={() => setIsError(true)}
                />
                {!isLoaded && !isError && (
                    <div className="absolute inset-0 bg-gray-900 animate-pulse z-10 flex items-center justify-center">
                        <ImageIcon className="text-gray-600 w-8 h-8 opacity-50" />
                    </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full bg-gray-100 overflow-hidden">
            {/* Loading Skeleton */}
            {!isLoaded && !isError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse z-10 flex items-center justify-center">
                    <ImageIcon className="text-gray-300 w-8 h-8 opacity-50" />
                </div>
            )}

            {/* Actual Image */}
            {!isError ? (
                <img 
                    src={src} 
                    alt={alt} 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setIsError(true)}
                    loading="lazy"
                />
            ) : (
                /* Error Fallback */
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center z-0">
                    <Briefcase className="text-gray-300 w-12 h-12 opacity-50" />
                </div>
            )}

            {/* Gradient Overlay (Always on top of image) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />
        </div>
    );
};

// --- 2. Isolated Component for Company Logo (Fixes Disappearing Issue) ---
const CompanyLogo = ({ src, alt }: { src: string | null, alt: string }) => {
    const [imgError, setImgError] = useState(false);

    if (!src || imgError) {
        return (
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm text-gray-400 border border-gray-100">
                <Building2 size={24} />
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className="w-12 h-12 object-contain bg-white rounded-lg p-1 shadow-sm border border-gray-100" 
            onError={() => setImgError(true)}
            loading="lazy"
        />
    );
};

// Interface for Translation State per Job
interface TranslationState {
    translatedTitle: string | null;
    translatedLocation: string | null;
    translatedDescription: string | null;
    isTranslating: boolean;
    showTranslated: boolean;
}

const GlobalJobsView: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { t, language, translationTarget, setTranslationTarget } = useLanguage();
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  // Translation States Map: jobId -> State
  const [translationStates, setTranslationStates] = useState<Record<string, TranslationState>>({});

  const [isTranslationSheetOpen, setIsTranslationSheetOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const fetchJobs = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
          setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      const url = new URL(`${API_BASE_URL}/api/v1/external-jobs`);
      url.searchParams.append('page', pageNum.toString());
      url.searchParams.append('limit', '10');

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url.toString(), { headers });
      
      if (response.ok) {
        const data = await response.json();
        const newJobs = data.jobs || data.data || [];
        
        if (pageNum === 1) {
            setJobs(newJobs);
        } else {
            setJobs(prev => [...prev, ...newJobs]);
        }
        
        if (newJobs.length === 0) {
            setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch global jobs", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
        setPage(1);
        setHasMore(true);
        fetchJobs(1);
        
        const localSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
        setIsSubscribed(!!localSubs['global-jobs']);
    }
  }, [isActive, fetchJobs]);

  const handleJobClickRequest = (url: string) => {
      if (url) setPendingUrl(url);
  };

  const confirmNavigation = () => {
      if (pendingUrl) {
          window.open(pendingUrl, '_blank');
          setPendingUrl(null);
      }
  };

  // --- UPDATED SUBSCRIBE HANDLER USING SERVICE ---
  const handleToggleSubscribe = async () => {
    const hasPermission = await requestPermissions();

    if (!hasPermission) {
      alert('⚠️ يرجى السماح بالإشعارات من إعدادات المتصفح لتلقي تنبيهات الوظائف العالمية');
      return;
    }

    const fcmToken = getStoredToken();
    const authToken = localStorage.getItem('token');

    if (!fcmToken || !authToken) {
      if (authToken) registerForPushNotifications();
      alert('⏳ جاري تهيئة نظام الإشعارات، يرجى المحاولة بعد قليل');
      return;
    }

    // Optimistic Update
    const previousState = isSubscribed;
    const newState = !previousState;
    const topicKey = 'global-jobs';
    
    // Update State & Storage Immediately
    setIsSubscribed(newState);
    const localSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
    if (newState) localSubs[topicKey] = true;
    else delete localSubs[topicKey];
    localStorage.setItem('user_subscriptions', JSON.stringify(localSubs));

    const action = newState ? 'subscribe' : 'unsubscribe';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/fcm/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          deviceToken: fcmToken,
          topic: 'global-jobs'
        })
      });

      if (response.ok) {
        alert(newState 
            ? '✅ تم تفعيل إشعارات الوظائف العالمية بنجاح!' 
            : '🔕 تم إلغاء تفعيل إشعارات الوظائف العالمية.'
        );
      } else {
        throw new Error("Server rejected subscription");
      }
    } catch (error) {
      console.error('Subscription error:', error);
      
      // Revert on Failure
      setIsSubscribed(previousState);
      const revertedSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
      if (previousState) revertedSubs[topicKey] = true;
      else delete revertedSubs[topicKey];
      localStorage.setItem('user_subscriptions', JSON.stringify(revertedSubs));

      alert('❌ خطأ في الاتصال');
    }
  };

  const handleRefreshMedia = async (e: React.MouseEvent, jobId: string) => {
      e.stopPropagation();
      setRefreshingId(jobId);
      const token = localStorage.getItem('token');
      try {
          const response = await fetch(`${API_BASE_URL}/api/v1/external-jobs/${jobId}/refresh-media`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              }
          });
          
          if (response.ok) {
              const data = await response.json();
              if (data.media) {
                  setJobs(prev => prev.map(j => (j._id === jobId || j.jobId === jobId) ? { ...j, media: data.media } : j));
              }
          }
      } catch (error) {
          console.error("Refresh failed", error);
      } finally {
          setRefreshingId(null);
      }
  };

  const handleTranslate = async (jobId: string, title: string, location: string, description: string) => {
      const currentState = translationStates[jobId] || { 
          translatedTitle: null, 
          translatedLocation: null, 
          translatedDescription: null, 
          isTranslating: false, 
          showTranslated: false 
      };

      if (currentState.showTranslated) {
          setTranslationStates(prev => ({
              ...prev,
              [jobId]: { ...currentState, showTranslated: false }
          }));
          return;
      }

      if (currentState.translatedDescription) {
          setTranslationStates(prev => ({
              ...prev,
              [jobId]: { ...currentState, showTranslated: true }
          }));
          return;
      }

      setTranslationStates(prev => ({
          ...prev,
          [jobId]: { ...currentState, isTranslating: true }
      }));

      try {
          const isArabicContent = /[\u0600-\u06FF]/.test(description);
          const sourceLang = isArabicContent ? 'ar' : 'en'; 
          let targetLang = translationTarget;

          if (sourceLang === targetLang) {
              targetLang = sourceLang === 'ar' ? 'en' : 'ar';
          }

          const langpair = `${sourceLang}|${targetLang}`;
          const delimiter = " ||| ";
          const metaQuery = `${title}${delimiter}${location}`;
          const descQuery = description.substring(0, 500); 

          const [metaRes, descRes] = await Promise.all([
              fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(metaQuery)}&langpair=${langpair}`),
              fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(descQuery)}&langpair=${langpair}`)
          ]);

          const metaData = await metaRes.json();
          const descData = await descRes.json();
          
          let newTitle = title;
          let newLocation = location;
          let newDesc = description;

          if (metaData.responseData?.translatedText) {
              const parts = metaData.responseData.translatedText.split('|||');
              if (parts.length >= 2) {
                  newTitle = parts[0].trim();
                  newLocation = parts[1].trim();
              } else {
                  newTitle = metaData.responseData.translatedText; 
              }
          }

          if (descData.responseData?.translatedText) {
              newDesc = descData.responseData.translatedText;
          }

          setTranslationStates(prev => ({
              ...prev,
              [jobId]: {
                  translatedTitle: newTitle,
                  translatedLocation: newLocation,
                  translatedDescription: newDesc,
                  isTranslating: false,
                  showTranslated: true
              }
          }));

      } catch (error) {
          console.error("Translation error:", error);
          alert("فشلت الترجمة");
          setTranslationStates(prev => ({
              ...prev,
              [jobId]: { ...currentState, isTranslating: false }
          }));
      }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white min-h-full pb-20">
      
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-green-50">
                   <Globe size={24} className="text-green-600" />
               </div>
               <div>
                   <h2 className="text-xl font-bold text-gray-900">{t('world_jobs_title')}</h2>
                   <p className="text-[10px] text-gray-500 font-medium">
                       {t('world_jobs_subtitle')}
                   </p>
               </div>
           </div>
           
           {/* Notification Bell */}
           <button 
             onClick={handleToggleSubscribe}
             className={`p-2 rounded-full transition-all duration-300 ${
                 isSubscribed 
                 ? 'bg-green-100 text-green-600 shadow-inner ring-2 ring-green-200' 
                 : 'hover:bg-gray-100 text-gray-400'
             }`}
             title={isSubscribed ? "إلغاء تفعيل الإشعارات" : "تفعيل إشعارات الوظائف العالمية"}
           >
             {isSubscribed ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
           </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex flex-col">
        {loading && jobs.length === 0 ? (
            <div className="flex flex-col gap-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full aspect-video bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
        ) : (
            jobs.map((job) => {
                const jobId = job._id || job.jobId;
                
                // Get Translation State for this specific job
                const tState = translationStates[jobId] || { 
                    translatedTitle: null, 
                    translatedLocation: null, 
                    translatedDescription: null, 
                    isTranslating: false, 
                    showTranslated: false 
                };
                
                const originalLocation = [job.location.city, job.location.country].filter(Boolean).join(', ');
                
                const displayTitle = tState.showTranslated && tState.translatedTitle ? tState.translatedTitle : job.title;
                const displayLocation = tState.showTranslated && tState.translatedLocation ? tState.translatedLocation : originalLocation;
                const displayText = tState.showTranslated && tState.translatedDescription ? tState.translatedDescription : job.description;

                let displaySalary = '';
                if (job.salary?.min || job.salary?.max) {
                    const min = job.salary.min ? job.salary.min.toLocaleString() : '';
                    const max = job.salary.max ? job.salary.max.toLocaleString() : '';
                    const currency = job.salary.currency || '$';
                    if (min && max) displaySalary = `${currency}${min} - ${max}`;
                    else if (min) displaySalary = `${currency}${min}+`;
                    else if (max) displaySalary = `Up to ${currency}${max}`;
                }

                const displayDate = job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '';
                const displayCategory = job.employmentType;

                return (
                  <div key={jobId} className="group border-b-[0.5px] border-gray-100 last:border-0 pb-4 mb-2 animate-in fade-in duration-500">
                    
                    {/* Full Width Visual Container */}
                    <div className="w-full aspect-video bg-gray-50 relative overflow-hidden group select-none">
                       
                       {/* 1. Main Job Image (Background) */}
                       <JobCardImage 
                           src={job.media?.url} 
                           alt={job.title} 
                           type={job.media?.type}
                       />
                       
                       {/* Refresh Button */}
                       <button 
                           onClick={(e) => handleRefreshMedia(e, jobId)}
                           className="absolute top-3 right-3 z-30 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                           title="Refresh Media"
                       >
                           <RefreshCw size={14} className={refreshingId === jobId ? "animate-spin" : ""} />
                       </button>

                       {/* 2. Company Logo (Top Left) - High Z-Index to stay visible */}
                       <div className="absolute top-3 left-3 z-30">
                           <CompanyLogo 
                               src={job.employer.logo} 
                               alt={job.employer.name} 
                           />
                       </div>

                       {/* Company Name Badge */}
                       <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md max-w-[70%] truncate z-20">
                         {job.employer.name}
                       </div>
                       
                       {/* Salary Badge */}
                       {displaySalary && (
                           <div className="absolute bottom-3 right-3 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1 z-20">
                             <DollarSign size={10} />
                             {displaySalary}
                           </div>
                       )}
                    </div>

                    {/* Info Section */}
                    <div className="px-4 pt-3">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                                    <Briefcase size={20} />
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    {/* Title */}
                                    {displayTitle && (
                                        <h3 
                                            className="font-bold text-gray-900 text-sm leading-tight line-clamp-2"
                                            dir="auto"
                                        >
                                            {displayTitle}
                                        </h3>
                                    )}
                                    
                                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                        <span className="flex items-center gap-1" dir="auto">
                                            <MapPin size={10} /> {displayLocation}
                                        </span>
                                        {displayDate && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} /> {displayDate}
                                                </span>
                                            </>
                                        )}
                                        {displayCategory && (
                                            <>
                                                <span>•</span>
                                                <span className="text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                                                    {displayCategory}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="mt-1">
                                        <p 
                                            className={`text-xs text-gray-600 leading-relaxed whitespace-pre-wrap text-start line-clamp-3`}
                                            dir="auto"
                                        >
                                            {displayText}
                                        </p>
                                        
                                        {/* Translation Controls */}
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleTranslate(jobId, job.title, originalLocation, job.description); }} 
                                                className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                                                disabled={tState.isTranslating}
                                            >
                                                {tState.isTranslating ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <Languages size={12} />
                                                )}
                                                
                                                {tState.isTranslating 
                                                    ? t('translating') 
                                                    : (tState.showTranslated ? t('show_original') : t('translate_post'))
                                                }
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setIsTranslationSheetOpen(true); }} 
                                                className="text-gray-400 p-1 hover:bg-gray-100 rounded-full"
                                            >
                                                <Settings size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* External Link Button */}
                            <button 
                                onClick={() => handleJobClickRequest(job.applyLink)} 
                                className="text-blue-600 bg-blue-50 p-2.5 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
                                title="فتح الوظيفة في المتصفح"
                            >
                                <ExternalLink size={20} className={language === 'ar' ? 'rotate-180' : ''} />
                            </button>
                        </div>
                    </div>

                  </div>
                );
            })
        )}
      </div>

      {/* Load More & Other Modals... (Same as before) */}
      {!loading && jobs.length > 0 && hasMore && (
          <div className="p-4 flex justify-center">
              <button 
                onClick={() => { setPage(p => p + 1); fetchJobs(page + 1); }}
                className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                  {t('view_all')}
              </button>
          </div>
      )}

      {!loading && jobs.length > 0 && !hasMore && (
          <div className="p-8 text-center">
             <p className="text-gray-400 text-xs font-medium">
                {t('end_of_results')} {t('world_jobs_title')}
             </p>
          </div>
      )}

      {/* Translation & Warning Modals (Unchanged) */}
      {isTranslationSheetOpen && createPortal(
        <div className="fixed inset-0 z-[10002] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setIsTranslationSheetOpen(false)} />
            <div className="bg-white w-full max-w-md h-[60vh] rounded-t-2xl relative z-10 animate-in slide-in-from-bottom duration-300 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">{t('translation_settings')}</h3><button onClick={() => setIsTranslationSheetOpen(false)} className="bg-gray-100 p-1 rounded-full"><X size={20} /></button></div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100"><span className="text-xs text-gray-500 font-bold mb-2 block">{t('source_lang')}</span><div className="flex items-center justify-between"><span className="font-bold text-gray-800">Auto Detect</span><Check size={18} className="text-gray-400" /></div></div>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b border-gray-100"><span className="text-xs text-gray-500 font-bold">{t('target_lang')}</span></div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {TARGET_LANGUAGES.map((lang) => (
                                <button 
                                    key={lang.code} 
                                    onClick={() => { 
                                        setTranslationTarget(lang.code); 
                                        setTranslationStates({}); 
                                        setIsTranslationSheetOpen(false); 
                                    }} 
                                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors text-start ${translationTarget === lang.code ? 'bg-blue-50' : 'bg-white'}`}
                                >
                                    <span className={`font-bold text-sm ${translationTarget === lang.code ? 'text-blue-700' : 'text-gray-700'}`}>{lang.label}</span>{translationTarget === lang.code && <Check size={18} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>, document.body
      )}

      {pendingUrl && createPortal(
          <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => setPendingUrl(null)} />
              <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden border-t-4 border-red-500">
                  <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <ShieldAlert size={36} className="text-red-600" strokeWidth={2} />
                      </div>
                      
                      <h3 className="text-xl font-black text-gray-900 mb-1">تنبيه أمني هام</h3>
                      <h3 className="text-sm font-bold text-gray-500 mb-4 dir-ltr">Security Alert</h3>
                      
                      <div className="bg-red-50 p-3 rounded-xl border border-red-100 mb-4 text-start">
                          <div className="flex gap-2">
                              <AlertTriangle size={32} className="flex-shrink-0 mt-0.5 text-red-600" />
                              <div className="flex flex-col gap-2">
                                  <p className="text-sm text-red-800 font-bold leading-relaxed">
                                    احذر من دفع أي مبالغ مالية مقابل التوظيف. التطبيق غير مسؤول عن أي تعاملات خارجية.
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="mb-6 text-start bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-bold mb-1">
                              أنت على وشك الانتقال إلى موقع خارجي.
                          </p>
                      </div>

                      <div className="flex gap-3">
                          <button 
                              onClick={confirmNavigation}
                              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-transform active:scale-95 flex flex-col items-center justify-center leading-tight"
                          >
                              <span>متابعة</span>
                              <span className="text-[10px] opacity-80 font-normal">Continue</span>
                          </button>
                          <button 
                              onClick={() => setPendingUrl(null)}
                              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex flex-col items-center justify-center leading-tight"
                          >
                              <span>إلغاء</span>
                              <span className="text-[10px] opacity-80 font-normal">Cancel</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>, document.body
      )}

    </div>
  );
};

export default GlobalJobsView;
