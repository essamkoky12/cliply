import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Clipboard,
  ChevronDown,
  Sparkles,
  Music,
  Film,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { QualityModal } from './components/QualityModal.tsx';
import { ResizeModal } from './components/ResizeModal.tsx';
import { AudioQualityModal } from './components/AudioQualityModal.tsx';
import { ProcessingView } from './components/ProcessingView.tsx';
import {
  DEFAULT_MOCK_METADATA,
  QUALITY_OPTIONS,
  RESIZE_PRESETS,
  AUDIO_QUALITY_OPTIONS,
} from './constants.ts';
import {
  FormatType,
  VideoQuality,
  AudioQuality,
  AspectRatioPreset,
  ResizeMode,
  VideoMetadata,
} from './types.ts';

export default function App() {
  // Input & Validation State (Empty by default with clean initial state)
  const [urlInput, setUrlInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [hasMetadata, setHasMetadata] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata>(DEFAULT_MOCK_METADATA);

  // Settings State (preserved across format switching)
  const [format, setFormat] = useState<FormatType>('mp4');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('720p');
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('original');
  const [resizeMode, setResizeMode] = useState<ResizeMode>('fit');
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('192k');

  // Modals & Origin Tracking
  const [activeModal, setActiveModal] = useState<
    'none' | 'quality' | 'resize' | 'audioQuality'
  >('none');
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  // Button refs for origin-aware modal blooming
  const qualityBtnRef = useRef<HTMLButtonElement>(null);
  const resizeBtnRef = useRef<HTMLButtonElement>(null);
  const audioQualityBtnRef = useRef<HTMLButtonElement>(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);

  // Container Measurement for Fluid Content-Aware Resizing (Height & Width)
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 800
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Continuous content measurement via ResizeObserver
  useLayoutEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const height =
          entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        if (height > 0) {
          setContentHeight(Math.ceil(height));
        }
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [hasMetadata, format, isProcessing, isFetchingMetadata, validationError]);

  // Compute fluid target width: starts compact, expands significantly horizontally on fetch
  const getTargetWidth = () => {
    const maxAvailable = screenWidth - 32;
    if (!hasMetadata) {
      // 1. Initial State: Compact centered box comfortably fitting only the URL input
      return Math.min(390, maxAvailable);
    }
    if (isProcessing) {
      // Focused processing workspace
      return Math.min(500, maxAvailable);
    }
    if (format === 'mp3') {
      // Audio focused layout
      return Math.min(520, maxAvailable);
    }
    // 2. Metadata Revealed State: Generously expanded horizontally for video controls
    return Math.min(580, maxAvailable);
  };

  // Open modal with bounding rect recorded for spring origin
  const handleOpenModal = (
    modal: 'quality' | 'resize' | 'audioQuality',
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => {
    if (buttonRef.current) {
      setTriggerRect(buttonRef.current.getBoundingClientRect());
    } else {
      setTriggerRect(null);
    }
    setActiveModal(modal);
  };

  // Fetch metadata handler with validation check
  const handleFetchMetadata = (targetUrl?: string) => {
    const url = (targetUrl !== undefined ? targetUrl : urlInput).trim();

    // Validation: Require a URL, do not auto-fill sample data
    if (!url) {
      setValidationError('Please enter a video URL');
      inputRef.current?.focus();
      return;
    }

    setValidationError(null);
    setIsFetchingMetadata(true);

    // Derive realistic metadata dynamically from whatever the user typed/pasted
    setTimeout(() => {
      let title = 'Building a Modern Web Application';
      let channel = 'Developer Studio';
      let source = 'YouTube';

      try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('vimeo')) {
          source = 'Vimeo';
          channel = 'Cinema Craft';
          title = 'Architecture & Space — Kyoto Document';
        } else if (parsed.hostname.includes('tiktok')) {
          source = 'TikTok';
          channel = '@studio.creatives';
          title = 'Motion Design Systems in Practice';
        } else if (parsed.hostname.includes('instagram')) {
          source = 'Instagram';
          channel = 'Studio Journal';
          title = 'Sound Design & Modular Synthesis';
        }
      } catch {
        // Simple plain link
      }

      setMetadata({
        title,
        channel,
        duration: '12:48',
        resolution: '1920 × 1080',
        thumbnail:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        source,
        url,
      });

      setIsFetchingMetadata(false);
      setHasMetadata(true);
    }, 1100);
  };

  // Paste from clipboard helper (does NOT inject fake demo URLs)
  const handlePaste = async () => {
    setValidationError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrlInput(text.trim());
        handleFetchMetadata(text.trim());
      } else {
        setValidationError('Clipboard is empty');
        setTimeout(() => setValidationError(null), 2500);
      }
    } catch {
      setValidationError('Could not access clipboard');
      setTimeout(() => setValidationError(null), 2500);
    }
  };

  // Reset to initial compact state
  const handleReset = () => {
    setHasMetadata(false);
    setIsProcessing(false);
    setUrlInput('');
    setValidationError(null);
    setActiveModal('none');
  };

  // Current label helpers
  const currentQualityObj = QUALITY_OPTIONS.find((q) => q.id === videoQuality);
  const currentResizeObj = RESIZE_PRESETS.find((r) => r.id === aspectPreset);
  const currentAudioObj = AUDIO_QUALITY_OPTIONS.find((a) => a.id === audioQuality);

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171717] flex flex-col justify-between selection:bg-[#171717] selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Center Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-4xl mx-auto my-auto">
        {/* ONE Main Expandable Container: Smoothly stretches in BOTH Width & Height */}
        <motion.div
          animate={{
            height: contentHeight,
            width: getTargetWidth(),
          }}
          transition={{
            type: 'spring',
            stiffness: 180,
            damping: 24,
            mass: 0.85,
          }}
          className="relative bg-white rounded-[24px] border border-[#171717] shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden mx-auto"
        >
          {/* Subtle top ambient indicator */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#171717]/15 to-transparent pointer-events-none" />

          {/* Measured Content Wrapper */}
          <div
            ref={contentRef}
            className={`w-full transition-all duration-200 ${
              hasMetadata || isProcessing ? 'p-5 sm:p-6' : 'p-2.5 sm:p-3'
            }`}
          >
            {isProcessing ? (
              <ProcessingView
                metadata={metadata}
                format={format}
                videoQuality={videoQuality}
                audioQuality={audioQuality}
                aspectPreset={aspectPreset}
                resizeMode={resizeMode}
                onReset={handleReset}
                onEditSettings={() => setIsProcessing(false)}
              />
            ) : (
              <div>
                {/* Header row when metadata is loaded */}
                {hasMetadata && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium text-[#777777] uppercase tracking-wider block">
                      Video URL
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[11px] text-[#777777] hover:text-[#171717] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} /> Change link
                    </button>
                  </div>
                )}

                {/* Minimal URL Input Section */}
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    id="video-url"
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFetchMetadata();
                      }
                    }}
                    disabled={isFetchingMetadata}
                    placeholder="Paste video URL here..."
                    className="w-full h-11 pl-4 pr-20 rounded-[14px] bg-[#F5F5F2] border border-transparent focus:border-[#171717] focus:bg-white text-[13.5px] text-[#171717] placeholder-[#888888] outline-none transition-all font-mono"
                  />

                  {/* Actions inside the input box */}
                  <div className="absolute right-1.5 flex items-center gap-1">
                    {!urlInput && !hasMetadata && (
                      <button
                        type="button"
                        onClick={handlePaste}
                        title="Paste from clipboard"
                        className="h-8 px-2.5 rounded-[10px] text-[#777777] hover:text-[#171717] hover:bg-white/80 transition-all text-[11px] flex items-center gap-1 border border-transparent hover:border-[#E5E5E5] cursor-pointer"
                      >
                        <Clipboard size={12} />
                        <span>Paste</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleFetchMetadata()}
                      disabled={isFetchingMetadata}
                      className="w-8 h-8 rounded-full bg-[#171717] text-white disabled:opacity-40 hover:bg-black active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      aria-label="Fetch video metadata"
                    >
                      {isFetchingMetadata ? (
                        <Loader2 size={13} className="animate-spin text-white" />
                      ) : (
                        <ArrowRight size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Subtle validation message if user attempts to fetch without a URL */}
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[11.5px] text-[#D94B4B] font-medium px-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D94B4B]" />
                        {validationError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fetching loading indicator */}
                {isFetchingMetadata && (
                  <motion.div
                    initial={{ opacity: 0, marginTop: 0 }}
                    animate={{ opacity: 1, marginTop: 8 }}
                    className="flex items-center gap-2 text-[12px] text-[#777777] px-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#171717] animate-ping" />
                    <span>Resolving video stream metadata...</span>
                  </motion.div>
                )}

                {/* Metadata & Controls: Smoothly revealed as the container stretches in both width and height */}
                <AnimatePresence>
                  {hasMetadata && !isFetchingMetadata && (
                    <motion.div
                      key="metadata-content"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mt-5 space-y-5 pt-4 border-t border-[#E5E5E5]/80"
                    >
                      {/* Compact Metadata Row */}
                      <div className="flex gap-3.5 items-center">
                        {/* Video Thumbnail */}
                        <div className="relative w-28 h-18 sm:w-32 sm:h-20 rounded-[12px] overflow-hidden bg-[#171717] shrink-0 border border-[#171717]/10 shadow-sm">
                          <img
                            src={metadata.thumbnail}
                            alt={metadata.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono leading-none">
                            {metadata.duration}
                          </span>
                        </div>

                        {/* Video Info Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[10.5px] uppercase font-mono tracking-wider text-[#777777] mb-0.5">
                            <span>{metadata.source}</span>
                            <span>•</span>
                            <span>{metadata.channel}</span>
                          </div>
                          <h3 className="text-[13.5px] font-medium text-[#171717] leading-snug line-clamp-2">
                            {metadata.title}
                          </h3>
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] font-mono text-[#777777]">
                            <span>{metadata.resolution}</span>
                            <span className="w-1 h-1 rounded-full bg-[#CCCCCC]" />
                            <span>60 FPS</span>
                            <span className="w-1 h-1 rounded-full bg-[#CCCCCC]" />
                            <span className="text-[#24865B] flex items-center gap-1 font-sans">
                              Lossless Cut
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Format Selector: Segmented MP4 / MP3 */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-[#777777] uppercase tracking-wider block">
                          Output Format
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-[#F0F0ED] p-1 rounded-[14px]">
                          <button
                            type="button"
                            onClick={() => setFormat('mp4')}
                            className={`py-2 px-3 rounded-[10px] text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                              format === 'mp4'
                                ? 'bg-white text-[#171717] shadow-sm'
                                : 'text-[#777777] hover:text-[#171717]'
                            }`}
                          >
                            <Film size={14} />
                            <span>MP4 Video</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormat('mp3')}
                            className={`py-2 px-3 rounded-[10px] text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                              format === 'mp3'
                                ? 'bg-white text-[#171717] shadow-sm'
                                : 'text-[#777777] hover:text-[#171717]'
                            }`}
                          >
                            <Music size={14} />
                            <span>MP3 Audio</span>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Format Settings Section */}
                      {format === 'mp4' ? (
                        /* MP4 Controls */
                        <motion.div
                          key="mp4-controls"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-2.5 pt-1"
                        >
                          {/* Quality Selector Row */}
                          <div className="flex items-center justify-between p-3 rounded-[14px] bg-[#F5F5F2] border border-[#E5E5E5]/60">
                            <div>
                              <span className="text-[13px] font-medium text-[#171717] block leading-tight">
                                Quality
                              </span>
                              <span className="text-[11px] text-[#777777] font-mono">
                                {currentQualityObj?.resolution} • {currentQualityObj?.approxSize}
                              </span>
                            </div>

                            <button
                              ref={qualityBtnRef}
                              type="button"
                              onClick={() => handleOpenModal('quality', qualityBtnRef)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-[#171717] text-[#171717] text-[13px] font-medium hover:bg-[#F0F0ED] transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                            >
                              <span>{currentQualityObj?.label || '720p'}</span>
                              <ChevronDown size={13} className="text-[#777777]" />
                            </button>
                          </div>

                          {/* Resize Row */}
                          <div className="flex items-center justify-between p-3 rounded-[14px] bg-[#F5F5F2] border border-[#E5E5E5]/60">
                            <div>
                              <span className="text-[13px] font-medium text-[#171717] block leading-tight">
                                Resize
                              </span>
                              <span className="text-[11px] text-[#777777] font-mono">
                                {currentResizeObj?.dimensions} • {resizeMode}
                              </span>
                            </div>

                            <button
                              ref={resizeBtnRef}
                              type="button"
                              onClick={() => handleOpenModal('resize', resizeBtnRef)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-[#171717] text-[#171717] text-[13px] font-medium hover:bg-[#F0F0ED] transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                            >
                              <span>{currentResizeObj?.label || 'Original'}</span>
                              <ChevronDown size={13} className="text-[#777777]" />
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        /* MP3 Controls */
                        <motion.div
                          key="mp3-controls"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-2.5 pt-1"
                        >
                          {/* Audio Quality Row */}
                          <div className="flex items-center justify-between p-3 rounded-[14px] bg-[#F5F5F2] border border-[#E5E5E5]/60">
                            <div>
                              <span className="text-[13px] font-medium text-[#171717] block leading-tight">
                                Audio Quality
                              </span>
                              <span className="text-[11px] text-[#777777] font-mono">
                                {currentAudioObj?.label} • {currentAudioObj?.approxSize}
                              </span>
                            </div>

                            <button
                              ref={audioQualityBtnRef}
                              type="button"
                              onClick={() =>
                                handleOpenModal('audioQuality', audioQualityBtnRef)
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-[#171717] text-[#171717] text-[13px] font-medium hover:bg-[#F0F0ED] transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                            >
                              <span>{currentAudioObj?.label || '192 kbps'}</span>
                              <ChevronDown size={13} className="text-[#777777]" />
                            </button>
                          </div>

                          <div className="px-3.5 py-2.5 rounded-[12px] bg-[#F0F0ED]/70 flex items-center justify-between text-[11px] text-[#777777]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                              <span>Audio extraction isolated from video stream</span>
                            </div>
                            <span className="font-mono text-[10px]">CBR Stereo</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Primary Action Button: Create Clip */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setIsProcessing(true)}
                          className="w-full h-11 rounded-[14px] bg-[#171717] text-white text-[13.5px] font-medium hover:bg-black active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <Sparkles size={14} />
                          <span>Create Clip</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* Minimal supporting instructions below container */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-[#777777]">
          <span>Single-surface architecture</span>
          <span>•</span>
          <span>Dual-axis spring expansion</span>
          <span>•</span>
          <span className="hidden sm:inline">Esc to dismiss</span>
        </div>
      </main>

      {/* Floating Animated Modals (Bloom from trigger controls with spring physics) */}
      <AnimatePresence>
        {activeModal === 'quality' && (
          <QualityModal
            currentQuality={videoQuality}
            triggerRect={triggerRect}
            onSelect={(q) => setVideoQuality(q)}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'resize' && (
          <ResizeModal
            currentPreset={aspectPreset}
            currentMode={resizeMode}
            thumbnailUrl={metadata.thumbnail}
            triggerRect={triggerRect}
            onSelectPreset={(p) => setAspectPreset(p)}
            onSelectMode={(m) => setResizeMode(m)}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'audioQuality' && (
          <AudioQualityModal
            currentQuality={audioQuality}
            triggerRect={triggerRect}
            onSelect={(aq) => setAudioQuality(aq)}
            onClose={() => setActiveModal('none')}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-[#E5E5E5]/60 flex items-center justify-between text-[11px] text-[#777777] max-w-4xl mx-auto">
        <div>
          <span>ClipDown UI Prototype</span>
          <span className="mx-2 text-[#CCCCCC]">|</span>
          <span className="text-[#999999]">Fluid Layout Engine</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono">#F5F5F2 / #171717</span>
          <span className="text-[#CCCCCC]">•</span>
          <span>Geist Sans</span>
        </div>
      </footer>
    </div>
  );
}
