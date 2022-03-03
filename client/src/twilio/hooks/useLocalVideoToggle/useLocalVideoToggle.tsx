import { LocalVideoTrack } from "twilio-video";
import { useCallback, useRef, useState, useEffect } from "react";
import useVideoContext from "../useVideoContext/useVideoContext";

export default function useLocalVideoToggle() {
  const {
    room,
    localTracks,
    getLocalVideoTrack,
    removeLocalVideoTrack,
    onError,
  } = useVideoContext();
  const { localParticipant, isPublishingVideo } = room;
  const videoTrack = localTracks.find((track) =>
    track.name.includes("camera")
  ) as LocalVideoTrack;
  const [isPublishing, setIsPublishing] = useState(isPublishingVideo);
  const previousDeviceIdRef = useRef<string>();
  const [didConnectOnce, setDidConnectOnce] = useState(isPublishingVideo);

  useEffect(() => {
    setDidConnectOnce(room.isPublishingVideo);
  }, [room]);

  const toggleVideoEnabled = useCallback(() => {
    if (videoTrack && isPublishing) {
      previousDeviceIdRef.current = videoTrack.mediaStreamTrack.getSettings().deviceId;
      localParticipant?.unpublishTrack(videoTrack);
      removeLocalVideoTrack();
    } else {
      getLocalVideoTrack({ deviceId: { exact: previousDeviceIdRef.current } })
        .then((track: LocalVideoTrack) =>
          localParticipant?.publishTrack(track, { priority: "low" })
        )
        .catch(onError)
        .finally(() => setIsPublishing(true));
    }
  }, [
    videoTrack,
    localParticipant,
    getLocalVideoTrack,
    isPublishing,
    onError,
    removeLocalVideoTrack,
    isPublishing,
  ]);

  const isConnected = !!localParticipant;
  useEffect(() => {
    if (room.isPublishingVideo) {
      setDidConnectOnce(true);
    } else if (isConnected && videoTrack && !didConnectOnce && !isPublishing) {
      setIsPublishing(true);
      setDidConnectOnce(true);
      localParticipant?.publishTrack(videoTrack);
    }
  }, [isConnected, videoTrack, didConnectOnce, isPublishing, room]);

  const isDisabledRemote = localParticipant && !isPublishing;
  const shouldHideBtn = room?.isVideoProducingDisabled;

  return [!!videoTrack && !isDisabledRemote, toggleVideoEnabled, shouldHideBtn] as const;
}
