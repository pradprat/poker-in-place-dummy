import React, { memo } from 'react';
import { LocalAudioTrack } from 'twilio-video';
import AudioLevelIndicator from '../../../AudioLevelIndicator/AudioLevelIndicator';

const LocalAudioLevelIndicator = ({ localAudioTrack }: { localAudioTrack: LocalAudioTrack }) => {
  return <AudioLevelIndicator size={30} audioTrack={localAudioTrack} />;
}

export default memo(LocalAudioLevelIndicator);
