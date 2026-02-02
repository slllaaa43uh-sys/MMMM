import { API_BASE_URL } from '../constants';

export interface ActivePromotion {
  postId: string;
  postTitle: string;
  promotionType: 'free' | 'weekly' | 'monthly';
  expiresAt: string;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    totalSeconds: number;
  };
  isExpired: boolean;
  postContent?: string;
}

export interface PromotionsResponse {
  success: boolean;
  activeCount: number;
  hasActivePromotions: boolean;
  promotions: ActivePromotion[];
}

/**
 * جلب الاشتراكات النشطة للمستخدم
 */
export const getActivePromotions = async (): Promise<PromotionsResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        activeCount: 0,
        hasActivePromotions: false,
        promotions: []
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/users/active-promotions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active promotions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    return {
      success: false,
      activeCount: 0,
      hasActivePromotions: false,
      promotions: []
    };
  }
};

/**
 * حساب الوقت المتبقي بشكل دقيق
 */
export const calculateTimeRemaining = (expiresAt: string) => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = Math.max(0, expiry - now);
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: Math.floor(diff / 1000),
    isExpired: diff <= 0
  };
};

/**
 * تنسيق الوقت المتبقي للعرض
 */
export const formatTimeRemaining = (expiresAt: string, language: 'ar' | 'en'): string => {
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
