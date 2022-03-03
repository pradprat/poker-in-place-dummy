import React, { useState, useCallback } from "react";

import DialogContext from "./DialogContext";
import AlertDialog from "./components/AlertDialog";
import ConfirmDialog from "./components/ConfirmDialog";
import PromptDialog from "./components/PromptDialog";

function DialogProvider({ children }: { children: React.ReactNode[] }) {
  const [alertDialog, setAlertDialog] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);

  const handleAlertDialogClose = (value: string) => {
    setAlertDialog({ ...alertDialog, open: false });
    return alertDialog.resolve(value);
  };

  const handleConfirmDialogClose = (value: string) => {
    setConfirmDialog({ ...confirmDialog, open: false });
    return value ? confirmDialog.resolve(value) : confirmDialog.reject();
  };

  const handlePromptDialogClose = (value: string) => {
    setPromptDialog({ ...promptDialog, open: false });
    return value !== null ? promptDialog.resolve(value) : promptDialog.reject();
  };

  const handleExited = () => {
    setAlertDialog(null);
    setConfirmDialog(null);
    setPromptDialog(null);
  };

  const alert = useCallback(
    (options: any) => typeof options === "string"
      ? new Promise((resolve, reject) => {
        setAlertDialog({ message: options, resolve, reject, open: true });
      })
      : new Promise((resolve, reject) => {
        setAlertDialog({ ...options, resolve, reject, open: true });
      }),
    [setAlertDialog]
  );

  const confirm = useCallback(
    (options: any) => typeof options === "string"
      ? new Promise((resolve, reject) => {
        setConfirmDialog({ message: options, resolve, reject, open: true });
      })
      : new Promise((resolve, reject) => {
        setConfirmDialog({ ...options, resolve, reject, open: true });
      }),
    [setConfirmDialog]
  );

  const prompt = useCallback(
    (options: any) => typeof options === "string"
      ? new Promise((resolve, reject) => {
        setPromptDialog({ message: options, resolve, reject, open: true });
      })
      : new Promise((resolve, reject) => {
        setPromptDialog({ ...options, resolve, reject, open: true });
      }),
    [setPromptDialog]
  );

  const dialog = {
    alert,
    confirm,
    prompt,
  };

  return (
    <DialogContext.Provider value={{ dialog }}>
      {children}
      {alertDialog && (
        <AlertDialog
          {...alertDialog}
          open={alertDialog.open}
          onClose={handleAlertDialogClose}
          onExited={handleExited}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          open={confirmDialog.open}
          onClose={handleConfirmDialogClose}
          onExited={handleExited}
        />
      )}
      {promptDialog && (
        <PromptDialog
          {...promptDialog}
          open={promptDialog.open}
          onClose={handlePromptDialogClose}
          onExited={handleExited}
        />
      )}
    </DialogContext.Provider>
  );
}

export default DialogProvider;
