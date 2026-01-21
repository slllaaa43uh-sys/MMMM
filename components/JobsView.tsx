
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Briefcase, Users, ChevronLeft, X, ArrowRight, MapPin, Loader2, Megaphone, Bell, BellOff
} from 'lucide-react';
import PostCard from './PostCard';
import { Post } from '../types';
import { JOB_CATEGORIES } from '../data/categories';
import { API_BASE_URL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { getDisplayLocation } from '../data/locations';
// Import New Service
import { registerForPushNotifications, requestPermissions, getStoredToken } from '../services/pushNotifications';

interface JobsViewProps {
  onFullScreenToggle: (isFull: boolean) => void;
  currentLocation: { country: string; city: string | null };
  onLocationClick: () => void;
  onReport: (type: 'post' | 'comment' | 'reply', id: string, name: string) => void;
  onProfileClick?: (userId: string) => void;
}

// Map Arabic categories to English topics for FCM
const CATEGORY_TO_TOPIC_MAP: Record<string, string> = {
    "سائق خاص": "driver",
    "حارس أمن": "security",
    "طباخ": "chef",
    "محاسب": "accountant",
    "مهندس مدني": "engineer",
    "طبيب/ممرض": "medical",
    "نجار": "carpenter",
    "كاتب محتوى": "writer",
    "كهربائي": "electrician",
    "ميكانيكي": "mechanic",
    "بائع / كاشير": "sales",
    "مبرمج": "developer",
    "مصمم جرافيك": "designer",
    "مترجم": "translator",
    "مدرس خصوصي": "tutor",
    "مدير مشاريع": "manager",
    "خدمة عملاء": "support",
    "مقدم طعام": "waiter",
    "توصيل": "delivery",
    "حلاق / خياط": "tailor",
    "مزارع": "farmer",
    "وظائف أخرى": "other_jobs"
};

const JobsView: React.FC<JobsViewProps> = ({ onFullScreenToggle, currentLocation, onLocationClick, onReport, onProfileClick }) => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSubPage, setActiveSubPage] = useState<{ type: 'seeker' | 'employer', category: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubPageSelect = (type: 'seeker' | 'employer') => {
    if (selectedCategory) {
      setLoading(true); 
      setActiveSubPage({ type, category: selectedCategory });
      setSelectedCategory(null);
      onFullScreenToggle(true);
    }
  };

  const handleBack = () => {
    setActiveSubPage(null);
    onFullScreenToggle(false);
    setPosts([]);
  };

  // 1. Check Local Subscription State
  useEffect(() => {
      if (activeSubPage) {
          const subTopic = activeSubPage.type;
          const englishCategory = CATEGORY_TO_TOPIC_MAP[activeSubPage.category] || 'other_jobs';
          const topicKey = `jobs_${englishCategory}_${subTopic}`;
          const localSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
          setIsSubscribed(!!localSubs[topicKey]);
      }
  }, [activeSubPage]);

  // 2. Handle Subscribe / Unsubscribe Toggle (Optimistic)
  const handleToggleSubscribe = async () => {
    const hasPermission = await requestPermissions();

    if (!hasPermission) {
      alert('⚠️ يرجى السماح بالإشعارات من إعدادات الهاتف لتتمكن من الاشتراك.');
      return;
    }

    const fcmToken = getStoredToken();
    const authToken = localStorage.getItem('token');

    if (!fcmToken || !authToken) {
      // Try registration again if token missing
      if (authToken) registerForPushNotifications(authToken);
      alert('⏳ جاري تهيئة التنبيهات... يرجى المحاولة بعد لحظات.');
      return;
    }

    // Optimistic Update
    const previousState = isSubscribed;
    const newState = !previousState;
    const subType = activeSubPage ? activeSubPage.type : 'seeker';
    const arabicCategory = activeSubPage?.category || '';
    const englishCategory = CATEGORY_TO_TOPIC_MAP[arabicCategory] || 'other_jobs';
    
    const topicKey = `jobs_${englishCategory}_${subType}`;
    
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
          topic: 'jobs', // Main Topic
          category: englishCategory, // Sub-category mapping
          subType: subType // seeker or employer
        })
      });

      if (response.ok) {
        const typeLabel = subType === 'seeker' ? 'للباحثين عن عمل' : 'لأصحاب العمل';
        
        alert(newState
            ? `✅ تم تفعيل الإشعارات لقسم: ${t(arabicCategory)} (${typeLabel}).`
            : `🔕 تم إلغاء تفعيل الإشعارات لقسم: ${t(arabicCategory)} (${typeLabel}).`
        );
      } else {
        throw new Error("Server rejected subscription");
      }
    } catch (error) {
      console.error('Subscription toggle error:', error);
      
      // Revert Optimistic Update
      setIsSubscribed(previousState);
      const revertedSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
      if (previousState) revertedSubs[topicKey] = true;
      else delete revertedSubs[topicKey];
      localStorage.setItem('user_subscriptions', JSON.stringify(revertedSubs));

      alert('❌ خطأ في الاتصال بالخادم، تعذر تغيير الحالة.');
    }
  };

  const getLocationLabel = () => {
    const { countryDisplay, cityDisplay, flag } = getDisplayLocation(
      currentLocation.country, 
      currentLocation.city, 
      language as 'ar' | 'en'
    );
    const flagStr = flag ? `${flag} ` : '';
    if (cityDisplay) return `${flagStr}${countryDisplay} | ${cityDisplay}`;
    return `${flagStr}${countryDisplay}`;
  };

  // Helper for relative time
  const getRelativeTime = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return language === 'ar' ? 'الآن' : 'Just now';
      
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return language === 'ar' ? `${minutes} د` : `${minutes}m`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return language === 'ar' ? `${hours} س` : `${hours}h`;
      
      const days = Math.floor(hours / 24);
      if (days < 30) return language === 'ar' ? `${days} يوم` : `${days}d`;
      
      const months = Math.floor(days / 30);
      if (months < 12) return language === 'ar' ? `${months} شهر` : `${months}mo`;
      
      const years = Math.floor(months / 12);
      return language === 'ar' ? `${years} سنة` : `${years}y`;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');

    if (activeSubPage && token) {
      setLoading(true);

      const countryParam = currentLocation.country === 'عام' ? '' : encodeURIComponent(currentLocation.country);
      const cityParam = currentLocation.city ? encodeURIComponent(currentLocation.city) : '';
      const postTypeValue = activeSubPage.type === 'seeker' ? 'ابحث عن وظيفة' : 'ابحث عن موظفين';
      const url = `${API_BASE_URL}/api/v1/posts?category=${encodeURIComponent(activeSubPage.category)}&postType=${encodeURIComponent(postTypeValue)}&country=${countryParam}&city=${cityParam}`;
      
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then(data => {
            const postsArray = data.posts || [];
            if (Array.isArray(postsArray) && postsArray.length > 0) {
                const filteredPosts = postsArray.filter((p: any) => {
                    const postUserId = p.user?._id || p.user?.id || p.user;
                    return postUserId !== currentUserId;
                });

                const mappedPosts: Post[] = filteredPosts.map((p: any) => {
                    // Location mapping for post card
                    let locationString = t('location_general');
                    if (p.scope === 'local' && p.country) {
                        const postLoc = getDisplayLocation(p.country, p.city === 'كل المدن' ? null : p.city, language as 'ar'|'en');
                        locationString = postLoc.cityDisplay ? `${postLoc.countryDisplay} | ${postLoc.cityDisplay}` : postLoc.countryDisplay;
                    }

                    const reactions = p.reactions || [];
                    const likesCount = reactions.filter((r: any) => !r.type || r.type === 'like').length;

                    // --- TITLE FILTERING (Hide "Looking for job/employee" titles) ---
                    let displayTitle = p.title;
                    const hiddenTitles = ['ابحث عن وظيفة', 'أبحث عن وظيفة', 'ابحث عن موظفين', 'أبحث عن موظفين'];
                    // Check if title matches any of the hidden titles (ignoring whitespace)
                    if (displayTitle && hiddenTitles.some(ht => ht === displayTitle.trim())) {
                        displayTitle = undefined;
                    }

                    return {
                        id: p._id || p.id || Math.random().toString(),
                        user: {
                            id: p.user?._id || 'u_j',
                            _id: p.user?._id,
                            name: p.user?.name || 'معلن وظائف',
                            avatar: p.user?.avatar ? (p.user.avatar.startsWith('http') ? p.user.avatar : `${API_BASE_URL}${p.user.avatar}`) : null,
                        },
                        timeAgo: p.createdAt ? getRelativeTime(p.createdAt) : '',
                        content: p.text || p.content || '', // Fixed: Check both text and content fields
                        image: p.media && p.media.length > 0 
                            ? (p.media[0].url.startsWith('http') 
                                ? p.media[0].url 
                                : `${API_BASE_URL}${p.media[0].url}`)
                            : undefined,
                        media: p.media ? p.media.map((m: any) => ({
                          url: m.url.startsWith('http') ? m.url : `${API_BASE_URL}${m.url}`,
                          type: m.type,
                          thumbnail: m.thumbnail
                        })) : [],
                        likes: likesCount,
                        comments: p.comments?.length || 0,
                        shares: p.shares?.length || 0,
                        title: displayTitle,
                        type: p.type || undefined,
                        location: locationString,
                        category: p.category,
                        isFeatured: p.isFeatured,
                        contactPhone: p.contactPhone || '',
                        contactEmail: p.contactEmail || '',
                        contactMethods: p.contactMethods || [],
                        repostsCount: p.repostsCount || 0,
                        jobStatus: p.jobStatus || 'open',
                        isLiked: reactions.some((r: any) => (r.user?._id || r.user) === currentUserId),
                        reactions: reactions,
                    };
                });
                
                mappedPosts.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
                setPosts(mappedPosts);
            } else {
              setPosts([]);
            }
        })
        .catch(err => {
          console.error(err);
          setPosts([]);
        })
        .finally(() => setLoading(false));
    }
  }, [activeSubPage, currentLocation, language, t]);

  const currentJobData = activeSubPage 
    ? JOB_CATEGORIES.find(j => j.name === activeSubPage.category) 
    : null;
  const JobIcon = currentJobData ? currentJobData.icon : Briefcase;

  // --- 1. RENDER INSIDE SECTION (Active Sub Page) ---
  if (activeSubPage) {
    return (
      <div className="bg-[#f0f2f5] dark:bg-black min-h-screen">
         <div className="sticky top-0 z-50 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 shadow-sm">
           <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleBack}
                  className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowRight size={24} className={language === 'en' ? 'rotate-180' : ''} />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${currentJobData?.bg || 'bg-gray-100'}`}>
                    <JobIcon size={20} className={currentJobData?.color || 'text-gray-600'} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-gray-800 dark:text-white">
                      {activeSubPage.type === 'seeker' ? t('jobs_employer') : t('jobs_seeker')}
                    </h2>
                    <p className="text-[10px] text-gray-500">
                      {t(activeSubPage.category)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* --- زر الجرس: مع التفعيل/إلغاء التفعيل (Fixed Icon Movement) --- */}
                <button 
                  onClick={handleToggleSubscribe}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
                      isSubscribed 
                      ? 'bg-purple-100 text-purple-600 shadow-inner ring-2 ring-purple-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
                  }`}
                  title={isSubscribed ? "إلغاء تفعيل الإشعارات" : "تفعيل إشعارات هذا القسم"}
                >
                  {isSubscribed ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
                </button>

                <button 
                  onClick={onLocationClick}
                  className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 py-1.5 px-3 rounded-full transition-colors border border-gray-100"
                >
                  <MapPin size={14} className="text-purple-600" />
                  <span className="text-[10px] font-bold text-gray-700 truncate max-w-[100px]">
                    {getLocationLabel()}
                  </span>
                </button>
              </div>
            </div>
        </div>

        <div className="flex flex-col gap-3 pb-10 pt-2 min-h-[80vh]">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                   <Loader2 size={40} className="text-purple-600 animate-spin" />
                </div>
            ) : posts.length > 0 ? (
                posts.map((post) => (
                    <PostCard key={post.id} post={post} onReport={onReport} onProfileClick={onProfileClick} />
                ))
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center border border-purple-100 shadow-sm relative">
                       <Megaphone size={40} className="text-purple-500" strokeWidth={1.5} />
                       <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                         <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white">
                            <span className="text-lg font-bold leading-none mb-0.5">+</span>
                         </div>
                       </div>
                    </div>
                    <div className="text-center px-6">
                       <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 mb-2">{t('jobs_empty')}</h3>
                       <p className="text-gray-500 text-sm max-w-[240px] mx-auto leading-relaxed">
                          {t('be_first_to_post')} {t(activeSubPage.category)}
                       </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    )
  }

  // --- 2. RENDER MAIN CATEGORIES LIST (No Bell Here) ---
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="bg-white dark:bg-[#121212] sticky top-0 z-10 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between bg-gradient-to-l from-purple-50 to-white dark:from-gray-900 dark:to-black">
           <div className="flex items-center gap-3">
             <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl">
               <Briefcase size={24} className="text-purple-600 dark:text-purple-400" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('nav_jobs')}</h2>
               <p className="text-[10px] text-gray-500 font-medium">{t('jobs_subtitle')}</p>
             </div>
           </div>
           
           <div className="flex items-center gap-2">
             <button 
                onClick={onLocationClick}
                className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 py-1.5 px-3 rounded-full transition-colors border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <MapPin size={14} className="text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                  {getLocationLabel()}
                </span>
             </button>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-[1px] bg-gray-100 dark:bg-gray-800 mt-1">
        {JOB_CATEGORIES.map((cat, idx) => (
          <div 
            key={idx}
            onClick={() => setSelectedCategory(cat.name)}
            className="flex items-center justify-between p-3 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`${cat.bg} p-2 rounded-lg shadow-sm dark:opacity-80`}>
                <cat.icon size={20} className={cat.color} />
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{t(cat.name)}</span>
            </div>
            <ChevronLeft size={18} className={`text-gray-300 ${language === 'en' ? 'rotate-180' : ''}`} />
          </div>
        ))}
      </div>

      {selectedCategory && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedCategory(null)} />
           <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg text-gray-800 dark:text-white">{t(selectedCategory)}</h3>
                 <button onClick={() => setSelectedCategory(null)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"><X size={20} className="text-gray-600 dark:text-gray-300" /></button>
              </div>
              
              <div className="space-y-3">
                 <button 
                   onClick={() => handleSubPageSelect('employer')}
                   className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                 >
                    <div className="flex items-center gap-3">
                       <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                          <Users size={20} />
                       </div>
                       <span className="font-bold text-gray-700 dark:text-gray-200">{t('jobs_seeker')}</span>
                    </div>
                    <ChevronLeft size={18} className={`text-gray-300 group-hover:text-purple-500 ${language === 'en' ? 'rotate-180' : ''}`} />
                 </button>

                 <button 
                   onClick={() => handleSubPageSelect('seeker')}
                   className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                 >
                    <div className="flex items-center gap-3">
                       <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <Briefcase size={20} />
                       </div>
                       <span className="font-bold text-gray-700 dark:text-gray-200">{t('jobs_employer')}</span>
                    </div>
                    <ChevronLeft size={18} className={`text-gray-300 group-hover:text-blue-500 ${language === 'en' ? 'rotate-180' : ''}`} />
                 </button>
              </div>
           </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default JobsView;
