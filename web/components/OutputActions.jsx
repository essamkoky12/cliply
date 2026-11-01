'use client';

import { useEffect, useState } from 'react';
import { getFileUrl } from '../lib/api';

const MIME_TYPES = {
  mp4: 'video/mp4',
  mp3: 'audio/mpeg'
};

function supportsFileSharing() {
  if (
    typeof navigator === 'undefined'
    || typeof File === 'undefined'
    || typeof navigator.share !== 'function'
    || typeof navigator.canShare !== 'function'
  ) return false;
  const file = new File([''], 'clip.mp4', { type: MIME_TYPES.mp4 });
  return navigator.canShare({ files: [file] });
}

export default function OutputActions({ jobId, format, fileName }) {
  const [fileShareAvailable, setFileShareAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const downloadUrl = getFileUrl(jobId, format);

  useEffect(() => {
    setFileShareAvailable(supportsFileSharing());
  }, []);

  async function shareFile() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`The generated file could not be fetched (${response.status}).`);
      const file = new File([await response.blob()], fileName, { type: MIME_TYPES[format] });
      if (!navigator.canShare?.({ files: [file] })) {
        setFileShareAvailable(false);
        return;
      }
      await navigator.share({ files: [file], title: fileName });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setMessage(error instanceof Error ? error.message : 'The file could not be shared.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    setMessage('');
    try {
      await navigator.clipboard.writeText(new URL(downloadUrl, window.location.href).href);
      setMessage('Download link copied.');
    } catch {
      setMessage('Could not copy the link. Use Download to save the generated file.');
    }
  }

  return (
    <div className="output-actions">
      <a className="download-link" href={downloadUrl} download={fileName}>
        Download {format.toUpperCase()}
      </a>
      {fileShareAvailable ? (
        <button className="secondary-button" type="button" onClick={shareFile} disabled={busy}>
          {busy ? 'Preparing…' : 'Share'}
        </button>
      ) : (
        <button className="secondary-button" type="button" onClick={copyLink}>
          Copy Link
        </button>
      )}
      {message && <span className="output-action-message" role="status">{message}</span>}
    </div>
  );
}
