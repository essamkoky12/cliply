import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Download, Share2, RotateCcw, Copy, ExternalLink } from 'lucide-react';
import { FormatType, VideoQuality, AudioQuality, AspectRatioPreset, ResizeMode, VideoMetadata } from '../types.ts';
import { QUALITY_OPTIONS, AUDIO_QUALITY_OPTIONS, RESIZE_PRESETS, SPRING_TRANSITION } from '../constants.ts';

interface ProcessingViewProps {
  metadata: VideoMetadata;
  format: FormatType;
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  aspectPreset: AspectRatioPreset;
  resizeMode: ResizeMode;
  onReset: () => void;
  onEditSettings: () => void;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  metadata,
  format,
  videoQuality,
  audioQuality,
  aspectPreset,
  resizeMode,
  onReset,
  onEditSettings,
}) => {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Preparing video...');
  const [isCompleted, setIsCompleted] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Progressive simulation matching the 4 specified stages
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      // Advance progress smoothly with slightly varying increments
      const step = Math.random() * 4 + 2;
      current = Math.min(100, current + step);
      setProgress(Math.round(current));

      if (current < 15) {
        setStageText('Preparing video...');
      } else if (current < 55) {
        setStageText('Fetching video stream...');
      } else if (current < 85) {
        setStageText(
          format === 'mp4'
            ? `Processing clip (${aspectPreset !== 'original' ? aspectPreset : 'native'})`
            : 'Extracting & encoding audio stream...'
        );
      } else if (current < 100) {
        setStageText('Finalizing file container...');
      } else {
        clearInterval(interval);
        setStageText('Ready for export');
        setIsCompleted(true);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [format, aspectPreset]);

  // Selected format summary string
  const getFormatSummary = () => {
    if (format === 'mp4') {
      const q = QUALITY_OPTIONS.find((opt) => opt.id === videoQuality);
      const r = RESIZE_PRESETS.find((opt) => opt.id === aspectPreset);
      return `MP4 • ${q?.label || '720p'} (${q?.resolution || '1280 × 720'}) • ${r?.label || 'Original'}`;
    } else {
      const a = AUDIO_QUALITY_OPTIONS.find((opt) => opt.id === audioQuality);
      return `MP3 • ${a?.label || '192 kbps'} • 44.1 kHz Stereo`;
    }
  };

  const estimatedSize =
    format === 'mp4'
      ? QUALITY_OPTIONS.find((q) => q.id === videoQuality)?.approxSize || '56.8 MB'
      : AUDIO_QUALITY_OPTIONS.find((a) => a.id === audioQuality)?.approxSize || '17.6 MB';

  // Real download trigger with safe harmless mockup blob
  const handleDownload = () => {
    const filename = `${metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_clip.${format}`;
    const dummyContent = `Cliply Mockup Export\nTitle: ${metadata.title}\nChannel: ${metadata.channel}\nFormat: ${format.toUpperCase()}\nQuality: ${format === 'mp4' ? videoQuality : audioQuality}\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([dummyContent], {
      type: format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Real share trigger (Web Share API with fallback to copy link)
  const handleShare = async () => {
    const shareData = {
      title: `Cliply — ${metadata.title}`,
      text: `Processed clip from "${metadata.title}" by ${metadata.channel} via Cliply.`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareFeedback('Shared successfully');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyFallback();
        }
      }
    } else {
      copyFallback();
    }
  };

  const copyFallback = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/clip/${metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    );
    setShareFeedback('Clip link copied to clipboard');
    setTimeout(() => setShareFeedback(null), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={SPRING_TRANSITION}
      className="p-5 sm:p-6"
    >
      {/* Video preview mini header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[#E5E5E5]/70">
        <div className="relative w-14 h-10 rounded-[8px] overflow-hidden bg-[#171717] shrink-0 border border-[#171717]/10">
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-medium text-[#171717] truncate leading-tight">
            {metadata.title}
          </h4>
          <p className="text-[11px] text-[#777777] truncate mt-0.5">
            {getFormatSummary()}
          </p>
        </div>
      </div>

      {/* Center state: In progress vs Complete */}
      <div className="py-6 flex flex-col items-center justify-center text-center">
        {!isCompleted ? (
          <>
            {/* Minimalist animated spinner */}
            <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                {/* Background track circle */}
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#F0F0ED"
                  strokeWidth="3"
                />
                {/* Progress arc */}
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#171717"
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={
                    2 * Math.PI * 20 * (1 - progress / 100)
                  }
                  strokeLinecap="round"
                  className="transition-all duration-150 ease-out"
                />
              </svg>
              <span className="absolute font-mono text-[11px] font-medium text-[#171717]">
                {progress}%
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-[13px] font-medium text-[#171717] tracking-tight">
                {stageText}
              </p>
              <p className="text-[11px] text-[#777777]">
                Rendering lossless cut with precise keyframe boundaries
              </p>
            </div>

            {/* Smooth linear bar */}
            <div className="w-full max-w-[280px] h-1.5 bg-[#F0F0ED] rounded-full overflow-hidden mt-4">
              <motion.div
                className="h-full bg-[#171717] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: 'linear' }}
              />
            </div>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_TRANSITION}
            className="flex flex-col items-center w-full"
          >
            {/* Subtle success indicator */}
            <div className="w-11 h-11 rounded-full bg-[#24865B]/10 border border-[#24865B]/25 text-[#24865B] flex items-center justify-center mb-3">
              <Check size={20} strokeWidth={2.6} />
            </div>

            <h3 className="text-[15px] font-medium text-[#171717] tracking-tight">
              Clip Generated Successfully
            </h3>
            <p className="text-[12px] text-[#777777] mt-0.5">
              Ready for high-speed download or sharing ({estimatedSize})
            </p>

            {/* Feedback notification toast if link was copied */}
            {shareFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 px-3 py-1 bg-[#171717] text-white text-[11px] rounded-full flex items-center gap-1.5 shadow-sm"
              >
                <Check size={11} /> {shareFeedback}
              </motion.div>
            )}

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-6">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-[12px] bg-[#171717] text-white text-[13px] font-medium hover:bg-black active:scale-[0.99] transition-all"
              >
                <Download size={14} />
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-[12px] bg-white border border-[#171717] text-[#171717] text-[13px] font-medium hover:bg-[#F5F5F2] active:scale-[0.99] transition-all"
              >
                <Share2 size={14} />
                <span>Share Clip</span>
              </button>
            </div>

            {/* Settings review & Restart actions */}
            <div className="flex items-center justify-between w-full mt-4 pt-3.5 border-t border-[#E5E5E5]/70 text-[11px] text-[#777777]">
              <button
                type="button"
                onClick={onEditSettings}
                className="hover:text-[#171717] transition-colors"
              >
                Modify settings
              </button>
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1 hover:text-[#171717] transition-colors"
              >
                <RotateCcw size={11} />
                <span>Clip new video</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
