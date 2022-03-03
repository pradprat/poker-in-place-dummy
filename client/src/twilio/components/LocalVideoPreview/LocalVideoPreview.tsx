import React from 'react';
import { LocalVideoTrack } from 'twilio-video';
import VideoTrack from '../VideoTrack/VideoTrack';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';

export default function LocalVideoPreview() {
  const { localTracks } = useVideoContext();

  const videoTrack = (localTracks ? localTracks.find((track) =>
    track.name.includes("camera")
  ) : null) as LocalVideoTrack;

  return videoTrack ? <VideoTrack track={videoTrack} isLocal /> : null;
}
