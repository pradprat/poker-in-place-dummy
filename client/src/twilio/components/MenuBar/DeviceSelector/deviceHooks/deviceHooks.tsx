import { useState, useEffect, useCallback } from "react";
import { ensureMediaPermissions } from "../../../../utils";
import useAVConfirmDialog from "../../../../../components/AVConfirmDialog/useAVConfirmDialog";

let forceAcceptResolve: any;
const forceAcceptPromise = new Promise((resolve) => {
  forceAcceptResolve = resolve;
});

export function useDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const { confirm, cancelConfirm, setError } = useAVConfirmDialog();

  const forceAcceptPermissions = useCallback(() => {
    cancelConfirm();
    forceAcceptResolve();
  }, [cancelConfirm]);

  useEffect(() => {
    const getDevices = () =>
      ensureMediaPermissions(
        confirm,
        cancelConfirm,
        setError,
        forceAcceptPromise
      )
        .then(
          (allowed) =>
            allowed &&
            navigator.mediaDevices.enumerateDevices().then((devices) => {
              setDevices(devices);
            })
        )
        .catch((error) => {
          alert(
            `There was an error loading audio/video. Please confirm that your browser is not blocking the microphone and camera.`
          );
        });
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener("devicechange", getDevices);
    }

    getDevices();

    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener("devicechange", getDevices);
      }
    };
  }, [confirm, cancelConfirm, setError]);

  return { devices, forceAcceptPermissions };
}

export function useAudioInputDevices() {
  const { devices } = useDevices();
  return devices.filter((device) => device.kind === "audioinput");
}

export function useVideoInputDevices() {
  const { devices } = useDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

export function useAudioOutputDevices() {
  const { devices } = useDevices();
  return devices.filter((device) => device.kind === "audiooutput");
}

export function useHasAudioInputDevices() {
  const audioDevices = useAudioInputDevices();
  return audioDevices.length > 0;
}

export function useHasVideoInputDevices() {
  const videoDevices = useVideoInputDevices();
  return videoDevices.length > 0;
}
