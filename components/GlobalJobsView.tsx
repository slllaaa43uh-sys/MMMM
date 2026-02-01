import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Globe, Loader2, AlertTriangle, ShieldAlert, Bell, BellOff
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../constants';
import { Post } from '../types';
import GlobalJobCard from './GlobalJobCard';
import ReportModal from './ReportModal';

const GlobalJobsView: React.FC<{ 
  isActive: boolean; 
  onReport: (type: 'post' | 'comment' | 'reply' | 'video', id: string, name: string) => void;
  onProfileClick?: (userId: string) => void 
}> = ({ isActive, onReport, onProfileClick }) => {
  const { t, language } = useLanguage();
  
  // Posts State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Modal State
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{type: 'post' | 'comment' | 'reply' | 'video', id: string, name: string} | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Check notification preference on mount
  useEffect(() => {
    const pref = localStorage.getItem('globalJobsNotifications');
    setNotificationsEnabled(pref === 'true');
  }, []);

  // Fetch Global Jobs
  const fetchJobs = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      
      const endpoint = API_BASE_URL
        ? `${API_BASE_URL}/api/v1/posts?isGlobalJob=true&page=${pageNum}&limit=20`
        : `/api/v1/posts?isGlobalJob=true&page=${pageNum}&limit=20`;

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        const postsArray = data.posts || data.data || [];
        
        // Map API response to Post interface
        const mappedPosts = postsArray.map((p: any) => ({
          id: p._id || p.id,
          _id: p._id,
          user: {
            id: p.user?._id || p.user?.id || p.userId,
            _id: p.user?._id || p.userId,
            name: p.user?.name || p.userName || 'مستخدم',
            avatar: p.user?.avatar || p.userAvatar || ''
          },
          timeAgo: p.timeAgo || 'الآن',
          createdAt: p.createdAt,
          content: p.content || '',
          media: p.media,
          likes: p.likes || p.likesCount || 0,
          comments: p.comments || p.commentsCount || 0,
          shares: p.shares || p.sharesCount || 0,
          isLiked: p.isLiked || false,
          isGlobalJob: true,
          globalJobData: p.globalJobData
        }));

        if (pageNum === 1) {
          setPosts(mappedPosts);
        } else {
          setPosts(prev => [...prev, ...mappedPosts]);
        }
        
        setHasMore(mappedPosts.length > 0 && postsArray.length >= 20);
      }
    } catch (error) {
      console.error('Error fetching global jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    if (isActive) {
      fetchJobs(1);
    }
  }, [isActive, fetchJobs]);

  // Apply Click Handler
  const handleApplyClick = (url: string) => {
    setPendingUrl(url);
  };

  const confirmNavigation = () => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
      setPendingUrl(null);
    }
  };

  const handleReportOpen = (type: 'post' | 'comment' | 'reply' | 'video', id: string, name: string) => {
    setReportData({type, id, name});
  };

  const handleReportClose = () => {
    setReportData(null);
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reportData) return;
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/v1/reports` : '/api/v1/reports';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: reportData.type,
          targetId: reportData.id,
          reason,
          details: reason
        })
      });

      if (response.ok) {
        alert(language === 'ar' ? 'تم إرسال البلاغ بنجاح' : 'Report submitted successfully');
        handleReportClose();
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Report error:', error);
      alert(language === 'ar' ? 'فشل إرسال البلاغ' : 'Failed to submit report');
    }
  };

  const toggleNotifications = async () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('globalJobsNotifications', newState.toString());

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const endpoint = API_BASE_URL 
        ? `${API_BASE_URL}/api/v1/users/preferences` 
        : '/api/v1/users/preferences';
      
      await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notifyGlobalJobs: newState
        })
      });

      alert(newState 
        ? (language === 'ar' ? '✅ تم تفعيل إشعارات الوظائف العالمية' : '✅ Global jobs notifications enabled')
        : (language === 'ar' ? '🔕 تم إيقاف إشعارات الوظائف العالمية' : '🔕 Global jobs notifications disabled')
      );
    } catch (error) {
      console.error('Failed to update notification preference:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header - Simple like other pages */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <Globe size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {language === 'ar' ? 'الوظائف العالمية' : 'Global Jobs'}
              </h1>
            </div>
          </div>
          
          {/* Bell Icon for Notifications */}
          <button
            onClick={toggleNotifications}
            className={`p-2 rounded-full transition-all ${
              notificationsEnabled 
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={notificationsEnabled 
              ? (language === 'ar' ? 'إيقاف الإشعارات' : 'Disable notifications')
              : (language === 'ar' ? 'تفعيل الإشعارات' : 'Enable notifications')
            }
          >
            {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Loading State */}
        {loading && page === 1 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-blue-500 mb-3" />
            <p className="text-gray-500 text-sm font-medium">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Globe size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {language === 'ar' ? 'لا توجد وظائف حالياً' : 'No jobs available'}
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {language === 'ar' ? 'سيتم عرض الوظائف العالمية هنا' : 'Global jobs will appear here'}
            </p>
          </div>
        )}

        {/* Jobs List */}
        {!loading && posts.length > 0 && (
          <div>
            {posts.map(post => (
              <GlobalJobCard
                key={post.id}
                post={post}
                onApplyClick={handleApplyClick}
                onReport={handleReportOpen}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 flex justify-center">
                <button 
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchJobs(nextPage);
                  }}
                  className="text-sm font-bold text-blue-600 bg-white border border-blue-200 px-6 py-3 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                >
                  {language === 'ar' ? 'عرض المزيد' : 'Load More'}
                </button>
              </div>
            )}

            {/* End of Results */}
            {!hasMore && posts.length > 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-xs font-medium">
                  {language === 'ar' ? 'لا توجد وظائف إضافية' : 'No more jobs'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Warning Modal for External Links */}
      {pendingUrl && createPortal(
        <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => setPendingUrl(null)} />
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden border-t-4 border-red-500">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <ShieldAlert size={36} className="text-red-600" strokeWidth={2} />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-1">
                {language === 'ar' ? 'تنبيه أمني هام' : 'Security Alert'}
              </h3>
              <h3 className="text-sm font-bold text-gray-500 mb-4">
                {language === 'ar' ? 'Security Alert' : 'تنبيه أمني هام'}
              </h3>
              
              <div className="bg-red-50 p-3 rounded-xl border border-red-100 mb-4 text-start">
                <div className="flex gap-2">
                  <AlertTriangle size={32} className="flex-shrink-0 mt-0.5 text-red-600" />
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-red-800 font-bold leading-relaxed">
                      {language === 'ar'
                        ? 'احذر من دفع أي مبالغ مالية مقابل التوظيف. التطبيق غير مسؤول عن أي تعاملات خارجية.'
                        : 'Beware of paying any fees for employment. The app is not responsible for any external transactions.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6 text-start bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 font-bold mb-1">
                  {language === 'ar'
                    ? 'أنت على وشك الانتقال إلى موقع خارجي.'
                    : 'You are about to navigate to an external website.'
                  }
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={confirmNavigation}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-transform active:scale-95 flex flex-col items-center justify-center leading-tight"
                >
                  <span>{language === 'ar' ? 'متابعة' : 'Continue'}</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    {language === 'ar' ? 'Continue' : 'متابعة'}
                  </span>
                </button>
                <button 
                  onClick={() => setPendingUrl(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex flex-col items-center justify-center leading-tight"
                >
                  <span>{language === 'ar' ? 'إلغاء' : 'Cancel'}</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    {language === 'ar' ? 'Cancel' : 'إلغاء'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>, 
        document.body
      )}

      {/* REPORT MODAL */}
      {reportData && (
        <ReportModal
          isOpen={true}
          onClose={handleReportClose}
          onSubmit={handleReportSubmit}
          targetType={reportData.type}
          targetName={reportData.name}
        />
      )}

    </div>
  );
};

export default GlobalJobsView;
