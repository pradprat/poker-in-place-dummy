import React, { useState } from "react";
import { styled } from "@material-ui/core/styles";
import { useParams } from "react-router-dom";

import { useAppState } from "./twilio/state";
import "./Meeting.css";
import InitZoom from "./Zoom";

const Container = styled("div")({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  overflow: "scroll",
});

const FullPage = styled("div")({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflow: "hidden",
  position: "relative",
});

function Meeting() {
  const { user, setError } = useAppState();
  // @ts-ignore
  const { number, password } = useParams();

  React.useEffect(() => {
    if (number && password) {
      InitZoom({ number, password, email: user.email, userName: user.displayName });
    }
  }, [number, password]);

  return (
    <Container className="home">
      <FullPage>
        Loading...
      </FullPage>
    </Container>
  );
}

export default Meeting;
