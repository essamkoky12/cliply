export default function UrlInput({ value, onChange, onSubmit, loading }) {
  return (
    <form className="url-form" onSubmit={onSubmit}>
      <input
        className="url-input"
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="Paste a video or direct media URL"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Video URL"
        required
      />
      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" />Fetching</> : 'Fetch video'}
      </button>
    </form>
  );
}
