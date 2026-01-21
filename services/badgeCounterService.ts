
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { API_BASE_URL } from '../constants';

export interface JobCategoryCounts {
    seeker: number;
    employer: number;
}

export interface PostCountsData {
    jobs: {
        totalSeeker: number;
        totalEmployer: number;
        categories: Record<string, JobCategoryCounts>;
    };
    haraj: {
        categories: Record<string, number>;
    };
}

let currentCounts: PostCountsData | null = null;

export const BadgeCounterService = {
  async setBadge(count: number) {
    if (Capacitor.getPlatform() !== 'web') {
      try {
        await PushNotifications.removeAllDeliveredNotifications();
        // Note: Capacitor PushNotifications doesn't have a direct setBadge method in all versions,
        // but removing delivered notifications often clears the badge on Android.
        // For iOS or specific badge plugins, you'd integrate @capacitor/app here.
      } catch (e) {
        console.error('Error clearing badge', e);
      }
    }
  },

  async clearBadge() {
    this.setBadge(0);
  },

  // --- API COUNT FETCHING LOGIC ---

  async fetchPostCounts(): Promise<PostCountsData | null> {
    try {
        // Fetch counts from the backend endpoint
        const response = await fetch(`${API_BASE_URL}/api/v1/posts/counts`);
        if (response.ok) {
            const data = await response.json();
            currentCounts = data;
            return data;
        }
    } catch (e) {
        console.error("Failed to fetch post counts", e);
    }
    return null;
  },

  getJobsSeekerCount() { 
      return currentCounts?.jobs?.totalSeeker || 0; 
  },

  getJobsEmployerCount() { 
      return currentCounts?.jobs?.totalEmployer || 0; 
  },

  getJobCategoryCounts(category: string): JobCategoryCounts {
      return currentCounts?.jobs?.categories?.[category] || { seeker: 0, employer: 0 };
  },

  getHarajCategoryCount(category: string): number {
      return currentCounts?.haraj?.categories?.[category] || 0;
  },

  initPostCountService() {
      // Initial fetch
      this.fetchPostCounts();
      
      // Poll every 60 seconds to keep counts updated
      setInterval(() => {
          this.fetchPostCounts();
      }, 60000);
  }
};
