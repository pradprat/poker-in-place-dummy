import React, { memo } from "react";
import { Participant, RemoteAudioTrack, LocalAudioTrack } from "twilio-video";

import AudioLevelIndicator from "../../../twilio/components/AudioLevelIndicator/AudioLevelIndicator";
import usePublications from "../../../twilio/hooks/usePublications/usePublications";
import useTrack from "../../../twilio/hooks/useTrack/useTrack";
import useParticipants from "../../../twilio/hooks/useParticipants/useParticipants";
import ParticipantTracks from "../../../twilio/components/ParticipantTracks/ParticipantTracks";
import useWhispers from "../../../twilio/hooks/useWhispers/useWhispers";
import useVideoContext from "../../../twilio/hooks/useVideoContext/useVideoContext";

import NetworkConnectionStatus from "./components/NetworkConnectionStatus";

interface ISeatVideoLevelsProps {
  participant: Participant;
  muted?: boolean;
}

const SeatVideoLevels = memo(({
  participant,
  muted,
}: ISeatVideoLevelsProps) => {
  const publications = usePublications(participant);

  const audioPublication = publications.find((p) => p.kind === "audio");
  const audioTrack = useTrack(audioPublication) as
    | LocalAudioTrack
    | RemoteAudioTrack;

  return (
    <>
      <AudioLevelIndicator
        audioTrack={muted ? null : audioTrack}
        background="white"
        className="audio"
        size={40}
      />
      <NetworkConnectionStatus
        className="network"
      />
    </>
  );
});

interface ISeatVideoProps {
  playerId: string;
  currentUserId: string;
  muted?: boolean;
  volume?: number;
  hideAudioLevels?: boolean;
}

export default memo((props: ISeatVideoProps) => {
  const participants = useParticipants();
  const { room } = useVideoContext();
  const { localParticipant } = room;
  const whispers = useWhispers();

  const participant = participants.find(
    (p) => p.identity.indexOf(props.playerId) >= 0
  );
  const isLocal =
    !participant &&
    localParticipant &&
    localParticipant.identity.indexOf(props.playerId) >= 0;

  if (!isLocal && !participant) {
    return <></>;
  }

  let muffledAudio = false;
  if (participant) {
    // They are muffled IF we are in a whisper not with them OR
    // they are in a whisper not with us...
    if (
      whispers[props.currentUserId] &&
      whispers[props.currentUserId] !== participant.sid
    ) {
      muffledAudio = true;
    } else if (
      whispers[participant.sid] &&
      whispers[participant.sid] !== props.currentUserId
    ) {
      muffledAudio = true;
    }
  }

  return (
    <div className="seat-video-with-indicator">
      <div className="seat-video">
        <ParticipantTracks
          participant={participant || localParticipant}
          disableAudio={isLocal || !!props.muted}
          enableScreenShare={false}
          volume={muffledAudio ? 0.2 : props.volume}
        />
      </div>
      {!props.hideAudioLevels ? (
        <SeatVideoLevels
          muted={props.muted}
          participant={participant || localParticipant}
        />
      ) : null}
    </div>
  );
});
