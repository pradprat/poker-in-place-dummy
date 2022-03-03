import React from "react";

export default React.createContext({
  dialog: {
    confirm: null,
    alert: null,
    prompt: null,
  },
});
