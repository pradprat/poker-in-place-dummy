import React, { useState, useEffect, memo } from "react";
import { makeStyles, createStyles, Theme } from "@material-ui/core";
import {
  AddCircleOutline as AddCircleOutlineIcon,
  AccessAlarm as AccessAlarmIcon,
} from "@material-ui/icons";

import { ITournamentDetails, IBlindRound } from "../../../../engine/types";
import { toCurrency } from "../../../../engine/utils";
import { formatTimeRemaining } from "../../../../utils/formatTimeRemaining";

export interface ITournamentCountdownProps {
  tournament: ITournamentDetails;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    countdown: {
      textShadow: "0 0 20px #32a86f, 0 0 20px rgba(10, 175, 230, 0)",
    },
  })
);

const TournamentCountdown = ({ tournament }: ITournamentCountdownProps) => {
  const classes = useStyles();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [nextRound, setNextRound] = useState<IBlindRound>(
    tournament.rounds[0]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const activeRound = tournament.rounds.find(
        (round) => round.id === tournament.activeRoundId
      );

      if (!activeRound) {
        setTimeRemaining(0);
        setNextRound(tournament.rounds[0]);
        return;
      }

      const pauseDuration = tournament.pauseStartTimestamp
        ? new Date().getTime() - tournament.pauseStartTimestamp
        : 0;

      const endTime =
        activeRound.timestamp +
        pauseDuration +
        tournament.roundInterval * 60 * 1000;

      setTimeRemaining(Math.max(0, endTime - new Date().getTime()));
      setNextRound(
        tournament.rounds.find(
          (round) => round.roundIndex === activeRound.roundIndex + 1
        ) || activeRound
      );
    }, 250);
    return () => clearInterval(interval);
  }, [tournament]);

  if (!timeRemaining) return null;

  return (
    <>
      <div className={`countdown ${classes.countdown}`}>
        <AccessAlarmIcon />
        <div>{formatTimeRemaining(timeRemaining)}</div>
      </div>
      <div className="blinds">
        <AddCircleOutlineIcon />
        <div>
          ${toCurrency(nextRound.bigBlind / 2)}/$
          {toCurrency(nextRound.bigBlind)}
        </div>
      </div>
    </>
  );
};

export default memo(TournamentCountdown);
