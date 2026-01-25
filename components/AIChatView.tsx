
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Send, Sparkles, User, Loader2, Briefcase, MapPin, Building2, ChevronRight, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../constants';
import Logo from './Logo';

interface AIChatViewProps {
  onClose: () => void;
}

interface JobRecommendation {
  _id?: string;
  id?: string;
  title: string;
  company?: string;
  location?: string;
  type?: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  jobs?: JobRecommendation[];
}

const AIChatView: React.FC<AIChatViewProps> = ({ onClose }) => {
  const { language, t } = useLanguage();
  
  // 1. Initialize from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
      try {
          const saved = localStorage.getItem('ai_chat_history');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>('online'); // online, thinking, searching, responding
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. Save to localStorage whenever messages change
  useEffect(() => {
      if (messages.length > 0) {
          localStorage.setItem('ai_chat_history', JSON.stringify(messages));
      } else {
          localStorage.removeItem('ai_chat_history');
      }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiStatus]);

  // 3. Centralized AI Fetch Logic (Reusable for new messages or resuming)
  const processAIResponse = useCallback(async (currentHistory: Message[]) => {
    setIsLoading(true);
    setAiStatus('thinking');

    try {
      const token = localStorage.getItem('token');
      
      // Prepare history
      const historyPayload = currentHistory.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      }));

      // The message is already in history, so we don't send a separate 'message' field
      // We send the last user message context via history
      const lastUserMsg = currentHistory[currentHistory.length - 1];
      const messageContent = lastUserMsg.text;

      const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageContent, 
          conversationHistory: historyPayload.slice(0, -1) // Send history excluding the new one we just added to UI to avoid duplication if backend handles it
        })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Create placeholder for model response
      const modelMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', isStreaming: true, jobs: [] }]);

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data:')) continue;

          try {
            const jsonStr = trimmedLine.replace('data: ', '');
            if (jsonStr === '[DONE]') break; 

            const data = JSON.parse(jsonStr);
            
            switch (data.type) {
              case 'status':
                setAiStatus(data.status);
                break;

              case 'jobs':
                setMessages(prev => prev.map(m => 
                  m.id === modelMessageId ? { ...m, jobs: data.jobs } : m
                ));
                break;

              case 'chunk':
                accumulatedText += data.content;
                setMessages(prev => prev.map(m => 
                  m.id === modelMessageId ? { ...m, text: accumulatedText } : m
                ));
                break;

              case 'done':
                setMessages(prev => prev.map(m => 
                  m.id === modelMessageId ? { ...m, isStreaming: false } : m
                ));
                setIsLoading(false);
                setAiStatus('online');
                break;

              case 'error':
                console.error('AI Error from server:', data.message);
                setMessages(prev => prev.map(m => 
                    m.id === modelMessageId 
                    ? { ...m, text: m.text ? m.text + `\n\n[Error: ${data.message}]` : (data.message || t('ai_error')), isStreaming: false } 
                    : m
                ));
                setIsLoading(false);
                setAiStatus('online');
                break;
            }
          } catch (parseError) {
            console.error('Parse error:', parseError, trimmedLine);
          }
        }
      }
    } catch (error) {
      console.error('Chat Network Error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: t('ai_error') 
      }]);
      setIsLoading(false);
      setAiStatus('online');
    }
  }, [t]);

  // 4. Check for interrupted requests on mount
  useEffect(() => {
      // If the last message in history is from the User, it means the AI hasn't replied yet.
      // We should resume/retry the request.
      if (messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role === 'user') {
              processAIResponse(messages);
          }
      }
  }, []); // Run once on mount

  const handleClearHistory = () => {
      localStorage.removeItem('ai_chat_history');
      setMessages([]); // Empty start
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    const userMessageId = Date.now().toString();
    
    // Add User Message immediately to state
    const newUserMsg: Message = { id: userMessageId, role: 'user', text: userMessageText };
    const updatedHistory = [...messages, newUserMsg];
    
    setMessages(updatedHistory);
    setInputText('');
    
    // Trigger AI processing
    processAIResponse(updatedHistory);
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusText = () => {
      switch (aiStatus) {
          case 'thinking': return t('ai_thinking');
          case 'searching': return language === 'ar' ? 'جاري البحث عن وظائف...' : 'Searching for jobs...';
          case 'responding': return language === 'ar' ? 'جاري الكتابة...' : 'Typing...';
          default: return t('ai_online');
      }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-20 pt-safe shadow-sm">
        <div className="flex items-center gap-3">
            <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
            >
            <ArrowRight className={language === 'en' ? 'rotate-180' : ''} size={24} />
            </button>
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-gradient-to-tr from-cyan-500 to-blue-600'}`}>
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} fill="currentColor" />}
                </div>
                <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{t('ai_title')}</h2>
                    {isLoading ? (
                        <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                            {getStatusText()}
                        </p>
                    ) : (
                        <p className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            {t('ai_online')}
                        </p>
                    )}
                </div>
            </div>
        </div>
        {/* Clear History Button */}
        <button 
            onClick={handleClearHistory} 
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear History"
        >
            <Trash2 size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-black pb-24">
        
        {/* Intro Branding (Only if empty) */}
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 opacity-60 mt-10">
                <Logo className="w-16 h-16 grayscale opacity-30 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[80%] font-medium leading-relaxed">
                    تم تصميم هذا المساعد من قبل فريق العمل ليساعدكم في كتابه السيره الذاتيه او تواجه صعوبات في التطبيق فقط
                </p>
            </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-800' : 'bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800'}`}>
                {msg.role === 'user' ? (
                    <User size={16} className="text-gray-600 dark:text-gray-300" />
                ) : (
                    <Sparkles size={16} className="text-cyan-600 dark:text-cyan-400" />
                )}
            </div>
            
            <div className="flex flex-col gap-2 max-w-[85%]">
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-cyan-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                }`}>
                    {msg.text}
                    {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-500 animate-pulse align-middle"></span>
                    )}
                </div>

                {/* Job Cards if available */}
                {msg.jobs && msg.jobs.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-500">
                        {msg.jobs.map((job, idx) => (
                            <div key={job._id || idx} className="bg-white dark:bg-[#1e1e1e] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{job.title}</h4>
                                        {job.company && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                                <Building2 size={12} />
                                                <span>{job.company}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">
                                        <Briefcase size={16} />
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    {job.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} />
                                            <span>{job.location}</span>
                                        </div>
                                    )}
                                    {job.type && (
                                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px]">
                                            {job.type}
                                        </span>
                                    )}
                                </div>

                                <button className="mt-1 w-full py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 transition-colors">
                                    {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                                    <ChevronRight size={14} className={language === 'ar' ? 'rotate-180' : ''} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#121212] p-4 border-t border-gray-100 dark:border-gray-800 pb-safe z-30">
        <div className="relative flex items-center gap-2">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center px-4 py-1 border border-transparent focus-within:border-cyan-500 transition-colors">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('ai_placeholder')}
                    className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dir-auto"
                    // Removed disabled={isLoading} to allow typing while thinking
                />
            </div>
            <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                    !inputText.trim() || isLoading 
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400' 
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                }`}
            >
                {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Send 
                        size={20} 
                        style={{ transform: language === 'en' ? 'scaleX(-1)' : 'none' }} 
                    />
                )}
            </button>
        </div>
      </div>

    </div>
  );
};

export default AIChatView;
