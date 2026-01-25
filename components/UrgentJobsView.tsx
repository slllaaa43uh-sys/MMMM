import React, { useState, useEffect } from 'react';
import { 
  MapPin, Loader2, Megaphone, Bell, BellOff
} from 'lucide-react';
import PostCard from './PostCard';
import { Post } from '../types';
import { API_BASE_URL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { getDisplayLocation } from '../data/locations';
import { registerForPushNotifications, requestPermissions, getStoredToken } from '../services/pushNotifications';
import Logo from './Logo';

interface UrgentJobsViewProps {
  onFullScreenToggle: (isFull: boolean) => void;
  currentLocation: { country: string; city: string | null };
  onLocationClick: () => void;
  onReport: (type: 'post' | 'comment' | 'reply' | 'video', id: string, name: string) => void;
  onProfileClick?: (userId: string) => void;
}

const UrgentJobsView: React.FC<UrgentJobsViewProps> = ({ onFullScreenToggle, currentLocation, onLocationClick, onReport, onProfileClick }) => {
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check subscription status
  useEffect(() => {
      const localSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
      setIsSubscribed(!!localSubs['urgent_jobs']);
  }, []);

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
      alert('⏳ جاري تهيئة التنبيهات... يرجى المحاولة بعد لحظات.');
      return;
    }

    const previousState = isSubscribed;
    const newState = !previousState;
    const topicKey = 'urgent_jobs';
    
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
          topic: 'urgent_jobs'
        })
      });

      if (response.ok) {
        alert(newState 
            ? '✅ تم تفعيل إشعارات الوظائف المستعجلة بنجاح!' 
            : '🔕 تم إلغاء تفعيل إشعارات الوظائف المستعجلة.'
        );
      } else {
        throw new Error("Server rejected subscription");
      }
    } catch (error) {
      console.error('Subscription toggle error:', error);
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
    const fetchUrgentPosts = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const currentUserId = localStorage.getItem('userId');
        
        try {
            const countryParam = currentLocation.country === 'عام' ? '' : encodeURIComponent(currentLocation.country);
            const cityParam = currentLocation.city ? encodeURIComponent(currentLocation.city) : '';
            
            // Build URL based on filter
            let url = `${API_BASE_URL}/api/v1/posts?displayPage=urgent&country=${countryParam}&city=${cityParam}`;
            
            // Map activeFilter to Arabic tags used in backend
            let specialTag = '';
            if (activeFilter === 'now') specialTag = 'مطلوب الآن';
            else if (activeFilter === 'temp') specialTag = 'عقود مؤقتة';
            else if (activeFilter === 'daily') specialTag = 'دفع يومي';
            
            if (specialTag) {
                url += `&specialTag=${encodeURIComponent(specialTag)}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const postsArray = data.posts || [];
                
                if (Array.isArray(postsArray)) {
                    // Filter out current user's posts
                    const filteredPosts = postsArray.filter((p: any) => {
                        const ownerId = p.user?._id || p.user?.id || p.user;
                        return String(ownerId) !== String(currentUserId);
                    });

                    const mappedPosts: Post[] = filteredPosts.map((p: any) => {
                        // Reactions logic
                        const reactions = p.reactions || [];
                        const isLiked = reactions.some((r: any) => String(r.user?._id || r.user || r) === String(currentUserId));
                        const likesCount = reactions.filter((r: any) => !r.type || r.type === 'like').length;

                        let locationString = t('location_general');
                        if (p.scope === 'local' && p.country) {
                            const postLoc = getDisplayLocation(p.country, p.city === 'كل المدن' ? null : p.city, language as 'ar'|'en');
                            locationString = postLoc.cityDisplay ? `${postLoc.countryDisplay} | ${postLoc.cityDisplay}` : postLoc.countryDisplay;
                        }

                        return {
                            id: p._id || p.id,
                            user: {
                                id: p.user?._id || 'u',
                                _id: p.user?._id,
                                name: p.user?.name || 'مستخدم',
                                avatar: p.user?.avatar ? (p.user.avatar.startsWith('http') ? p.user.avatar : `${API_BASE_URL}${p.user.avatar}`) : null
                            },
                            timeAgo: p.createdAt ? getRelativeTime(p.createdAt) : 'الآن',
                            content: p.text || p.content || '',
                            image: p.media && p.media.length > 0 ? (p.media[0].url.startsWith('http') ? p.media[0].url : `${API_BASE_URL}${p.media[0].url}`) : undefined,
                            media: p.media ? p.media.map((m: any) => ({ url: m.url.startsWith('http') ? m.url : `${API_BASE_URL}${m.url}`, type: m.type, thumbnail: m.thumbnail })) : [],
                            likes: likesCount,
                            comments: p.comments?.length || 0,
                            shares: p.shares?.length || 0,
                            location: locationString,
                            isFeatured: p.isFeatured,
                            specialTag: p.specialTag,
                            title: p.title,
                            jobStatus: p.jobStatus || 'open',
                            contactPhone: p.contactPhone,
                            contactEmail: p.contactEmail,
                            contactMethods: p.contactMethods,
                            isLiked: isLiked,
                            reactions: reactions
                        };
                    });
                    setPosts(mappedPosts);
                } else {
                    setPosts([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch urgent posts", error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    fetchUrgentPosts();
  }, [activeFilter, currentLocation, language, t]);

  const filters = [
      { id: 'all', label: t('search_tab_all') },
      { id: 'now', label: t('urgent_opt_now') },
      { id: 'temp', label: t('urgent_opt_temp') },
      { id: 'daily', label: t('urgent_opt_daily') },
  ];

  return (
    <div className="bg-[#f0f2f5] dark:bg-black min-h-screen">
      <div className="bg-white dark:bg-[#121212] sticky top-0 z-10 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-12 h-12">
               <Logo className="w-full h-full" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                   {t('urgent_jobs_title')}
                   <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded animate-pulse">{t('urgent_badge')}</span>
               </h2>
               <p className="text-[10px] text-gray-500 font-medium">{t('urgent_jobs_subtitle')}</p>
             </div>
           </div>
           
           <div className="flex items-center gap-2">
             <button 
                onClick={handleToggleSubscribe}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
                    isSubscribed 
                    ? 'bg-red-100 text-red-600 shadow-inner ring-2 ring-red-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
                }`}
                title={isSubscribed ? "إلغاء تفعيل الإشعارات" : "تفعيل إشعارات الوظائف المستعجلة"}
             >
                {isSubscribed ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
             </button>

             <button 
                onClick={onLocationClick}
                className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 py-1.5 px-3 rounded-full transition-colors border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <MapPin size={14} className="text-red-600 dark:text-red-400" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                  {getLocationLabel()}
                </span>
             </button>
           </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        activeFilter === filter.id
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-10 pt-2 min-h-[80vh]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
               <Loader2 size={40} className="text-red-600 animate-spin" />
            </div>
          ) : posts.length > 0 ? (
             posts.map((post) => (
                <PostCard key={post.id} post={post} onReport={onReport} onProfileClick={onProfileClick} />
             ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-sm relative">
                   <Megaphone size={40} className="text-red-500" strokeWidth={1.5} />
                   <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                     <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
                        <span className="text-lg font-bold leading-none mb-0.5">+</span>
                     </div>
                   </div>
                </div>
                <div className="text-center px-6">
                   <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 mb-2">{t('no_urgent_jobs')}</h3>
                   <p className="text-gray-500 text-sm max-w-[240px] mx-auto leading-relaxed">
                      {t('check_back_later')}
                   </p>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default UrgentJobsView;