
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowRight, ChevronLeft, Store, MapPin, Loader2, Megaphone, Bell, BellOff,
  MoreHorizontal, Languages, Clock, Zap, Image as ImageIcon, Building2, Share2, Link as LinkIcon, 
  Flag, Phone, Mail, Check, X, Settings, CheckCircle, Star, Tag, Search, MessageCircle, Copy
} from 'lucide-react';
import { Post } from '../types';
import { HARAJ_CATEGORIES } from '../data/categories';
import { API_BASE_URL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { getDisplayLocation } from '../data/locations';
import { registerForPushNotifications, requestPermissions, getStoredToken } from '../services/pushNotifications';
import Logo from './Logo';
import Avatar from './Avatar';

interface HarajViewProps {
  onFullScreenToggle: (isFull: boolean) => void;
  currentLocation: { country: string; city: string | null };
  onLocationClick: () => void;
  onReport: (type: 'post' | 'comment' | 'reply', id: string, name: string) => void;
  onProfileClick?: (userId: string) => void;
}

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

const DARK_GRADIENTS = [
  'bg-gradient-to-br from-[#1e293b] to-[#0f172a]', // Slate
  'bg-gradient-to-br from-[#312e81] to-[#1e1b4b]', // Indigo
  'bg-gradient-to-br from-[#881337] to-[#4c0519]', // Rose
  'bg-gradient-to-br from-[#064e3b] to-[#022c22]', // Emerald
  'bg-gradient-to-br from-[#7c2d12] to-[#451a03]', // Orange/Brown
  'bg-gradient-to-br from-[#111827] to-[#000000]', // Gray/Black
];

const getGradientClass = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % DARK_GRADIENTS.length;
    return DARK_GRADIENTS[index];
};

const cleanUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed || trimmed.includes('undefined') || trimmed.includes('null')) return null;
    if (trimmed.startsWith('http') || trimmed.startsWith('blob:')) return trimmed;
    const normalized = trimmed.replace(/\\/g, '/');
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${base}${path}`;
};

// Map Arabic categories to English topics for FCM
const CATEGORY_TO_TOPIC_MAP: Record<string, string> = {
    "سيارات": "cars",
    "عقارات": "real_estate",
    "أجهزة منزلية": "appliances",
    "أثاث ومفروشات": "furniture",
    "جوالات": "mobiles",
    "لابتوبات وكمبيوتر": "computers",
    "كاميرات وتصوير": "cameras",
    "ألعاب فيديو": "video_games",
    "ملابس وموضة": "fashion",
    "ساعات ومجوهرات": "jewelry",
    "حيوانات أليفة": "pets",
    "طيور": "birds",
    "معدات ثقيلة": "heavy_equipment",
    "قطع غيار": "spare_parts",
    "تحف ومقتنيات": "antiques",
    "كتب ومجلات": "books",
    "أدوات رياضية": "sports",
    "مستلزمات أطفال": "kids",
    "خيم وتخييم": "camping",
    "أرقام مميزة": "vip_numbers",
    "نقل عفش": "moving",
    "أدوات أخرى": "other_haraj"
};

const HarajView: React.FC<HarajViewProps> = ({ onFullScreenToggle, currentLocation, onLocationClick, onReport, onProfileClick }) => {
  const { t, language, translationTarget, setTranslationTarget } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Translation State
  const [translations, setTranslations] = useState<Record<string, { text: string; show: boolean; lang: string }>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [isLangSheetOpen, setIsLangSheetOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  // Menu & Contact State
  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [contactPost, setContactPost] = useState<Post | null>(null);

  // The requested WhatsApp message
  const whatsappMessage = "مرحبًا 👋،\n\nأنا أتقدم لهذه الوظيفة التي وجدتها في تطبيق مهنتي لي 🌟.\nيسعدني التواصل معك لمزيد من التفاصيل حول فرصتي ومؤهلاتي.\n\nشكرًا جزيلًا على وقتك! 🙏";

  const handleCategoryClick = (name: string) => {
    setLoading(true); 
    setActiveCategory(name);
    onFullScreenToggle(true);
  };

  const handleBack = () => {
    setActiveCategory(null);
    onFullScreenToggle(false);
    setPosts([]);
  };

  // 1. Check Local Subscription State
  useEffect(() => {
      if (activeCategory) {
          const englishCategory = CATEGORY_TO_TOPIC_MAP[activeCategory] || 'other_haraj';
          const topicKey = `haraj_${englishCategory}`;
          const localSubs = JSON.parse(localStorage.getItem('user_subscriptions') || '{}');
          setIsSubscribed(!!localSubs[topicKey]);
      }
  }, [activeCategory]);

  // 2. Handle Subscribe / Unsubscribe Toggle
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
    const arabicCategory = activeCategory || '';
    const englishCategory = CATEGORY_TO_TOPIC_MAP[arabicCategory] || 'other_haraj';
    
    const topicKey = `haraj_${englishCategory}`;
    
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
          topic: 'haraj',
          category: englishCategory,
          subTopic: 'all'
        })
      });

      if (response.ok) {
        alert(newState 
            ? `✅ تم تفعيل إشعارات قسم "${t(arabicCategory)}" بنجاح!` 
            : `🔕 تم إلغاء تفعيل إشعارات قسم "${t(arabicCategory)}".`
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
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');

    // Removed the "&& token" check so guests can fetch posts
    if (activeCategory) {
      // Smooth loading logic
      if (posts.length === 0) {
          setLoading(true);
      } else {
          setIsRefetching(true);
      }

      const countryParam = currentLocation.country === 'عام' ? '' : encodeURIComponent(currentLocation.country);
      const cityParam = currentLocation.city ? encodeURIComponent(currentLocation.city) : '';
      const url = `${API_BASE_URL}/api/v1/posts?category=${encodeURIComponent(activeCategory)}&country=${countryParam}&city=${cityParam}`;
      
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch(url, { headers })
        .then(res => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then(data => {
          const postsArray = data.posts || [];
          if (Array.isArray(postsArray) && postsArray.length > 0) {
            // If logged in, filter out own posts. If guest, show all.
            const filteredPosts = postsArray.filter((p: any) => {
                const postUserId = p.user?._id || p.user?.id || p.user;
                return postUserId !== currentUserId;
            });

            const mappedPosts: Post[] = filteredPosts.map((p: any) => {
              let locationString = t('location_general');
              if (p.scope === 'local' && p.country) {
                 const postLoc = getDisplayLocation(p.country, p.city === 'كل المدن' ? null : p.city, language as 'ar'|'en');
                 locationString = postLoc.cityDisplay ? `${postLoc.countryDisplay} | ${postLoc.cityDisplay}` : postLoc.countryDisplay;
              }

                            const mappedMedia = Array.isArray(p.media)
                                ? p.media
                                        .map((m: any) => {
                                            const type = m?.type || (typeof m?.mime === 'string' && m.mime.toLowerCase().includes('video') ? 'video' : 'image');
                                            const url = cleanUrl(m?.url);
                                            const thumbnail = cleanUrl(m?.thumbnail);
                                            return url ? { url, type, thumbnail: thumbnail || undefined } : null;
                                        })
                                        .filter(Boolean) as Post['media']
                                : [];

                            const coverMedia = mappedMedia?.[0];
                            const fallbackImage = cleanUrl(p?.image);
                            const image = coverMedia
                                ? (coverMedia.type === 'video' ? (coverMedia.thumbnail || fallbackImage || undefined) : coverMedia.url)
                                : (fallbackImage || undefined);

                            return {
                id: p._id || p.id || Math.random().toString(),
                user: {
                  id: p.user?._id || 'u_h',
                  _id: p.user?._id, 
                  name: p.user?.name || 'بائع',
                                    avatar: cleanUrl(p.user?.avatar),
                },
                timeAgo: p.createdAt ? getRelativeTime(p.createdAt) : '',
                content: p.text || p.content || '',
                                image: image,
                                media: mappedMedia,
                likes: 0,
                comments: p.comments?.length || 0,
                shares: p.shares?.length || 0,
                location: locationString,
                category: p.category,
                isFeatured: p.isFeatured,
                title: p.title || undefined,
                contactPhone: p.contactPhone || '',
                contactEmail: p.contactEmail || '',
                contactMethods: p.contactMethods || [],
                repostsCount: p.repostsCount || 0,
                jobStatus: p.jobStatus || 'open',
              };
            });
            
            mappedPosts.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
            setPosts(mappedPosts);
          } else {
             setPosts([]);
          }
        })
        .catch(err => {
          console.error("Error fetching haraj posts", err);
          setPosts([]);
        })
        .finally(() => {
            setLoading(false);
            setIsRefetching(false);
        });
    }
  }, [activeCategory, currentLocation, language, t]);

  // Translation Handler
  const handleTranslate = async (post: Post) => {
      const postId = post.id;
      const currentTranslation = translations[postId];
      
      if (currentTranslation && currentTranslation.lang === translationTarget) {
          setTranslations(prev => ({
              ...prev,
              [postId]: { ...prev[postId], show: !prev[postId].show }
          }));
          return;
      }

      setTranslatingIds(prev => new Set(prev).add(postId));

      try {
          const target = translationTarget; 
          const textToTranslate = post.content;
          
          if (!textToTranslate) throw new Error("No text");

          const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=ar|${target}`);
          const data = await response.json();
          
          if (data.responseData && data.responseData.translatedText) { 
              setTranslations(prev => ({
                  ...prev,
                  [postId]: { 
                      text: data.responseData.translatedText, 
                      show: true, 
                      lang: target
                  }
              }));
          } else { 
              alert("Could not translate"); 
          }
      } catch (error) { 
          alert("Translation failed"); 
      } finally { 
          setTranslatingIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(postId);
              return newSet;
          });
      }
  };

  const handleShare = async () => {
      if (!menuPost) return;
      setMenuPost(null);
      if (navigator.share) {
          try { 
              await navigator.share({ 
                  title: menuPost.title || menuPost.user.name, 
                  text: menuPost.content, 
                  url: `${API_BASE_URL}/share/post/${menuPost.id}`
              }); 
          } catch (err) {}
      } else {
          navigator.clipboard.writeText(`${API_BASE_URL}/share/post/${menuPost.id}`);
          alert(t('copy_link') + " (تم النسخ)"); 
      }
  };

  const handleCopyLink = () => {
      if (!menuPost) return;
      navigator.clipboard.writeText(`${API_BASE_URL}/share/post/${menuPost.id}`);
      setMenuPost(null);
      alert(t('copy_link') + " (تم النسخ)");
  };

  const handleCopyContact = (text: string) => {
      navigator.clipboard.writeText(text);
      alert(t('copy_text') + ": " + text);
  };

  const currentCategoryData = HARAJ_CATEGORIES.find(c => c.name === activeCategory);
  const CategoryIcon = currentCategoryData ? currentCategoryData.icon : Store;

  const filteredLanguages = TARGET_LANGUAGES.filter(lang => 
    lang.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    lang.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  // --- 1. RENDER INSIDE CATEGORY (Active Category) ---
  if (activeCategory) {
    return (
      <div className="bg-[#f0f2f5] dark:bg-black min-h-screen">
        <div className="sticky top-0 z-[100] bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 shadow-sm">
           <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBack}
                className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowRight size={24} className={language === 'en' ? 'rotate-180' : ''} />
              </button>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentCategoryData?.lightColor || 'bg-gray-100'}`}>
                  <CategoryIcon size={20} className={currentCategoryData?.iconColor || 'text-gray-600'} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-800 dark:text-white">{t(activeCategory)}</h2>
                  <p className="text-[10px] text-gray-500">{t('haraj_latest_offers')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleToggleSubscribe}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
                    isSubscribed 
                    ? 'bg-orange-100 text-orange-600 shadow-inner ring-2 ring-orange-200' 
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
                <MapPin size={14} className="text-orange-600" />
                <span className="text-[10px] font-bold text-gray-700 truncate max-w-[100px]">
                  {getLocationLabel()}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={`flex flex-col gap-2 pb-20 pt-2 min-h-[80vh] transition-opacity duration-300 ${isRefetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
               <Loader2 size={40} className="text-orange-600 animate-spin" />
            </div>
          ) : posts.length > 0 ? (
             posts.map((post) => {
                const coverMedia = post.media?.[0];
                const isVideo = coverMedia?.type === 'video' && !!coverMedia.url;
                const coverImage = isVideo ? (coverMedia?.thumbnail || post.image) : (coverMedia?.url || post.image);

                return (
                <div key={post.id} className="relative bg-white dark:bg-[#1e1e1e] shadow-sm border-b border-gray-100 dark:border-gray-800">
                    
                    {/* 1. Top Cover Section (Image or Gradient) */}
                    <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-900 group overflow-hidden">
                        {isVideo ? (
                            <video
                                src={coverMedia?.url}
                                poster={coverMedia?.thumbnail || coverImage || undefined}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                loop
                            />
                        ) : coverImage ? (
                            <img 
                                src={coverImage} 
                                alt={post.title || "Haraj Item"} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className={`w-full h-full relative overflow-hidden ${getGradientClass(post.id)}`}>
                                {/* Decorative elements for overlap effect */}
                                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-3xl mix-blend-multiply"></div>
                                
                                <div className="flex flex-col items-center justify-center h-full text-white z-10 relative p-6 text-center">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-white/10">
                                        <Store className="w-7 h-7 text-white opacity-90" />
                                    </div>
                                    <span className="font-bold text-lg leading-tight drop-shadow-md">
                                        {post.title || t('haraj_subtitle')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Top Left: User Avatar */}
                        <div className="absolute top-3 left-3 z-20">
                            <div className="p-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer" onClick={() => post.user._id && onProfileClick?.(post.user._id)}>
                                <Avatar name={post.user.name} src={post.user.avatar} className="w-8 h-8 rounded-lg" textClassName="text-xs" />
                            </div>
                        </div>

                        {/* Top Right: Settings Icon */}
                        <div className="absolute top-3 right-3 z-20">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuPost(post);
                                }}
                                className="bg-black/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/50 transition-colors"
                            >
                                <MoreHorizontal size={16} />
                            </button>
                        </div>

                        {/* Side Icons */}
                        <div className="absolute right-3 bottom-10 flex flex-col gap-2 z-20">
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleTranslate(post); }}
                                className="bg-black/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-blue-600 transition-colors shadow-sm"
                            >
                                {translatingIds.has(post.id) ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Languages size={16} />
                                )}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsLangSheetOpen(true); }}
                                className="bg-black/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                <Settings size={16} />
                            </button>

                            <div className="bg-black/30 backdrop-blur-md p-2 rounded-full text-white shadow-sm border border-white/20">
                                <div className="w-4 h-4">
                                    <Logo className="w-full h-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Bottom Content Section */}
                    <div className="p-4 relative">
                        {/* Title & User */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1">
                                    {post.title || post.user.name}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <Building2 size={12} />
                                    <span>{post.user.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Badges Section */}
                        {(post.jobStatus === 'hired' || post.jobStatus === 'negotiating' || post.isFeatured || post.title) && (
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                {post.isFeatured && (
                                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-200 flex items-center gap-1">
                                        <Star size={10} fill="currentColor" /> {t('post_premium')}
                                    </span>
                                )}
                                {post.jobStatus === 'hired' && (
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border border-green-200">
                                        <CheckCircle size={10} /> {t('status_hired')}
                                    </span>
                                )}
                                {post.jobStatus === 'negotiating' && (
                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border border-yellow-200">
                                        <Clock size={10} /> {t('status_negotiating')}
                                    </span>
                                )}
                                {post.title && (
                                     <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-orange-100 flex items-center gap-1">
                                        <Tag size={10} />
                                        {t(post.title)}
                                     </span>
                                )}
                            </div>
                        )}

                        {/* Post Text */}
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 mb-3 whitespace-pre-wrap dir-auto">
                            {translations[post.id]?.show ? translations[post.id].text : post.content}
                        </p>

                        {/* Location & Time Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                                    <MapPin size={10} />
                                    <span className="truncate max-w-[80px]">{post.location}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock size={10} />
                                    <span>{post.timeAgo}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                     </div>
                     );
                 })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shadow-sm relative">
                   <Megaphone size={40} className="text-orange-500" strokeWidth={1.5} />
                   <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                     <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white">
                        <span className="text-lg font-bold leading-none mb-0.5">+</span>
                     </div>
                   </div>
                </div>
                <div className="text-center px-6">
                   <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 mb-2">{t('haraj_empty')}</h3>
                   <p className="text-gray-500 text-sm max-w-[240px] mx-auto leading-relaxed">
                      {t('be_first_to_post')} {t(activeCategory)}
                   </p>
                </div>
            </div>
          )}
        </div>

        {/* --- MENU TRAY (Bottom Sheet) --- */}
        {menuPost && createPortal(
            <div className="fixed inset-0 z-[10000] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMenuPost(null)} />
            <div className="bg-white w-full max-w-md rounded-t-3xl relative z-10 animate-in slide-in-from-bottom duration-300 pb-safe shadow-2xl overflow-hidden">
                
                <div className="flex justify-center pt-3 pb-2" onClick={() => setMenuPost(null)}>
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                <div className="p-5 pt-2 space-y-2">
                    
                    {/* Contact Option */}
                    {(menuPost.contactPhone || menuPost.contactEmail) && (
                        <button 
                            onClick={() => { setContactPost(menuPost); setMenuPost(null); }} 
                            className="w-full flex items-center gap-3 p-4 hover:bg-blue-50 rounded-2xl transition-colors text-blue-700 border border-gray-100"
                        >
                            <Phone size={22} className="text-blue-600" />
                            <span className="font-bold">{t('contact_header')}</span>
                        </button>
                    )}

                    <button onClick={handleCopyLink} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-gray-700 border border-gray-100">
                    <LinkIcon size={22} className="text-purple-600" />
                    <span className="font-bold">{t('copy_link')}</span>
                    </button>

                    <button onClick={handleShare} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-gray-700 border border-gray-100">
                    <Share2 size={22} className="text-green-600" />
                    <span className="font-bold">{t('share')}</span>
                    </button>

                    <button onClick={() => { onReport('post', menuPost.id, menuPost.user.name); setMenuPost(null); }} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-600 border border-gray-100">
                    <Flag size={22} />
                    <span className="font-bold">{t('report')}</span>
                    </button>
                    
                    <button onClick={() => setMenuPost(null)} className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-bold text-gray-800 transition-colors">
                    {t('cancel')}
                    </button>
                </div>
            </div>
            </div>, document.body
        )}

        {/* --- CONTACT DETAILS MODAL --- */}
        {contactPost && createPortal(
            <div className="fixed inset-0 z-[10001] flex items-end justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setContactPost(null)} />
                <div className="bg-white w-full max-w-md rounded-t-3xl relative z-10 animate-in slide-in-from-bottom duration-300 pb-safe p-6 shadow-2xl">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
                    <h3 className="font-bold text-xl text-center mb-6 text-gray-800">{t('contact_header')}</h3>
                    
                    <div className="space-y-4">
                        {/* Phone Section */}
                        {contactPost.contactPhone && (
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-center gap-2 mb-3 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <Phone size={14} />
                                    <span>{t('register_phone_label')}</span>
                                </div>
                                <p className="text-lg font-black text-gray-900 mb-4 dir-ltr text-center tracking-wide">
                                    {contactPost.contactPhone}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => handleCopyContact(contactPost.contactPhone!)}
                                        className="flex flex-col items-center justify-center gap-1 bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
                                    >
                                        <Copy size={20} className="text-gray-600" />
                                        <span className="text-[10px] font-bold text-gray-600">{t('copy')}</span>
                                    </button>
                                    <a 
                                        href={`tel:${contactPost.contactPhone}`}
                                        className="flex flex-col items-center justify-center gap-1 bg-blue-50 p-3 rounded-xl shadow-sm border border-blue-100 active:scale-95 transition-transform"
                                    >
                                        <Phone size={20} className="text-blue-600" />
                                        <span className="text-[10px] font-bold text-blue-600">{t('contact_method_call')}</span>
                                    </a>
                                    <a 
                                        href={`https://wa.me/${contactPost.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex flex-col items-center justify-center gap-1 bg-green-50 p-3 rounded-xl shadow-sm border border-green-100 active:scale-95 transition-transform"
                                    >
                                        <MessageCircle size={20} className="text-green-600" />
                                        <span className="text-[10px] font-bold text-green-600">WhatsApp</span>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Email Section */}
                        {contactPost.contactEmail && (
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-center gap-2 mb-3 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <Mail size={14} />
                                    <span>{t('email_label')}</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 mb-4 text-center break-all">
                                    {contactPost.contactEmail}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => handleCopyContact(contactPost.contactEmail!)}
                                        className="flex flex-col items-center justify-center gap-1 bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
                                    >
                                        <Copy size={20} className="text-gray-600" />
                                        <span className="text-[10px] font-bold text-gray-600">{t('copy')}</span>
                                    </button>
                                    <a 
                                        href={`mailto:${contactPost.contactEmail}`}
                                        className="flex flex-col items-center justify-center gap-1 bg-orange-50 p-3 rounded-xl shadow-sm border border-orange-100 active:scale-95 transition-transform"
                                    >
                                        <Mail size={20} className="text-orange-600" />
                                        <span className="text-[10px] font-bold text-orange-600">{t('contact_method_email')}</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button onClick={() => setContactPost(null)} className="w-full mt-6 py-4 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                        {t('close')}
                    </button>
                </div>
            </div>, document.body
        )}

        {/* --- LANGUAGE SELECTION SHEET --- */}
        {isLangSheetOpen && createPortal(
            <div className="fixed inset-0 z-[10002] flex items-end justify-center">
                <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setIsLangSheetOpen(false)} />
                <div className="bg-white w-full max-w-md h-[80vh] rounded-t-2xl relative z-10 animate-in slide-in-from-bottom duration-300 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">{t('translation_settings')}</h3>
                        <button type="button" onClick={() => setIsLangSheetOpen(false)} className="bg-gray-100 p-1 rounded-full"><X size={20} /></button>
                    </div>
                    
                    {/* Search Input */}
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
                            <span className="text-xs text-gray-500 font-bold mb-2 block">{t('source_lang')}</span>
                            <div className="flex items-center justify-between"><span className="font-bold text-gray-800">Auto Detect</span><Check size={18} className="text-gray-400" /></div>
                        </div>
                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b border-gray-100"><span className="text-xs text-gray-500 font-bold">{t('target_lang')}</span></div>
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
                                    <div className="p-4 text-center text-gray-400 text-sm">{t('search_no_results')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>, document.body
        )}

      </div>
    );
  }

  // --- 2. RENDER MAIN CATEGORIES LIST (No Bell Here) ---
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="bg-white dark:bg-[#121212] sticky top-0 z-10 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between bg-gradient-to-l from-orange-50 to-white dark:from-gray-900 dark:to-black">
           <div className="flex items-center gap-3">
             <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl">
               <Store size={24} className="text-orange-600 dark:text-orange-400" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('nav_haraj')}</h2>
               <p className="text-[10px] text-gray-500 font-medium">{t('haraj_subtitle')}</p>
             </div>
           </div>
           
           <div className="flex items-center gap-2">
             <button 
                onClick={onLocationClick}
                className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 py-1.5 px-3 rounded-full transition-colors border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <MapPin size={14} className="text-orange-600 dark:text-orange-400" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                  {getLocationLabel()}
                </span>
             </button>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-[1px] bg-gray-100 dark:bg-gray-800 mt-1">
        {HARAJ_CATEGORIES.map((cat, idx) => (
          <div 
            key={idx}
            onClick={() => handleCategoryClick(cat.name)}
            className="flex items-center justify-between p-3 bg-white dark:bg-[#121212] hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`${cat.color} p-2 rounded-lg shadow-sm dark:opacity-80`}>
                <cat.icon size={20} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{t(cat.name)}</span>
            </div>
            <ChevronLeft size={18} className={`text-gray-300 ${language === 'en' ? 'rotate-180' : ''}`} />
          </div>
        ))}
      </div>

      {/* --- MENU TRAY (Bottom Sheet) --- */}
      {menuPost && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMenuPost(null)} />
          <div className="bg-white w-full max-w-md rounded-t-3xl relative z-10 animate-in slide-in-from-bottom duration-300 pb-safe shadow-2xl overflow-hidden">
             
             <div className="flex justify-center pt-3 pb-2" onClick={() => setMenuPost(null)}>
               <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
             </div>

             <div className="p-5 pt-2 space-y-2">
                
                {/* Contact Option */}
                {(menuPost.contactPhone || menuPost.contactEmail) && (
                    <button 
                        onClick={() => { setContactPost(menuPost); setMenuPost(null); }} 
                        className="w-full flex items-center gap-3 p-4 hover:bg-blue-50 rounded-2xl transition-colors text-blue-700 border border-gray-100"
                    >
                        <Phone size={22} className="text-blue-600" />
                        <span className="font-bold">{t('contact_header')}</span>
                    </button>
                )}

                <button onClick={handleCopyLink} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-gray-700 border border-gray-100">
                   <LinkIcon size={22} className="text-purple-600" />
                   <span className="font-bold">{t('copy_link')}</span>
                </button>

                <button onClick={handleShare} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-gray-700 border border-gray-100">
                   <Share2 size={22} className="text-green-600" />
                   <span className="font-bold">{t('share')}</span>
                </button>

                <button onClick={() => { onReport('post', menuPost.id, menuPost.user.name); setMenuPost(null); }} className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-600 border border-gray-100">
                   <Flag size={22} />
                   <span className="font-bold">{t('report')}</span>
                </button>
                
                <button onClick={() => setMenuPost(null)} className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-bold text-gray-800 transition-colors">
                   {t('cancel')}
                </button>
             </div>
          </div>
        </div>, document.body
      )}

      {/* --- CONTACT DETAILS MODAL --- */}
      {contactPost && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setContactPost(null)} />
            <div className="bg-white w-full max-w-md rounded-t-3xl relative z-10 animate-in slide-in-from-bottom duration-300 pb-safe p-6 shadow-2xl">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
                <h3 className="font-bold text-xl text-center mb-6 text-gray-800">{t('contact_header')}</h3>
                
                <div className="space-y-4">
                    {/* Phone Section */}
                    {contactPost.contactPhone && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                <Phone size={14} />
                                <span>{t('register_phone_label')}</span>
                            </div>
                            <p className="text-lg font-black text-gray-900 mb-4 dir-ltr text-center tracking-wide">
                                {contactPost.contactPhone}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => handleCopyContact(contactPost.contactPhone!)}
                                    className="flex flex-col items-center justify-center gap-1 bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
                                >
                                    <Copy size={20} className="text-gray-600" />
                                    <span className="text-[10px] font-bold text-gray-600">{t('copy')}</span>
                                </button>
                                <a 
                                    href={`tel:${contactPost.contactPhone}`}
                                    className="flex flex-col items-center justify-center gap-1 bg-blue-50 p-3 rounded-xl shadow-sm border border-blue-100 active:scale-95 transition-transform"
                                >
                                    <Phone size={20} className="text-blue-600" />
                                    <span className="text-[10px] font-bold text-blue-600">{t('contact_method_call')}</span>
                                </a>
                                <a 
                                    href={`https://wa.me/${contactPost.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col items-center justify-center gap-1 bg-green-50 p-3 rounded-xl shadow-sm border border-green-100 active:scale-95 transition-transform"
                                >
                                    <MessageCircle size={20} className="text-green-600" />
                                    <span className="text-[10px] font-bold text-green-600">WhatsApp</span>
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Email Section */}
                    {contactPost.contactEmail && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                <Mail size={14} />
                                <span>{t('email_label')}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-4 text-center break-all">
                                {contactPost.contactEmail}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleCopyContact(contactPost.contactEmail!)}
                                    className="flex flex-col items-center justify-center gap-1 bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
                                >
                                    <Copy size={20} className="text-gray-600" />
                                    <span className="text-[10px] font-bold text-gray-600">{t('copy')}</span>
                                </button>
                                <a 
                                    href={`mailto:${contactPost.contactEmail}`}
                                    className="flex flex-col items-center justify-center gap-1 bg-orange-50 p-3 rounded-xl shadow-sm border border-orange-100 active:scale-95 transition-transform"
                                >
                                    <Mail size={20} className="text-orange-600" />
                                    <span className="text-[10px] font-bold text-orange-600">{t('contact_method_email')}</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
                
                <button onClick={() => setContactPost(null)} className="w-full mt-6 py-4 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                    {t('close')}
                </button>
            </div>
        </div>, document.body
      )}

      {/* --- LANGUAGE SELECTION SHEET --- */}
      {isLangSheetOpen && createPortal(
        <div className="fixed inset-0 z-[10002] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setIsLangSheetOpen(false)} />
            <div className="bg-white w-full max-w-md h-[80vh] rounded-t-2xl relative z-10 animate-in slide-in-from-bottom duration-300 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">{t('translation_settings')}</h3>
                    <button type="button" onClick={() => setIsLangSheetOpen(false)} className="bg-gray-100 p-1 rounded-full"><X size={20} /></button>
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
                        <span className="text-xs text-gray-500 font-bold mb-2 block">{t('source_lang')}</span>
                        <div className="flex items-center justify-between"><span className="font-bold text-gray-800">Auto Detect</span><Check size={18} className="text-gray-400" /></div>
                    </div>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b border-gray-100"><span className="text-xs text-gray-500 font-bold">{t('target_lang')}</span></div>
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
                                <div className="p-4 text-center text-gray-400 text-sm">{t('search_no_results')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>, document.body
      )}

    </div>
  );
};

export default HarajView;
