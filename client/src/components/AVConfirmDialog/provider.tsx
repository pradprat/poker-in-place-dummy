import React from "react";
import Button from "@material-ui/core/Button";

import DialogContext from "./context";

import AVConfirmDialog from "./index";

class DialogProvider extends React.PureComponent {
  // eslint-disable-next-line react/state-in-constructor
  state: { confirmDialog: any; error: any } = {
    confirmDialog: null,
    error: null,
  };

  handleConfirmDialogClose = (value: any) => {
    const { confirmDialog } = this.state;
    this.setState({ confirmDialog: { ...confirmDialog, open: false } });
    return value ? confirmDialog.resolve(value) : confirmDialog.reject();
  };

  handleExited = () => {
    this.setState({
      confirmDialog: null,
    });
  };

  confirm = (options: any) => typeof options === "string"
    ? new Promise((resolve, reject) => {
      this.setState({
        confirmDialog: { message: options, resolve, reject, open: true },
      });
    })
    : new Promise((resolve, reject) => {
      this.setState({
        confirmDialog: { ...options, resolve, reject, open: true },
      });
    });

  cancelConfirm = () =>
    this.setState({
      confirmDialog: { open: false },
    });

  setError = (error: any) => {
    if (error) {
      this.setState({
        error: error && error.message ? error.message : error.toString(),
      });
    } else {
      this.setState({ error: null });
    }
  };

  render() {
    const { children } = this.props;
    const { confirmDialog, error } = this.state;
    const args = {
      confirm: this.confirm,
      setError: this.setError,
      cancelConfirm: this.cancelConfirm,
    };
    return (
      <DialogContext.Provider value={args}>
        {children}

        {confirmDialog && (
          <AVConfirmDialog
            {...confirmDialog}
            open={confirmDialog.open}
            onClose={this.handleConfirmDialogClose}
            onExited={this.handleExited}
          />
        )}
        {error ? (
          <div className="avconfirm-error">
            <div className="content">
              <h1>Audio/Video Error: {error}</h1>
              <div>
                <span>1. Check for disabled video in your address bar</span>
                <img src="/images/enable-video.png" alt="Enable Video" />
              </div>
              <div>
                <span>
                  2. Make sure that video/audio permissions are allowed
                </span>
                <img src="/images/allowed-video.png" alt="Allow Video" />
              </div>
              <div>
                <span>3. Click done and refresh the page</span>
              </div>
              <Button
                type="submit"
                color="secondary"
                variant="contained"
                onClick={() => this.setError(null)}
                className="button"
                size="large"
              >
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContext.Provider>
    );
  }
}

export default DialogProvider;
