
import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Clock, ArrowRight, Loader2, Briefcase, User, Store, Tag, ArrowUpLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Avatar from './Avatar';

interface SearchViewProps {
  onClose: () => void;
}

// Mock Data
const SUGGESTED_TAGS = [
  "سائق خاص", "طباخ ماهر", "آيفون 15", "سيارة تويوتا", "محاسب", "خادمة", "شقة للإيجار", "مصمم جرافيك"
];

const MOCK_RESULTS = [
  { id: '1', type: 'job', title: 'سائق خاص لعائلة', user: 'أبو محمد', location: 'الرياض', time: 'منذ 15 دقيقة', salary: '2500 ريال', avatar: null },
  { id: '2', type: 'job', title: 'مطلوب طباخ لمطعم', user: 'مطعم السعادة', location: 'جدة', time: 'منذ ساعة', salary: 'قابل للتفاوض', avatar: null },
  { id: '3', type: 'haraj', title: 'للبيع تويوتا كامري 2023', user: 'معرض السيارات', location: 'الدمام', time: 'منذ ساعتين', price: '85,000 ريال', avatar: null },
  { id: '4', type: 'person', name: 'أحمد علي', role: 'مهندس برمجيات', location: 'الخبر', avatar: null },
  { id: '5', type: 'job', title: 'مندوب توصيل طلبات', user: 'شركة لوجستية', location: 'مكة', time: 'منذ 3 ساعات', salary: 'عمولة', avatar: null },
];

const SearchView: React.FC<SearchViewProps> = ({ onClose }) => {
  const { t, language } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all'); // all, jobs, people, haraj
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
        setResults([]);
        return;
    }

    setIsSearching(true);
    // Simulate API delay
    setTimeout(() => {
        // Filter mock results (very basic fuzzy search)
        const filtered = MOCK_RESULTS.filter(item => {
            const str = JSON.stringify(item).toLowerCase();
            return str.includes(text.toLowerCase());
        });
        
        // If "driver" or "سائق" is searched, ensure we show some specific dummy data even if filter fails (per prompt request)
        if (text.includes('سائق') || text.includes('driver')) {
             if (!filtered.find(i => i.title?.includes('سائق'))) {
                 filtered.unshift(MOCK_RESULTS[0]);
             }
        }

        setResults(filtered.length > 0 ? filtered : MOCK_RESULTS); // Fallback to all mock results if empty for demo purposes to show "awesome containers"
        setIsSearching(false);
    }, 800);
  };

  const clearSearch = () => {
      setSearchText('');
      setResults([]);
  };

  const getFilteredResults = () => {
      if (activeTab === 'all') return results;
      return results.filter(r => r.type === (activeTab === 'people' ? 'person' : activeTab));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Search Header */}
      <div className="px-4 py-2 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 sticky top-0 z-20 pt-safe">
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
                onChange={(e) => handleSearch(e.target.value)}
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-black">
        
        {/* State 1: No Search Text (Suggestions) */}
        {!searchText && (
            <div className="animate-in fade-in duration-500">
                {/* Recent Searches - YouTube Style List */}
                <div className="py-2">
                    {['وظائف جدة', 'سيارات للبيع', 'مصمم شعارات'].map((item, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => handleSearch(item)} 
                            className="w-full flex items-center justify-between py-3 px-5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <Clock size={20} className="text-gray-400 dark:text-gray-500" />
                                <span className="text-base font-medium text-gray-900 dark:text-gray-100">{item}</span>
                            </div>
                            <ArrowUpLeft size={18} className={`text-gray-300 dark:text-gray-600 ${language === 'en' ? 'rotate-90' : ''}`} />
                        </button>
                    ))}
                </div>

                {/* Suggested Tags */}
                <div className="px-5 mt-4">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                        {t('search_suggested')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_TAGS.map((tag, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleSearch(tag)}
                                className="px-4 py-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* State 2: Searching / Results */}
        {searchText && (
            <div className="flex flex-col h-full">
                {/* Tabs */}
                <div className="px-4 py-3 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 flex gap-3 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: t('search_tab_all') },
                        { id: 'jobs', label: t('search_tab_jobs') },
                        { id: 'people', label: t('search_tab_people') },
                        { id: 'haraj', label: t('search_tab_haraj') },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                                activeTab === tab.id 
                                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                                : 'bg-white dark:bg-black text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Results List - Clean, Flat List Style */}
                <div className="pb-20">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-gray-400 mb-2" />
                        </div>
                    ) : getFilteredResults().length > 0 ? (
                        getFilteredResults().map((item) => (
                            <div 
                                key={item.id} 
                                className="px-4 py-4 bg-white dark:bg-black border-b border-gray-50 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors cursor-pointer animate-in slide-in-from-bottom-2 duration-300"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon/Avatar based on type */}
                                    <div className="flex-shrink-0 mt-1">
                                        {item.type === 'person' ? (
                                            <Avatar name={item.name} src={item.avatar} className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                item.type === 'job' ? 'bg-gray-100 dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-300' : 'bg-gray-100 dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-300'
                                            }`}>
                                                {item.type === 'job' ? <Briefcase size={18} /> : <Store size={18} />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                                                {item.title || item.name}
                                            </h4>
                                            {item.time && (
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {item.time}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            <span>{item.user || item.role}</span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                            <span>{item.location}</span>
                                        </div>

                                        {/* Extra Badge (Salary/Price) - Minimalist */}
                                        {(item.salary || item.price) && (
                                            <div className="mt-2 text-xs font-bold text-green-600 dark:text-green-400">
                                                {item.salary || item.price}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-50">
                            <Search size={48} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-bold text-gray-400">{t('search_no_results')}</p>
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default SearchView;
