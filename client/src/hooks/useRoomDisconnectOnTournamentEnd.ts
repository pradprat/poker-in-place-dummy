import { useEffect } from "react";

import useVideoContext from "../twilio/hooks/useVideoContext/useVideoContext";

export const useRoomDisconnectOnTournamentEnd = (roomState: string | undefined) => {
  const { removeLocalAudioTrack, removeLocalVideoTrack } = useVideoContext();

  useEffect(() => {
    if (roomState === "disconnected") {
      removeLocalVideoTrack();
      removeLocalAudioTrack();
    }
  }, [roomState]);

  return roomState;
};