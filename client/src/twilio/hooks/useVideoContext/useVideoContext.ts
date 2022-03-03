import { EventEmitter } from "events";
import { useContext } from "react";
import { SuperRoom } from "twilio-video";
import { IVideoContext, VideoContext } from "../../components/VideoProvider";

export default function useVideoContext() {
  const context = useContext(VideoContext);
  if (!context) {
    return {
      room: new EventEmitter() as SuperRoom,
      identity: null,
      localTracks: null,
      isConnecting: true,
      connect: null,
      onError: null,
      getLocalVideoTrack: null,
      getLocalAudioTrack: null,
      isAcquiringLocalTracks: null,
      removeLocalVideoTrack: null,
      removeLocalAudioTrack: null,
      getAudioAndVideoTracks: null,
    } as IVideoContext;
  }
  return context;
}
