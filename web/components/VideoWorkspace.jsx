'use client';

import { useEffect, useState } from 'react';
import VideoPreview from './VideoPreview';
import VideoTimeline from './VideoTimeline';
import TimeInput from './TimeInput';
import FormatSelector from './FormatSelector';
import DownloadButton from './DownloadButton';
import ProcessingStatus from './ProcessingStatus';

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return 'Duration verified on acquisition';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60);
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':');
}

export default function VideoWorkspace({
  video, start, end, setStart, setEnd, format, setFormat, quality, setQuality, audioQuality, setAudioQuality,
  resizePreset, setResizePreset, resizeMode, setResizeMode,
  job, onCreate, onCancel, creating, error
}) {
  const [audioQualityOpen, setAudioQualityOpen] = useState(false);
  useEffect(() => {
    if (format !== 'mp3') setAudioQualityOpen(false);
  }, [format]);
  const canAcquire = Boolean(video.capabilities?.acquire);
  const canUseTimeline = Number.isFinite(video.duration) && video.duration > 0;
  const formats = video.capabilities?.formats || [];
  const activeJob = Boolean(job && ['queued', 'processing'].includes(job.status));
  const canCreate = canAcquire
    && formats.some((supportedFormat) => ['mp4', 'mp3'].includes(supportedFormat))
    && start >= 0
    && end > start
    && (!canUseTimeline || end <= video.duration)
    && !activeJob;
  return (
    <section className="workspace" aria-label="Clip editor">
      <div className="video-head">
        <VideoPreview video={video} />
        <div>
          <h2 className="video-title">{video.title}</h2>
          <div className="video-meta">
            <span>{video.provider}</span>
            <span>{formatDuration(video.duration)}</span>
          </div>
          {video.capabilities?.reason && (
            <p className="capability-note">{video.capabilities.reason}</p>
          )}
        </div>
      </div>
      <div className="trim-section">
        <h3 className="section-title">Choose your segment</h3>
        <VideoTimeline
          duration={video.duration}
          start={start}
          end={end}
          onStartChange={setStart}
          onEndChange={setEnd}
        />
        <div className="time-grid">
          <TimeInput label="Start time" value={start} onChange={setStart} disabled={Boolean(job && !['failed', 'cancelled', 'expired', 'completed'].includes(job.status))} />
          <TimeInput label="End time" value={end} onChange={setEnd} disabled={Boolean(job && !['failed', 'cancelled', 'expired', 'completed'].includes(job.status))} />
        </div>
        <div className="format-row">
          <FormatSelector
            value={format}
            onChange={setFormat}
            outputs={job?.outputs}
          />
          {format === 'mp3' && (
            <div className="audio-quality-picker">
              <button
                className="audio-quality-trigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={audioQualityOpen}
                disabled={activeJob}
                onClick={() => setAudioQualityOpen((open) => !open)}
              >
                <span>Audio quality</span>
                <strong>{audioQuality} kbps</strong>
                <span className="audio-quality-chevron" aria-hidden="true">{audioQualityOpen ? '−' : '+'}</span>
              </button>
              {audioQualityOpen && (
                <div className="audio-quality-panel" role="listbox" aria-label="MP3 bitrate">
                  {[
                    [128, 'Low'],
                    [192, 'Standard'],
                    [256, 'High'],
                    [320, 'Best']
                  ].map(([bitrate, label]) => (
                    <button
                      key={bitrate}
                      className={`audio-quality-option ${audioQuality === bitrate ? 'active' : ''}`}
                      type="button"
                      role="option"
                      aria-selected={audioQuality === bitrate}
                      disabled={activeJob}
                      onClick={() => {
                        setAudioQuality(bitrate);
                        setAudioQualityOpen(false);
                      }}
                    >
                      <span>{label}</span>
                      <strong>{bitrate} kbps</strong>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {format === 'mp4' && (
            <div className="mp4-options">
              <label className="quality-control" htmlFor="mp4-quality">
                <span>MP4 quality</span>
                <select
                  id="mp4-quality"
                  className="quality-select"
                  value={quality}
                  onChange={(event) => setQuality(event.target.value)}
                  disabled={activeJob}
                >
                  <option value="360p">360p — 640 × 360</option>
                  <option value="480p">480p — 854 × 480</option>
                  <option value="720p">720p — 1280 × 720</option>
                  <option value="1080p">1080p — 1920 × 1080</option>
                  <option value="best">Best Available</option>
                </select>
              </label>
              <fieldset className="resize-controls" disabled={activeJob}>
                <legend>Video dimensions</legend>
                <p className="resize-hint">Original preserves source dimensions; quality and mode apply to the other presets.</p>
                <div className="resize-presets">
                  {[
                    ['original', 'Original', 'Source dimensions'],
                    ['portrait', 'Portrait', '9:16 · 1080 × 1920'],
                    ['landscape', 'Landscape', '16:9 · 1920 × 1080'],
                    ['square', 'Square', '1:1 · 1080 × 1080'],
                    ['feed', 'Portrait Feed', '4:5 · 1080 × 1350']
                  ].map(([preset, label, dimensions]) => (
                    <button
                      key={preset}
                      className={`resize-preset ${resizePreset === preset ? 'active' : ''}`}
                      type="button"
                      aria-pressed={resizePreset === preset}
                      onClick={() => setResizePreset(preset)}
                    >
                      <strong>{label}</strong>
                      <small>{dimensions}</small>
                    </button>
                  ))}
                </div>
                <label className="quality-control resize-mode-control" htmlFor="resize-mode">
                  <span>Resizing mode</span>
                  <select
                    id="resize-mode"
                    className="quality-select"
                    value={resizeMode}
                    onChange={(event) => setResizeMode(event.target.value)}
                  >
                    <option value="fit">Fit — keep all content, pad as needed</option>
                    <option value="fill">Fill — center-crop edges as needed</option>
                    <option value="stretch">Stretch — may distort the video</option>
                  </select>
                </label>
              </fieldset>
            </div>
          )}
          <div className="download-actions">
            <DownloadButton disabled={!canCreate} loading={creating} onClick={onCreate} />
          </div>
        </div>
        {!canAcquire && <p className="timeline-hint">{video.capabilities?.reason || 'This source cannot currently be processed.'}</p>}
        {error && <div className="status error" role="alert">{error}</div>}
        <ProcessingStatus
          job={job}
          format={format}
          onCancel={activeJob ? onCancel : null}
        />
      </div>
    </section>
  );
}
