export interface IRecorder {
  record: { (): void };
  upload: { (): void };
  reset: { (hardReset: boolean): void };
  stopVideo?: { (): void };
  playVideo?: { (): void };
  pauseVideo?: { (): void };
  accept?: { (): void };
  remove?: { (): void };
}

export enum RecorderState {
  Idle,
  Recording,
  Recorded,
  Playing,
  Paused,
  Accepted,
  Uploading,
  Uploaded,
}

export interface IVideoManagerProps {
  onVideoAccepted: { (videoUrl: string): void };
  qualityUrl?: string;
  allowUploads?: boolean;
  hasWelcomeVideo?: boolean;
  hasVimeoEnabled?: boolean;
  hasVimeo?: boolean;
  toggleVimeo?: () => void;
  onShowUploader?: () => void;
  onCloseUploader?: () => void;
}