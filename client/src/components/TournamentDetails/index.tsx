import React, { memo } from "react";

import { ITournamentDetails } from "../../engine/types";

import TournamentCountdown from "./components/TournamentCountdown";
import RebuyClock from "./components/RebuyClock";

import "./styles.css";

export interface ITournamentDetailsProps {
  tournament: ITournamentDetails;
}

const TournamentDetails = ({ tournament }: ITournamentDetailsProps) => {
  const shouldRenderRebuyClock = tournament.rebuysThroughRound > -1;

  return (
    <div className="tournamentdetails">
      <TournamentCountdown tournament={tournament} />
      {shouldRenderRebuyClock && <RebuyClock tournament={tournament} />}
    </div>
  );
};

export default memo(TournamentDetails);
