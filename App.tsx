
import React, { useState, useEffect, useRef } from 'react';
import { messaging, getToken, onMessage } from './firebase-init'; // Import Firebase Messaging
import Header from './components/Header';
import CreatePostBar from './components/CreatePostBar';
import Stories from './components/Stories';
import PostCard from './components/PostCard';
import BottomNav from './components/BottomNav';
import CreatePostModal from './components/CreatePostModal';
import CreateStoryModal from './components/CreateStoryModal';
import ReportModal from './components/ReportModal';
import LocationDrawer from './components/LocationDrawer';
import JobsView from './components/JobsView';
import HarajView from './components/HarajView';
import NotificationsView, { clearNotificationsCache } from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import ProfileView, { clearProfileCache } from './components/ProfileView';
import LoginPage from './components/LoginPage';
import SuggestedList, { SuggestedItem } from './components/SuggestedList';
import SuggestedUsersView from './components/SuggestedUsersView';
import PostDetailView, { clearPostDetailsCache } from './components/PostDetailView';
import PostUploadIndicator from './components/PostUploadIndicator';
import WelcomeCelebration from './components/WelcomeCelebration';
import GlobalJobsView from './components/GlobalJobsView'; 
import UrgentJobsView from './components/UrgentJobsView';
import CVBuilderWizard from './components/CVBuilderWizard';
import AIChatView from './components/AIChatView';
import SearchView from './components/SearchView'; 
import { Post } from './types';
import { API_BASE_URL } from './constants';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  
  // CV / ID Card State
  const [isCVWizardOpen, setIsCVWizardOpen] = useState(false);
  const [userCV, setUserCV] = useState<any>(() => {
      const saved = localStorage.getItem('user_cv_card');
      return saved ? JSON.parse(saved) : null;
  });

  // AI Chat & Search State
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // New Search State

  const [activeTab, setActiveTab] = useState('home');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isLocationDrawerOpen, setIsLocationDrawerOpen] = useState(false);

  useEffect(() => {
    const metaThemeColor = document.getElementById('theme-color-meta');
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      html.style.backgroundColor = '#000000'; 
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#000000');
    } else {
      html.classList.remove('dark');
      html.style.backgroundColor = '#f3f4f6';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#f3f4f6');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {}, { enableHighAccuracy: true });
    }
  }, []);

  useEffect(() => {
    if (token) {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        setTimeout(() => setShowWelcome(true), 500);
      }
    }
  }, [token]);

  // === FIREBASE NOTIFICATION INIT ===
  useEffect(() => {
    const initFirebaseNotifications = async () => {
      if (!token || !messaging) return;
      
      try {
        // 1. Request Permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // 2. Get Token
          // NOTE: You need to generate a VAPID key in Firebase Console -> Cloud Messaging -> Web Config
          // and put it in your .env file as VITE_FIREBASE_VAPID_KEY
          const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;
          
          if (getToken) {
             const fcmToken = await getToken(messaging, { vapidKey });
             if (fcmToken) {
               console.log('✅ FCM Token:', fcmToken);
               localStorage.setItem('fcmToken', fcmToken);
               // Optional: Send to backend to update user profile
             }
          }

          // 3. Listen for foreground messages
          if (onMessage) {
            onMessage(messaging, (payload: any) => {
              console.log('Foreground Message:', payload);
              if (payload.notification) {
                // You can show a custom toast here
                new Notification(payload.notification.title || 'إشعار جديد', {
                  body: payload.notification.body,
                  icon: '/logo.png'
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Firebase Notification Error:', error);
      }
    };

    // Delay slightly to not block initial render
    const timer = setTimeout(initFirebaseNotifications, 2000);
    return () => clearTimeout(timer);
  }, [token]);
  // ===================================

  useEffect(() => {
    if (!token) return;
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/notifications/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadNotificationsCount(data.unreadCount || 0);
        }
      } catch (error) { console.error("Failed to fetch unread count", error); }
    };
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalId);
  }, [token]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.add('disable-transitions');
    setIsDarkMode(prev => !prev);
    window.setTimeout(() => document.documentElement.classList.remove('disable-transitions'), 0);
  };
  
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [suggestedViewType, setSuggestedViewType] = useState<'company' | 'person' | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);
  const [reportData, setReportData] = useState<{isOpen: boolean; type: 'post' | 'comment' | 'reply' | 'video'; id: string; name: string;}>({ isOpen: false, type: 'post', id: '', name: '' });
  const [isReporting, setIsReporting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedPeople, setSuggestedPeople] = useState<SuggestedItem[]>([]);
  const [suggestedCompanies, setSuggestedCompanies] = useState<SuggestedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [pendingPost, setPendingPost] = useState<Post | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'publishing' | 'success' | 'error'>('publishing');
  const [postUploadProgress, setPostUploadProgress] = useState(0);
  const [postErrorMsg, setPostErrorMsg] = useState<string>('');

  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [storyUploadProgress, setStoryUploadProgress] = useState(0); 
  const [pendingStory, setPendingStory] = useState<{ type: 'text'|'image'|'video', content: string, color?: string } | null>(null);

  const [currentLocation, setCurrentLocation] = useState<{ country: string; city: string | null }>({ country: 'عام', city: null });

  const handleLogout = () => {
    clearNotificationsCache();
    clearProfileCache();
    clearPostDetailsCache();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('user_cv_card'); 
    setIsSettingsOpen(false);
    setIsNotificationsOpen(false);
    setIsAIChatOpen(false); 
    setIsSearchOpen(false); // Close Search
    setViewingProfileId(null);
    setSelectedNotification(null);
    setSuggestedViewType(null);
    setActiveTab('home'); 
    setUserCV(null);
    setPosts([]); 
    setUnreadNotificationsCount(0);
    setIsLoading(true); 
    setToken(null);
  };

  const handleLocationSelect = (country: string, city: string | null) => setCurrentLocation({ country, city });
  const handleSetActiveTab = (newTab: string) => activeTab !== newTab && setActiveTab(newTab);
  const handleOpenProfile = (userId: string | null = null) => setViewingProfileId(userId || 'me');
  const handleReport = (type: 'post' | 'comment' | 'reply' | 'video', id: string, name: string) => setReportData({ isOpen: true, type, id, name });

  const handleSubmitReport = async (reason: string) => {
    const token = localStorage.getItem('token');
    if (!token) { alert("يرجى تسجيل الدخول للإبلاغ."); return; }
    setIsReporting(true);
    try {
        const typeToSend = reportData.type === 'video' ? 'post' : reportData.type;
        const payload = { 
            reportType: typeToSend, 
            targetId: reportData.id, 
            reason: reason, 
            details: reason, 
            media: [], 
            loadingDate: null, 
            unloadingDate: null 
        };
        const response = await fetch(`${API_BASE_URL}/api/v1/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            alert(t('post_report_success'));
            setReportData(prev => ({ ...prev, isOpen: false }));
        } else {
            alert("فشل إرسال البلاغ.");
        }
    } catch (error) { alert("حدث خطأ في الاتصال."); }
    finally { setIsReporting(false); }
  };

  const mapApiPostToUI = (apiPost: any): Post => {
    let locationString = 'عام';
    if (apiPost.scope === 'local' && apiPost.country) {
      locationString = apiPost.city && apiPost.city !== 'كل المدن' ? `${apiPost.country} | ${apiPost.city}` : apiPost.country;
    }
    const currentUserId = localStorage.getItem('userId');
    const reactions = Array.isArray(apiPost.reactions) ? apiPost.reactions : [];
    const isLiked = reactions.some((r: any) => String(r.user?._id || r.user || r) === String(currentUserId));

    let originalPost: Post | undefined = undefined;
    if (apiPost.originalPost) {
      originalPost = mapApiPostToUI(apiPost.originalPost);
    }

    const getRelativeTime = (dateStr: string) => {
        if (!dateStr) return 'الآن';
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'الآن';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} د`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} س`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} يوم`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} شهر`;
        const years = Math.floor(months / 12);
        return `${years} سنة`;
    };

    let displayTitle = apiPost.title;
    const hiddenTitles = ['ابحث عن وظيفة', 'أبحث عن وظيفة', 'ابحث عن موظفين', 'أبحث عن موظفين'];
    if (displayTitle && hiddenTitles.some(ht => ht === displayTitle.trim())) {
        displayTitle = undefined;
    }

    return {
      id: apiPost._id || apiPost.id || Math.random().toString(36).substr(2, 9),
      user: {
        id: apiPost.user?._id || 'u_unknown',
        _id: apiPost.user?._id, 
        name: apiPost.user?.name || 'مستخدم', 
        avatar: apiPost.user?.avatar ? (apiPost.user.avatar.startsWith('http') ? apiPost.user.avatar : `${API_BASE_URL}${apiPost.user.avatar}`) : null, 
      },
      timeAgo: apiPost.createdAt ? getRelativeTime(apiPost.createdAt) : 'الآن',
      createdAt: apiPost.createdAt,
      content: apiPost.text || apiPost.content || '',
      image: apiPost.media && apiPost.media.length > 0 ? (apiPost.media[0].url.startsWith('http') ? apiPost.media[0].url : `${API_BASE_URL}${apiPost.media[0].url}`) : undefined,
      media: apiPost.media ? apiPost.media.map((m: any) => ({ url: m.url.startsWith('http') ? m.url : `${API_BASE_URL}${m.url}`, type: m.type, thumbnail: m.thumbnail })) : [],
      likes: reactions.filter((r: any) => !r.type || r.type === 'like').length,
      comments: apiPost.comments?.length || 0,
      shares: apiPost.shares?.length || 0,
      repostsCount: apiPost.repostsCount || 0,
      jobStatus: apiPost.jobStatus || 'open',
      title: displayTitle,
      type: apiPost.type,
      location: locationString,
      country: apiPost.country,
      city: apiPost.city,
      category: apiPost.category,
      isFeatured: apiPost.isFeatured,
      contactPhone: apiPost.contactPhone,
      contactEmail: apiPost.contactEmail,
      contactMethods: apiPost.contactMethods,
      isLiked,
      reactions,
      isShort: apiPost.isShort || false,
      originalPost,
    };
  };

  const uploadFiles = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/upload/multiple`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.msg || 'فشل رفع الملفات');
    }
    const result = await response.json();
    return result.files;
  };

  const handlePostSubmit = async (postPayload: any) => {
    const promotionType = postPayload.promotionType;
    const payloadToSend = { ...postPayload };
    delete payloadToSend.promotionType;

    const tempPost: Post = {
        id: 'temp-pending',
        user: { id: localStorage.getItem('userId') || 'me', _id: localStorage.getItem('userId') || 'me', name: localStorage.getItem('userName') || 'مستخدم', avatar: localStorage.getItem('userAvatar') || undefined },
        timeAgo: 'الآن', content: postPayload.content || postPayload.text || '', likes: 0, comments: 0, shares: 0,
        image: postPayload.rawMedia?.[0] ? URL.createObjectURL(postPayload.rawMedia[0]) : (postPayload.media?.[0]?.url),
        media: postPayload.rawMedia ? postPayload.rawMedia.map((f: File) => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video') ? 'video' : 'image' })) : []
    };

    setPendingPost(tempPost); 
    setPendingStatus('publishing'); 
    setPostErrorMsg('');
    setPostUploadProgress(0); // Initialize progress to 0
    setIsCreateModalOpen(false); 
    
    // FORCE HOME REDIRECT: Even if it's urgent, go to Home to show upload status nicely
    setActiveTab('home');
    
    const performBackgroundUpload = async () => {
      // 1. Simulate "Spinning" Phase (Delayed Start)
      // We keep progress at 0 for 1.5 seconds to show "Connecting/Preparing" state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Start Counting Phase
      const progressInterval = setInterval(() => {
          setPostUploadProgress(prev => {
              if (prev >= 90) return prev; // Cap at 90 until real success
              return prev + 5;
          });
      }, 100); // Increment every 100ms

      try {
        let finalPayload = { ...payloadToSend }; 
        if (postPayload.rawMedia?.length > 0) {
            const uploaded = await uploadFiles(postPayload.rawMedia);
            finalPayload.media = uploaded.map((f: any) => ({ url: f.filePath, type: f.fileType }));
            delete finalPayload.rawMedia;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(finalPayload)
        });
        
        if (response.ok) {
          const data = await response.json();
          const post = data.post || data; 
          const postId = post._id || post.id;

          if (postId && promotionType) {
              try {
                  await fetch(`${API_BASE_URL}/api/payment/promote/${postId}`, {
                      method: 'POST',
                      headers: { 
                          'Content-Type': 'application/json', 
                          'Authorization': `Bearer ${localStorage.getItem('token')}` 
                      },
                      body: JSON.stringify({ promotionType: promotionType })
                  });
              } catch (promoError) {
                  console.error("Promotion failed:", promoError);
              }
          }

          clearInterval(progressInterval);
          setPostUploadProgress(100); // Snap to 100 on success
          
          // Small delay to let the user see 100% before showing success check
          setTimeout(() => {
              setPendingStatus('success');
              // Clear pending post after showing success
              setTimeout(() => setPendingPost(null), 3000); 
          }, 500);

        } else {
          clearInterval(progressInterval);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.msg || "فشل النشر من الخادم");
        }
      } catch (error: any) {
        clearInterval(progressInterval);
        setPendingStatus('error');
        setPostErrorMsg(error.message);
        setTimeout(() => setPendingPost(null), 10000);
      }
    };
    performBackgroundUpload();
  };

  const handleStoryPost = async (storyPayload: any) => {
      setIsCreateStoryOpen(false);
      setIsUploadingStory(true);
      setStoryUploadProgress(0); 
      
      if (storyPayload.type === 'text') {
          setPendingStory({ type: 'text', content: storyPayload.text, color: storyPayload.backgroundColor });
      } else if (storyPayload.file) {
          const file = storyPayload.file;
          const url = URL.createObjectURL(file);
          const type = file.type.startsWith('video') ? 'video' : 'image';
          setPendingStory({ type, content: url });
      }

      setStoriesRefreshKey(prev => prev + 1);

      const progressInterval = setInterval(() => {
          setStoryUploadProgress(prev => {
              if (prev >= 90) return prev;
              return prev + (Math.random() * 5); 
          });
      }, 300);

      try {
          const token = localStorage.getItem('token');
          const formData = new FormData();

          if (storyPayload.type === 'text') {
              formData.append('text', storyPayload.text || '');
              if (storyPayload.backgroundColor) {
                  formData.append('backgroundColor', storyPayload.backgroundColor);
              }
          } else if (storyPayload.type === 'media' && storyPayload.file) {
              formData.append('file', storyPayload.file);
              if (storyPayload.text) formData.append('text', storyPayload.text);
              if (storyPayload.trimData) {
                  formData.append('trimStart', storyPayload.trimData.start.toString());
                  formData.append('trimEnd', storyPayload.trimData.end.toString());
              }
              if (storyPayload.overlays && storyPayload.overlays.length > 0) {
                  formData.append('overlays', JSON.stringify(storyPayload.overlays));
              }
              if (storyPayload.filter) {
                  formData.append('filter', storyPayload.filter);
              }
              if (storyPayload.mediaScale) {
                  formData.append('mediaScale', storyPayload.mediaScale.toString());
              }
              if (storyPayload.objectFit) {
                  formData.append('objectFit', storyPayload.objectFit);
              }
          }

          const response = await fetch(`${API_BASE_URL}/api/v1/stories`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
          });

          clearInterval(progressInterval); 

          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || errorData.msg || "Story creation failed");
          }
          
          setStoryUploadProgress(100); 

      } catch (error: any) {
          console.error(error);
          alert(error.message || t('story_upload_error'));
          clearInterval(progressInterval);
          setStoryUploadProgress(0);
      } finally {
          setIsUploadingStory(false);
          setPendingStory(null); 
          setStoriesRefreshKey(prev => prev + 1); 
      }
  };

  const handleCVSubmit = async (data: any) => {
      const cvData = { ...data };
      if (cvData.photoFile) delete cvData.photoFile; 
      if (cvData.cvFile) delete cvData.cvFile;

      localStorage.setItem('user_cv_card', JSON.stringify(cvData));
      setUserCV(cvData);

      const payload: any = {
          content: `**${data.fullName}**\n${data.jobTitle}\n\nالعمر: ${data.age || 'غير محدد'}\nاللغات: ${data.languages || 'غير محدد'}\nالخبرات: ${data.companies || 'لا يوجد'}\nالتعليم: ${data.education || 'غير محدد'}\n\nللتواصل:\n${data.contactPhone ? `هاتف: ${data.contactPhone}` : ''}\n${data.contactEmail ? `بريد: ${data.contactEmail}` : ''}`,
          title: data.jobTitle,
          type: 'general',
          category: 'سير ذاتية',
          displayPage: 'jobs',
          scope: 'global',
          isFeatured: data.isPremium,
          promotionType: data.promotionType,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          contactMethods: data.contactMethods,
          rawMedia: []
      };

      if (data.photoFile) payload.rawMedia.push(data.photoFile);
      handlePostSubmit(payload);
  };

  const handleDeleteCV = () => {
      localStorage.removeItem('user_cv_card');
      setUserCV(null);
      setIsCVWizardOpen(false); 
  };

  const handleOpenNotifications = () => { setIsNotificationsOpen(true); setUnreadNotificationsCount(0); };

  // --- FIXED FETCHING LOGIC FOR HOME FEED ---
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      // Only set loading if we don't have posts to avoid flicker
      if (posts.length === 0) setIsLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const countryParam = currentLocation.country === 'عام' ? '' : encodeURIComponent(currentLocation.country);
        const cityParam = currentLocation.city ? encodeURIComponent(currentLocation.city) : '';
        
        // This endpoint returns ALL posts by default unless filtered
        const postsRes = await fetch(`${API_BASE_URL}/api/v1/posts?country=${countryParam}&city=${cityParam}`, { headers });
        
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          const postsArray = postsData.posts || postsData;
          if (Array.isArray(postsArray)) {
            const currentUserId = localStorage.getItem('userId');
            
            // Filter out shorts, map to UI, and remove 'urgent' specific posts from Home Feed
            // to keep home clean, but allowing ALL other posts (undefined, null, 'home', 'all')
            const feedPosts = postsArray
                .filter((p: any) => !p.isShort && p.displayPage !== 'urgent') 
                .map(mapApiPostToUI)
                .filter((post: Post) => post.user._id !== currentUserId)
                .sort((a: Post, b: Post) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
                
            setPosts(feedPosts);
          }
        }
        
        // Fetch suggested users (unchanged)
        const usersRes = await fetch(`${API_BASE_URL}/api/v1/users?limit=1000`, { headers });
        if(usersRes.ok) {
          const data = await usersRes.json();
          if (data.users) {
            setSuggestedPeople(data.users.filter((u: any) => u.userType === 'individual').map((u:any)=>({id:u._id, name:u.name, subtitle:u.email, avatar:u.avatar?(u.avatar.startsWith('http')?u.avatar:`${API_BASE_URL}${u.avatar}`):null})));
            setSuggestedCompanies(data.users.filter((u: any) => u.userType === 'company').map((u:any)=>({id:u._id, name:u.name, subtitle:u.email, avatar:u.avatar?(u.avatar.startsWith('http')?u.avatar:`${API_BASE_URL}${u.avatar}`):null})));
          }
        }
      } catch (error) { console.error(error); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [token, currentLocation]); // activeTab removed to prevent unnecessary re-fetches

  if (!token) return <LoginPage onLoginSuccess={setToken} />;

  const isAnyModalOpen = isCreateModalOpen || isCreateStoryOpen || reportData.isOpen || isLocationDrawerOpen || isCVWizardOpen || isAIChatOpen || isSearchOpen;
  const isHomeActive = activeTab === 'home' && !viewingProfileId && !isSettingsOpen && !isNotificationsOpen && !selectedNotification && !suggestedViewType && !isAnyModalOpen;
  const isWorldActive = activeTab === 'world';

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-black max-w-md mx-auto shadow-2xl overflow-hidden relative transition-colors duration-200">
      {showWelcome && <WelcomeCelebration onClose={handleCloseWelcome} />}
      
      {pendingPost && !pendingPost.isShort && (
         <PostUploadIndicator 
            status={pendingStatus} 
            contentPreview={pendingPost.content} 
            errorMessage={postErrorMsg}
            progress={postUploadProgress} // Pass progress
         />
      )}
      {isCreateModalOpen && <CreatePostModal onClose={() => setIsCreateModalOpen(false)} onPostSubmit={handlePostSubmit} />}
      
      {isCreateStoryOpen && <CreateStoryModal onClose={() => setIsCreateStoryOpen(false)} onPost={handleStoryPost} />}
      
      {isCVWizardOpen && (
          <CVBuilderWizard 
              onClose={() => setIsCVWizardOpen(false)} 
              onSubmit={handleCVSubmit} 
              existingCV={userCV} 
              onDeleteCV={handleDeleteCV}
          />
      )}

      {/* AI Chat View */}
      {isAIChatOpen && (
          <AIChatView onClose={() => setIsAIChatOpen(false)} />
      )}

      {/* NEW: Search View */}
      {isSearchOpen && (
          <SearchView onClose={() => setIsSearchOpen(false)} />
      )}

      <ReportModal isOpen={reportData.isOpen} onClose={() => setReportData(prev => ({ ...prev, isOpen: false }))} onSubmit={handleSubmitReport} targetName={reportData.name} targetType={reportData.type} isSubmitting={isReporting} />
      {isLocationDrawerOpen && <LocationDrawer onClose={() => setIsLocationDrawerOpen(false)} onSelect={handleLocationSelect} />}
      {viewingProfileId && <ProfileView userId={viewingProfileId === 'me' ? undefined : viewingProfileId} onClose={() => setViewingProfileId(null)} onReport={handleReport} onLogout={handleLogout} />}
      {isSettingsOpen && <SettingsView onClose={() => setIsSettingsOpen(false)} onProfileClick={() => handleOpenProfile('me')} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />}
      {suggestedViewType && <SuggestedUsersView initialTab={suggestedViewType === 'company' ? 'companies' : 'individuals'} people={suggestedPeople} companies={suggestedCompanies} onBack={() => setSuggestedViewType(null)} isLoading={isLoading} onProfileClick={handleOpenProfile} />}
      {isNotificationsOpen && <div className="absolute inset-0 z-50 bg-white"><NotificationsView onClose={() => setIsNotificationsOpen(false)} onNotificationClick={setSelectedNotification} onProfileClick={handleOpenProfile} /></div>}
      {selectedNotification && selectedNotification.category === 'post' && <PostDetailView notification={selectedNotification} onBack={() => setSelectedNotification(null)} />}
      
      <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-hidden relative">
          <div className={`view ${activeTab === 'home' ? 'active' : ''}`}>
            <div className={`h-full native-scroll no-scrollbar ${!isFullScreen ? 'pb-20' : ''}`}>
              {!isFullScreen && (
                <div className="bg-white shadow-sm mb-2">
                  <Header 
                    currentLocation={currentLocation} 
                    onLocationClick={() => setIsLocationDrawerOpen(true)} 
                    onNotificationsClick={handleOpenNotifications} 
                    onSettingsClick={() => setIsSettingsOpen(true)} 
                    onDiscoveryClick={() => {}} 
                    onAddCVClick={() => setIsCVWizardOpen(true)}
                    onAIChatClick={() => setIsAIChatOpen(true)}
                    onSearchClick={() => setIsSearchOpen(true)} // Handle Search Click
                    unreadCount={unreadNotificationsCount} 
                  />
                  <CreatePostBar onOpen={() => setIsCreateModalOpen(true)} />
                </div>
              )}
              <Stories 
                  onCreateStory={() => setIsCreateStoryOpen(true)} 
                  refreshKey={storiesRefreshKey} 
                  isUploading={isUploadingStory}
                  uploadProgress={storyUploadProgress}
                  pendingStory={pendingStory} 
              />
              {isLoading ? (
                <div className="flex flex-col mt-2">{[1, 2, 3].map(i => <div key={i} className="bg-white mb-3 shadow-sm py-4 px-4 relative overflow-hidden"><div className="animate-pulse flex flex-col gap-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div><div className="flex-1 space-y-2"><div className="h-2.5 bg-gray-200 rounded w-1/4"></div><div className="h-2 bg-gray-100 rounded w-1/6"></div></div></div><div className="space-y-3 pt-2"><div className="h-2.5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full w-full"></div><div className="h-2.5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full w-[95%]"></div><div className="h-2.5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full w-[90%]"></div><div className="h-2.5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full w-[60%]"></div></div></div></div>)}</div>
              ) : (
                <>
                  <div className="flex flex-col gap-1 mt-2">
                    {posts.map(post => <PostCard key={post.id} post={post} onReport={handleReport} onProfileClick={handleOpenProfile} isActive={isHomeActive} />)}
                  </div>
                  {posts.length > 0 ? <div className="p-4 text-center text-gray-400 text-sm"><p>{t('no_more_posts')}</p></div> : <div className="p-10 text-center text-gray-400 flex flex-col items-center"><p>{t('no_posts_home')}</p><button onClick={() => setIsCreateModalOpen(true)} className="mt-4 text-blue-600 font-bold text-sm">{t('be_first_post')}</button></div>}
                </>
              )}
            </div>
          </div>
          <div className={`view ${activeTab === 'jobs' ? 'active' : ''}`}>
             <div className={`h-full native-scroll no-scrollbar ${!isFullScreen ? 'pb-20' : ''}`}>
                <JobsView onFullScreenToggle={setIsFullScreen} currentLocation={currentLocation} onLocationClick={() => setIsLocationDrawerOpen(true)} onReport={handleReport} onProfileClick={handleOpenProfile} />
             </div>
          </div>
          
          {/* Urgent Jobs View */}
          <div className={`view ${activeTab === 'urgent' ? 'active' : ''}`}>
             <div className={`h-full native-scroll no-scrollbar ${!isFullScreen ? 'pb-20' : ''}`}>
                <UrgentJobsView 
                    onFullScreenToggle={setIsFullScreen} 
                    currentLocation={currentLocation} 
                    onLocationClick={() => setIsLocationDrawerOpen(true)} 
                    onReport={handleReport} 
                    onProfileClick={handleOpenProfile} 
                />
             </div>
          </div>

          <div className={`view ${activeTab === 'haraj' ? 'active' : ''}`}>
             <div className={`h-full native-scroll no-scrollbar ${!isFullScreen ? 'pb-20' : ''}`}>
                <HarajView onFullScreenToggle={setIsFullScreen} currentLocation={currentLocation} onLocationClick={() => setIsLocationDrawerOpen(true)} onReport={handleReport} onProfileClick={handleOpenProfile} />
             </div>
          </div>
          <div className={`view ${activeTab === 'world' ? 'active' : ''}`}>
             <div className={`h-full native-scroll no-scrollbar ${!isFullScreen ? 'pb-20' : ''}`}>
                <GlobalJobsView isActive={isWorldActive} />
             </div>
          </div>
        </main>
        {!isFullScreen && !isSettingsOpen && !viewingProfileId && !isNotificationsOpen && !selectedNotification && !suggestedViewType && <BottomNav activeTab={activeTab} setActiveTab={handleSetActiveTab} onOpenCreate={() => setIsCreateModalOpen(true)} />}
      </div>
    </div>
  );
};

const App: React.FC = () => <LanguageProvider><AppContent /></LanguageProvider>;
export default App;
