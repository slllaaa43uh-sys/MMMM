
import React, { useState, useRef, useEffect, PointerEvent } from 'react';
import { 
  X, Palette, Check, ALargeSmall, Image as ImageIcon, Loader2, 
  ArrowLeft, Send, Play, Volume2, VolumeX,
  Maximize, Minimize, Smile, Type, Edit3, PlusCircle, AlertCircle, Wand2, Trash2, Minus, Plus
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateStoryModalProps {
  onClose: () => void;
  onPost: (storyPayload: any) => void; 
}

interface OverlayItem {
  id: number;
  type: 'text' | 'sticker';
  content: string;
  x: number;
  y: number;
  scale: number;
  color?: string;
}

const GRADIENTS = [
  'bg-gradient-to-br from-purple-600 to-blue-500',
  'bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500',
  'bg-gradient-to-bl from-cyan-400 to-blue-600',
  'bg-gradient-to-br from-pink-500 to-rose-500',
  'bg-gradient-to-t from-emerald-400 to-cyan-500',
  'bg-gradient-to-r from-violet-600 to-indigo-600',
  'bg-gradient-to-br from-slate-900 to-slate-700',
];

const FONT_SIZES = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];

const STICKERS = ['😂','😍','🔥','👍','😭','🎉','👀','✨','❤️','😎','🤔','😡','🥰','🤩','🤪','👻','💀','👽','🤖','💩'];

const FILTERS = [
    { name: 'طبيعي', css: 'none' },
    { name: 'ساطع', css: 'saturate(1.5) contrast(1.1)' },
    { name: 'دافئ', css: 'sepia(0.3) saturate(1.2)' },
    { name: 'أبيض/أسود', css: 'grayscale(1)' },
    { name: 'بارد', css: 'hue-rotate(180deg) saturate(0.8)' },
    { name: 'كلاسيك', css: 'sepia(0.6) contrast(1.2)' },
];

// Placeholder image (AI Style) to show before video frame loads or if fails
const DEFAULT_FILTER_IMG = "https://images.unsplash.com/photo-1620641788421-7f1c33747fc7?q=80&w=200&auto=format&fit=crop";

