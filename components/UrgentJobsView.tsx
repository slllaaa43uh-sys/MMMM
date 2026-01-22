
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, MapPin, Clock, Zap, Filter, Search, Briefcase, DollarSign, Bell, BellOff, Layers, Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../constants';
import Logo from './Logo';
import PostCard from './PostCard';
import { Post } from '../types';
import { getDisplayLocation } from '../data/locations';
// Updated Imports
import { registerForPushNotifications, requestPermissions, getStoredToken } from '../services/pushNotifications';

interface UrgentJobsViewProps {
  onFullScreenToggle: (isFull: boolean) => void;
  onLocationClick: () => void;
  currentLocation: { country: string; city: string | null };
  onReport: (type: 'post' | 'comment' | 'reply', id: string, name: string) => void;
  onProfileClick?: (userId: string) => void;
}

const UrgentJobsView: React.FC<UrgentJobsViewProps> = ({ 
  onFullScreenToggle, 
  onLocationClick, 
  currentLocation,
  onReport,
  onProfileClick
}) => {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the active filter (Tag). null means "All"
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  // Notification State
  const [isSubscribed, setIsSubscribed] = useState(false);

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
      return language === 'ar' ? 'منذ فترة' : 'A while ago';
  };

  // 1. Initialize Notification State from Local Storage (Fast Load)
  useEffect(() => {
      const localSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
      setIsSubscribed(!!localSubs['urgent-jobs']);
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchUrgentJobs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const currentUserId = localStorage.getItem('userId');
            
            // Prepare location params
            const countryParam = currentLocation.country === 'عام' ? '' : encodeURIComponent(currentLocation.country);
            const cityParam = currentLocation.city ? encodeURIComponent(currentLocation.city) : '';

            // Fetch posts using server-side filtering for 'urgent' displayPage AND location
            const response = await fetch(`${API_BASE_URL}/api/v1/posts?displayPage=urgent&country=${countryParam}&city=${cityParam}&limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const rawPosts = data.posts || [];
                
                // FILTER: Exclude my own posts
                const filteredPosts = rawPosts.filter((p: any) => {
                    const postUserId = p.user?._id || p.user?.id || p.user;
                    return String(postUserId) !== String(currentUserId);
                });
                
                const mappedPosts = filteredPosts.map((p: any) => {
                    let locationString = t('location_general');
                    
                    if (p.country && p.country !== 'عام') {
                         const loc = getDisplayLocation(p.country, p.city === 'كل المدن' ? null : p.city, language as 'ar'|'en');
                         locationString = loc.cityDisplay ? `${loc.countryDisplay} | ${loc.cityDisplay}` : loc.countryDisplay;
                    } else if (p.location) {
                         locationString = p.location;
                    }

                    return {
                        id: p._id || p.id,
                        user: {
                            id: p.user?._id || 'u_x',
                            _id: p.user?._id,
                            name: p.user?.name || 'مستخدم',
                            avatar: p.user?.avatar ? (p.user.avatar.startsWith('http') ? p.user.avatar : `${API_BASE_URL}${p.user.avatar}`) : null
                        },
                        timeAgo: p.createdAt ? getRelativeTime(p.createdAt) : 'الآن',
                        content: p.text || p.content || '',
                        likes: p.likes || 0,
                        comments: p.comments?.length || 0,
                        shares: 0,
                        isFeatured: true,
                        category: p.category || t('urgent_label'),
                        location: locationString, 
                        title: p.title,
                        jobStatus: 'open',
                        contactPhone: p.contactPhone,
                        contactEmail: p.contactEmail, 
                        contactMethods: p.contactMethods || [], 
                        specialTag: p.specialTag 
                    };
                });
                setPosts(mappedPosts);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    fetchUrgentJobs();
  }, [currentLocation, language, t]); 

  const handleTagClick = (tagKey: string) => {
      if (tagKey === 'urgent_opt_all') {
          if (activeTag === null) return; 
          setActiveTag(null);
          return;
      }
      const tagValue = t(tagKey);
      if (activeTag === tagValue) return;
      setActiveTag(tagValue); 
  };

  // 3. Optimistic Subscribe Handler using Service
  const handleToggleSubscribe = async () => {
    const hasPermission = await requestPermissions();

    if (!hasPermission) {
      alert('⚠️ يرجى السماح بالإشعارات من إعدادات الهاتف لتتمكن من الاشتراك.');
      return;
    }

    const fcmToken = getStoredToken();
    const authToken = localStorage.getItem('token');

    if (!fcmToken || !authToken) {
      if (authToken) registerForPushNotifications();
      alert('🔒 يرجى تسجيل الدخول أولاً لتفعيل التنبيهات.');
      return;
    }

    // Optimistic Update
    const previousState = isSubscribed;
    const newState = !previousState;
    const topicKey = 'urgent-jobs';
    
    // Update State & Storage Immediately
    setIsSubscribed(newState);
    const localSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
    if (newState) localSubs[topicKey] = true;
    else delete localSubs[topicKey];
    localStorage.setItem('user_subscriptions', JSON.stringify(localSubs));

    // Send Request
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
          topic: 'urgent-jobs'
        })
      });

      if (response.ok) {
          alert(newState 
            ? '✅ تم تفعيل إشعارات الوظائف العاجلة بنجاح!' 
            : '🔕 تم إلغاء تفعيل إشعارات الوظائف العاجلة.'
          );
      } else {
        throw new Error("Server rejected subscription");
      }
    } catch (error) {
      console.error('Subscription error:', error);
      // Revert UI on Error
      setIsSubscribed(previousState);
      const revertedSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
      if (previousState) revertedSubs[topicKey] = true;
      else delete revertedSubs[topicKey];
      localStorage.setItem('user_subscriptions', JSON.stringify(revertedSubs));
      
      alert('❌ حدث خطأ في الاتصال، تعذر تغيير حالة الاشتراك.');
    }
  };

  // Filter posts based on active tag
  const displayedPosts = activeTag 
      ? posts.filter(p => p.specialTag === activeTag)
      : posts;

  // Helper to determine button style
  const getButtonStyle = (tagKey: string) => {
      let isActive = false;
      if (tagKey === 'urgent_opt_all') isActive = activeTag === null;
      else isActive = activeTag === t(tagKey);
      
      if (isActive) {
          return "bg-red-600 text-white shadow-md shadow-red-200 border-transparent";
      }
      return "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";
  };

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen pb-24">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-[#121212] sticky top-0 z-20 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 shadow-sm rounded-full overflow-hidden border border-gray-100 dark:border-gray-700 bg-white">
                    <Logo className="w-full h-full" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-gray-800 dark:text-white">
                            {t('urgent_jobs_title')}
                        </h2>
                        {/* Title Badge */}
                        <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm shadow-red-200">
                            {t('urgent_badge')}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">{t('urgent_jobs_subtitle')}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* --- NOTIFICATION BELL --- */}
                <button 
                    onClick={handleToggleSubscribe}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
                        isSubscribed 
                        ? 'bg-red-50 text-red-600 border border-red-100 shadow-inner' 
                        : 'bg-white hover:bg-gray-50 text-gray-400 border border-gray-100'
                    }`}
                    title={isSubscribed ? "إلغاء تفعيل الإشعارات" : "تفعيل إشعارات الوظائف العاجلة"}
                >
                    {isSubscribed ? (
                        <Bell size={18} fill="currentColor" className="transition-transform duration-300" />
                    ) : (
                        <BellOff size={18} className="transition-transform duration-300" />
                    )}
                </button>

                <button 
                    onClick={onLocationClick}
                    className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 py-1.5 px-3 rounded-full transition-colors border border-gray-100 dark:border-gray-700"
                >
                    <MapPin size={14} className="text-red-600" />
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                        {currentLocation.country === 'عام' ? t('location_general') : currentLocation.country}
                    </span>
                </button>
            </div>
        </div>

        {/* Interactive Filter Strip */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2 pt-1">
            <div className="flex items-center gap-2 px-4 min-w-max">
                <button 
                    onClick={() => handleTagClick('urgent_opt_now')}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold transition-all border whitespace-nowrap ${getButtonStyle('urgent_opt_now')}`}
                >
                    <Clock size={10} /> {t('urgent_now')}
                </button>
                
                <button 
                    onClick={() => handleTagClick('urgent_opt_temp')}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap transition-all border ${getButtonStyle('urgent_opt_temp')}`}
                >
                    <Briefcase size={10} /> {t('temp_contracts')}
                </button>
                
                <button 
                    onClick={() => handleTagClick('urgent_opt_daily')}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap transition-all border ${getButtonStyle('urgent_opt_daily')}`}
                >
                    <DollarSign size={10} /> {t('daily_payment')}
                </button>

                {/* "All" Button */}
                <button 
                    onClick={() => handleTagClick('urgent_opt_all')}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap transition-all border ${getButtonStyle('urgent_opt_all')}`}
                >
                    <Layers size={10} /> {t('view_all')}
                </button>
            </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-1 pb-24"> 
        {loading ? (
            <div className="flex flex-col gap-3 p-3">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl shadow-sm animate-pulse h-40"></div>
                ))}
            </div>
        ) : displayedPosts.length > 0 ? (
            displayedPosts.map(post => (
                <div key={post.id} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <PostCard 
                        post={post} 
                        onReport={onReport} 
                        onProfileClick={onProfileClick} 
                        isActive={true} 
                    />
                </div>
            ))
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60 p-3">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <Zap size={40} className="text-red-500" fill="currentColor" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200">
                    {activeTag ? `${t('no_urgent_jobs')} (${activeTag})` : t('no_urgent_jobs')}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px]">{t('check_back_later')}</p>
                {activeTag && (
                    <button 
                        onClick={() => setActiveTag(null)}
                        className="mt-4 text-xs font-bold text-blue-600 underline"
                    >
                        {t('view_all')}
                    </button>
                )}
            </div>
        )}
      </div>

    </div>
  );
};

export default UrgentJobsView;
