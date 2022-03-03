import React from "react";
import { FormControl, MenuItem, Typography, Select } from "@material-ui/core";
import LocalAudioLevelIndicator from "../LocalAudioLevelIndicator/LocalAudioLevelIndicator";
import { makeStyles } from "@material-ui/core/styles";
import { useAudioInputDevices } from "../deviceHooks/deviceHooks";
import useMediaStreamTrack from "../../../../hooks/useMediaStreamTrack/useMediaStreamTrack";
import useVideoContext from "../../../../hooks/useVideoContext/useVideoContext";
import { SELECTED_AUDIO_INPUT_KEY } from "../../../../../constants";
import { LocalAudioTrack } from "twilio-video";

const useStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
});

export default function AudioInputList({ localAudioTrack }: { localAudioTrack?: LocalAudioTrack }) {
  const classes = useStyles();
  const audioInputDevices = useAudioInputDevices();
  const {
    room: { localParticipant },
  } = useVideoContext();

  const mediaStreamTrack = useMediaStreamTrack(localAudioTrack);
  const localAudioInputDeviceId = mediaStreamTrack?.getSettings().deviceId;

  function replaceTrack(newDeviceId: string) {
    try {
      window.localStorage.setItem(SELECTED_AUDIO_INPUT_KEY, newDeviceId);
    } catch (e) { }

    localAudioTrack?.restart({ deviceId: { exact: newDeviceId } })
      .then(() => {
        localParticipant?.publishTrack(localAudioTrack, { priority: "low" });
      });
  }

  return (
    <div className={classes.container}>
      <div className="inputSelect">
        {audioInputDevices.length > 1 ? (
          <FormControl fullWidth>
            <Typography variant="h6">Audio Input:</Typography>
            <Select
              onChange={(e) => replaceTrack(e.target.value as string)}
              value={localAudioInputDeviceId || ""}
            >
              {audioInputDevices.map((device) => (
                <MenuItem value={device.deviceId} key={device.deviceId}>
                  {device.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <>
            <Typography variant="h6">Audio Input:</Typography>
            <Typography>
              {localAudioTrack?.mediaStreamTrack.label || "No Local Audio"}
            </Typography>
          </>
        )}
      </div>
      <LocalAudioLevelIndicator localAudioTrack={localAudioTrack} />
    </div>
  );
}
