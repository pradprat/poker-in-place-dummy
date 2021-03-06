import React, { ReactElement } from "react";
import PropTypes from "prop-types";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";

import "./AVConfirmDialog.css";

interface IProps {
  open: boolean;
  onClose: { (val: boolean): void };
  onExited: { (): void };
  title: string;
  message: string;
  ok: { color: any; variant: any; startIcon: any; endIcon: any; text: string };
}

const AVConfirmDialog = (props: IProps): ReactElement => {
  const { open, onClose, title, message, ok } = props;

  return (
    <Dialog
      fullWidth
      open={open}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      className="avconfirm-dialog"
      hideBackdrop
      disableScrollLock
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {typeof message === "string" ? (
          <DialogContentText id="confirm-dialog-message">
            {message}
          </DialogContentText>
        ) : (
          message
        )}
      </DialogContent>
      <DialogActions>
        {/* <Button
          onClick={() => onClose(false)}
          color={cancel.color}
          variant={cancel.variant}
          startIcon={cancel.startIcon}
          endIcon={cancel.endIcon}
        >
          {cancel.text}
        </Button> */}
        <Button
          onClick={() => onClose(true)}
          color={ok.color}
          variant={ok.variant}
          startIcon={ok.startIcon}
          endIcon={ok.endIcon}
          autoFocus
        >
          {ok.text}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// TODO: move to interface
AVConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExited: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.node,
  ok: PropTypes.shape({
    text: PropTypes.string,
    color: PropTypes.string,
    variant: PropTypes.string,
    startIcon: PropTypes.element,
    endIcon: PropTypes.element,
  }),
  cancel: PropTypes.shape({
    text: PropTypes.string,
    color: PropTypes.string,
    variant: PropTypes.string,
    startIcon: PropTypes.element,
    endIcon: PropTypes.element,
  }),
};

AVConfirmDialog.defaultProps = {
  open: false,
  title: "",
  ok: {
    text: "Allow",
    color: "primary",
    variant: "contained",
  },
  cancel: {
    text: "Cancel",
    color: "secondary",
    variant: "contained",
    disabled: true,
  },
};

export default AVConfirmDialog;
