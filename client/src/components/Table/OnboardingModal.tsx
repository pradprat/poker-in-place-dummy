import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Modal,
  Typography,
  IconButton,
} from "@material-ui/core";
import { Close as CloseIcon } from "@material-ui/icons";

import Onboarding from "./Onboarding";

interface IProps {
  open: boolean;
  onComplete: { (): void };
}
function OnboardingModal(props: IProps) {
  const onMessage = (ev: MessageEvent) => {
    if (ev.data && ev.data.dismissOnboarding) {
      props.onComplete();
    }
  };
  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  });
  return (
    <Modal
      open={props.open}
      style={{
        backgroundColor: "black",
        width: "80vw",
        height: "80vh",
        margin: "auto",
        borderRadius: "1vw",
        overflow: "hidden",
        display: "flex",
      }}
      disablePortal
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "stretch",
          flex: 1,
        }}
      >
        <AppBar position="sticky">
          <Toolbar variant="dense">
            <Typography variant="h6" style={{ flex: 1 }}>Getting Started...</Typography>
            <IconButton
              edge="end"
              // className={classes.rightMenuButton}
              color="inherit"
              aria-label="menu"
              onClick={() => props.onComplete()}
              title="Close Onboarding"
              data-pup="close-onboarding"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <iframe
          frameBorder="0"
          src="/onboarding/embedded"
          width="100%"
          height="100%"
          title="onboarding"
        />
      </div>
    </Modal>
  );
}

export default OnboardingModal;
