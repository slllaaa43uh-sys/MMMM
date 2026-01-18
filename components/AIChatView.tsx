
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Send, Sparkles, Bot, User, Loader2, StopCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

interface AIChatViewProps {
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

const AIChatView: React.FC<AIChatViewProps> = ({ onClose }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
  }, []); // Only on mount

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    const userMessageId = Date.now().toString();
    
    // Add User Message
    setMessages(prev => [
      ...prev,
      { id: userMessageId, role: 'user', text: userMessageText }
    ]);
    
    setInputText('');
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
          throw new Error("API Key not configured");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `
        You are "Mehnati AI", a helpful career assistant for the "Mehnati Li" application.
        Your tone is professional, encouraging, and helpful.
        The user might be looking for a job or looking to hire employees.
        Answer in the language the user is speaking, or default to ${language === 'ar' ? 'Arabic' : 'English'}.
        Keep answers concise and formatted nicely.
      `;

      // Create a placeholder for the model response
      const modelMessageId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        { id: modelMessageId, role: 'model', text: '', isStreaming: true }
      ]);

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [
            ...messages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMessageText }] }
        ],
        config: {
            systemInstruction: systemInstruction,
        }
      });

      let fullText = '';
      
      for await (const chunk of responseStream) {
        const chunkText = chunk.text;
        if (chunkText) {
            fullText += chunkText;
            setMessages(prev => prev.map(m => 
                m.id === modelMessageId 
                ? { ...m, text: fullText } 
                : m
            ));
        }
      }

      // Finalize message
      setMessages(prev => prev.map(m => 
        m.id === modelMessageId 
        ? { ...m, isStreaming: false } 
        : m
      ));

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'model', text: t('ai_error') }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
                        {t('ai_thinking')}
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
            <p className="text-xs text-gray-400">{t('ai_powered')}</p>
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
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                msg.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
            }`}>
                {msg.text}
                {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-500 animate-pulse align-middle"></span>
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
                    // Updated: Arabic points Right (default), English points Left (mirrored)
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
