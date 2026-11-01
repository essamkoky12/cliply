export default function DownloadButton({ disabled, loading, onClick }) {
  return (
    <button className="primary-button" type="button" disabled={disabled || loading} onClick={onClick}>
      {loading ? <><span className="spinner" />Starting</> : 'Create clip'}
    </button>
  );
}
