import { useEffect, useState } from "react";
import useVideoContext from "../useVideoContext/useVideoContext";
import { RemoteParticipant, Participant } from "twilio-video";

type WhisperMap = Record<Participant.SID, Participant.SID>;

export default function useWhispers() {
  const { room } = useVideoContext();
  const [whispers, setWhispers] = useState<WhisperMap>(room.whispers || {});

  useEffect(() => {
    // Sometimes, the 'dominantSpeakerChanged' event can emit 'null', which means that
    // there is no dominant speaker. If we change the main participant when 'null' is
    // emitted, the effect can be jarring to the user. Here we ignore any 'null' values
    // and continue to display the previous dominant speaker as the main participant.
    const handleWhisperStarted = ({
      fromPeer,
      toPeer,
    }: {
      fromPeer: RemoteParticipant;
      toPeer: RemoteParticipant;
    }) => {
      if (fromPeer && toPeer) {
      setWhispers({
        ...whispers,
        [fromPeer.sid]: toPeer.sid,
        // [toPeer.sid]: fromPeer.sid,
      });
    }
    };
    const handleWhisperEnded = ({
      fromPeer,
      toPeer,
    }: {
      fromPeer: RemoteParticipant;
      toPeer: RemoteParticipant;
    }) => {
      const updatedWhispers = {
        ...whispers,
      };
      // if (updatedWhispers[fromPeer.sid] && updatedWhispers[fromPeer.sid] === toPeer.sid)
      if (fromPeer) {
      delete updatedWhispers[fromPeer.sid];
      }
      if (toPeer) {
      delete updatedWhispers[toPeer.sid];
      }
      setWhispers(updatedWhispers);
    };

    // Since 'null' values are ignored, we will need to listen for the 'participantDisconnected'
    // event, so we can set the dominantSpeaker to 'null' when they disconnect.
    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      const updatedWhispers = {
        ...whispers,
      };
      // if (updatedWhispers[fromPeer.sid] && updatedWhispers[fromPeer.sid] === toPeer.sid)
      delete updatedWhispers[participant.sid];
      for (const key of Object.keys(updatedWhispers)) {
        if (updatedWhispers[key] === participant.sid) {
          delete updatedWhispers[key];
        }
      }
      setWhispers(updatedWhispers);
    };

    room.on("whisperStarted", handleWhisperStarted);
    room.on("whisperEnded", handleWhisperEnded);
    room.on("participantDisconnected", handleParticipantDisconnected);
    return () => {
      room.off("whisperStarted", handleWhisperStarted);
      room.off("whisperEnded", handleWhisperEnded);
      room.off("participantDisconnected", handleParticipantDisconnected);
    };
  }, [room]);

  return whispers;
}
