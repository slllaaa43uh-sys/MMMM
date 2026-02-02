import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, Calendar, Crown, Sparkles, TrendingUp, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getActivePromotions, calculateTimeRemaining, ActivePromotion } from '../services/promotionService';

interface SubscriptionsViewProps {
  onClose: () => void;
}

const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onClose }) => {
  const { t, language } = useLanguage();
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  // جلب البيانات عند التحميل
  useEffect(() => {
    fetchPromotions();
    
    // تحديث الوقت المتبقي كل ثانية
    const interval = setInterval(() => {
      setPromotions(prev => [...prev]); // Force re-render لتحديث الوقت
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const data = await getActivePromotions();
      if (data.success) {
        setPromotions(data.promotions);
        setActiveCount(data.activeCount);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // أيقونة حسب نوع التمييز
  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'free':
        return <Clock className="text-blue-600" size={24} />;
      case 'weekly':
        return <Calendar className="text-purple-600" size={24} />;
      case 'monthly':
        return <Crown className="text-amber-600" size={24} />;
      default:
        return <Sparkles className="text-cyan-600" size={24} />;
    }
  };

  // لون حسب نوع التمييز
  const getPromotionColor = (type: string) => {
    switch (type) {
      case 'free':
        return 'from-blue-500 to-cyan-500';
      case 'weekly':
        return 'from-purple-500 to-pink-500';
      case 'monthly':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // اسم نوع التمييز
  const getPromotionName = (type: string) => {
    const names = {
      ar: {
        free: '24 ساعة',
        weekly: 'أسبوع',
        monthly: 'شهر'
      },
      en: {
        free: '24 Hours',
        weekly: 'Week',
        monthly: 'Month'
      }
    };
    return names[language as 'ar' | 'en'][type as 'free' | 'weekly' | 'monthly'] || type;
  };

  // تنسيق الوقت المتبقي
  const formatTimeRemaining = (expiresAt: string) => {
    const time = calculateTimeRemaining(expiresAt);
    
    if (time.isExpired) {
      return language === 'ar' ? 'منتهي' : 'Expired';
    }
    
    const parts: string[] = [];
    
    if (time.days > 0) {
      parts.push(language === 'ar' ? `${time.days} يوم` : `${time.days}d`);
    }
    if (time.hours > 0) {
      parts.push(language === 'ar' ? `${time.hours} ساعة` : `${time.hours}h`);
    }
    if (time.minutes > 0 && time.days === 0) {
      parts.push(language === 'ar' ? `${time.minutes} دقيقة` : `${time.minutes}m`);
    }
    
    return parts.join(' ') || (language === 'ar' ? 'أقل من دقيقة' : '< 1m');
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-[9999] animate-in slide-in-from-right duration-300 flex flex-col">
      
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowRight size={22} className={`text-gray-700 dark:text-gray-300 ${language === 'en' ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'اشتراكاتي' : 'My Subscriptions'}
          </h1>
          {activeCount > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {language === 'ar' ? `${activeCount} اشتراك نشط` : `${activeCount} Active`}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-500 text-sm">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        ) : promotions.length === 0 ? (
          // لا توجد اشتراكات
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <TrendingUp size={64} className="text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {language === 'ar' ? 'لا توجد اشتراكات نشطة' : 'No Active Subscriptions'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm leading-relaxed max-w-sm">
              {language === 'ar' 
                ? 'عندما تقوم بتمييز إعلاناتك، ستظهر هنا مع عداد تنازلي للوقت المتبقي' 
                : 'When you promote your posts, they will appear here with a countdown timer'}
            </p>
          </div>
        ) : (
          // عرض الاشتراكات النشطة
          <div className="p-4 space-y-4">
            {promotions.map((promo) => {
              const timeLeft = calculateTimeRemaining(promo.expiresAt);
              const isExpired = timeLeft.isExpired;
              
              return (
                <div 
                  key={promo.postId}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
                    isExpired 
                      ? 'border-gray-200 dark:border-gray-800 opacity-60' 
                      : 'border-transparent shadow-lg hover:shadow-xl'
                  }`}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getPromotionColor(promo.promotionType)} opacity-10`} />
                  
                  <div className="relative p-5 space-y-4">
                    
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-xl ${
                        isExpired 
                          ? 'bg-gray-100 dark:bg-gray-800' 
                          : 'bg-white dark:bg-gray-900 shadow-md'
                      }`}>
                        {isExpired ? (
                          <XCircle size={24} className="text-gray-400" />
                        ) : (
                          getPromotionIcon(promo.promotionType)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                            {language === 'ar' ? 'إعلان مميز' : 'Featured Post'}
                          </h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isExpired 
                              ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400' 
                              : `bg-gradient-to-r ${getPromotionColor(promo.promotionType)} text-white`
                          }`}>
                            {getPromotionName(promo.promotionType)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {promo.postTitle || promo.postContent || (language === 'ar' ? 'منشور' : 'Post')}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {!isExpired && (
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-green-600">
                          {language === 'ar' ? 'نشط الآن' : 'Active Now'}
                        </span>
                      </div>
                    )}

                    {/* Countdown Timer */}
                    <div className={`rounded-xl p-4 ${
                      isExpired 
                        ? 'bg-gray-100 dark:bg-gray-800' 
                        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          {language === 'ar' ? 'الوقت المتبقي' : 'Time Remaining'}
                        </span>
                        {!isExpired && (
                          <span className="text-xs text-gray-400">
                            {Math.round(((timeLeft.days * 24 + timeLeft.hours) / (promo.promotionType === 'free' ? 24 : promo.promotionType === 'weekly' ? 168 : 720)) * 100)}%
                          </span>
                        )}
                      </div>
                      
                      {isExpired ? (
                        <div className="text-center py-2">
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? '⏱️ انتهى' : '⏱️ Expired'}
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Progress Bar */}
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                            <div 
                              className={`h-full bg-gradient-to-r ${getPromotionColor(promo.promotionType)} transition-all duration-1000`}
                              style={{ 
                                width: `${Math.max(5, ((timeLeft.days * 24 + timeLeft.hours) / (promo.promotionType === 'free' ? 24 : promo.promotionType === 'weekly' ? 168 : 720)) * 100)}%` 
                              }}
                            />
                          </div>
                          
                          {/* Time Display */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg py-2">
                              <div className="text-lg font-black text-gray-900 dark:text-white">
                                {timeLeft.days}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {language === 'ar' ? 'يوم' : 'Days'}
                              </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg py-2">
                              <div className="text-lg font-black text-gray-900 dark:text-white">
                                {timeLeft.hours}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {language === 'ar' ? 'ساعة' : 'Hours'}
                              </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg py-2">
                              <div className="text-lg font-black text-gray-900 dark:text-white">
                                {timeLeft.minutes}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {language === 'ar' ? 'دقيقة' : 'Minutes'}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default SubscriptionsView;
