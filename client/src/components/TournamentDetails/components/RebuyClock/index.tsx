import React, { useEffect, useState, memo } from "react";

import { ITournamentDetails } from "../../../../engine/types";
import { formatTimeRemaining } from "../../../../utils/formatTimeRemaining";

const RebuyClock = ({ tournament }: { tournament: ITournamentDetails }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const firstRoundStartTime = tournament.rounds[0].timestamp;

  useEffect(() => {
    const interval = setInterval(() => {
      const pauseDuration = tournament.pauseStartTimestamp
        ? new Date().getTime() - tournament.pauseStartTimestamp
        : 0;

      const endTime =
        firstRoundStartTime +
        (tournament.roundInterval * 60 * 1000 * (tournament.rebuysThroughRound + 1)) +
        pauseDuration;

      const remaining = endTime - new Date().getTime();

      setTimeRemaining(remaining > 0 ? endTime - new Date().getTime() : 0);
    }, 250);
    return () => clearInterval(interval);
  }, [tournament]);

  if (!timeRemaining) {
    return (
      <div className="rebuy-clock">
        <span>
          Rebuy time ended
        </span>
      </div>
    );
  }

  return (
    <div className="rebuy-clock">
      <span>Rebuy is available for: </span>
      <span>{formatTimeRemaining(timeRemaining)}</span>
    </div>
  );
};

export default memo(RebuyClock);
