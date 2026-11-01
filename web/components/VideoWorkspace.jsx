'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import VideoPreview from './VideoPreview';
import VideoTimeline from './VideoTimeline';
import TimeInput from './TimeInput';
import FormatSelector from './FormatSelector';
import ProcessingStatus from './ProcessingStatus';
import SettingsModal from './SettingsModal';

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return 'Duration verified on acquisition';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60);
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':');
}

const QUALITY_LABELS = {
  '360p': '640 × 360',
  '480p': '854 × 480',
  '720p': '1280 × 720',
  '1080p': '1920 × 1080',
  best: 'Highest suitable source quality'
};

const RESIZE_LABELS = {
  original: ['Original', 'Source dimensions'],
  portrait: ['Portrait', '9:16 · 1080 × 1920'],
  landscape: ['Landscape', '16:9 · 1920 × 1080'],
  square: ['Square', '1:1 · 1080 × 1080'],
  feed: ['Portrait Feed', '4:5 · 1080 × 1350']
};

export default function VideoWorkspace({
  video, start, end, setStart, setEnd, format, setFormat, quality, setQuality, audioQuality, setAudioQuality,
  resizePreset, setResizePreset, resizeMode, setResizeMode,
  job, onCreate, onCancel, onReset, onEditSettings, creating, error
}) {
  const [activeModal, setActiveModal] = useState(null);
  const [triggerRect, setTriggerRect] = useState(null);
  const canAcquire = Boolean(video.capabilities?.acquire);
  const canUseTimeline = Number.isFinite(video.duration) && video.duration > 0;
  const formats = video.capabilities?.formats || [];
  const sourceDimensions = (video.formats || [])
    .filter((item) => Number.isSafeInteger(item.width) && Number.isSafeInteger(item.height) && item.width > 0 && item.height > 0)
    .reduce((largest, item) => {
      if (!largest || item.width * item.height > largest.width * largest.height) return item;
      return largest;
    }, null);
  const activeJob = Boolean(job && ['queued', 'processing'].includes(job.status));
  const canCreate = canAcquire
    && formats.includes(format)
    && start >= 0
    && end > start
    && (!canUseTimeline || end <= video.duration)
    && !activeJob
    && !creating;
  const [resizeLabel, resizeDimensions] = RESIZE_LABELS[resizePreset] || RESIZE_LABELS.original;

  function openModal(type, event) {
    setTriggerRect(event.currentTarget.getBoundingClientRect());
    setActiveModal(type);
  }

  return (
    <motion.section
      layout
      transition={{ type: 'spring', stiffness: 220, damping: 27, mass: 0.9 }}
      className="workspace"
      aria-label="Clip editor"
    >
      <AnimatePresence mode="wait" initial={false}>
        {job ? (
          <motion.div
            key="job"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <ProcessingStatus
              job={job}
              format={format}
              setFormat={setFormat}
              video={video}
              onCancel={activeJob ? onCancel : null}
              onReset={onReset}
              onEditSettings={!activeJob ? onEditSettings : null}
            />
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="video-head">
              <VideoPreview video={video} />
              <div className="video-details">
                <div className="video-meta">
                  <span>{video.provider}</span>
                  <span className="meta-dot" />
                  <span>{formatDuration(video.duration)}</span>
                </div>
                <h2 className="video-title">{video.title}</h2>
                {video.formats?.length > 0 && (
                  <p className="source-capabilities">
                    Source ready · {formats.map((item) => item.toUpperCase()).join(' and ')} available
                  </p>
                )}
              </div>
            </div>

            <div className="trim-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">01 / CLIP RANGE</span>
                  <h3 className="section-title">Choose your moment</h3>
                </div>
                <span className="duration-chip">{formatDuration(Math.max(0, end - start))}</span>
              </div>
              <VideoTimeline
                duration={video.duration}
                start={start}
                end={end}
                onStartChange={setStart}
                onEndChange={setEnd}
              />
              <div className="time-grid">
                <TimeInput label="Start time" value={start} onChange={setStart} disabled={activeJob} />
                <TimeInput label="End time" value={end} onChange={setEnd} disabled={activeJob} />
              </div>
            </div>

            <div className="settings-section">
              <div className="section-heading settings-heading">
                <div>
                  <span className="section-kicker">02 / EXPORT</span>
                  <h3 className="section-title">Output settings</h3>
                </div>
              </div>
              <FormatSelector value={format} onChange={setFormat} formats={formats} />

              <div className="setting-rows">
                {format === 'mp4' ? (
                  <>
                    <div className="setting-row">
                      <div className="setting-copy">
                        <span className="setting-title">Video quality</span>
                        <span className="setting-detail">{QUALITY_LABELS[quality] || QUALITY_LABELS['720p']}</span>
                      </div>
                      <button className="setting-trigger" type="button" onClick={(event) => openModal('quality', event)}>
                        <span>{quality === 'best' ? 'Best Available' : quality}</span><Chevron />
                      </button>
                    </div>
                    <div className="setting-row">
                      <div className="setting-copy">
                        <span className="setting-title">Resize & framing</span>
                        <span className="setting-detail">{resizeDimensions} · {resizeMode}</span>
                      </div>
                      <button className="setting-trigger" type="button" onClick={(event) => openModal('resize', event)}>
                        <span>{resizeLabel}</span><Chevron />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="setting-row">
                      <div className="setting-copy">
                        <span className="setting-title">Audio quality</span>
                        <span className="setting-detail">MP3 · Constant bitrate</span>
                      </div>
                      <button className="setting-trigger" type="button" onClick={(event) => openModal('audio', event)}>
                        <span>{audioQuality} kbps</span><Chevron />
                      </button>
                    </div>
                    <p className="audio-note"><span className="status-dot" /> Audio extraction uses the selected bitrate</p>
                  </>
                )}
              </div>

              {!canAcquire && (
                <p className="capability-note" role="status">
                  {video.capabilities?.reason || 'This source cannot currently be processed.'}
                </p>
              )}
              {error && <div className="status error" role="alert">{error}</div>}

              <button className="create-button" type="button" disabled={!canCreate} onClick={onCreate}>
                {creating ? <span className="spinner dark-spinner" /> : <Sparkle />}
                <span>{creating ? 'Starting clip…' : 'Create Clip'}</span>
                {!creating && <span className="button-arrow">→</span>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal && (
          <SettingsModal
            type={activeModal}
            currentQuality={quality}
            currentAudioQuality={audioQuality}
            currentPreset={resizePreset}
            currentMode={resizeMode}
            thumbnailUrl={video.thumbnail}
            sourceDimensions={sourceDimensions}
            triggerRect={triggerRect}
            onSelectQuality={setQuality}
            onSelectAudioQuality={setAudioQuality}
            onSelectPreset={setResizePreset}
            onSelectMode={setResizeMode}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Chevron() {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m7 10 5 5 5-5" /></svg>;
}

function Sparkle() {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></svg>;
}
