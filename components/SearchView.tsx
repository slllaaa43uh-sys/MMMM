
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Clock, ArrowRight, Loader2, Verified, Check, Phone, Mail, MessageCircle, Copy, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Avatar from './Avatar';
import { API_BASE_URL } from '../constants';
import PostCard from './PostCard'; // Import original PostCard
import { Post } from '../types';

interface SearchViewProps {
  onClose: () => void;
  onReport?: (type: 'post' | 'comment' | 'reply' | 'video', id: string, name: string) => void;
  onProfileClick?: (userId: string) => void;
}

// 1. GLOBAL CACHE FOR SUGGESTIONS
let globalSuggestionsCache: string[] = [];

const SearchView: React.FC<SearchViewProps> = ({ onClose, onReport }) => {
  const { t, language } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Results will be mixed: People (mapped internally) or Posts (mapped to Post type)
  const [results, setResults] = useState<any[]>([]);
  
  const [suggestions, setSuggestions] = useState<string[]>(globalSuggestionsCache);
  const [activeTab, setActiveTab] = useState('all');
  const [resultStats, setResultStats] = useState<any>({});
  
  // History State
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('search_history');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<any>(null);

  const getRelativeTime = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (seconds < 60) return language === 'ar' ? 'الآن' : 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return language === 'ar' ? `منذ ${minutes} د` : `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return language === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
      return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const getImageUrl = (url: string) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    if (globalSuggestionsCache.length > 0) {
        setSuggestions(globalSuggestionsCache);
    } else {
        const fetchSuggestions = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/posts/search/suggestions`);
                if (response.ok) {
                    const data = await response.json();
                    const newSuggestions = data.suggestions || [];
                    globalSuggestionsCache = newSuggestions; 
                    setSuggestions(newSuggestions);
                }
            } catch (error) {
                console.error("Failed to load suggestions", error);
            }
        };
        fetchSuggestions();
    }
    
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Save history to local storage
  const addToHistory = (query: string) => {
      const cleanQuery = query.trim();
      if (!cleanQuery) return;
      
      setSearchHistory(prev => {
          const newHistory = [cleanQuery, ...prev.filter(item => item !== cleanQuery)].slice(0, 10);
          localStorage.setItem('search_history', JSON.stringify(newHistory));
          return newHistory;
      });
  };

  const removeFromHistory = (e: React.MouseEvent, itemToRemove: string) => {
      e.stopPropagation();
      setSearchHistory(prev => {
          const newHistory = prev.filter(item => item !== itemToRemove);
          localStorage.setItem('search_history', JSON.stringify(newHistory));
          return newHistory;
      });
  };

  const clearHistory = () => {
      setSearchHistory([]);
      localStorage.removeItem('search_history');
  };

  const performSearch = useCallback(async (query: string, tab: string) => {
      if (!query.trim()) {
          setResults([]);
          setResultStats({});
          return;
      }

      // Add to history when searching
      addToHistory(query);

      setIsLoading(true);
      try {
          if (tab === 'people') {
              const params = new URLSearchParams({ q: query, page: '1', limit: '20' });
              const response = await fetch(`${API_BASE_URL}/api/v1/users/search?${params}`);
              const data = await response.json();
              if (data.success) {
                  const mappedUsers = (data.users || []).map((u: any) => ({
                      _id: u._id,
                      resultType: 'person', // Custom flag to distinguish
                      title: u.name,
                      subtitle: u.bio || (u.city ? u.city : ''),
                      image: u.avatar,
                      isVerified: u.isVerified,
                      stats: `${u.followersCount || 0} ${t('profile_followers')}`,
                      contactPhone: u.phone,
                      contactEmail: u.email
                  }));
                  setResults(mappedUsers);
              }
          } else {
              const apiType = tab === 'jobs' ? 'job' : (tab === 'all' ? 'all' : tab);
              const params = new URLSearchParams({ q: query, page: '1', limit: '20' });
              if (apiType !== 'all') params.append('type', apiType);
              
              const response = await fetch(`${API_BASE_URL}/api/v1/posts/search?${params}`);
              const data = await response.json();
              
              if (data.success) {
                  if (data.stats) setResultStats(data.stats);
                  
                  const mappedPosts: Post[] = (data.posts || []).map((p: any) => {
                      let locationString = p.city || p.country || (p.scope === 'global' ? t('nav_world') : t('location_general'));

                      return {
                          id: p._id,
                          _id: p._id,
                          user: {
                              id: p.user?._id || 'unknown',
                              _id: p.user?._id,
                              name: p.user?.name || t('app_name'),
                              avatar: getImageUrl(p.user?.avatar) || null
                          },
                          timeAgo: getRelativeTime(p.createdAt),
                          content: p.content || p.text || '',
                          image: getImageUrl(p.image),
                          media: p.media ? p.media.map((m: any) => ({
                              url: getImageUrl(m.url),
                              type: m.type,
                              thumbnail: m.thumbnail
                          })) : [],
                          likes: 0,
                          comments: 0,
                          shares: 0,
                          isLiked: false,
                          
                          title: p.title,
                          type: p.type || 'general',
                          category: p.category,
                          location: locationString,
                          country: p.country,
                          city: p.city,
                          
                          isFeatured: p.isFeatured,
                          jobStatus: p.jobStatus,
                          harajStatus: p.harajStatus,
                          
                          contactPhone: p.contactPhone,
                          contactEmail: p.contactEmail,
                          contactMethods: p.contactMethods || [],
                          
                          resultType: 'post' 
                      };
                  });
                  setResults(mappedPosts);
              }
          }
      } catch (error) {
          console.error("Search error", error);
      } finally {
          setIsLoading(false);
      }
  }, [t, language]);

  const handleSearchInput = (text: string) => {
      setSearchText(text);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      if (!text.trim()) {
          setResults([]);
          return;
      }

      setIsLoading(true);
      debounceTimer.current = setTimeout(() => {
          performSearch(text, activeTab);
      }, 500); 
  };

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      if (searchText.trim()) {
          performSearch(searchText, tab);
      }
  };

  const handleSuggestionClick = (term: string) => {
      setSearchText(term);
      performSearch(term, activeTab);
  };

  const clearSearch = () => {
      setSearchText('');
      setResults([]);
      setResultStats({});
  };

  const getTabCount = (tabKey: string) => {
      if (!resultStats || Object.keys(resultStats).length === 0) return null;
      const map: Record<string, string> = { 'all': 'all', 'jobs': 'job', 'haraj': 'haraj' };
      const key = map[tabKey];
      return key && resultStats[key] !== undefined ? resultStats[key] : null;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* 1. Header (Sticky) */}
      <div className="flex-shrink-0 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 pt-safe">
          <div className="px-4 py-3 flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
            >
              <ArrowRight className={language === 'en' ? 'rotate-180' : ''} size={24} />
            </button>
            
            <div className="flex-1 bg-gray-100 dark:bg-[#1e1e1e] rounded-full flex items-center px-4 py-2 relative group focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchText}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 dark:text-white placeholder:text-gray-500 px-1 h-full dir-auto"
                />
                {searchText ? (
                    <button onClick={clearSearch} className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                        <X size={14} className="text-gray-600 dark:text-gray-300" />
                    </button>
                ) : (
                    <Search size={18} className="text-gray-400" />
                )}
            </div>
          </div>

          {/* 2. Tabs (Sticky when searching) */}
          {searchText && (
             <div className="px-4 pb-2 bg-white dark:bg-black flex gap-3 overflow-x-auto no-scrollbar w-full flex-shrink-0 border-b border-gray-50 dark:border-gray-900">
                {[
                    { id: 'all', label: t('search_tab_all') },
                    { id: 'jobs', label: t('search_tab_jobs') },
                    { id: 'people', label: t('search_tab_people') },
                    { id: 'haraj', label: t('search_tab_haraj') },
                ].map(tab => {
                    const count = getTabCount(tab.id);
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 flex-shrink-0 ${
                                activeTab === tab.id 
                                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                                : 'bg-white dark:bg-black text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                            }`}
                        >
                            {tab.label}
                            {count !== null && <span className="opacity-70 text-[10px]">({count})</span>}
                        </button>
                    );
                })}
             </div>
          )}
      </div>

      {/* 3. Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black pb-20 no-scrollbar">
        
        {/* State 1: No Search Text (History & Suggestions) */}
        {!searchText && (
            <div className="animate-in fade-in duration-500 bg-white dark:bg-black h-full">
                
                {/* 1. Recent Searches (History) */}
                {searchHistory.length > 0 && (
                    <div className="px-5 mt-6 mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('search_recent')}
                            </h3>
                            <button 
                                onClick={clearHistory}
                                className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            >
                                {t('search_clear')}
                            </button>
                        </div>
                        <div className="flex flex-col gap-1">
                            {searchHistory.map((term, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => handleSuggestionClick(term)}
                                    className="flex items-center justify-between py-3 cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{term}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => removeFromHistory(e, term)}
                                        className="p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Suggested Tags */}
                <div className="px-5 mt-2">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                        {t('search_suggested')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.length > 0 ? suggestions.map((tag, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleSuggestionClick(tag)}
                                className="px-4 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {tag}
                            </button>
                        )) : (
                            <div className="text-sm text-gray-400 italic py-2">{t('loading')}</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* State 2: Results */}
        {searchText && (
            <div className="flex flex-col min-h-full">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-black h-full">
                        <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                        <p className="text-gray-400 text-sm font-medium">{t('loading')}</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="flex flex-col gap-[1px]">
                        {results.map((item) => {
                            // Render Person Row (Read Only, No Click)
                            if (item.resultType === 'person') {
                                return (
                                    <div 
                                        key={item._id} 
                                        className="p-4 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 cursor-default animate-in slide-in-from-bottom-2 duration-300 w-full"
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <div className="relative pointer-events-none">
                                                    <Avatar name={item.title} src={getImageUrl(item.image)} className="w-12 h-12 rounded-full border border-gray-100" />
                                                    {item.isVerified && (
                                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-white">
                                                            <Verified size={10} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.stats}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } 
                            
                            // Use PostCard directly but hide actions and disable profile click
                            return (
                                <div key={item.id} className="bg-white dark:bg-black mb-1 animate-in slide-in-from-bottom-2 duration-300 shadow-sm border-b border-gray-100 dark:border-gray-800">
                                    <PostCard 
                                        post={item} 
                                        variant="feed"
                                        onReport={onReport}
                                        hideActions={true} // Hide Bottom Actions (Like, Comment, Repost)
                                        disableProfileClick={true} // Prevent Profile Navigation
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-50 bg-white dark:bg-black h-full flex flex-col items-center justify-center">
                        <Search size={48} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-bold text-gray-400">{t('search_no_results')}</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;
