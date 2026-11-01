export default function VideoTimeline({ duration, start, end, onStartChange, onEndChange }) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return <p className="timeline-hint">Duration is verified when the source is acquired. Enter the desired timestamps below.</p>;
  }
  const startPercent = Math.min(100, (start / duration) * 100);
  const endPercent = Math.min(100, (end / duration) * 100);
  const step = Math.min(0.1, duration / 1000);
  return (
    <div className="timeline-wrap" aria-label="Select a video segment">
      <div className="timeline">
        <span className="timeline-selected" style={{ left: `${startPercent}%`, right: `${100 - endPercent}%` }} />
        <input
          className="range-input"
          type="range"
          min="0"
          max={duration}
          step={step}
          value={start}
          aria-label="Clip start"
          onChange={(event) => onStartChange(Math.min(Number(event.target.value), end - step))}
        />
        <input
          className="range-input"
          type="range"
          min="0"
          max={duration}
          step={step}
          value={end}
          aria-label="Clip end"
          onChange={(event) => onEndChange(Math.max(Number(event.target.value), start + step))}
        />
      </div>
    </div>
  );
}
