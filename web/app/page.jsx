'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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
        setStart(0);
        setEnd(Math.min(info.duration || 30, 30));
        if (info.capabilities?.formats?.length) {
          setFormat(info.capabilities.formats.includes('mp4') ? 'mp4' : info.capabilities.formats[0]);
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }

  return (
    <div className="page-shell min-h-screen">
      <Header />
      <main className="main">
        <section className="hero">
          <span className="eyebrow">A better way to clip</span>
          <h1>Trim video, your way.</h1>
          <p>Paste a supported video or media link, choose a moment, and export just the part you need.</p>
        </section>
        <UrlInput value={url} onChange={setUrl} onSubmit={submit} loading={loading} />
        {error && !video && <div className="status error" role="alert">{error}</div>}
        {playlist && (
          <section className="workspace">
            <h2 className="video-title">{playlist.title}</h2>
            <div className="video-meta"><span>YouTube playlist</span><span>{playlist.itemCount} videos</span></div>
            <div className="playlist-list">
              {playlist.items.map((item) => (
                <button className="playlist-item" type="button" key={item.id} onClick={() => choosePlaylistItem(item)}>
                  {item.thumbnail && <Image src={item.thumbnail} alt="" width={88} height={50} unoptimized referrerPolicy="no-referrer" />}
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        {video && (
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
            creating={creating}
            error={error}
          />
        )}
        <p className="footer-note">Use only media you have the right to access and process. Provider availability depends on permitted integrations and access rights.</p>
      </main>
    </div>
  );
}
