import { useEffect, useState } from 'react';
import { RemoteParticipant } from 'twilio-video';
import useVideoContext from '../useVideoContext/useVideoContext';

export default function useIsDominantSpeaker(): RemoteParticipant {
  const { room } = useVideoContext();
  const [dominantSpeaker, setDominantSpeaker] = useState(room.dominantSpeaker);

  useEffect(() => {
    // Sometimes, the 'dominantSpeakerChanged' event can emit 'null', which means that
    // there is no dominant speaker.
    const handleDominantSpeakerChanged = (newDominantSpeaker: RemoteParticipant): void => {
      setDominantSpeaker(newDominantSpeaker);
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant): void => {
      setDominantSpeaker(dominantSpeaker === participant ? null : dominantSpeaker);
    }

    room.on('dominantSpeakerChanged', handleDominantSpeakerChanged);
    room.on('participantDisconnected', handleParticipantDisconnected);
    return (): void => {
      room.off('dominantSpeakerChanged', handleDominantSpeakerChanged);
      room.off('participantDisconnected', handleParticipantDisconnected);
    };
  }, [dominantSpeaker, room]);

  return dominantSpeaker;
}
