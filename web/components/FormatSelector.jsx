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

export default function FormatSelector({ value, onChange, outputs = {}, formats = ['mp4', 'mp3'] }) {
  return (
    <div className="format-options" aria-label="Output format">
      {['mp4', 'mp3'].map((format) => (
        <button
          key={format}
          type="button"
          className={`format-option ${value === format ? 'active' : ''}`}
          aria-pressed={value === format}
          aria-label={`${format.toUpperCase()} ${format === 'mp4' ? 'Video' : 'Audio'}${outputs[format] ? `: ${outputLabel(outputs[format])}` : ''}`}
          disabled={!formats.includes(format)}
          onClick={() => onChange(format)}
        >
          <span className="format-symbol" aria-hidden="true">{format === 'mp4' ? '▣' : '♫'}</span>
          <span>{format === 'mp4' ? 'MP4 Video' : 'MP3 Audio'}</span>
          {outputs[format] && <small>{outputLabel(outputs[format])}</small>}
        </button>
      ))}
    </div>
  );
}
