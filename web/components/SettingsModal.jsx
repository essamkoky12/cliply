'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

const QUALITY_OPTIONS = [
  ['360p', '360p', '640 × 360'],
  ['480p', '480p', '854 × 480'],
  ['720p', '720p', '1280 × 720'],
  ['1080p', '1080p', '1920 × 1080'],
  ['best', 'Best Available', 'Highest suitable source quality']
];

const AUDIO_OPTIONS = [
  [128, 'Low', 'Smaller file · 128 kbps'],
  [192, 'Standard', 'Balanced quality · 192 kbps'],
  [256, 'High', 'Higher fidelity · 256 kbps'],
  [320, 'Best', 'Maximum bitrate · 320 kbps']
];

const PRESETS = [
  { id: 'original', label: 'Original', ratio: 'Original', dimensions: 'Source dimensions', width: 16, height: 9, description: 'Preserve source dimensions' },
  { id: 'portrait', label: 'Portrait', ratio: '9:16', dimensions: '1080 × 1920', width: 9, height: 16, description: 'Reels, TikTok, Shorts' },
  { id: 'landscape', label: 'Landscape', ratio: '16:9', dimensions: '1920 × 1080', width: 16, height: 9, description: 'YouTube and widescreen' },
  { id: 'square', label: 'Square', ratio: '1:1', dimensions: '1080 × 1080', width: 1, height: 1, description: 'Social media posts' },
  { id: 'feed', label: 'Portrait Feed', ratio: '4:5', dimensions: '1080 × 1350', width: 4, height: 5, description: 'Instagram feed' }
];

const MODES = [
  ['fit', 'Fit', 'Keep all content; pad the frame if needed.'],
  ['fill', 'Fill', 'Fill the frame; center-crop excess edges.'],
  ['stretch', 'Stretch', 'Force dimensions; may distort the image.']
];

export default function SettingsModal({
  type, currentQuality, currentAudioQuality, currentPreset, currentMode, thumbnailUrl, sourceDimensions, triggerRect,
  onSelectQuality, onSelectAudioQuality, onSelectPreset, onSelectMode, onClose
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isResize = type === 'resize';
  const isAudio = type === 'audio';
  const title = isResize ? 'Resize & framing' : isAudio ? 'Audio quality' : 'Video quality';
  const subtitle = isResize
    ? 'Choose a frame and how the source fits.'
    : isAudio ? 'MP3 constant bitrate encoding.' : 'Set the maximum output resolution.';
  const origin = triggerRect && typeof window !== 'undefined'
    ? {
        x: triggerRect.left + triggerRect.width / 2 - window.innerWidth / 2,
        y: triggerRect.top + triggerRect.height / 2 - window.innerHeight / 2,
        scale: 0.28
      }
    : { x: 0, y: 16, scale: 0.92 };
  const activePreset = currentPreset === 'original' && sourceDimensions
    ? {
        ...PRESETS[0],
        width: sourceDimensions.width,
        height: sourceDimensions.height,
        dimensions: `${sourceDimensions.width} × ${sourceDimensions.height}`
      }
    : PRESETS.find((preset) => preset.id === currentPreset) || PRESETS[0];
  const currentOption = isResize ? null : isAudio
    ? AUDIO_OPTIONS.find(([value]) => value === currentAudioQuality)
    : QUALITY_OPTIONS.find(([value]) => value === currentQuality);
  const previewScale = Math.min(260 / activePreset.width, 192 / activePreset.height);
  const previewSize = {
    width: `${Math.round(activePreset.width * previewScale)}px`,
    height: `${Math.round(activePreset.height * previewScale)}px`
  };

  return (
    <div className="settings-modal-wrap">
      <motion.button
        type="button"
        aria-label="Close settings"
        className="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className={`settings-modal ${isResize ? 'resize-modal' : ''}`}
        initial={{ x: origin.x, y: origin.y, scale: origin.scale, opacity: 0.5, borderRadius: 14 }}
        animate={{ x: 0, y: 0, scale: 1, opacity: 1, borderRadius: 22 }}
        exit={{ x: origin.x, y: origin.y, scale: origin.scale, opacity: 0, borderRadius: 14 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.85 }}
      >
        <div className="modal-heading">
          <div>
            <h2 id="settings-modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        {isResize ? (
          <>
            <div className="resize-preview-area">
              <motion.div
                className="resize-preview-frame"
                animate={previewSize}
                transition={{ type: 'spring', stiffness: 240, damping: 26, mass: 0.8 }}
              >
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt="Preview of the selected frame"
                    width={640}
                    height={360}
                    unoptimized
                    referrerPolicy="no-referrer"
                    className={`resize-preview-image mode-${currentMode}`}
                  />
                ) : <div className="resize-preview-placeholder">Preview</div>}
                <span className="preview-preset-tag">{activePreset.ratio}</span>
                <span className="preview-mode-tag">{currentMode}</span>
                <div className="preview-grid" aria-hidden="true">
                  <span /><span /><span /><span /><span /><span /><span /><span /><span />
                </div>
              </motion.div>
              <div className="preview-caption">
                <strong>{activePreset.dimensions}</strong><span>·</span><span>{activePreset.description}</span>
              </div>
            </div>
            <div className="modal-content resize-modal-content">
              <div className="mode-heading">
                <span>Resize mode</span>
                <span>{currentMode === 'stretch' ? 'May distort video' : 'Preserves source proportions'}</span>
              </div>
              <div className="mode-options">
                {MODES.map(([mode, label, description]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`mode-option ${currentMode === mode ? 'selected' : ''}`}
                    aria-pressed={currentMode === mode}
                    onClick={() => onSelectMode(mode)}
                  >
                    <strong>{label}</strong><span>{description}</span>
                  </button>
                ))}
              </div>
              <div className="preset-list">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-option ${currentPreset === preset.id ? 'selected' : ''}`}
                    aria-pressed={currentPreset === preset.id}
                    onClick={() => onSelectPreset(preset.id)}
                  >
                    <span className="preset-shape-box">
                      <span className="preset-shape" style={{ aspectRatio: `${preset.width} / ${preset.height}` }} />
                    </span>
                    <span className="preset-copy"><strong>{preset.label}</strong><small>{preset.ratio} · {preset.description}</small></span>
                    <span className="preset-dimensions">{preset.dimensions}</span>
                    <SelectionMark selected={currentPreset === preset.id} />
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  onSelectPreset('original');
                  onSelectMode('fit');
                }}
              >
                Reset to Original
              </button>
              <button type="button" className="modal-done" onClick={onClose}>Done</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-content selection-list">
              {(isAudio ? AUDIO_OPTIONS : QUALITY_OPTIONS).map(([value, label, detail]) => {
                const selected = value === (isAudio ? currentAudioQuality : currentQuality);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`selection-option ${selected ? 'selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => {
                      if (isAudio) onSelectAudioQuality(value);
                      else onSelectQuality(value);
                      onClose();
                    }}
                  >
                    <SelectionMark selected={selected} />
                    <span className="selection-copy"><strong>{label}</strong><small>{detail}</small></span>
                    {selected && <span className="selected-label">Selected</span>}
                  </button>
                );
              })}
            </div>
            <div className="modal-footer modal-footer-note">
              <span>{isAudio ? '44.1 kHz · Stereo' : 'Maximum resolution · never upscale'}</span>
              {currentOption && <strong>{currentOption[1]}</strong>}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function SelectionMark({ selected }) {
  return <span className={`selection-mark ${selected ? 'selected' : ''}`} aria-hidden="true">{selected ? '✓' : ''}</span>;
}
