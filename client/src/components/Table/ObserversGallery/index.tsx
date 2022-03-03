import React, { memo, useMemo } from "react";

import useParticipants from "../../../twilio/hooks/useParticipants/useParticipants";
import { PlayerRole } from "../../../engine/types";
import useRoomState from "../../../twilio/hooks/useRoomState/useRoomState";
import SeatVideo from "../../Seat/SeatVideo";
import { useAppState } from "../../../twilio/state";

import { IObserversGalleryProps } from "./interface";

import "./ObserversGallery.css";

const ObserversGallery = ({ players }: IObserversGalleryProps): JSX.Element => {
  const participants = useParticipants();
  const { user } = useAppState();
  const observingParticipants = useMemo(() => participants
    .map((p) => players[p.identity])
    .filter(
      (p) => p?.role === PlayerRole.Organizer
    ), [participants, players])

  return (
    <div className="observers-gallery">
      {observingParticipants.map((player) => (
        <SeatVideo
          key={player.id}
          playerId={player.id}
          currentUserId={user?.uid}
          volume={1}
          hideAudioLevels
        />
      ))}
    </div>
  );
}

const ConnectedObserversGallery = ({ players }: IObserversGalleryProps): JSX.Element => {
  const roomState = useRoomState();

  if (roomState !== "connected") {
    return null;
  }

  return <ObserversGallery players={players} />;
}

export default memo(ConnectedObserversGallery);