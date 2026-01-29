import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Clock, ArrowRight, Loader2, Briefcase, User, Store, Tag, ArrowUpLeft, DollarSign, Star, MapPin, Verified, MoreHorizontal, CheckCircle, Phone, Mail, MessageCircle, Trash2, Copy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Avatar from './Avatar';
import { API_BASE_URL } from '../constants';

interface SearchViewProps {
  onClose: () => void;
}

// 1. GLOBAL CACHE FOR SUGGESTIONS
let globalSuggestionsCache: string[] = [];

const SearchView: React.FC<SearchViewProps> = ({ onClose }) => {
  const { t, language } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  
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
      if (minutes < 60) return language === 'ar' ? `منذ ${minutes} د` : `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return language === 'ar' ? `منذ ${hours} س` : `${hours}h`;
      const days = Math.floor(hours / 24);
      if (days < 30) return language === 'ar' ? `منذ ${days} ي` : `${days}d`;
      return new Date(dateStr).toLocaleDateString();
  };

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus();
    }
  }, []);

  const handleSearch = async (query: string) => {
      if (!query.trim()) {
          setResults([]);
          return;
      }

      setIsLoading(true);
      
      try {
          const token = localStorage.getItem('token');
          // Search API logic - Assuming standard query param structure
          // If no dedicated search endpoint exists, this might need adjustment to filter existing posts
          const response = await fetch(`${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&type=${activeTab}`, {
             headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          if (response.ok) {
              const data = await response.json();
              setResults(data.results || data.data || []);
          } else {
              // Fallback: If API endpoint is missing, we just show empty or handle gracefully
              // For now, setting empty results
              setResults([]);
          }
      } catch (error) {
          console.error("Search failed", error);
      } finally {
          setIsLoading(false);
      }
  };

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchText(val);
      
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      debounceTimer.current = setTimeout(() => {
          handleSearch(val);
      }, 500);
  };

  const handleHistoryClick = (term: string) => {
      setSearchText(term);
      handleSearch(term);
  };

  const addToHistory = (term: string) => {
      if (!term.trim()) return;
      const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
      setSearchHistory([]);
      localStorage.removeItem('search_history');
  };

  const handleEnterKey = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSearch(searchText);
          addToHistory(searchText);
      }
  };

  const getResultIcon = (type: string) => {
      switch(type) {
          case 'user': return <User size={20} className="text-blue-600" />;
          case 'company': return <Store size={20} className="text-purple-600" />;
          case 'job': return <Briefcase size={20} className="text-green-600" />;
          case 'haraj': return <Tag size={20} className="text-orange-600" />;
          default: return <Search size={20} className="text-gray-600" />;
      }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 pt-safe bg-white dark:bg-[#121212]">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-200 transition-colors">
                <ArrowRight size={20} className={language === 'en' ? 'rotate-180' : ''} />
            </button>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center px-4 py-2">
                <Search size={18} className="text-gray-400" />
                <input 
                    ref={inputRef}
                    type="text" 
                    value={searchText}
                    onChange={onSearchInputChange}
                    onKeyDown={handleEnterKey}
                    placeholder={t('search_placeholder')}
                    className="bg-transparent border-none outline-none w-full text-sm px-2 text-gray-900 dark:text-white placeholder:text-gray-500 dir-auto"
                />
                {searchText && (
                    <button onClick={() => setSearchText('')}>
                        <X size={16} className="text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 py-2 gap-2 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121212]">
            {['all', 'jobs', 'people', 'haraj'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => { setActiveTab(tab); handleSearch(searchText); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                        activeTab === tab 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    {t(`search_tab_${tab}`)}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-white dark:bg-black">
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                </div>
            ) : searchText ? (
                <div className="space-y-4">
                    {results.length > 0 ? (
                        results.map((item, i) => (
                            <div key={item.id || i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    {getResultIcon(item.type || 'unknown')}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.title || item.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.description || item.subtitle || item.content}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Search size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">{t('search_no_results')}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    {searchHistory.length > 0 && (
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('search_recent')}</h3>
                                <button onClick={clearHistory} className="text-xs text-red-500 font-bold hover:text-red-600 transition-colors">{t('search_clear')}</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {searchHistory.map((term, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleHistoryClick(term)}
                                        className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs text-gray-700 dark:text-gray-300 transition-colors"
                                    >
                                        <Clock size={12} className="text-gray-400" />
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Suggestions */}
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">{t('search_suggested')}</h3>
                        <div className="space-y-2">
                            {['وظائف سائقين', 'مهندس معماري', 'بيع سيارات', 'شقق للإيجار'].map((s, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleHistoryClick(s)}
                                    className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-start transition-colors group"
                                >
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{s}</span>
                                    <ArrowUpLeft size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default SearchView;