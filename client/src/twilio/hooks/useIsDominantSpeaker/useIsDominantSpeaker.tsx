import { useMemo } from 'react';
import useVideoContext from '../useVideoContext/useVideoContext';
import useParticipants from '../useParticipants/useParticipants';
import useDominantSpeaker from '../useDominantSpeaker/useDominantSpeaker';

export default function useIsDominantSpeaker(playerId: string): boolean {
  const participants = useParticipants();
  const dominantSpeaker = useDominantSpeaker();
  const { room: { localParticipant, state } } = useVideoContext();

  const participant = useMemo(() => participants.find(
    (p) => p.identity.indexOf(playerId) >= 0
  ), [participants, playerId]);

  const isRemoteSpeaker =
    dominantSpeaker &&
    dominantSpeaker.sid === participant?.sid;
  const isLocalSpeaker =
    dominantSpeaker &&
    !participant &&
    localParticipant?.identity.indexOf(playerId) >= 0 &&
    dominantSpeaker.sid === localParticipant?.sid;

  return state === "connected" && (isRemoteSpeaker || isLocalSpeaker);
}
