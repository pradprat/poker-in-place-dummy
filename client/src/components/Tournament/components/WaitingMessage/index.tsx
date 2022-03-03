import React, { memo } from "react";
import {
  makeStyles,
  createStyles,
  Theme,
} from "@material-ui/core";

interface IWaitingMessageProps {
  message: string;
  position?: "top" | "bottom";
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    headerMessage: {
      backgroundColor: theme.palette.secondary.main,
    },
  })
);

const WaitingMessage = ({ message, position = "top" }: IWaitingMessageProps): JSX.Element => {
  const classes = useStyles();

  if (!message) {
    return null;
  }

  return (
    <div className={`header-message ${classes.headerMessage} ${position}`}>{message}</div>
  );
};

export default memo(WaitingMessage);