import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import { RESIZE_PRESETS, SPRING_TRANSITION } from '../constants.ts';
import { AspectRatioPreset, ResizeMode } from '../types.ts';

interface ResizeModalProps {
  currentPreset: AspectRatioPreset;
  currentMode: ResizeMode;
  thumbnailUrl: string;
  triggerRect?: DOMRect | null;
  onSelectPreset: (preset: AspectRatioPreset) => void;
  onSelectMode: (mode: ResizeMode) => void;
  onClose: () => void;
}

export const ResizeModal: React.FC<ResizeModalProps> = ({
  currentPreset,
  currentMode,
  thumbnailUrl,
  triggerRect,
  onSelectPreset,
  onSelectMode,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const activeOption =
    RESIZE_PRESETS.find((p) => p.id === currentPreset) || RESIZE_PRESETS[0];

  // Calculate origin offset so the panel blooms directly from the trigger control
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
      scale: 0.26,
    };
  };

  const origin = getOrigin();

  // Precise frame dimensions for live animated preview
  const getFrameDimensions = () => {
    switch (currentPreset) {
      case '9:16':
        return { width: 122, height: 216 };
      case '1:1':
        return { width: 185, height: 185 };
      case '4:5':
        return { width: 160, height: 200 };
      case 'original':
      case '16:9':
      default:
        return { width: 280, height: 157.5 };
    }
  };

  const frameDims = getFrameDimensions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-[#171717]/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Surface that grows directly from the Resize control */}
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
        className="relative w-full max-w-[460px] bg-white rounded-[22px] border border-[#171717] shadow-[0_24px_60px_rgba(0,0,0,0.18)] overflow-hidden z-10 origin-center"
      >
        {/* Natural content fade-in as panel expands */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, delay: 0.04 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E5]/70">
            <div>
              <h3 className="text-[13px] font-medium text-[#171717] tracking-tight">
                Resize & Framing
              </h3>
              <p className="text-[11px] text-[#777777]">
                Live crop preview for multi-platform distribution
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

          {/* Interactive Thumbnail Preview Section */}
          <div className="p-4 bg-[#F5F5F2] border-b border-[#E5E5E5]/70">
            <div className="w-full h-[235px] rounded-[16px] bg-[#EAEAE6] flex items-center justify-center p-3 overflow-hidden relative border border-[#E5E5E5]">
              {/* Aspect container with fluid spring dimension animation */}
              <motion.div
                animate={{
                  width: frameDims.width,
                  height: frameDims.height,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 26,
                  mass: 0.8,
                }}
                className="relative rounded-[12px] overflow-hidden shadow-md border border-[#171717] bg-[#111111] flex items-center justify-center"
              >
                <img
                  src={thumbnailUrl}
                  alt="Framing preview"
                  className={`transition-all duration-200 select-none ${
                    currentMode === 'fill'
                      ? 'w-full h-full object-cover'
                      : currentMode === 'stretch'
                      ? 'w-full h-full object-fill'
                      : 'w-full h-full object-contain'
                  }`}
                />

                {/* Professional Corner Crop Brackets */}
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-white/80 pointer-events-none" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-white/80 pointer-events-none" />
                <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-white/80 pointer-events-none" />
                <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-white/80 pointer-events-none" />

                {/* Composition Framing Guides (Rule of thirds grid) */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
                  <div className="border-r border-b border-white/80" />
                  <div className="border-r border-b border-white/80" />
                  <div className="border-b border-white/80" />
                  <div className="border-r border-b border-white/80" />
                  <div className="border-r border-b border-white/80" />
                  <div className="border-b border-white/80" />
                  <div className="border-r border-b border-white/80" />
                  <div className="border-r border-b border-white/80" />
                  <div />
                </div>

                {/* Active Preset Tag */}
                <div className="absolute top-2 left-2 bg-[#171717]/85 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight uppercase shadow-xs">
                  {activeOption.id}
                </div>

                {/* Active Mode Tag */}
                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-[#171717] px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight uppercase shadow-xs">
                  {currentMode}
                </div>
              </motion.div>
            </div>

            {/* Dimension Details Bar */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#777777]">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[#171717] font-medium">
                  {activeOption.dimensions}
                </span>
                <span>•</span>
                <span>{activeOption.platforms}</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-[#777777]">
                Mode: {currentMode}
              </span>
            </div>
          </div>

          {/* Resize Presets & Mode Controls */}
          <div className="p-4 space-y-4">
            {/* Mode Selector (Fit / Fill / Stretch) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-[#171717]">
                  Resize Mode
                </span>
                <span className="text-[11px] text-[#777777]">
                  {currentMode === 'fit' && 'Pillar/letterbox to preserve all pixels'}
                  {currentMode === 'fill' && 'Zooms & crops to fill entire frame'}
                  {currentMode === 'stretch' && 'Scales to force exact aspect ratio'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-[#F0F0ED] p-1 rounded-[12px]">
                {(['fit', 'fill', 'stretch'] as ResizeMode[]).map((mode) => {
                  const isActive = currentMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSelectMode(mode)}
                      className={`py-1.5 px-3 rounded-[9px] text-[12px] font-medium capitalize transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-white text-[#171717] shadow-sm'
                          : 'text-[#777777] hover:text-[#171717]'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Presets List */}
            <div>
              <span className="text-[12px] font-medium text-[#171717] block mb-1.5">
                Aspect Ratio Presets
              </span>
              <div className="space-y-1.5 max-h-[185px] overflow-y-auto pr-0.5">
                {RESIZE_PRESETS.map((preset) => {
                  const isSelected = preset.id === currentPreset;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectPreset(preset.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-[12px] text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0F0ED] border border-[#171717]/25 text-[#171717]'
                          : 'hover:bg-[#F5F5F2] border border-transparent text-[#171717]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Mini visual aspect box */}
                        <div className="w-8 h-8 rounded bg-white border border-[#CCCCCC] flex items-center justify-center shrink-0">
                          <div
                            className="border border-[#171717] rounded-[2px] bg-[#E5E5E5]"
                            style={{
                              width:
                                preset.ratioWidth >= preset.ratioHeight
                                  ? '18px'
                                  : `${(preset.ratioWidth / preset.ratioHeight) * 18}px`,
                              height:
                                preset.ratioHeight >= preset.ratioWidth
                                  ? '18px'
                                  : `${(preset.ratioHeight / preset.ratioWidth) * 18}px`,
                            }}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium leading-tight">
                              {preset.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#777777] block leading-tight">
                            {preset.description}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#777777] hidden sm:inline">
                          {preset.dimensions}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#171717] bg-[#171717] text-white'
                              : 'border-[#CCCCCC]'
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer / Apply */}
          <div className="p-3.5 bg-[#F5F5F2]/50 border-t border-[#E5E5E5]/70 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onSelectPreset('original');
                onSelectMode('fit');
              }}
              className="text-[12px] text-[#777777] hover:text-[#171717] px-2 py-1 transition-colors cursor-pointer"
            >
              Reset to Original
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[10px] bg-[#171717] text-white text-[12px] font-medium hover:bg-black transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
