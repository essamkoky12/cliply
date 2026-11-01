const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    const headers = { ...options.headers };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      cache: 'no-store'
    });
  } catch {
    throw new Error('Cannot reach the ClipDown API. Check that the backend is running.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || `Request failed (${response.status}).`);
  return body;
}

export async function fetchVideoInfo(url) {
  return (await request('/api/video/info', { method: 'POST', body: JSON.stringify({ url }) })).video;
}

export async function fetchPlaylistInfo(url) {
  return (await request('/api/playlists/info', { method: 'POST', body: JSON.stringify({ url }) })).playlist;
}

export async function createDownloadJob({
  url, startTime, endTime, format, quality, audioQuality, resizePreset, resizeMode, title
}) {
  return (await request('/api/video/download', {
    method: 'POST',
    body: JSON.stringify({ url, startTime, endTime, format, quality, audioQuality, resizePreset, resizeMode, title })
  })).job;
}

export async function fetchJob(id, options = {}) {
  return (await request(`/api/video/jobs/${encodeURIComponent(id)}`, options)).job;
}

export async function cancelJob(id) {
  return (await request(`/api/video/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' })).job;
}

export function getFileUrl(id, format) {
  const filePath = format
    ? `files/${encodeURIComponent(format)}`
    : 'file';
  return `${API_BASE}/api/video/jobs/${encodeURIComponent(id)}/${filePath}`;
}
