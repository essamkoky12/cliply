import { AudioBitrateOption, QualityOption, ResizePresetOption, VideoMetadata } from './types.ts';

export const DEFAULT_MOCK_METADATA: VideoMetadata = {
  title: 'Building a Modern Web Application',
  channel: 'Developer Studio',
  duration: '12:48',
  resolution: '1920 × 1080',
  // High quality cinematic tech workspace / UI design frame
  thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  source: 'YouTube',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

export const SAMPLE_URLS = [
  {
    label: 'Building a Modern Web Application',
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    channel: 'Developer Studio',
    duration: '12:48',
    res: '1920 × 1080',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Minimalist Architecture in Kyoto',
    url: 'https://youtube.com/watch?v=kyoto-arch-4k',
    channel: 'Form & Space',
    duration: '08:24',
    res: '3840 × 2160',
    thumb: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Analog Synthesizer Jam Session',
    url: 'https://youtube.com/watch?v=synth-wave-modular',
    channel: 'Oscillator Club',
    duration: '05:32',
    res: '1920 × 1080',
    thumb: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80'
  }
];

export const QUALITY_OPTIONS: QualityOption[] = [
  { id: '360p', label: '360p', resolution: '640 × 360', badge: 'SD', approxSize: '14.2 MB' },
  { id: '480p', label: '480p', resolution: '854 × 480', badge: 'SD', approxSize: '28.5 MB' },
  { id: '720p', label: '720p', resolution: '1280 × 720', badge: 'HD', approxSize: '56.8 MB' },
  { id: '1080p', label: '1080p', resolution: '1920 × 1080', badge: 'FHD', approxSize: '112.4 MB' },
  { id: 'best', label: 'Best Available', resolution: 'Maximum available (1080p 60fps)', badge: 'Source', approxSize: '184.0 MB' },
];

export const RESIZE_PRESETS: ResizePresetOption[] = [
  {
    id: 'original',
    label: 'Original',
    description: 'Keep original dimensions',
    dimensions: '1920 × 1080',
    ratioWidth: 16,
    ratioHeight: 9,
    platforms: 'Standard 16:9'
  },
  {
    id: '9:16',
    label: 'Portrait 9:16',
    description: 'Suitable for TikTok, Reels, and Shorts',
    dimensions: '1080 × 1920',
    ratioWidth: 9,
    ratioHeight: 16,
    platforms: 'TikTok • Reels • Shorts'
  },
  {
    id: '16:9',
    label: 'Landscape 16:9',
    description: 'Suitable for YouTube',
    dimensions: '1920 × 1080',
    ratioWidth: 16,
    ratioHeight: 9,
    platforms: 'YouTube • Desktop'
  },
  {
    id: '1:1',
    label: 'Square 1:1',
    description: 'Suitable for square social posts',
    dimensions: '1080 × 1080',
    ratioWidth: 1,
    ratioHeight: 1,
    platforms: 'Instagram • X / Twitter'
  },
  {
    id: '4:5',
    label: 'Portrait Feed 4:5',
    description: 'Suitable for Instagram feed',
    dimensions: '1080 × 1350',
    ratioWidth: 4,
    ratioHeight: 5,
    platforms: 'Instagram Feed'
  }
];

export const AUDIO_QUALITY_OPTIONS: AudioBitrateOption[] = [
  { id: '128k', label: '128 kbps', description: 'Standard quality, lightweight file', approxSize: '11.8 MB' },
  { id: '192k', label: '192 kbps', description: 'Optimal clarity & balance (Recommended)', approxSize: '17.6 MB' },
  { id: '256k', label: '256 kbps', description: 'High fidelity audio streams', approxSize: '23.5 MB' },
  { id: '320k', label: '320 kbps', description: 'Maximum studio-grade quality', approxSize: '29.4 MB' },
];

export const SPRING_TRANSITION = {
  type: 'spring',
  stiffness: 190,
  damping: 26,
  mass: 0.85,
} as const;
