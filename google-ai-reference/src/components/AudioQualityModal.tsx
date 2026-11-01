import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, X, Disc } from 'lucide-react';
import { AUDIO_QUALITY_OPTIONS } from '../constants.ts';
import { AudioQuality } from '../types.ts';

interface AudioQualityModalProps {
  currentQuality: AudioQuality;
  triggerRect?: DOMRect | null;
  onSelect: (quality: AudioQuality) => void;
  onClose: () => void;
}

export const AudioQualityModal: React.FC<AudioQualityModalProps> = ({
  currentQuality,
  triggerRect,
  onSelect,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getOrigin = () => {
    if (!triggerRect || typeof window === 'undefined') {
      return { x: 0, y: 16, scale: 0.92 };
    }
    const modalCenterX = window.innerWidth / 2;
    const modalCenterY = window.innerHeight / 2;
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;

    return {
      x: triggerCenterX - modalCenterX,
      y: triggerCenterY - modalCenterY,
      scale: 0.28,
    };
  };

  const origin = getOrigin();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Subtle backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 bg-[#171717]/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Surface that grows directly from trigger button */}
      <motion.div
        initial={{
          x: origin.x,
          y: origin.y,
          scale: origin.scale,
          opacity: 0.6,
          borderRadius: 14,
        }}
        animate={{
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          borderRadius: 22,
        }}
        exit={{
          x: origin.x,
          y: origin.y,
          scale: origin.scale,
          opacity: 0,
          borderRadius: 14,
        }}
        transition={{
          type: 'spring',
          stiffness: 220,
          damping: 26,
          mass: 0.85,
        }}
        className="relative w-full max-w-[380px] bg-white rounded-[22px] border border-[#171717] shadow-[0_24px_60px_rgba(0,0,0,0.18)] overflow-hidden z-10 origin-center"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, delay: 0.04 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]/70">
            <div>
              <h3 className="text-[13px] font-medium text-[#171717] tracking-tight">
                Select Audio Quality
              </h3>
              <p className="text-[11px] text-[#777777]">
                MP3 CBR constant bitrate encoding
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#777777] hover:text-[#171717] hover:bg-[#F0F0ED] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-3 space-y-1">
            {AUDIO_QUALITY_OPTIONS.map((opt) => {
              const isSelected = opt.id === currentQuality;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelect(opt.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[14px] text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F0F0ED] text-[#171717] font-medium'
                      : 'hover:bg-[#F5F5F2] text-[#171717]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-[#171717] bg-[#171717] text-white'
                          : 'border-[#CCCCCC]'
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="text-[13px] text-[#171717] font-mono leading-tight block">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-[#777777] leading-tight">
                        {opt.description}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-[#777777]">
                      {opt.approxSize}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-5 py-3 bg-[#F5F5F2]/50 border-t border-[#E5E5E5]/70 flex items-center justify-between text-[11px] text-[#777777]">
            <span className="flex items-center gap-1.5">
              <Disc size={13} /> 44.1 kHz • Stereo
            </span>
            <span className="font-mono">LAME Encoder</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
