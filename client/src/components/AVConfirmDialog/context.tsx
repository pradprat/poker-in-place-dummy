import React from "react";

const AVConfirmDialogContext = React.createContext({
  confirm: null,
  cancelConfirm: null,
  setError: null,
});

export default AVConfirmDialogContext;
