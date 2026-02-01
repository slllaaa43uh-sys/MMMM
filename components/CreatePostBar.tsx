
import React from 'react';
import Avatar from './Avatar';
import { API_BASE_URL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface CreatePostBarProps {
  onOpen: () => void;
  onLoginRequest?: () => void; // New prop for guest handling
  isVisible?: boolean; // New prop for visibility control
}

const CreatePostBar: React.FC<CreatePostBarProps> = ({ onOpen, onLoginRequest, isVisible = true }) => {
  const { t, language } = useLanguage();
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || 'مستخدم';
  const userAvatar = localStorage.getItem('userAvatar');
  const avatarSrc = userAvatar ? (userAvatar.startsWith('http') ? userAvatar : `${API_BASE_URL}${userAvatar}`) : null;

  const handleClick = () => {
      if (token) {
          onOpen();
      } else {
          if (onLoginRequest) onLoginRequest();
      }
  };

  const placeholderText = token 
    ? (language === 'ar' 
        ? `${t('post_header_create')} ${userName}؟ ${t('nav_haraj')}، ${t('nav_jobs')}...`
        : `${t('post_header_create')} ${userName}? ${t('nav_haraj')}, ${t('nav_jobs')}...`)
    : (language === 'ar' 
        ? "بما تفكر أيها الزائر؟ قم بتسجيل الدخول" 
        : "What's on your mind, Guest? Log in");

  return (
    <div className={`bg-white px-4 py-3 shadow-sm border-b border-gray-100 transition-all duration-200 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div className="flex items-center gap-3">
        <Avatar 
          name={userName}
          src={token ? avatarSrc : null}
          className="w-10 h-10 border border-gray-100 flex-shrink-0"
        />
        <div 
          onClick={handleClick}
          className="flex-1 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center px-4 cursor-pointer transition-all duration-200 border border-gray-200 overflow-hidden"
        >
          <span className="text-gray-500 text-xs sm:text-sm font-medium truncate text-start dir-auto w-full select-none">
             {placeholderText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreatePostBar;
