
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { API_BASE_URL } from '../constants';

export interface JobCategoryCounts {
    seeker: number;
    employer: number;
}

export interface PostCountsData {
    jobs: {
        total?: number;          // ⭐ Added
        seeker?: number;         // ⭐ Added
        employer?: number;       // ⭐ Added
        totalSeeker?: number;
        totalEmployer?: number;
        categories: Record<string, JobCategoryCounts>;
    };
    haraj: {
        total?: number;          // ⭐ Added
        categories: Record<string, number>;
    };
    urgent?: {                   // ⭐ Added for urgent jobs
        total?: number;
        byTag?: Record<string, number>;
    };
    globalJobs?: {               // ⭐ Added for global jobs
        total?: number;
        byLocation?: Record<string, number>;
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
        console.log('🔢 [BadgeCounter] Fetching post counts from:', `${API_BASE_URL}/api/v1/posts/counts`);
        
        // Fetch counts from the backend endpoint
        const response = await fetch(`${API_BASE_URL}/api/v1/posts/counts`);
        
        console.log('🔢 [BadgeCounter] Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('🔢 [BadgeCounter] Raw API Response:', JSON.stringify(data, null, 2));
            console.log('🔢 [BadgeCounter] Jobs Data:', data.data?.jobs);
            console.log('🔢 [BadgeCounter] Haraj Data:', data.data?.haraj);
            
            // Store the actual data structure
            currentCounts = data.data || data;

                        // Notify UI listeners that counts changed
                        try {
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('badge-counts-updated', { detail: currentCounts }));
                            }
                        } catch {}
            
            console.log('🔢 [BadgeCounter] Stored counts:', currentCounts);
            console.log('🔢 [BadgeCounter] Jobs Total:', currentCounts?.jobs?.total);
            console.log('🔢 [BadgeCounter] Jobs Seeker:', currentCounts?.jobs?.seeker);
            console.log('🔢 [BadgeCounter] Jobs Employer:', currentCounts?.jobs?.employer);
            console.log('🔢 [BadgeCounter] Haraj Total:', currentCounts?.haraj?.total);
            
            return currentCounts;
        } else {
            console.error('🔢 [BadgeCounter] API request failed:', response.status, response.statusText);
        }
    } catch (e) {
        console.error("🔢 [BadgeCounter] Failed to fetch post counts", e);
    }
    return null;
  },

  getJobsSeekerCount() { 
      const count = currentCounts?.jobs?.seeker || currentCounts?.jobs?.totalSeeker || 0;
      console.log('🔢 [BadgeCounter] getJobsSeekerCount() =', count);
      return count;
  },

  getJobsEmployerCount() { 
      const count = currentCounts?.jobs?.employer || currentCounts?.jobs?.totalEmployer || 0;
      console.log('🔢 [BadgeCounter] getJobsEmployerCount() =', count);
      return count;
  },
  
  getJobsTotalCount() {
      const count = currentCounts?.jobs?.total || 0;
      console.log('🔢 [BadgeCounter] getJobsTotalCount() =', count);
      return count;
  },
  
  getHarajTotalCount() {
      const count = currentCounts?.haraj?.total || 0;
      console.log('🔢 [BadgeCounter] getHarajTotalCount() =', count);
      return count;
  },
  
  getUrgentTotalCount() {
      const count = currentCounts?.urgent?.total || 0;
      console.log('🔢 [BadgeCounter] getUrgentTotalCount() =', count);
      return count;
  },
  
  getGlobalJobsTotalCount() {
      const count = currentCounts?.globalJobs?.total || 0;
      console.log('🔢 [BadgeCounter] getGlobalJobsTotalCount() =', count);
      return count;
  },

  getJobCategoryCounts(category: string): JobCategoryCounts {
      return currentCounts?.jobs?.categories?.[category] || { seeker: 0, employer: 0 };
  },

  getHarajCategoryCount(category: string): number {
      return currentCounts?.haraj?.categories?.[category] || 0;
  },

  initPostCountService() {
      console.log('🔢 [BadgeCounter] Initializing Post Count Service...');
      
      // Initial fetch
      this.fetchPostCounts().then(() => {
          console.log('🔢 [BadgeCounter] Initial fetch completed');
          console.log('🔢 [BadgeCounter] Current counts after init:', currentCounts);
      });
      
      // Poll every 60 seconds to keep counts updated
      setInterval(() => {
          console.log('🔢 [BadgeCounter] Polling for updates...');
          this.fetchPostCounts();
      }, 60000);
  }
};
