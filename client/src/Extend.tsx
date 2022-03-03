import React, { useState, useEffect } from "react";
import { Typography } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { useStripe } from "@stripe/react-stripe-js";

import { useAppState } from "./twilio/state";
import { callFirebaseGameFunction } from "./firebase/rest";
import IURLTableIDParams from "./types/IURLTableIDParams";

import "./Extend.css";

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

function Extend() {
  const { URLTableID } = useParams<IURLTableIDParams>();
  const stripe = useStripe();
  const [message, setMessage] = useState("Loading...");
  const { user } = useAppState();
  const [requestInFlight, setRequestInFlight] = useState(false);

  useEffect(() => {
    const queryStringParameters = getUrlVars();
    const sessionId = queryStringParameters.get("session_id");
    const action = queryStringParameters.get("action");
    if (action === "redirect" && sessionId) {
      stripe.redirectToCheckout({
        sessionId,
      });
    } else if (action === "cancel") {
      setMessage("Cancelled. You may close this window...");
    } else if (action === "success" && sessionId) {
      // Do something;
      setMessage("Extending the game duration...");
      if (!requestInFlight) {
        setRequestInFlight(true);

        callFirebaseGameFunction(
          "extend/confirm",
          { paymentSessionId: sessionId },
          () => user!.getIdToken(),
          () => null,
          URLTableID
        )
          .then((result) => {
            if (result.error) {
              setMessage(result.error);
            } else {
              setMessage(
                "Game duration extended. You may close this window..."
              );
            }
          })
          .catch((error) => {
            setMessage(`ERROR: ${error.message}`);
          });
      }
    }
  }, [URLTableID]);

  return (
    <div className="extend-root">
      <Typography variant="h2">{message}</Typography>
    </div>
  );
}

export default Extend;
