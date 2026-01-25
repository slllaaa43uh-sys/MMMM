
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, ArrowRight, ArrowLeft, Image as ImageIcon, 
  Briefcase, Languages, Check, Crown, 
  MapPin, User, Send, Printer, Trash2, RotateCw, QrCode, Lock, BadgeCheck, Sparkles, FileOutput, AlertTriangle, ShieldAlert, Construction
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

interface CVBuilderWizardProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  existingCV?: any; 
  onDeleteCV?: () => void;
}

const CVBuilderWizard: React.FC<CVBuilderWizardProps> = ({ onClose, onSubmit, existingCV, onDeleteCV }) => {
  const { t, language } = useLanguage();
  
  // Direct access to view_card if data exists
  const [step, setStep] = useState<'welcome' | 'form' | 'view_card'>(existingCV ? 'view_card' : 'welcome');
  
  // --- FORM STATES ---
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState(''); 
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [companies, setCompanies] = useState('');
  const [education, setEducation] = useState(''); 
  const [country, setCountry] = useState(''); 
  const [city, setCity] = useState('');       

  // Uploads
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Card Flip State
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Date Selection Helpers
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const monthsAr = [
    { num: 1, name: 'يناير' }, { num: 2, name: 'فبراير' }, { num: 3, name: 'مارس' }, 
    { num: 4, name: 'أبريل' }, { num: 5, name: 'مايو' }, { num: 6, name: 'يونيو' },
    { num: 7, name: 'يوليو' }, { num: 8, name: 'أغسطس' }, { num: 9, name: 'سبتمبر' },
    { num: 10, name: 'أكتوبر' }, { num: 11, name: 'نوفمبر' }, { num: 12, name: 'ديسمبر' }
  ];
  const monthsEn = [
    { num: 1, name: 'January' }, { num: 2, name: 'February' }, { num: 3, name: 'March' }, 
    { num: 4, name: 'April' }, { num: 5, name: 'May' }, { num: 6, name: 'June' },
    { num: 7, name: 'July' }, { num: 8, name: 'August' }, { num: 9, name: 'September' },
    { num: 10, name: 'October' }, { num: 11, name: 'November' }, { num: 12, name: 'December' }
  ];
  
  const months = language === 'ar' ? monthsAr : monthsEn;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Hydrate form if existingCV is present
  useEffect(() => {
      if (existingCV) {
          setFullName(existingCV.fullName || '');
          setJobTitle(existingCV.jobTitle || '');
          setBio(existingCV.bio || '');
          setEducation(existingCV.education || '');
          setCompanies(existingCV.companies || '');
          setLanguagesSpoken(existingCV.languages || '');
          setCountry(existingCV.country || '');
          setCity(existingCV.city || '');
          setPhotoPreview(existingCV.photoPreview);
          setAge(existingCV.age);
      }
  }, [existingCV]);

  useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
        const d = selectedDay.toString().padStart(2, '0');
        const m = selectedMonth.toString().padStart(2, '0');
        const dateStr = `${selectedYear}-${m}-${d}`;
        setBirthDate(dateStr);
    } else {
        setBirthDate('');
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  useEffect(() => {
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [birthDate]);

  // Bio Character Count Logic (Max 50 Chars)
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (val.length <= 50) {
          setBio(val);
      }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!photoFile && !existingCV) {
        alert(language === 'ar' ? "الصورة الشخصية ضرورية لإصدار البطاقة" : "Profile photo is required to issue the card");
        return;
    }
    if (!fullName || !jobTitle || !birthDate) {
        alert(language === 'ar' ? "يرجى إكمال البيانات الأساسية (الاسم، الوظيفة، التاريخ)" : "Please complete basic details (Name, Job Title, Date)");
        return;
    }

    // Prepare data object (kept for view logic)
    const data = {
      fullName,
      birthDate,
      age,
      jobTitle,
      bio,
      education,
      country,
      city,
      languages: languagesSpoken,
      companies,
      photoFile,
      photoPreview,
      isPremium: false,
      promotionType: 'free',
      publishScope: 'global'
    };

    onSubmit(data);
    setStep('view_card');
  };

  const formatLanguages = (langs: string) => {
      if (!langs) return '';
      return langs.replace(/[,،]/g, ' • ');
  };

  const handlePrint = () => {
      window.print();
  };

  // --- SWIPE HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
      if (touchStart - touchEnd > 75) {
          setIsFlipped(true); 
      }
      if (touchEnd - touchStart > 75) {
          setIsFlipped(false);
      }
  };

  const toggleFlip = () => setIsFlipped(!isFlipped);

  // --- RENDER HELPERS ---
  const renderFrontFace = (data: any, isPreview: boolean = false) => (
    <div 
        className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col h-full w-full"
        style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
            color: 'white',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
        }}
    >
        {/* Subtle Texture */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full blur-2xl"></div>

        {/* Header: Logo (Left) and Header Text (Right) */}
        <div className="flex justify-between items-center p-4 pb-2 z-10 relative">
            <div className="w-10 h-10">
                <Logo className="w-full h-full" />
            </div>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {t('cv_card_header')}
            </div>
        </div>

        {/* Card Content - Grid Layout */}
        <div className="relative z-10 flex-1 px-5 pt-2">
            <div className="flex items-start gap-4">
                
                {/* Left: Small Circular Photo */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-b from-amber-300 to-amber-600 shadow-md">
                        <img 
                            src={data.photoPreview || 'https://via.placeholder.com/150'} 
                            alt="Profile" 
                            className="w-full h-full object-cover rounded-full bg-slate-800 border-2 border-[#1e293b]" 
                        />
                    </div>
                    <div className="bg-green-500/20 border border-green-500/50 text-green-300 text-[6px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-1">
                        {t('cv_label_employed_badge')}
                    </div>
                </div>

                {/* Right: Main Info & Details */}
                <div className="flex-1 min-w-0 pt-1">
                    {/* Name & Title */}
                    <h2 className="text-base font-black text-white leading-tight mb-0.5 truncate">
                        {data.fullName}
                    </h2>
                    <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wide mb-3 truncate">
                        {data.jobTitle}
                    </p>

                    {/* Detail Fields Grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[8px]">
                        {/* Age/DOB */}
                        <div>
                            <span className="block text-gray-500 font-bold uppercase text-[6px]">{t('cv_label_age_birth')}</span>
                            <span className="text-white font-medium">{data.age ? `${data.age} ${t('cv_year_unit')}` : (data.birthDate || '---')}</span>
                        </div>
                        
                        {/* Education */}
                        <div>
                            <span className="block text-gray-500 font-bold uppercase text-[6px]">{t('cv_label_education')}</span>
                            <span className="text-white font-medium truncate block">{data.education || '---'}</span>
                        </div>

                        {/* Location */}
                        <div className="col-span-2">
                            <span className="block text-gray-500 font-bold uppercase text-[6px]">{t('cv_label_residence')}</span>
                            <span className="text-white font-medium">{data.country} {data.city ? `- ${data.city}` : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio Section (Bottom of Front) */}
            {data.bio && (
                <div className="mt-3 border-t border-white/10 pt-2">
                    <span className="block text-gray-500 font-bold uppercase text-[6px] mb-0.5">{t('profile_bio')}</span>
                    <p className="text-[8px] text-gray-300 leading-relaxed line-clamp-2">
                        {data.bio}
                    </p>
                </div>
            )}
        </div>
        
        {/* Bottom Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 absolute bottom-0"></div>
    </div>
  );

  const renderBackFace = (data: any, idString: string) => (
    <div 
        className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col h-full w-full"
        style={{
            background: '#0f172a',
            color: 'white',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
        }}
    >
        {/* Magnetic Stripe Simulation */}
        <div className="mt-4 w-full h-10 bg-black/80 relative">
            <div className="absolute inset-0 opacity-20 bg-noise"></div>
        </div>

        <div className="flex-1 flex flex-col p-6 justify-between relative z-10">
            
            {/* ID Number Section */}
            <div className="flex flex-col items-center justify-center mt-2">
                <span className="text-[7px] text-gray-500 uppercase tracking-[0.2em] mb-1">{t('cv_label_id_num')}</span>
                <div className="font-mono text-sm tracking-widest text-white bg-white/5 px-3 py-1 rounded border border-white/10 shadow-inner">
                    {idString}
                </div>
            </div>

            <div className="flex items-end justify-between border-t border-white/10 pt-3 mt-auto">
                <div className="flex-1 pr-2">
                    <p className="text-[7px] text-gray-500 leading-relaxed">
                        {t('cv_footer_text')}
                    </p>
                </div>
                <div className="bg-white p-1 rounded-sm flex-shrink-0">
                    <QrCode size={42} className="text-black" />
                </div>
            </div>
        </div>
    </div>
  );

  // --- VIEW CARD SCREEN ---
  if (step === 'view_card') {
      const cardData = existingCV || {
          fullName, age, jobTitle, bio, education, country, city, 
          languages: languagesSpoken, photoPreview
      };
      const randomId = "EMPLOYED-8829-1029";

      return (
        <div className="fixed inset-0 z-[200] bg-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20 pt-safe print:hidden">
                <button onClick={onClose} className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors">
                    <ArrowRight size={22} className={language === 'en' ? 'rotate-180' : ''} />
                    <span className="font-bold text-sm">{t('back')}</span>
                </button>
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">{t('cv_preview_header')}</h2>
                <div className="w-8"></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-start pt-8 p-4 pb-20">
                <div 
                    id="interactive-card"
                    className="relative w-full max-w-md aspect-[1.586/1] rounded-2xl shadow-2xl cursor-pointer perspective-[1000px] group print:hidden"
                    onClick={toggleFlip}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className={`relative w-full h-full duration-700 transition-all preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                        <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-lg" style={{ backfaceVisibility: 'hidden' }}>
                            {renderFrontFace(cardData)}
                        </div>
                        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow-lg" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            {renderBackFace(cardData, randomId)}
                        </div>
                    </div>
                </div>

                {/* Print Layout */}
                <div id="print-layout" className="hidden print:flex print:flex-col print:items-center print:justify-center print:w-full print:h-full print:bg-white print:gap-8 print:p-0">
                    <div className="relative overflow-hidden border border-gray-200 rounded-xl" style={{ width: '85.6mm', height: '53.98mm', pageBreakInside: 'avoid' }}>{renderFrontFace(cardData)}</div>
                    <div className="relative overflow-hidden border border-gray-200 rounded-xl" style={{ width: '85.6mm', height: '53.98mm', pageBreakInside: 'avoid' }}>{renderBackFace(cardData, randomId)}</div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs animate-pulse print:hidden">
                    <RotateCw size={14} />
                    <span>{t('cv_hint_flip')}</span>
                </div>

                <div className="mt-8 w-full max-w-sm space-y-3 print:hidden">
                    <button onClick={handlePrint} className="w-full py-3 bg-white border border-gray-200 text-gray-800 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2">
                        <Printer size={18} className="text-blue-600" />
                        {t('cv_btn_print')}
                    </button>
                    <button onClick={() => { if (window.confirm(t('cv_confirm_delete'))) { if (onDeleteCV) onDeleteCV(); setStep('welcome'); } }} className="w-full py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl font-bold text-sm shadow-sm hover:bg-red-100 flex items-center justify-center gap-2">
                        <Trash2 size={18} />
                        {t('cv_btn_delete')}
                    </button>
                </div>
            </div>
            
            {/* Print Styles */}
            <style>{`
                .backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .preserve-3d { transform-style: preserve-3d; }
                .perspective-1000 { perspective: 1000px; }
                @media print {
                    @page { margin: 0; size: auto; }
                    body, html { background-color: white !important; height: auto; }
                    body * { visibility: hidden; }
                    #interactive-card, #interactive-card * { display: none !important; }
                    #print-layout, #print-layout * { visibility: visible; display: flex !important; }
                    #print-layout { position: absolute; left: 0; top: 0; width: 100%; min-height: 100vh; padding-top: 20mm; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
      );
  }

  // --- FORM SCREEN ---
  if (step === 'form') {
    return (
    <div className="fixed inset-0 z-[200] bg-gray-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20 pt-safe border-b border-gray-100">
         <button onClick={() => setStep('welcome')} className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <ArrowRight size={20} className={language === 'en' ? 'rotate-180' : ''} />
         </button>
         <h2 className="text-base font-black text-gray-800">{t('cv_form_title')}</h2>
         <button onClick={handleSubmit} className="bg-black text-white hover:bg-gray-800 px-4 py-1.5 rounded-full shadow-sm transition-colors active:scale-95 font-bold text-xs flex items-center gap-1">
            {t('cv_btn_export')}
            {language === 'ar' ? <FileOutput className="rotate-180" size={14} /> : <FileOutput size={14} />}
         </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-10 bg-gray-50">
         {/* Form Fields ... (Existing Form Logic) */}
         <div className="space-y-3">
            <div className="flex justify-center mb-2">
                <div onClick={() => photoInputRef.current?.click()} className={`relative w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-sm bg-white ${photoFile ? 'border-green-500' : 'border-dashed border-gray-300'}`}>
                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    {photoPreview ? <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1 text-gray-400"><ImageIcon size={24} className="text-blue-500" /><span className="text-[9px] font-bold">{t('cv_photo_upload_text')}</span></div>}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_fullname')} *</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black outline-none shadow-sm" /></div>
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_jobtitle')} *</label><input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black outline-none shadow-sm" /></div>
            </div>
            <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_bio')}</label><textarea value={bio} onChange={handleBioChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-black outline-none resize-none h-20 shadow-sm" placeholder={t('cv_label_bio_placeholder')} /><div className={`text-[9px] text-right px-1 ${bio.length === 50 ? 'text-red-500' : 'text-gray-400'}`}>{bio.length}/50</div></div>
            <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_dob')} *</label><div className="flex gap-2"><select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none text-center shadow-sm"><option value="">{t('cv_day')}</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="flex-[1.5] bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none text-center shadow-sm"><option value="">{t('cv_month')}</option>{months.map(m => <option key={m.num} value={m.num}>{m.name}</option>)}</select><select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="flex-[1.2] bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none text-center shadow-sm"><option value="">{t('cv_year')}</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
            <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_country')}</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none shadow-sm" placeholder={t('cv_ph_country')} /></div>
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_city')}</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none shadow-sm" placeholder={t('cv_ph_city')} /></div>
            </div>
            <div className="grid grid-cols-1 gap-2">
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_education')}</label><input type="text" value={education} onChange={(e) => setEducation(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none shadow-sm" placeholder={t('cv_ph_education')} /></div>
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_languages')}</label><input type="text" value={languagesSpoken} onChange={(e) => setLanguagesSpoken(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none shadow-sm" placeholder={t('cv_ph_languages')} /></div>
            </div>
            <div><label className="text-[10px] font-bold text-gray-500 mb-1 block px-1">{t('cv_label_companies')}</label><input type="text" value={companies} onChange={(e) => setCompanies(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none shadow-sm" placeholder={t('cv_ph_companies')} /></div>
         </div>
      </div>
    </div>
    );
  }

  // --- WELCOME SCREEN (MODIFIED) ---
  const dummyData = {
      fullName: "محمد أحمد",
      jobTitle: "مدير مشاريع",
      birthDate: "1995-01-01",
      age: 28,
      education: "ماجستير إدارة أعمال",
      country: "السعودية",
      city: "الرياض",
      bio: "خبير في إدارة المشاريع التقنية بخبرة تزيد عن 5 سنوات.",
      photoPreview: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=150&h=150"
  };

  return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-500">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-black z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/30 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-600/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-safe top-6 left-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm z-50">
            <X size={24} />
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10 w-full">
            
            {/* Title */}
            <h1 className="text-2xl font-black text-white mb-6 tracking-tight flex items-center gap-2">
                <BadgeCheck className="text-amber-500" />
                {t('cv_welcome_title')}
            </h1>

            {/* DUMMY CARD PREVIEW (SCALED DOWN) */}
            <div className="w-full max-w-[320px] aspect-[1.586/1] mb-8 shadow-2xl relative group transform hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                    {renderFrontFace(dummyData, true)}
                </div>
            </div>

            {/* GOVERNMENT DISCLAIMER (IMPORTANT) */}
            <div className="w-full max-w-xs bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-start mb-6 backdrop-blur-sm">
                <div className="flex gap-3">
                    <ShieldAlert size={24} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-xs font-bold text-red-200 mb-1">{t('cv_disclaimer_title')}</h3>
                        <p className="text-[10px] text-red-100/80 leading-relaxed whitespace-pre-wrap">
                            {t('cv_disclaimer_msg')}
                        </p>
                    </div>
                </div>
            </div>

            {/* MAINTENANCE MODE Button */}
            <div className="w-full max-w-xs space-y-3">
                <button 
                  disabled={true}
                  className="w-full py-4 bg-gray-800 text-gray-400 rounded-xl font-bold text-base shadow-none cursor-not-allowed flex items-center justify-center gap-2 border border-gray-700 opacity-80"
                >
                  <Construction size={18} />
                  <span>{t('cv_btn_maintenance')}</span>
                </button>
                <p className="text-[9px] text-gray-500 leading-relaxed font-medium">
                    {t('cv_msg_maintenance')}
                </p>
            </div>

        </div>
      </div>
  );
};

export default CVBuilderWizard;
