import React, { memo, FunctionComponent } from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
} from "@material-ui/core";

import { useAppState } from "../../../../../twilio/state";

const PlayNowBtn: FunctionComponent = () => {
  const { user } = useAppState();
  const history = useHistory();

  const createGame = () => {
    history.push("/create");
  };

  return (
    <>
      {user && (
        <Button
          className="btn"
          variant="contained"
          color="secondary"
          onClick={createGame}
          size="large"
          fullWidth
          data-pup="create-new-game"
        >
          Play Now
        </Button>
      )}
      {!user && (
        <Button
          className="btn"
          variant="contained"
          color="secondary"
          href="/login"
          size="large"
          fullWidth
          data-pup="login"
        >
          Log In Now
        </Button>
      )}
    </>
  )
}

export default memo(PlayNowBtn);