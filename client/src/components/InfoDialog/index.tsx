import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Link from "@material-ui/core/Link";

interface IProps {
  open: boolean;
  isGameOver: boolean;
  onClose: ((event: {}) => void) | undefined;
}

export default function FormDialog(props: IProps) {
  const onClose = (ev: {}) => {
    if (props.onClose) {
      props.onClose(ev);
    }
  };
  return (
    <Dialog
      open={props.open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">Getting Started</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <div>
            Hang out here while you wait for everyone to join. You can send the
            URL in the address bar to anyone who did not receive the email
            invite (email provider hasn't been great lately). Once you're ready
            to start video chatting, click the button in the bottom right. When
            you're ready to start the game, click "Start Playing".
          </div>
          <br />
          <br />
          <div>Enjoy!</div>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
}
