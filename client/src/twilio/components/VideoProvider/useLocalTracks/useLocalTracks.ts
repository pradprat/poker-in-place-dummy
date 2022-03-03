import {
  DEFAULT_VIDEO_CONSTRAINTS,
  SELECTED_AUDIO_INPUT_KEY,
  SELECTED_VIDEO_INPUT_KEY,
} from "../../../../constants";
import { useCallback, useState } from "react";
import Video, {
  LocalVideoTrack,
  LocalAudioTrack,
  CreateLocalTrackOptions,
} from "twilio-video";
import {
  useAudioInputDevices,
  useVideoInputDevices,
} from "../../../components/MenuBar/DeviceSelector/deviceHooks/deviceHooks";
import { ensureMediaPermissions } from "../../../utils";
import useAVConfirmDialog from "../../../../components/AVConfirmDialog/useAVConfirmDialog";

export default function useLocalTracks() {
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack>();
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack>();
  const [isAcquiringLocalTracks, setIsAcquiringLocalTracks] = useState(false);
  const { confirm, cancelConfirm, setError } = useAVConfirmDialog();

  const localAudioDevices = useAudioInputDevices();
  const localVideoDevices = useVideoInputDevices();

  const hasAudio = localAudioDevices.length > 0;
  const hasVideo = localVideoDevices.length > 0;

  const getLocalAudioTrack = useCallback((deviceId?: string) => {
    const options: CreateLocalTrackOptions = {};

    if (deviceId) {
      options.deviceId = { exact: deviceId };
    }

    return Video.createLocalAudioTrack(options).then((newTrack) => {
      setAudioTrack(newTrack);
      return newTrack;
    });
  }, []);

  const getLocalVideoTrack = useCallback(
    (newOptions?: CreateLocalTrackOptions) => {
      const options: CreateLocalTrackOptions = {
        ...(DEFAULT_VIDEO_CONSTRAINTS as {}),
        name: `camera-${Date.now()}`,
        ...newOptions,
      };

      return Video.createLocalVideoTrack(options).then((newTrack) => {
        setVideoTrack(newTrack);
        return newTrack;
      });
    },
    []
  );

  const removeLocalAudioTrack = useCallback(() => {
    if (audioTrack) {
      audioTrack.stop();
      setAudioTrack(undefined);
    }
  }, [audioTrack]);

  const removeLocalVideoTrack = useCallback(() => {
    if (videoTrack) {
      videoTrack.stop();
      setVideoTrack(undefined);
    }
  }, [videoTrack]);

  const getAudioAndVideoTracks = useCallback(() => {
    if (!hasAudio || !hasVideo) return Promise.resolve();
    if (isAcquiringLocalTracks || audioTrack || videoTrack) return Promise.resolve();

    setIsAcquiringLocalTracks(true);

    let selectedAudioDeviceId: string = null;
    let selectedVideoDeviceId: string = null;
    try {
      selectedAudioDeviceId = window.localStorage.getItem(
        SELECTED_AUDIO_INPUT_KEY
      );
      selectedVideoDeviceId = window.localStorage.getItem(
        SELECTED_VIDEO_INPUT_KEY
      );
    } catch (e) { }

    const hasSelectedAudioDevice = localAudioDevices.some(
      (device) =>
        selectedAudioDeviceId && device.deviceId === selectedAudioDeviceId
    );
    const hasSelectedVideoDevice = localVideoDevices.some(
      (device) =>
        selectedVideoDeviceId && device.deviceId === selectedVideoDeviceId
    );

    const localTrackConstraints = {
      video: hasVideo && {
        ...(DEFAULT_VIDEO_CONSTRAINTS as {}),
        name: `camera-${Date.now()}`,
        ...(hasSelectedVideoDevice && {
          deviceId: { exact: selectedVideoDeviceId! },
        }),
      },
      audio: hasSelectedAudioDevice
        ? { deviceId: { exact: selectedAudioDeviceId! } }
        : hasAudio,
    };

    return ensureMediaPermissions(confirm, cancelConfirm, setError)
      .then(() => {
        return Video.createLocalTracks(localTrackConstraints).then((tracks) => {
          const videoTrack = tracks.find((track) => track.kind === "video");
          const audioTrack = tracks.find((track) => track.kind === "audio");
          if (videoTrack) {
            setVideoTrack(videoTrack as LocalVideoTrack);
          }
          if (audioTrack) {
            setAudioTrack(audioTrack as LocalAudioTrack);
          }
        });
      })
      .finally(() => setIsAcquiringLocalTracks(false));
  }, [
    hasAudio,
    hasVideo,
    audioTrack,
    videoTrack,
    localAudioDevices,
    localVideoDevices,
    isAcquiringLocalTracks,
    cancelConfirm,
    confirm,
    setError,
  ]);

  const localTracks = [audioTrack, videoTrack].filter(
    (track) => track !== undefined
  ) as (LocalAudioTrack | LocalVideoTrack)[];

  return {
    localTracks,
    getLocalVideoTrack,
    getLocalAudioTrack,
    isAcquiringLocalTracks,
    removeLocalAudioTrack,
    removeLocalVideoTrack,
    getAudioAndVideoTracks,
  };
}
