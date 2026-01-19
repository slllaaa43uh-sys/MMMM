
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Send, Sparkles, User, Loader2, Briefcase, MapPin, Building2, ChevronRight } from 'lucide-react';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>('online'); // online, thinking, searching, responding
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with the welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: t('ai_welcome_msg')
      }
    ]);
  }, [t]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiStatus]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    const userMessageId = Date.now().toString();
    
    // Add User Message immediately
    const newUserMsg: Message = { id: userMessageId, role: 'user', text: userMessageText };
    setMessages(prev => [...prev, newUserMsg]);
    
    setInputText('');
    setIsLoading(true);
    setAiStatus('thinking');

    try {
      const token = localStorage.getItem('token');
      
      // Prepare history including the new message
      const historyPayload = messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      }));

      const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessageText,
          conversationHistory: historyPayload
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
            if (jsonStr === '[DONE]') break; // Safety check if backend sends [DONE]

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
                // Replace the streaming message with error text if empty, or append error
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
    } finally {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
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
      <div className="px-4 py-3 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 sticky top-0 z-20 pt-safe shadow-sm">
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-black pb-24">
        
        {/* Intro Branding */}
        <div className="flex flex-col items-center justify-center py-6 opacity-50">
            <Logo className="w-16 h-16 grayscale opacity-30 mb-2" />
            <p className="text-xs text-gray-400">Powered by Ollama & Mehnati Engine</p>
        </div>

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
                    disabled={isLoading}
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