// --- Internal Component: Draggable Overlay ---
const DraggableOverlay: React.FC<{
  item: OverlayItem;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: number, updates: Partial<OverlayItem>) => void;
}> = ({ item, isSelected, onSelect, onUpdate }) => {
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragStart({ x: e.clientX - item.x, y: e.clientY - item.y });
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStart) {
      e.preventDefault();
      e.stopPropagation();
      onUpdate(item.id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragStart(null);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute touch-none cursor-grab active:cursor-grabbing select-none flex items-center justify-center z-30"
      style={{
        left: item.x,
        top: item.y,
        transform: `translate(-50%, -50%) scale(${item.scale})`,
        border: isSelected ? '1px dashed rgba(255,255,255,0.8)' : 'none',
        padding: '8px',
        borderRadius: '8px'
      }}
    >
      {item.type === 'text' ? (
        <span 
          className="text-2xl font-bold whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
          style={{ color: item.color || '#fff' }}
        >
          {item.content}
        </span>
      ) : (
        <span className="text-4xl drop-shadow-md">{item.content}</span>
      )}
    </div>
  );
};

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onPost }) => {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<'text' | 'media'>('text');
  
  // Text Mode State (Simple Story)
  const [text, setText] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(2);
  
  // Media Mode State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  // Separate preview for thumbnails (can be same as mediaPreview for images)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  
  // Advanced Editor States
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('none');
  
  // Scale / Fit State
  // CHANGED DEFAULT TO 'cover' as requested (Natural mode first)
  const [mediaScale, setMediaScale] = useState(1);
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>('cover');
  
  // UI Panels
  const [showTextInput, setShowTextInput] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  
  // Temporary Text Input
  const [tempText, setTempText] = useState('');
  const [tempColor, setTempColor] = useState('#ffffff');

  // Video Specific
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]); 
  const [isVideoError, setIsVideoError] = useState(false);
  
  // Trimming State
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0); 
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Dragging State (Timeline)
  const [isDraggingTimeline, setIsDraggingTimeline] = useState<'start' | 'end' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup object URLs
  useEffect(() => {
      return () => {
          if (mediaPreview && !mediaPreview.startsWith('http')) {
              URL.revokeObjectURL(mediaPreview);
          }
      };
  }, []);

  const handleNextBackground = () => setBgIndex((prev) => (prev + 1) % GRADIENTS.length);
  const handleNextSize = () => setSizeIndex((prev) => (prev + 1) % FONT_SIZES.length);

  // --- OPTIMIZED BACKGROUND THUMBNAIL GENERATOR ---
  useEffect(() => {
    if (mode === 'media' && mediaFile?.type.startsWith('video') && duration > 0 && thumbnails.length === 0) {
        const generate = async () => {
            try {
                // Generate a quick first frame for filter previews immediately
                const video = document.createElement('video');
                video.src = URL.createObjectURL(mediaFile);
                video.muted = true;
                video.playsInline = true;
                video.crossOrigin = "anonymous";
                video.preload = "auto"; 

                await new Promise<void>((resolve) => {
                    video.onloadedmetadata = () => resolve();
                    video.onerror = () => resolve();
                });

                // FIX BLACK SCREEN: Jump to 0.5s instead of 0.0s to avoid black fade-in frames
                // Also ensure we don't jump past duration if video is very short
                const safeStartTime = Math.min(0.5, duration / 2);
                video.currentTime = safeStartTime;
                
                await new Promise<void>(r => { 
                    const seekHandler = () => r();
                    video.addEventListener('seeked', seekHandler, { once: true });
                    // Fallback timeout in case seeked doesn't fire
                    setTimeout(seekHandler, 1000);
                }); 
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // Low resolution for performance but high enough for UI
                const w = 120; 
                const h = 120; 
                canvas.width = w;
                canvas.height = h;

                if(ctx) {
                    ctx.drawImage(video, 0, 0, w, h);
                    const firstFrame = canvas.toDataURL('image/jpeg', 0.6);
                    setThumbPreview(firstFrame);
                }

                // Generate Timeline (Limit to 5 frames for speed)
                const thumbs: string[] = [];
                const steps = 5; 
                
                for (let i = 0; i < steps; i++) {
                    // Calculate time steps, avoiding exactly 0.0 if possible
                    const time = Math.min(safeStartTime + ((duration - safeStartTime) / steps) * i, duration - 0.1);
                    video.currentTime = time;
                    
                    await new Promise<void>(r => {
                        const handler = () => {
                            if (ctx) {
                                ctx.drawImage(video, 0, 0, w, h);
                                // Ensure we don't push empty black frames if drawImage fails (rare but possible)
                                try { thumbs.push(canvas.toDataURL('image/jpeg', 0.4)); } catch(e){}
                            }
                            r();
                        };
                        video.addEventListener('seeked', handler, { once: true });
                        setTimeout(handler, 300); // Faster timeout for strip
                    });
                }
                setThumbnails(thumbs);
                URL.revokeObjectURL(video.src);
            } catch (e) {
                console.error("Thumb gen error", e);
                // If error, thumbnails stays empty, UI shows loading or placeholder
            }
        };
        // Small delay to let UI render first
        setTimeout(generate, 100);
    } else if (mode === 'media' && !mediaFile?.type.startsWith('video') && mediaPreview) {
        setThumbPreview(mediaPreview); // Images use themselves as preview
    }
  }, [mode, mediaFile, duration]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      setMediaFile(file);
      setMediaPreview(url);
      
      // Reset Editor State
      setOverlays([]);
      setSelectedOverlayId(null);
      setActiveFilter('none');
      setObjectFit('cover'); // DEFAULT TO COVER (Natural Mode)
      setMediaScale(1);
      
      setIsVideoReady(false);
      setIsVideoError(false);
      setDuration(0);
      setTrimStart(0);
      setTrimEnd(0);
      setThumbnails([]);
      setThumbPreview(null);
      setIsPlaying(false); // Let events handle playing state

      setMode('media');
    }
  };

  const handlePublishClick = () => {
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'media' && !mediaFile) return;

    const payload: any = { type: mode };

    if (mode === 'text') {
        payload.text = text;
        payload.backgroundColor = GRADIENTS[bgIndex];
    } else {
        payload.file = mediaFile;
        // Include overlays in payload to backend (even if backend processes them differently)
        payload.overlays = overlays; 
        payload.filter = activeFilter;
        payload.mediaScale = mediaScale;
        payload.objectFit = objectFit;
        
        if (duration > 0 && trimEnd > 0) {
            payload.trimData = { start: trimStart, end: trimEnd };
        }
    }

    onPost(payload);
    onClose(); 
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSize = (seconds: number) => {
    if (!mediaFile || duration === 0) return "0 MB";
    const estimatedBytes = (mediaFile.size / duration) * seconds;
    const mb = estimatedBytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // --- EDITOR FUNCTIONS ---

  const addTextOverlay = () => {
      if (!tempText.trim()) return;
      const newItem: OverlayItem = {
          id: Date.now(),
          type: 'text',
          content: tempText,
          x: (containerRef.current?.clientWidth || 300) / 2,
          y: (containerRef.current?.clientHeight || 500) / 2,
          scale: 1,
          color: tempColor
      };
      setOverlays(prev => [...prev, newItem]);
      setSelectedOverlayId(newItem.id);
      setTempText('');
      setShowTextInput(false);
  };

  const addStickerOverlay = (sticker: string) => {
      const newItem: OverlayItem = {
          id: Date.now(),
          type: 'sticker',
          content: sticker,
          x: (containerRef.current?.clientWidth || 300) / 2,
          y: (containerRef.current?.clientHeight || 500) / 2,
          scale: 1.5
      };
      setOverlays(prev => [...prev, newItem]);
      setSelectedOverlayId(newItem.id);
      setShowStickerPicker(false);
  };

  const updateOverlay = (id: number, updates: Partial<OverlayItem>) => {
      setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteSelectedOverlay = () => {
      if (selectedOverlayId) {
          setOverlays(prev => prev.filter(o => o.id !== selectedOverlayId));
          setSelectedOverlayId(null);
      }
  };

  // Updated to toggle between fit modes properly
  const toggleObjectFit = () => {
      setObjectFit(prev => {
          if (prev === 'contain') {
              // Switching TO cover
              setMediaScale(1); 
              return 'cover';
          } else {
              // Switching TO contain (Minimize)
              setMediaScale(1); // Keep scale at 1, CSS object-fit handles the "mini" look
              return 'contain';
          }
      });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (selectedOverlayId) {
          updateOverlay(selectedOverlayId, { scale: val });
      }
  };

  const togglePlay = () => {
      if (videoRef.current) {
          if (videoRef.current.paused) {
              if (videoRef.current.currentTime >= trimEnd) {
                  videoRef.current.currentTime = trimStart;
              }
              videoRef.current.play().catch(e => console.error("Play error", e));
          } else {
              videoRef.current.pause();
          }
      }
  };

  const handleTimeUpdate = () => {
      if (videoRef.current && !isDraggingTimeline) {
          const curr = videoRef.current.currentTime;
          if (duration > 0 && curr >= trimEnd) {
              videoRef.current.currentTime = trimStart;
              if (isPlaying) videoRef.current.play();
          }
      }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      const vid = e.currentTarget;
      const d = vid.duration;
      if (d && d !== Infinity && !isNaN(d)) {
          setDuration(d);
          setTrimEnd(d);
          setTrimStart(0);
          setIsVideoReady(true);
      }
  };

  // --- TOUCH / TIMELINE LOGIC ---
  const handleTouchStartTimeline = (e: React.TouchEvent | React.MouseEvent, type: 'start' | 'end') => {
      e.stopPropagation();
      setIsDraggingTimeline(type);
      if (videoRef.current) videoRef.current.pause();
  };

  const handleTouchMoveTimeline = (e: any) => {
      if (!isDraggingTimeline || !timelineRef.current || duration === 0) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = offsetX / rect.width;
      const newTime = percentage * duration;

      if (isDraggingTimeline === 'start') {
          const maxStart = trimEnd - 1; 
          const validStart = Math.min(newTime, maxStart);
          setTrimStart(validStart);
          if (videoRef.current) videoRef.current.currentTime = validStart;
      } else if (isDraggingTimeline === 'end') {
          const minEnd = trimStart + 1;
          const validEnd = Math.max(newTime, minEnd);
          setTrimEnd(validEnd);
          if (videoRef.current) videoRef.current.currentTime = validEnd;
      }
  };

  const handleTouchEndTimeline = () => {
      setIsDraggingTimeline(null);
  };

  useEffect(() => {
      if (isDraggingTimeline) {
          window.addEventListener('mousemove', handleTouchMoveTimeline);
          window.addEventListener('mouseup', handleTouchEndTimeline);
          window.addEventListener('touchmove', handleTouchMoveTimeline);
          window.addEventListener('touchend', handleTouchEndTimeline);
      }
      return () => {
          window.removeEventListener('mousemove', handleTouchMoveTimeline);
          window.removeEventListener('mouseup', handleTouchEndTimeline);
          window.removeEventListener('touchmove', handleTouchMoveTimeline);
          window.removeEventListener('touchend', handleTouchEndTimeline);
      };
  }, [isDraggingTimeline, trimStart, trimEnd, duration]);


  // --- MEDIA EDITOR VIEW ---
  if (mode === 'media') {
      const startPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
      const endPercent = duration > 0 ? (trimEnd / duration) * 100 : 100;
      const widthPercent = endPercent - startPercent;
      const currentDuration = trimEnd > 0 ? (trimEnd - trimStart) : 0;
      const isVideo = mediaFile?.type.startsWith('video');

      return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
            
            {/* 1. Header & Tools */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-safe flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent pb-16 pointer-events-none">
                <button 
                    onClick={() => { setMode('text'); setMediaFile(null); setMediaPreview(null); }} 
                    className="p-2 rounded-full text-white hover:bg-white/20 transition-colors pointer-events-auto"
                >
                    <X size={28} strokeWidth={2.5} />
                </button>

                <div className="flex gap-4 items-center pointer-events-auto">
                    {/* Tool: Crop/Fit (UPDATED ICON & LOGIC) */}
                    <button 
                        onClick={toggleObjectFit} 
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="p-2 bg-black/40 backdrop-blur-sm rounded-full group-active:scale-90 transition-transform">
                            {objectFit === 'contain' ? (
                                <Maximize size={20} className="text-white" />
                            ) : (
                                <Minimize size={20} className="text-white" />
                            )}
                        </div>
                        <span className="text-[10px] text-white shadow-sm font-bold">
                            {objectFit === 'contain' ? 'تكبير' : 'تصغير'}
                        </span>
                    </button>

                    {/* Tool: Stickers */}
                    <button 
                        onClick={() => setShowStickerPicker(true)} 
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="p-2 bg-black/40 backdrop-blur-sm rounded-full group-active:scale-90 transition-transform">
                            <Smile size={20} className="text-white" />
                        </div>
                        <span className="text-[10px] text-white shadow-sm font-bold">ملصق</span>
                    </button>

                    {/* Tool: Text */}
                    <button 
                        onClick={() => setShowTextInput(true)} 
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="p-2 bg-black/40 backdrop-blur-sm rounded-full group-active:scale-90 transition-transform">
                            <Type size={20} className="text-white" />
                        </div>
                        <span className="text-[10px] text-white shadow-sm font-bold">نص</span>
                    </button>

                    {/* Tool: Filter/Edit */}
                    <button 
                        onClick={() => setShowFilterPicker(true)} 
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="p-2 bg-black/40 backdrop-blur-sm rounded-full group-active:scale-90 transition-transform">
                            <Wand2 size={20} className="text-white" />
                        </div>
                        <span className="text-[10px] text-white shadow-sm font-bold">تعديل</span>
                    </button>
                </div>
            </div>

            {/* 2. Trimmer Section (Overlay on Top) - Only for Video */}
            {isVideo && duration > 0 && !isVideoError && (
                <div className="absolute top-24 left-0 right-0 z-40 px-6 flex flex-col items-center gap-2 pointer-events-auto">
                    <div className="relative w-full h-12 select-none rounded-md overflow-hidden bg-gray-800/50" ref={timelineRef}>
                        <div className="absolute inset-0 flex">
                            {thumbnails.length > 0 ? (
                                thumbnails.map((src, i) => (
                                    <img key={i} src={src} alt="" className="flex-1 h-full object-cover min-w-0" />
                                ))
                            ) : (
                                // Fallback loading state for timeline
                                <div className="w-full h-full bg-white/10 animate-pulse flex items-center justify-center">
                                    <Loader2 size={16} className="animate-spin text-white/50" />
                                </div>
                            )}
                        </div>
                        <div className="absolute top-0 bottom-0 left-0 bg-black/60 z-20 pointer-events-none" style={{ width: `${startPercent}%` }} />
                        <div className="absolute top-0 bottom-0 right-0 bg-black/60 z-20 pointer-events-none" style={{ width: `${100 - endPercent}%` }} />
                        <div className="absolute top-0 bottom-0 border-y-2 border-white z-30 pointer-events-none" style={{ left: `${startPercent}%`, width: `${widthPercent}%` }} />
                        <div 
                            className="absolute top-0 bottom-0 w-4 bg-white rounded-l-md z-40 cursor-ew-resize flex items-center justify-center shadow-md touch-none"
                            style={{ left: `calc(${startPercent}% - 0px)` }} 
                            onMouseDown={(e) => handleTouchStartTimeline(e, 'start')}
                            onTouchStart={(e) => handleTouchStartTimeline(e, 'start')}
                        >
                            <div className="w-1 h-1 bg-black/40 rounded-full"></div>
                        </div>
                        <div 
                            className="absolute top-0 bottom-0 w-4 bg-white rounded-r-md z-40 cursor-ew-resize flex items-center justify-center shadow-md touch-none"
                            style={{ left: `calc(${endPercent}% - 16px)` }}
                            onMouseDown={(e) => handleTouchStartTimeline(e, 'end')}
                            onTouchStart={(e) => handleTouchStartTimeline(e, 'end')}
                        >
                            <div className="w-1 h-1 bg-black/40 rounded-full"></div>
                        </div>
                    </div>
                    <div className="bg-[#1f2937]/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
                        <span className="text-white text-[11px] font-medium">
                            {formatTime(currentDuration)} • {formatSize(currentDuration)}
                        </span>
                    </div>
                </div>
            )}

            {/* 3. MAIN PREVIEW AREA (Canvas) */}
            <div 
                ref={containerRef}
                className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden" 
                onClick={() => {
                    if (selectedOverlayId) setSelectedOverlayId(null);
                    else if (!isVideoError && isVideo) togglePlay();
                }}
            >
                {/* Background Blur for aesthetic 'Contain' mode */}
                {objectFit === 'contain' && (
                    <div 
                        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 blur-xl scale-125 pointer-events-none"
                        style={{ 
                            backgroundImage: `url(${thumbPreview || mediaPreview || DEFAULT_FILTER_IMG})`,
                            zIndex: 0 
                        }}
                    />
                )}

                {isVideo ? (
                    isVideoError ? (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                            <AlertCircle size={48} className="text-red-500 mb-2" />
                            <p className="text-sm font-bold">عذراً، تنسيق الفيديو غير مدعوم</p>
                        </div>
                    ) : (
                        <>
                            <video 
                                key={mediaPreview}
                                ref={videoRef}
                                src={mediaPreview!} 
                                className="w-full h-full relative z-10 transition-all duration-300"
                                style={{ 
                                    objectFit: objectFit,
                                    transform: `scale(${mediaScale})`, // Actual scale transform
                                    filter: activeFilter 
                                }}
                                playsInline
                                autoPlay
                                muted={isMuted} 
                                preload="auto"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnded={() => setIsPlaying(false)}
                                onError={() => setIsVideoError(true)}
                            />
                            {!isPlaying && isVideoReady && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
                                    <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                        <Play size={40} className="text-white fill-white ml-2" />
                                    </div>
                                </div>
                            )}
                        </>
                    )
                ) : (
                    <img 
                        src={mediaPreview!} 
                        alt="preview" 
                        className="w-full h-full relative z-10 transition-all duration-300"
                        style={{ 
                            objectFit: objectFit,
                            transform: `scale(${mediaScale})`, // Actual scale transform
                            filter: activeFilter 
                        }}
                    />
                )}

                {/* Render Overlays */}
                {overlays.map(overlay => (
                    <DraggableOverlay 
                        key={overlay.id} 
                        item={overlay} 
                        isSelected={selectedOverlayId === overlay.id} 
                        onSelect={() => setSelectedOverlayId(overlay.id)}
                        onUpdate={updateOverlay}
                    />
                ))}
            </div>

            {/* 4. MODALS & DRAWERS */}
            
            {/* Text Input Modal */}
            {showTextInput && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <input
                        type="text"
                        value={tempText}
                        onChange={(e) => setTempText(e.target.value)}
                        placeholder="اكتب هنا..."
                        className="bg-transparent text-white text-3xl font-bold text-center outline-none border-b-2 border-white/50 focus:border-white w-full max-w-sm mb-8 placeholder:text-gray-500"
                        autoFocus
                    />
                    <div className="flex gap-4 mb-8">
                        {['#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'].map(color => (
                            <button
                                key={color}
                                onClick={() => setTempColor(color)}
                                className={`w-8 h-8 rounded-full border-2 ${tempColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowTextInput(false)} className="px-6 py-2 bg-gray-700 rounded-full text-white font-bold text-sm">{t('cancel')}</button>
                        <button onClick={addTextOverlay} disabled={!tempText.trim()} className="px-6 py-2 bg-blue-600 rounded-full text-white font-bold text-sm disabled:opacity-50">{t('done')}</button>
                    </div>
                </div>
            )}

            {/* Sticker Picker */}
            {showStickerPicker && (
                <div className="absolute bottom-0 left-0 right-0 z-[60] bg-gray-900 border-t border-gray-800 rounded-t-3xl h-[40vh] flex flex-col animate-in slide-in-from-bottom">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <span className="text-white font-bold text-sm">الملصقات</span>
                        <button onClick={() => setShowStickerPicker(false)}><X size={20} className="text-gray-400" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-4">
                        {STICKERS.map((sticker, i) => (
                            <button key={i} onClick={() => addStickerOverlay(sticker)} className="text-4xl hover:scale-110 transition-transform">
                                {sticker}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Picker */}
            {showFilterPicker && (
                <div className="absolute bottom-24 left-0 right-0 z-[50] p-4">
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 overflow-x-auto no-scrollbar flex gap-4">
                        {FILTERS.map(filter => (
                            <button 
                                key={filter.name}
                                onClick={() => setActiveFilter(filter.css)}
                                className={`flex flex-col items-center gap-1 min-w-[60px] ${activeFilter === filter.css ? 'text-blue-400' : 'text-gray-400'}`}
                            >
                                <div className={`w-14 h-14 rounded-lg border-2 overflow-hidden flex items-center justify-center bg-gray-800 ${activeFilter === filter.css ? 'border-blue-500' : 'border-transparent'}`}>
                                    {/* LIVE PREVIEW BACKGROUND using image/video thumb or fallback AI image */}
                                    {thumbPreview || mediaPreview ? (
                                        <div 
                                            className="w-full h-full bg-cover bg-center" 
                                            style={{ 
                                                filter: filter.css, 
                                                backgroundImage: `url(${thumbPreview || mediaPreview || DEFAULT_FILTER_IMG})`
                                            }}
                                        ></div>
                                    ) : (
                                        <Loader2 size={16} className="text-white/50 animate-spin" />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold">{filter.name}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowFilterPicker(false)} className="absolute -top-3 right-2 bg-gray-800 rounded-full p-1"><X size={14} className="text-white" /></button>
                </div>
            )}

            {/* Overlay Controls (Delete / Resize) */}
            {selectedOverlayId && (
                <div className="absolute bottom-20 left-0 right-0 z-[55] flex flex-col items-center gap-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    {/* Scale Slider */}
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 w-64 border border-white/10">
                        <Minus size={14} className="text-white" />
                        <input 
                            type="range" min="0.5" max="3" step="0.1"
                            value={overlays.find(o => o.id === selectedOverlayId)?.scale || 1}
                            onChange={handleScaleChange}
                            className="flex-1 accent-blue-500 h-1 bg-gray-500 rounded-lg appearance-none"
                        />
                        <Plus size={14} className="text-white" />
                    </div>
                    
                    {/* Delete Button */}
                    <button 
                        onClick={deleteSelectedOverlay}
                        className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                        <Trash2 size={24} className="text-white" />
                    </button>
                </div>
            )}

            {/* 5. BOTTOM CONTROLS (Publish) */}
            {!isVideoError && (
                <>
                    {isVideo && (
                        <div className="absolute bottom-6 left-6 z-50">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} 
                                className="p-3 bg-black/40 rounded-full text-white backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
                            >
                                {isMuted ? <VolumeX size={24} className="text-red-400" /> : <Volume2 size={24} />}
                            </button>
                        </div>
                    )}

                    <div className="absolute bottom-6 right-6 z-50">
                        <button 
                            onClick={handlePublishClick}
                            className="w-14 h-14 bg-[#00a884] rounded-full flex items-center justify-center shadow-lg text-white hover:bg-[#008f6f] transition-all active:scale-95"
                        >
                            <Send size={24} className={language === 'ar' ? 'mr-1' : 'ml-1'} style={{ transform: language === 'ar' ? 'scaleX(-1)' : 'none' }} fill="currentColor" />
                        </button>
                    </div>
                </>
            )}
        </div>
      );
  }

  // --- DEFAULT TEXT ONLY VIEW (Unchanged from original) ---
  return (
    <div className={`fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-300 ${GRADIENTS[bgIndex]} transition-colors duration-500`}>
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-start z-20">
        <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-sm hover:bg-black/30 transition-colors">
          <X size={28} />
        </button>
        <button onClick={handleNextBackground} className="mt-2 p-2 bg-white/20 rounded-full text-white backdrop-blur-md hover:bg-white/30 transition-colors">
            <Palette size={24} />
        </button>
        <button 
          onClick={handlePublishClick}
          disabled={!text}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-lg backdrop-blur-sm bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Check size={20} />
          <span>{t('post_publish')}</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
         <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('story_text_placeholder')}
            className={`w-full max-w-lg bg-transparent border-none outline-none text-center font-bold placeholder:text-white/50 resize-none overflow-hidden leading-relaxed text-white ${FONT_SIZES[sizeIndex]} drop-shadow-md`}
            rows={5}
         />
      </div>

      <div className="absolute bottom-10 left-0 right-0 pb-safe flex flex-col items-center gap-6 z-20">
         <div className="flex gap-6">
            <button onClick={handleNextSize} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center backdrop-blur-md"><ALargeSmall size={20} className="text-white" /></div>
                <span className="text-white text-[10px] shadow-sm">{t('story_font_size')}</span>
            </button>
         </div>
         <div className="bg-black/40 backdrop-blur-md rounded-full p-1 flex">
             <button 
               onClick={() => setMode('text')}
               className={`px-6 py-2 rounded-full text-sm font-bold transition-colors bg-white text-black`}
             >
               {t('story_type_text')}
             </button>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className={`px-6 py-2 rounded-full text-sm font-bold transition-colors text-white hover:bg-white/10`}
             >
               {t('story_type_media')}
             </button>
         </div>
         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>
    </div>
  );
};

export default CreateStoryModal;
