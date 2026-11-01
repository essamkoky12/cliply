'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import Header from '../components/Header';
import UrlInput from '../components/UrlInput';
import VideoWorkspace from '../components/VideoWorkspace';
import { cancelJob, createDownloadJob, fetchJob, fetchPlaylistInfo, fetchVideoInfo } from '../lib/api';
import { createJobPoller } from '../lib/job-poller.mjs';

function isPlaylistOnly(raw) {
  try {
    const url = new URL(raw);
    return Boolean(url.searchParams.get('list')) && !url.searchParams.get('v') && !/\/(?:shorts|embed|live)\//.test(url.pathname);
  } catch {
    return false;
  }
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [video, setVideo] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [editingLink, setEditingLink] = useState(true);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('720p');
  const [audioQuality, setAudioQuality] = useState(192);
  const [resizePreset, setResizePreset] = useState('original');
  const [resizeMode, setResizeMode] = useState('fit');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState(null);
  const jobId = job?.id;
  const jobStatus = job?.status;
  const creatingJob = useRef(false);
  const jobPoller = useRef(null);
  if (!jobPoller.current) {
    jobPoller.current = createJobPoller({
      fetchJob,
      onJob: setJob,
      onError: (pollError) => setError(pollError.message)
    });
  }

  async function submit(event) {
    event.preventDefault();
    jobPoller.current.stop();
    setLoading(true);
    setError('');
    setVideo(null);
    setPlaylist(null);
    setJob(null);
    try {
      if (isPlaylistOnly(url)) {
        setPlaylist(await fetchPlaylistInfo(url));
      } else {
        const info = await fetchVideoInfo(url);
        setVideo(info);
        setStart(0);
        setEnd(Math.min(info.duration || 30, 30));
        if (info.capabilities?.formats?.length) {
          setFormat(info.capabilities.formats.includes('mp4') ? 'mp4' : info.capabilities.formats[0]);
        }
      }
      setEditingLink(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function createJob() {
    if (creatingJob.current) return;
    creatingJob.current = true;
    setCreating(true);
    setError('');
    try {
      setJob(await createDownloadJob({
        url: video.sourceUrl || url, startTime: start, endTime: end, format, quality,
        audioQuality, resizePreset, resizeMode, title: video.title
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      creatingJob.current = false;
      setCreating(false);
    }
  }

  useEffect(() => {
    if (jobId && ['queued', 'processing'].includes(jobStatus)) jobPoller.current.start(jobId);
    else jobPoller.current.stop();
  }, [jobId, jobStatus]);

  useEffect(() => () => jobPoller.current.stop(), []);

  async function stopJob() {
    if (!job) return;
    jobPoller.current.stop(job.id);
    try {
      setJob(await cancelJob(job.id));
    } catch (requestError) {
      setError(requestError.message);
      if (['queued', 'processing'].includes(job.status)) jobPoller.current.start(job.id);
    }
  }

  function choosePlaylistItem(item) {
    const selectedUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`;
    setUrl(selectedUrl);
    setPlaylist(null);
    setError('');
    setLoading(true);
    fetchVideoInfo(selectedUrl)
      .then((info) => {
        setVideo(info);
        setEditingLink(false);
        setStart(0);
        setEnd(Math.min(info.duration || 30, 30));
        if (info.capabilities?.formats?.length) {
          setFormat(info.capabilities.formats.includes('mp4') ? 'mp4' : info.capabilities.formats[0]);
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  function resetClip() {
    jobPoller.current.stop();
    setVideo(null);
    setPlaylist(null);
    setJob(null);
    setEditingLink(true);
    setUrl('');
    setError('');
    setStart(0);
    setEnd(30);
  }

  function editSettings() {
    setJob(null);
    setError('');
  }

  function changeLink() {
    if (job && ['queued', 'processing'].includes(job.status)) return;
    jobPoller.current.stop();
    setVideo(null);
    setPlaylist(null);
    setJob(null);
    setEditingLink(true);
    setError('');
    setStart(0);
    setEnd(30);
  }

  function handleUrlChange(nextUrl) {
    setUrl(nextUrl);
    if (video || playlist) {
      setVideo(null);
      setPlaylist(null);
      setJob(null);
      setEditingLink(true);
      setError('');
    }
  }

  return (
    <div className="page-shell min-h-screen">
      <Header />
      <main className="main">
        <section className="hero">
          <span className="eyebrow"><span className="eyebrow-dot" />A better way to clip</span>
          <h1>Keep the moments<br className="mobile-break" /> that matter.</h1>
          <p>Shape a video or extract audio. One clean workflow, ready when you are.</p>
        </section>
        <motion.section
          layout
          transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 0.85 }}
          className={`clip-card ${video || playlist ? 'expanded' : ''}`}
        >
          <div className="clip-card-content">
            <div className="source-entry">
              <div className="source-label-row">
                <label htmlFor="source-url">{video || playlist ? 'VIDEO URL' : 'Video source'}</label>
                {video || playlist ? (
                  !(job && ['queued', 'processing'].includes(job.status)) && (
                    <button className="change-link-button" type="button" onClick={changeLink}>
                      <span aria-hidden="true">↻</span> Change link
                    </button>
                  )
                ) : <span>Supported video or direct media URL</span>}
              </div>
              <UrlInput
                value={url}
                onChange={handleUrlChange}
                onSubmit={submit}
                loading={loading}
                expanded={Boolean((video || playlist) && !editingLink)}
              />
            </div>
            {!video && error && <div className="source-error" role="alert">{error}</div>}
            {playlist && (
              <motion.div
                key="playlist"
                className="playlist-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.16 }}
              >
                <div className="playlist-heading">
                  <div>
                    <span className="section-kicker">PLAYLIST</span>
                    <h2>{playlist.title}</h2>
                  </div>
                  <span className="duration-chip">{playlist.itemCount} videos</span>
                </div>
                <div className="playlist-list">
                  {playlist.items.map((item) => (
                    <button className="playlist-item" type="button" key={item.id} onClick={() => choosePlaylistItem(item)}>
                      {item.thumbnail && <Image src={item.thumbnail} alt="" width={88} height={50} unoptimized referrerPolicy="no-referrer" />}
                      <span>{item.title}</span>
                      <span className="playlist-arrow" aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {video && !editingLink && (
              <motion.div
                key="video-workspace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.16 }}
                className="workspace-wrap"
              >
                <VideoWorkspace
                  video={video}
                  start={start}
                  end={end}
                  setStart={setStart}
                  setEnd={setEnd}
                  format={format}
                  setFormat={setFormat}
                  quality={quality}
                  setQuality={setQuality}
                  audioQuality={audioQuality}
                  setAudioQuality={setAudioQuality}
                  resizePreset={resizePreset}
                  setResizePreset={setResizePreset}
                  resizeMode={resizeMode}
                  setResizeMode={setResizeMode}
                  job={job}
                  onCreate={createJob}
                  onCancel={stopJob}
                  onReset={resetClip}
                  onEditSettings={editSettings}
                  creating={creating}
                  error={error}
                />
              </motion.div>
            )}
          </div>
        </motion.section>
        <p className="footer-note">Use only media you have the right to access and process. Provider availability depends on permitted integrations and access rights.</p>
      </main>
    </div>
  );
}
