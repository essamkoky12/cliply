export type FormatType = 'mp4' | 'mp3';

export type VideoQuality = '360p' | '480p' | '720p' | '1080p' | 'best';

export type AudioQuality = '128k' | '192k' | '256k' | '320k';

export type AspectRatioPreset = 'original' | '9:16' | '16:9' | '1:1' | '4:5';

export type ResizeMode = 'fit' | 'fill' | 'stretch';

export type ProcessingStage = 'preparing' | 'fetching' | 'processing' | 'finalizing' | 'completed';

export interface VideoMetadata {
  title: string;
  channel: string;
  duration: string;
  resolution: string;
  thumbnail: string;
  source: string;
  url: string;
}

export interface QualityOption {
  id: VideoQuality;
  label: string;
  resolution: string;
  badge?: string;
  approxSize: string;
}

export interface ResizePresetOption {
  id: AspectRatioPreset;
  label: string;
  description: string;
  dimensions: string;
  ratioWidth: number;
  ratioHeight: number;
  platforms: string;
}

export interface AudioBitrateOption {
  id: AudioQuality;
  label: string;
  description: string;
  approxSize: string;
}
