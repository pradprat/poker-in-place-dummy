import React, { memo } from "react";
import { createStyles, makeStyles } from "@material-ui/core/styles";

import useRoomState from "../../../twilio/hooks/useRoomState/useRoomState";

import ToggleAudioButton from "./components/ToggleAudioButton";
import ToggleVideoButton from "./components/ToggleVideoButton";

const useStyles = makeStyles(() =>
  createStyles({
    container: {
      display: "flex",
      alignItems: "center",
      position: "absolute",
      top: 0,
      right: "50%",
      transform: "translate(50%, 0)",
      bottom: "0px",
      zIndex: 9999,
    },
    audioBtn: {
      marginRight: "16px",
    }
  })
);

const HeaderControls = (): JSX.Element => {
  const classes = useStyles();
  const roomState = useRoomState();
  const isReconnecting = roomState === "reconnecting";

  return (
    <div className={classes.container}>
      {roomState !== "disconnected" && (
        <>
          <ToggleAudioButton className={classes.audioBtn} disabled={isReconnecting} />
          <ToggleVideoButton disabled={isReconnecting} />
        </>
      )}
    </div>
  );
}

export default memo(HeaderControls);