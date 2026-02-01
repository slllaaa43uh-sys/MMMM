import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Briefcase, Globe, DollarSign, Users, Calendar, MapPin, Link as LinkIcon, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../constants';

interface CreateGlobalJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateGlobalJobModal: React.FC<CreateGlobalJobModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  
  // Form State
  const [content, setContent] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [numberOfEmployees, setNumberOfEmployees] = useState('');
  const [ageRequirement, setAgeRequirement] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!content.trim()) {
      errors.content = language === 'ar' ? 'محتوى الوظيفة مطلوب' : 'Job content is required';
    }
    
    if (!applicationUrl.trim()) {
      errors.applicationUrl = language === 'ar' ? 'رابط التقديم مطلوب' : 'Application URL is required';
    } else if (!/^https?:\/\/.+/.test(applicationUrl.trim())) {
      errors.applicationUrl = language === 'ar' ? 'الرابط يجب أن يبدأ بـ http:// أو https://' : 'URL must start with http:// or https://';
    }
    
    if (!workLocation.trim()) {
      errors.workLocation = language === 'ar' ? 'مكان العمل مطلوب' : 'Work location is required';
    }
    
    if (numberOfEmployees && (isNaN(Number(numberOfEmployees)) || Number(numberOfEmployees) <= 0)) {
      errors.numberOfEmployees = language === 'ar' ? 'عدد الموظفين يجب أن يكون رقم موجب' : 'Number of employees must be a positive number';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: content.trim(),
          isGlobalJob: true,
          globalJobData: {
            applicationUrl: applicationUrl.trim(),
            workLocation: workLocation.trim(),
            ...(salary.trim() && { salary: salary.trim() }),
            ...(numberOfEmployees && { numberOfEmployees: Number(numberOfEmployees) }),
            ...(ageRequirement.trim() && { ageRequirement: ageRequirement.trim() })
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create job');
      }
      
      // Success
      setContent('');
      setApplicationUrl('');
      setWorkLocation('');
      setSalary('');
      setNumberOfEmployees('');
      setAgeRequirement('');
      setFieldErrors({});
      
      if (onSuccess) onSuccess();
      onClose();
      
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل في نشر الوظيفة' : 'Failed to create job'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-green-500">
          <div className="flex items-center gap-2 text-white">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {language === 'ar' ? 'نشر وظيفة عالمية' : 'Post Global Job'}
              </h2>
              <p className="text-xs opacity-90">
                {language === 'ar' ? 'شارك فرصة عمل مع العالم 🌍' : 'Share a job opportunity worldwide 🌍'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Job Content */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Briefcase size={16} className="text-blue-600" />
              {language === 'ar' ? 'وصف الوظيفة' : 'Job Description'}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب تفاصيل الوظيفة، المهام، المؤهلات المطلوبة...' : 'Write job details, responsibilities, qualifications...'}
              className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${fieldErrors.content ? 'border-red-500' : 'border-gray-200'}`}
              rows={6}
            />
            {fieldErrors.content && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.content}</p>
            )}
          </div>

          {/* Application URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <LinkIcon size={16} className="text-green-600" />
              {language === 'ar' ? 'رابط التقديم' : 'Application URL'}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://example.com/apply"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${fieldErrors.applicationUrl ? 'border-red-500' : 'border-gray-200'}`}
            />
            {fieldErrors.applicationUrl && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.applicationUrl}</p>
            )}
          </div>

          {/* Work Location */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-red-600" />
              {language === 'ar' ? 'مكان العمل' : 'Work Location'}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: الرياض، السعودية أو Remote' : 'e.g., Riyadh, Saudi Arabia or Remote'}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${fieldErrors.workLocation ? 'border-red-500' : 'border-gray-200'}`}
            />
            {fieldErrors.workLocation && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.workLocation}</p>
            )}
          </div>

          {/* Optional Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Salary */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-yellow-600" />
                {language === 'ar' ? 'الراتب' : 'Salary'}
              </label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder={language === 'ar' ? '5000 - 7000 ريال' : '$5000 - $7000'}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Number of Employees */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Users size={16} className="text-purple-600" />
                {language === 'ar' ? 'عدد الموظفين' : 'No. of Employees'}
              </label>
              <input
                type="number"
                value={numberOfEmployees}
                onChange={(e) => setNumberOfEmployees(e.target.value)}
                placeholder="5"
                min="1"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${fieldErrors.numberOfEmployees ? 'border-red-500' : 'border-gray-200'}`}
              />
              {fieldErrors.numberOfEmployees && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.numberOfEmployees}</p>
              )}
            </div>

            {/* Age Requirement */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-pink-600" />
                {language === 'ar' ? 'العمر المطلوب' : 'Age Requirement'}
              </label>
              <input
                type="text"
                value={ageRequirement}
                onChange={(e) => setAgeRequirement(e.target.value)}
                placeholder="18-35"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
            <p className="font-bold mb-1">
              {language === 'ar' ? '💡 نصيحة:' : '💡 Tip:'}
            </p>
            <p>
              {language === 'ar' 
                ? 'تأكد من أن رابط التقديم صحيح ويعمل. سيتم توجيه المتقدمين مباشرة إلى هذا الرابط.'
                : 'Make sure the application URL is correct and working. Applicants will be redirected directly to this link.'
              }
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg font-bold hover:from-blue-600 hover:to-green-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {language === 'ar' ? 'جاري النشر...' : 'Publishing...'}
              </>
            ) : (
              <>
                <Globe size={20} />
                {language === 'ar' ? 'نشر الوظيفة' : 'Publish Job'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CreateGlobalJobModal;
