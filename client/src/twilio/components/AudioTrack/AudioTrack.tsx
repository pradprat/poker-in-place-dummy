import { useEffect, useRef } from "react";
import { AudioTrack as IAudioTrack } from "twilio-video";
import { useAppState } from "../../state";

interface AudioTrackProps {
  track: IAudioTrack;
  volume?: number;
}

export default function AudioTrack({ track, volume }: AudioTrackProps): any {
  const { activeSinkId } = useAppState();
  const audioEl = useRef<HTMLAudioElement>();

  useEffect(() => {
    audioEl.current = track.attach();
    if (audioEl.current) {
      audioEl.current.setAttribute("data-cy-audio-track-name", track.name);
      audioEl.current.volume = volume !== undefined ? volume : 1;
      document.body.appendChild(audioEl.current);
    }
    return () => track.detach().forEach((el) => {
      // Mute it before removing
      el.volume = 0;
      el.remove();
    });
  }, [track]);

  useEffect(() => {
    audioEl.current?.setSinkId?.(activeSinkId);
  }, [activeSinkId]);

  return null;
}
