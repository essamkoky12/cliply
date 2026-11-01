function outputLabel(output) {
  if (!output) return '';
  return {
    queued: 'Queued',
    processing: output.stage === 'acquiring' ? 'Source' : 'Processing',
    completed: 'Ready',
    failed: 'Failed',
    cancelled: 'Cancelled',
    expired: 'Expired'
  }[output.status] || '';
}

export default function FormatSelector({ value, onChange, outputs = {} }) {
  return (
    <div className="format-options" aria-label="Output format">
      {['mp4', 'mp3'].map((format) => (
        <button
          key={format}
          type="button"
          className={`format-option ${value === format ? 'active' : ''}`}
          aria-pressed={value === format}
          aria-label={`${format.toUpperCase()}${outputs[format] ? `: ${outputLabel(outputs[format])}` : ''}`}
          onClick={() => onChange(format)}
        >
          {format.toUpperCase()}
          {outputs[format] && <small>{outputLabel(outputs[format])}</small>}
        </button>
      ))}
    </div>
  );
}
