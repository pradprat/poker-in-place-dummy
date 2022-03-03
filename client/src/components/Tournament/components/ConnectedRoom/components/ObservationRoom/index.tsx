import React from "react";
import { styled } from "@material-ui/core/styles";

import ParticipantStrip from "../../../../../../twilio/components/ParticipantStrip/ParticipantStrip";
import MainParticipant from "../../../../../../twilio/components/MainParticipant/MainParticipant";
import { ITournamentDetails } from "../../../../../../engine/types";

const Container = styled("div")(({ theme }) => ({
  position: "relative",
  height: "100%",
  display: "grid",
  flex: 1,
  gridTemplateColumns: `${theme.sidebarWidth}px 1fr`,
  gridTemplateAreas: "\". participantList\"",
  gridTemplateRows: "100%",
  [theme.breakpoints.down("xs")]: {
    gridTemplateAreas: "\"participantList\" \".\"",
    gridTemplateColumns: "auto",
    gridTemplateRows: `calc(100% - ${theme.sidebarMobileHeight + 12}px) ${
      theme.sidebarMobileHeight + 6
    }px`,
    gridGap: "6px",
  },
  "& > iframe": {
    flex: 1,
    width: "100%",
    height: "100%",
  },
}));

export default function ObservationRoom({
  tournament,
}: {
  tournament: ITournamentDetails;
}) {
  return (
    <Container>
      <ParticipantStrip />
      {tournament.overflowRoomUrl ? (
        <iframe src={tournament.overflowRoomUrl} title="Room" />
      ) : (
        <MainParticipant />
      )}
    </Container>
  );
}
