import React, { memo } from "react";
import { Typography } from "@material-ui/core";

import { ITournamentDetails } from "../../../../engine/types";
import useRoomState from "../../../../twilio/hooks/useRoomState/useRoomState";

import ObservationRoom from "./components/ObservationRoom";

interface IObservationRoomProps {
  tournament: ITournamentDetails;
}

const ConnectedRoom = ({ tournament }: IObservationRoomProps): JSX.Element => {
  // Connect to the room
  const roomState = useRoomState();
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {roomState === "connected" && (
        <ObservationRoom tournament={tournament} />
      )}
      {roomState !== "connected" && (
        <Typography variant="h2">Connecting...</Typography>
      )}
    </div>
  );
}

export default memo(ConnectedRoom);