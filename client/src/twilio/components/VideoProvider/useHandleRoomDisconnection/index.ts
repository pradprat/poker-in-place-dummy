import { Room, TwilioError } from 'twilio-video';
import { useEffect } from 'react';

import { Callback } from '../../../types';

export default function useHandleRoomDisconnectionErrors(room: Room, onDisconnected: Callback) {
  useEffect(() => {
    room.on('disconnected', onDisconnected);
    return () => {
      room.off('disconnected', onDisconnected);
    };
  }, [room, onDisconnected]);
}
