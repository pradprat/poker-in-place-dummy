import React, { memo } from "react";
import clsx from "clsx";

import useRoomState from "../../../twilio/hooks/useRoomState/useRoomState";

import ToggleAudioButton from "./components/ToggleAudioButton";
import ToggleVideoButton from "./components/ToggleVideoButton";

import "./styles.css";

const AudioVideoControls = (): JSX.Element => {
  const roomState = useRoomState();

  const isRoomConnected = roomState !== "disconnected";
  const isReconnecting = roomState === "reconnecting";
  const showControls = isRoomConnected;

  return (
    <div className={clsx("audio-video-container", { showControls })}>
      {isRoomConnected && (
        <>
          <ToggleAudioButton className="btn btn__left" activeClassName="btn--active" disabled={isReconnecting} />
          <ToggleVideoButton className="btn btn__right" activeClassName="btn--active" disabled={isReconnecting} />
        </>
      )}
    </div>
  );
}

export default memo(AudioVideoControls);