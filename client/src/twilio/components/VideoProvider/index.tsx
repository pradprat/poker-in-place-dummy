import React, { createContext, ReactNode } from "react";
import {
  CreateLocalTrackOptions,
  ConnectOptions,
  LocalAudioTrack,
  LocalVideoTrack,
  SuperRoom,
  TwilioError,
} from "twilio-video";
import { ErrorCallback } from "../../types";
import { SelectedParticipantProvider } from "./useSelectedParticipant/useSelectedParticipant";

import AttachVisibilityHandler from "./AttachVisibilityHandler/AttachVisibilityHandler";
import useHandleRoomDisconnectionErrors from "./useHandleRoomDisconnectionErrors/useHandleRoomDisconnectionErrors";
import useHandleTrackPublicationFailed from "./useHandleTrackPublicationFailed/useHandleTrackPublicationFailed";
import useLocalTracks from "./useLocalTracks/useLocalTracks";
import useRoom from "./useRoom/useRoom";
import useHandleRoomDisconnection from "./useHandleRoomDisconnection";

/*
 *  The hooks used by the VideoProvider component are different than the hooks found in the 'hooks/' directory. The hooks
 *  in the 'hooks/' directory can be used anywhere in a video application, and they can be used any number of times.
 *  the hooks in the 'VideoProvider/' directory are intended to be used by the VideoProvider component only. Using these hooks
 *  elsewhere in the application may cause problems as these hooks should not be used more than once in an application.
 */

export interface IVideoContext {
  room: SuperRoom;
  localTracks: (LocalAudioTrack | LocalVideoTrack)[];
  isConnecting: boolean;
  connect: (
    token: string,
    options?: { disableAudioProduce?: boolean, disableVideoProduce?: boolean }
  ) => Promise<void>;
  onError: ErrorCallback;
  getLocalVideoTrack: (
    newOptions?: CreateLocalTrackOptions
  ) => Promise<LocalVideoTrack>;
  getLocalAudioTrack: (deviceId?: string) => Promise<LocalAudioTrack>;
  isAcquiringLocalTracks: boolean;
  removeLocalVideoTrack: () => void;
  removeLocalAudioTrack: () => void;
  getAudioAndVideoTracks: () => Promise<void>;
}

export const VideoContext = createContext<IVideoContext>(null!);

interface VideoProviderProps {
  options?: ConnectOptions;
  onError: ErrorCallback;
  children: ReactNode;
}

export function VideoProvider({
  options,
  children,
  onError = () => { },
}: VideoProviderProps) {
  const onErrorCallback = (error: TwilioError) => {
    console.log(`ERROR: ${error.message}`, error);
    onError(error);
  };

  const {
    localTracks,
    getLocalVideoTrack,
    getLocalAudioTrack,
    removeLocalAudioTrack,
    isAcquiringLocalTracks,
    removeLocalVideoTrack,
    getAudioAndVideoTracks,
  } = useLocalTracks();

  const onDisconnect = (): void => {
    removeLocalAudioTrack();
    removeLocalVideoTrack();
  }

  const { room, isConnecting, connect } = useRoom(
    localTracks,
    onErrorCallback,
    options
  );

  // Register onError and onDisconnect callback functions.
  useHandleRoomDisconnectionErrors(room, onError);
  useHandleRoomDisconnection(room, onDisconnect);
  useHandleTrackPublicationFailed(room, onError);

  return (
    <VideoContext.Provider
      value={{
        room,
        localTracks,
        isConnecting,
        onError: onErrorCallback,
        getLocalVideoTrack,
        getLocalAudioTrack,
        connect,
        isAcquiringLocalTracks,
        removeLocalVideoTrack,
        removeLocalAudioTrack,
        getAudioAndVideoTracks,
      }}
    >
      <SelectedParticipantProvider room={room}>
        {children}
      </SelectedParticipantProvider>
      {/*
        The AttachVisibilityHandler component is using the useLocalVideoToggle hook
        which must be used within the VideoContext Provider.
      */}
      <AttachVisibilityHandler />
    </VideoContext.Provider>
  );
}
