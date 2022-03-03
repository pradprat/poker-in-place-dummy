export const DEFAULT_VIDEO_CONSTRAINTS: MediaStreamConstraints["video"] = {
  width: 640,
  height: 360,
  frameRate: 24,
};

// These are used to store the selected media devices in localStorage
export const SELECTED_AUDIO_INPUT_KEY = "PokerInPlace-selectedAudioInput";
export const SELECTED_AUDIO_OUTPUT_KEY = "PokerInPlace-selectedAudioOutput";
export const SELECTED_VIDEO_INPUT_KEY = "PokerInPlace-selectedVideoInput";
export const VIDEO_AUDIO_PERMISSIONS_GRANTED =
  "PokerInPlace-audioVideoPermissionsGranted";
