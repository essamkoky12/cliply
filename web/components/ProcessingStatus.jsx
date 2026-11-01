'use client';

import { motion } from 'motion/react';
import VideoPreview from './VideoPreview';
import FormatSelector from './FormatSelector';
import OutputActions from './OutputActions';

function progressLabel(job, output, format) {
  if (output?.status === 'queued' || job.status === 'queued') return 'Waiting for an available processing slot…';
  if (output?.stage === 'acquiring') {
    return `Acquiring source${output.progress > 0 ? ` · ${output.progress}%` : '…'}`;
  }
  if (output?.stage === 'validating_source') return 'Checking source media…';
  if (output?.stage === 'validating_output') return `Verifying ${format.toUpperCase()} output…`;
  if (output?.stage === 'processing') return `Creating your ${format.toUpperCase()} clip${output.progress > 0 ? ` · ${output.progress}%` : '…'}`;
  return `Preparing your ${format.toUpperCase()} clip…`;
}

function qualitySummary(format, output) {
  if (format === 'mp4' && output.resolution) {
    return `Actual resolution · ${output.resolution.width} × ${output.resolution.height}`;
  }
  if (format === 'mp3' && output.audioBitrate) {
    return `Audio quality · ${output.audioBitrate} kbps`;
  }
  return `${format.toUpperCase()} ready`;
}

export default function ProcessingStatus({
  job, format, setFormat, video, onCancel, onReset, onEditSettings
}) {
  if (!job) return null;
  const output = job.outputs?.[format];
  const outputFormats = Object.keys(job.outputs || {}).filter((key) => ['mp4', 'mp3'].includes(key));
  const formats = outputFormats.length ? outputFormats : [format];
  const isReady = output?.status === 'completed' && output.fileAvailable;
  const progress = Math.max(0, Math.min(100, Number(output?.progress) || 0));
  const isTerminal = ['failed', 'cancelled', 'expired'].includes(output?.status)
    || ['failed', 'cancelled', 'expired'].includes(job.status);

  return (
    <div className="processing-view">
      <div className="result-head">
        <VideoPreview video={video} />
        <div className="result-title-wrap">
          <h2 className="video-title">{video.title}</h2>
          <p className="result-subtitle">{format.toUpperCase()} · {isReady ? 'Output validated' : 'Clip export'}</p>
        </div>
        <span className={`result-state ${isReady ? 'ready' : isTerminal ? 'problem' : ''}`}>
          <span />{isReady ? 'Ready' : isTerminal ? 'Attention' : 'In progress'}
        </span>
      </div>

      <div className="processing-settings">
        <span className="section-kicker">OUTPUT</span>
        <FormatSelector value={format} onChange={setFormat} formats={formats} outputs={job.outputs} />
      </div>

      {isReady ? (
        <motion.div
          className="completion-panel"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        >
          <span className="completion-icon" aria-hidden="true">✓</span>
          <h3>Your clip is ready</h3>
          <p>{qualitySummary(format, output)}</p>
          {Object.values(job.outputs || {}).some((item) => item?.status === 'processing' || item?.status === 'queued') && (
            <p className="secondary-progress-note">The other selected output is still processing.</p>
          )}
          <OutputActions
            key={`${job.id}-${format}`}
            jobId={job.id}
            format={format}
            fileName={output.fileName || `clip.${format}`}
          />
        </motion.div>
      ) : output?.status === 'failed' || job.status === 'failed' ? (
        <div className="job-message error" role="alert">
          <strong>Clip creation failed</strong>
          <span>{output?.error?.message || job.error?.message || `${format.toUpperCase()} generation failed.`}</span>
        </div>
      ) : output?.status === 'cancelled' || job.status === 'cancelled' ? (
        <div className="job-message" role="status"><strong>Processing was cancelled.</strong></div>
      ) : output?.status === 'expired' || job.status === 'expired' ? (
        <div className="job-message" role="status"><strong>This output has expired.</strong></div>
      ) : !output ? (
        <div className="job-message" role="status"><strong>{format.toUpperCase()} is not included in this job.</strong></div>
      ) : (
        <div className="progress-panel" aria-live="polite">
          <div className="progress-ring" aria-label={`${progress}% complete`}>
            <svg viewBox="0 0 56 56" aria-hidden="true">
              <circle className="progress-ring-track" cx="28" cy="28" r="23" />
              <circle
                className="progress-ring-value"
                cx="28"
                cy="28"
                r="23"
                strokeDasharray={2 * Math.PI * 23}
                strokeDashoffset={2 * Math.PI * 23 * (1 - progress / 100)}
              />
            </svg>
            <span>{progress}%</span>
          </div>
          <h3>{progressLabel(job, output, format)}</h3>
          <p>Keep this page open while your output is being prepared.</p>
          <div className="processing-progress-track">
            <motion.div
              className="processing-progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: 'linear' }}
            />
          </div>
          {onCancel && <button className="text-button cancel-button" type="button" onClick={onCancel}>Cancel processing</button>}
        </div>
      )}

      <div className="result-footer">
        {onEditSettings && <button className="text-button" type="button" onClick={onEditSettings}>Edit settings</button>}
        <button className="text-button" type="button" onClick={onReset}>New clip <span aria-hidden="true">→</span></button>
      </div>
    </div>
  );
}
