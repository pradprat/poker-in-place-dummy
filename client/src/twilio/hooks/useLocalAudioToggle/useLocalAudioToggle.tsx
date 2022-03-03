import { LocalAudioTrack } from "twilio-video";
import { useCallback, useState, useEffect } from "react";
import useIsTrackEnabled from "../useIsTrackEnabled/useIsTrackEnabled";
import useVideoContext from "../useVideoContext/useVideoContext";

export default function useLocalAudioToggle() {
  const {
    localTracks,
    getLocalAudioTrack,
    removeLocalAudioTrack,
    room: { localParticipant, isPublishingAudio },
  } = useVideoContext();

  const [isPublishing, setIsPublishing] = useState(isPublishingAudio);
  const [didConnectOnce, setDidConnectOnce] = useState(isPublishingAudio);

  const audioTrack = localTracks.find(
    (track) => track.kind === "audio"
  ) as LocalAudioTrack;

  const isEnabled = useIsTrackEnabled(audioTrack);
  const isConnected = !!localParticipant;
  const isAudioEnabled = isEnabled && (isPublishing || !isConnected);

  const toggleAudioEnabled = useCallback(() => {
    const shouldDisableAudioTrack = audioTrack && isPublishing;
    if (shouldDisableAudioTrack) {
      disableAudioTrack();
    } else {
      enableAudioTrack();
    }
  }, [audioTrack, localParticipant, isPublishing]);

  const disableAudioTrack = useCallback(() => {
    setIsPublishing(false);
    removeLocalAudioTrack();
    localParticipant?.unpublishTrack(audioTrack)
  }, [isPublishing, localParticipant]);

  const enableAudioTrack = useCallback(() => {
    getLocalAudioTrack()
      .then((track: LocalAudioTrack) =>
        localParticipant?.publishTrack(track, { priority: "low" })
      )
      .finally(() => setIsPublishing(true));
  }, [localParticipant])

  useEffect(() => {
    if (isConnected && audioTrack && !didConnectOnce && !isPublishing) {
      setIsPublishing(true);
      setDidConnectOnce(true);
      localParticipant?.publishTrack(audioTrack);
    }
  }, [isConnected, audioTrack, didConnectOnce, isPublishing]);

  return [isAudioEnabled, toggleAudioEnabled] as const;
}
