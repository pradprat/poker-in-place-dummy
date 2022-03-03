import { VIDEO_AUDIO_PERMISSIONS_GRANTED } from "../constants";
export const isMobile = (() => {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.userAgent !== "string"
  ) {
    return false;
  }
  return /Mobile/.test(navigator.userAgent);
})();

const gotMediaPermissionsPromise = new Promise((resolve, reject) => {
  let interval = setInterval(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          return devices.every((device) => !(device.deviceId && device.label));
        })
        .then((shouldAskForMediaPermissions) => {
          if (!shouldAskForMediaPermissions) {
            clearInterval(interval);
            resolve(true);
          }
        });
      // .catch(reject);
    }
  }, 250);
});

// This function ensures that the user has granted the browser permission to use audio and video
// devices. If permission has not been granted, it will cause the browser to ask for permission
// for audio and video at the same time (as opposed to separate requests).
export function ensureMediaPermissions(
  confirm: any,
  cancelConfirm: any,
  setError: any,
  forceAcceptPermissions?: any
) {
  if (!navigator.mediaDevices) {
    if (!window.mediaNotAvailableAlertShown) {
      window.mediaNotAvailableAlertShown = true;
      setTimeout(() => {
        alert(
          `This browser unfortunately doesn't support video. Please try Chrome on desktops, Safari on iOS, and Chrome on Android.`
        );
      }, 5000);
    }
    return Promise.resolve(false);
  }
  let hasPromptedBefore = false;
  try {
    hasPromptedBefore = !!window.localStorage.getItem(
      VIDEO_AUDIO_PERMISSIONS_GRANTED
    );
  } catch (e) {}
  const hasPromptedBeforePromise = hasPromptedBefore
    ? Promise.resolve(true)
    : gotMediaPermissionsPromise;
  console.debug("Enumerating media devices");
  return navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      console.debug("Enumerated media devices");
      return devices.every((device) => !(device.deviceId && device.label));
    })
    .then((shouldAskForMediaPermissions) => {
      if (shouldAskForMediaPermissions) {
        return Promise.race([
          confirm(
            `${document.title} needs access to your camera and microphone to function.`
          ),
          forceAcceptPermissions || gotMediaPermissionsPromise,
          hasPromptedBeforePromise,
        ]).then(() => {
          cancelConfirm();
          window.localStorage.setItem(VIDEO_AUDIO_PERMISSIONS_GRANTED, "true");
          console.debug("Requesting media devices");
          return navigator.mediaDevices
            .getUserMedia({ audio: true, video: true })
            .then((mediaStream) => {
              console.debug("Requested media devices");
              mediaStream.getTracks().forEach((track) => track.stop());
              return true;
            })
            .catch((err) => {
              console.error("Error requesting media devices", err);
              setError(err);
            });
        });
      }
      return true;
    })
    .catch((err) => {
      console.error("Error requesting media devices", err);
      setError(err);
    });
}
