import React, { memo } from "react";
import clsx from "clsx";
import Fab from "@material-ui/core/Fab";
import Mic from "@material-ui/icons/Mic";
import MicOff from "@material-ui/icons/MicOff";
import Tooltip from "@material-ui/core/Tooltip";

import useLocalAudioToggle from "../../../../../twilio/hooks/useLocalAudioToggle/useLocalAudioToggle";

interface IToggleAudioButtonProps {
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
}

const ToggleAudioButton = ({ disabled, className, activeClassName }: IToggleAudioButtonProps): JSX.Element => {
  const [isAudioEnabled, toggleAudioEnabled] = useLocalAudioToggle();

  return (
    <Tooltip
      title={isAudioEnabled ? "Mute Audio" : "Unmute Audio"}
      placement="top"
      PopperProps={{ disablePortal: true }}
    >
      <Fab
        className={clsx(className, { [activeClassName]: isAudioEnabled })}
        onClick={toggleAudioEnabled}
        disabled={disabled}
        data-cy-audio-toggle
      >
        {isAudioEnabled ? <Mic /> : <MicOff />}
      </Fab>
    </Tooltip>
  );
}

export default memo(ToggleAudioButton);