import React, { memo } from "react";
import FlipMove from "react-flip-move";
import {
  Card,
  CardContent,
  Typography,
  Link,
} from "@material-ui/core";

import { ITournamentDetails, TournamentStatus, GameType } from "../../../../engine/types";
import { toCurrency } from "../../../../engine/utils";
import { calculateRankingRows } from "../../../../Results";

interface IResultsProps {
  tournament: ITournamentDetails;
}

const Results = ({ tournament }: IResultsProps): JSX.Element => {
  const rows = calculateRankingRows(
    Object.values(tournament.players).filter(
      ({ bustedTimestamp, removed }) => bustedTimestamp || !removed
    ),
    [],
    tournament
  );

  return (
    <div className="tournament-results-container">
      <Typography variant="h4">
        Tournament{" "}
        {tournament.status === TournamentStatus.Ended ||
          tournament.status === TournamentStatus.Finalized
          ? "Results"
          : "Leaderboard"}
      </Typography>
      <div className="results">
        <Card className="result" key="header">
          <CardContent>
            <div>#</div>
            <div>Stack</div>
            <div>Player Name</div>
            <div>Busted Time</div>
            <div>Table</div>
            {tournament.type === GameType.Tournament && (
              <div>Payments</div>
            )}
          </CardContent>
        </Card>
        <FlipMove>
          {rows.map((row) => (
            <Card className="result" key={row.player.id}>
              <CardContent>
                <div>#{row.rank + 1}</div>
                <div>{(row.stack || 0).toLocaleString()}</div>
                <div>
                  <Typography variant="subtitle1">{row.player.name}</Typography>
                </div>
                <div>
                  {row.player.bustedTimestamp
                    ? new Date(row.player.bustedTimestamp).toLocaleTimeString()
                    : ""}
                </div>
                <div>
                  #
                  {tournament.tableIdentifiers
                    ? Object.values(tournament.tableIdentifiers)
                      .sort((t1, t2) => t1.name.localeCompare(t2.name))
                      .findIndex(
                        (t) =>
                          t.id ===
                          tournament.players[row.player.id].tableId
                      )
                    : 0 + 1}
                </div>
                {tournament.type === GameType.Tournament && (
                  <div>
                    {row.payments?.length && row.payments.map((p) => (
                      <div key={p.to.id}>
                        <Link
                          href={`https://www.paypal.com/cgi-bin/webscr?&cmd=_donations&business=${encodeURIComponent(
                            p.to.email
                          )}&currency_code=USD&amount=${p.amount}&item_name=${encodeURIComponent(
                            "Poker winnings"
                          )}`}
                          variant="subtitle2"
                          target="_blank"
                        >
                          ${toCurrency(p.amount)} to {p.to.name}
                        </Link>
                      </div>
                    ))}
                    {!row.payments?.length && (
                      <div>-</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </FlipMove>
      </div>
    </div>
  );
};

export default memo(Results);