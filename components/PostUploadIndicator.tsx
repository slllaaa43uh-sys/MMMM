
import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PostUploadIndicatorProps {
  status: 'publishing' | 'success' | 'error';
  contentPreview?: string;
  errorMessage?: string;
  progress?: number; // 0 to 100
}

const PostUploadIndicator: React.FC<PostUploadIndicatorProps> = ({ status, contentPreview, errorMessage, progress = 0 }) => {
  const { t } = useLanguage();
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // Circular Progress Calculation
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`fixed top-24 right-4 z-[9999] flex items-center gap-3 p-3 pl-5 rounded-2xl backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-all duration-500 transform ${
      isError 
      ? 'bg-red-50/95 border-red-200' 
      : (isSuccess ? 'bg-white/95 border-green-200' : 'bg-white/95 border-gray-100')
    } ${isSuccess ? 'animate-out fade-out slide-out-to-right duration-1000 delay-3000' : 'animate-in slide-in-from-right duration-500'}`}>
      
      <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
        {status === 'publishing' ? (
           progress > 0 ? (
             // Phase 2: Counting Progress
             <div className="relative w-full h-full flex items-center justify-center">
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="rgba(59, 130, 246, 0.2)" // blue-200 approx
                        strokeWidth="3"
                        fill="transparent"
                    />
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="#3b82f6" // blue-500
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-out"
                    />
                </svg>
                <span className="absolute text-[10px] font-bold text-blue-600">{Math.round(progress)}</span>
             </div>
           ) : (
             // Phase 1: Indeterminate Spinning
             <div className="bg-blue-50 rounded-full w-full h-full flex items-center justify-center border border-blue-100">
                <Loader2 size={24} className="text-blue-600 animate-spin" />
             </div>
           )
        ) : isError ? (
           <div className="bg-red-100 rounded-full w-full h-full flex items-center justify-center border border-red-200">
              <AlertCircle size={24} className="text-red-600 animate-in zoom-in" />
           </div>
        ) : (
           <div className="bg-green-100 rounded-full w-full h-full flex items-center justify-center border border-green-200">
              <Check size={24} className="text-green-600 animate-in zoom-in" strokeWidth={3} />
           </div>
        )}
      </div>

      <div className="flex flex-col min-w-[140px] text-start max-w-[220px]">
         <span className={`text-sm font-bold mb-0.5 ${
           isError ? 'text-red-700' : (isSuccess ? 'text-green-600' : 'text-gray-900')
         }`}>
            {status === 'publishing' 
                ? (progress > 0 ? t('sending') : t('post_publishing')) 
                : (isError ? 'عذراً، فشل النشر' : t('post_success'))}
         </span>
         <span className={`text-[11px] line-clamp-1 font-medium ${isError ? 'text-red-500' : 'text-gray-500'}`}>
            {isError ? (errorMessage || 'خطأ في معالجة الطلب') : (contentPreview || (status === 'publishing' ? t('post_pending_desc') : t('nav_home')))}
         </span>
      </div>

    </div>
  );
};

export default PostUploadIndicator;
