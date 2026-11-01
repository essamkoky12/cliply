import OutputActions from './OutputActions';

export default function ProcessingStatus({ job, format, onCancel }) {
  if (!job) return null;
  const output = job.outputs?.[format];
  if (output?.status === 'completed' && output.fileAvailable) {
    return (
      <div className="status status-progress">
        <span>
          Your {format.toUpperCase()} clip is ready.
          {format === 'mp4' && output.resolution
            ? ` Actual resolution: ${output.resolution.width} × ${output.resolution.height}.`
            : ''}
          {format === 'mp3' && output.audioBitrate
            ? ` Audio quality: ${output.audioBitrate} kbps.`
            : ''}
        </span>
        <OutputActions
          key={`${job.id}-${format}`}
          jobId={job.id}
          format={format}
          fileName={output.fileName || `clip.${format}`}
        />
      </div>
    );
  }
  if (output?.status === 'failed') {
    return <div className="status error" role="alert">{output.error?.message || `${format.toUpperCase()} generation failed.`}</div>;
  }
  if (output?.status === 'cancelled' || job.status === 'cancelled') {
    return <div className="status">Processing was cancelled.</div>;
  }
  if (output?.status === 'expired' || job.status === 'expired') {
    return <div className="status">This output has expired.</div>;
  }
  if (job.status === 'failed') {
    return <div className="status error" role="alert">{job.error?.message || 'The job failed.'}</div>;
  }
  const label = output?.status === 'queued'
    ? 'Waiting for an available processing slot…'
    : output?.stage === 'acquiring'
      ? `Downloading shared source${output.progress > 0 ? ` · ${output.progress}%` : '…'}`
      : output?.stage === 'validating_source'
        ? 'Checking shared source media…'
        : output?.stage === 'validating_output'
          ? `Verifying the ${format.toUpperCase()} output…`
          : `Creating your ${format.toUpperCase()} clip${output?.progress > 0 ? ` · ${output.progress}%` : '…'}`;
  const progress = output?.stage === 'acquiring' ? output.progress : output?.progress;
  return (
    <div className="status">
      <div className="status-progress">
        <span>{label}</span>
        {onCancel && <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>}
      </div>
      {['acquiring', 'processing', 'validating_source', 'validating_output'].includes(output?.stage) && (
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress || 0}%` }} /></div>
      )}
    </div>
  );
}
