import React, { memo } from "react";
import clsx from "clsx";
import Fab from "@material-ui/core/Fab";
import Tooltip from "@material-ui/core/Tooltip";
import Videocam from "@material-ui/icons/Videocam";
import VideocamOff from "@material-ui/icons/VideocamOff";

import useLocalVideoToggle from "../../../../../twilio/hooks/useLocalVideoToggle/useLocalVideoToggle";

interface IToggleVideoButtonProps {
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
}

const ToggleVideoButton = ({ disabled, className, activeClassName }: IToggleVideoButtonProps): JSX.Element => {
  const [isVideoEnabled, toggleVideoEnabled, shouldHideBtn] = useLocalVideoToggle();

  if (shouldHideBtn) {
    return null;
  }

  return (
    <Tooltip
      title={isVideoEnabled ? "Disable Video" : "Enable Video"}
      placement="top"
      PopperProps={{ disablePortal: true }}
    >
      <Fab
        className={clsx(className, { [activeClassName]: isVideoEnabled })}
        onClick={toggleVideoEnabled}
        disabled={disabled}
      >
        {isVideoEnabled ? <Videocam /> : <VideocamOff />}
      </Fab>
    </Tooltip>
  );
}

export default memo(ToggleVideoButton);