'use client';

import { useEffect, useRef, useState } from 'react';

export default function UrlInput({ value, onChange, onSubmit, loading, expanded = false }) {
  const [pasteMessage, setPasteMessage] = useState('');
  const messageTimeout = useRef(null);

  useEffect(() => () => clearTimeout(messageTimeout.current), []);

  function showPasteMessage(message) {
    setPasteMessage(message);
    clearTimeout(messageTimeout.current);
    messageTimeout.current = setTimeout(() => setPasteMessage(''), 2600);
  }

  async function pasteFromClipboard() {
    if (!navigator.clipboard?.readText) {
      showPasteMessage('Clipboard access is unavailable in this browser.');
      return;
    }

    try {
      const clipboardText = (await navigator.clipboard.readText()).trim();
      if (!clipboardText) {
        showPasteMessage('Clipboard is empty.');
        return;
      }
      onChange(clipboardText);
      setPasteMessage('Link pasted.');
      clearTimeout(messageTimeout.current);
      messageTimeout.current = setTimeout(() => setPasteMessage(''), 1800);
    } catch (error) {
      showPasteMessage(error?.name === 'NotAllowedError'
        ? 'Allow clipboard access to paste a link.'
        : 'Could not read the clipboard.');
    }
  }

  return (
    <>
      <form className={`url-form ${expanded ? 'url-form-expanded' : ''}`} onSubmit={onSubmit}>
        <input
          className="url-input"
          id="source-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="Paste a video URL here…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Video URL"
          readOnly={expanded}
          required
        />
        {!expanded && (
          <button className="paste-button" type="button" onClick={pasteFromClipboard} disabled={loading}>
            <PasteIcon />
            <span>Paste</span>
          </button>
        )}
        <button className="fetch-button" type="submit" disabled={loading || expanded} aria-label="Fetch video metadata">
          {loading ? <span className="spinner" aria-label="Fetching" /> : <span className="fetch-arrow" aria-hidden="true">→</span>}
        </button>
      </form>
      <span className={`paste-feedback ${pasteMessage ? 'visible' : ''}`} role="status" aria-live="polite">
        {pasteMessage || '\u00a0'}
      </span>
    </>
  );
}

function PasteIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="4" width="12" height="16" rx="2" />
      <path d="M16 4.5V3a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h2" />
    </svg>
  );
}
