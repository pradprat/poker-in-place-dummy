import {
  LocalVideoTrack,
  RemoteVideoTrack,
  TwilioError,
} from "twilio-video";

declare module "twilio-video" {
  interface LocalParticipant {
    setBandwidthProfile: (bandwidthProfile: BandwidthProfileOptions) => void;
    publishTrack(
      track: LocalTrack,
      options?: { priority: Track.Priority }
    ): Promise<LocalTrackPublication>;
  }

  interface VideoCodecSettings {
    simulcast?: boolean;
  }

  interface LocalVideoTrack {
    isSwitchedOff: undefined;
    setPriority: undefined;
  }

  interface RemoteVideoTrack {
    isSwitchedOff: boolean;
    // setPriority: (priority: Track.Priority | null) => void;
  }

  interface VideoBandwidthProfileOptions {
    trackSwitchOffMode?: "predicted" | "detected" | "disabled";
  }

  interface SuperRoom extends Room {
    id: string;
    isPublishingVideo: boolean;
    isPublishingAudio: boolean;
    isVideoProducingDisabled: boolean;
    shouldProduce: boolean;
    whispers: Record<Participant.SID, Participant.SID>;
    sendChatMessage(message: string): void;
    sendStructuredMessage(message: any): void;
    startWhisper(toPeerId: string): Promise<boolean>;
    endWhisper(toPeerId: string): Promise<boolean>;
    disconnectAndWait(): Promise<void>;
  }
}

declare global {
  interface MediaDevices {
    getDisplayMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  }

  interface HTMLMediaElement {
    setSinkId?(sinkId: string): Promise<undefined>;
  }
}

export type Callback = (...args: any[]) => void;

export type ErrorCallback = (error: TwilioError) => void;

export type IVideoTrack = LocalVideoTrack | RemoteVideoTrack;
