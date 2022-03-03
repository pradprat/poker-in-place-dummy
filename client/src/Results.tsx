/* eslint-disable no-restricted-syntax */
import React, { useState, useEffect } from "react";
import { groupBy } from "ramda";
import { makeStyles, styled } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import { useParams } from "react-router-dom";
import firebase from "firebase";
import { Inbox as InboxIcon } from "@material-ui/icons";

import "./Results.css";
import Header from "./components/Header";
import ReconnectingNotification from "./twilio/components/ReconnectingNotification/ReconnectingNotification";
import { useAppState } from "./twilio/state";
import { toCurrency } from "./engine/utils";
import { getPaidPlayers } from "./engine";
import {
  IGame,
  IHand,
  ActionDirective,
  IPlayer,
  ITournamentDetails,
  TournamentStatus,
} from "./engine/types";
import DonateDialog from "./components/DonateDialog";
import { MiscOverrides } from "./theme";
import IURLTableIDParams from "./types/IURLTableIDParams";
import getRankedPlayers from "./utils/getRankedPlayers";

const miscOverrides = MiscOverrides[window.location.hostname];
const title =
  miscOverrides && miscOverrides.title ? miscOverrides.title : "Poker in Place";

const Container = styled("div")({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflow: "hidden",
  overflowY: "auto",
});

interface IResultsTableProps {
  game: IGame;
  hands: IHand[];
}

const useStyles = makeStyles({
  table: {
    width: "100%",
  },
});

export function calculateRankingRows(
  players: IPlayer[],
  hands?: IHand[],
  tournament?: ITournamentDetails
) {
  const playerPayoutMap: { [key: string]: number } =
    tournament &&
      (tournament.status === TournamentStatus.Ended ||
        tournament.status === TournamentStatus.Finalized)
      ? calculatePlayerPayouts(players, tournament)
      : null;
  const playerMap = players.reduce(
    (map, p) => ({ ...map, [p.id]: p }),
    {} as { [key: string]: IPlayer }
  );

  let priorStack = -1;
  let priorRank = 0;

  const rows = getRankedPlayers({ players, tournament })
    .map((p, idx) => {
      const playerId = p.id;
      // Find any hand where the player had some sort of a bet
      const handsPlayed = hands?.filter(
        (hand) =>
          !!hand.rounds.find(
            (round) =>
              !!round.actions.find(
                (a) => a.uid === playerId && a.action !== ActionDirective.Fold
              )
          )
      );
      const handsWon = handsPlayed?.filter(
        (hand) =>
          hand.payouts.filter((p) => p.uid === playerId && p.amount > 0).length
      );

      // If we are in a tournament, we need to set the payouts

      const getPlayerWinnings = (playerId: string) => {
        if (playerPayoutMap) {
          return playerPayoutMap[playerId] || 0;
        }
        return playerMap[playerId].stack;
      };
      const winnings = getPlayerWinnings(playerId);
      const { contributed } = playerMap[playerId];

      let rank = idx;
      if (playerMap[playerId].stack === priorStack) {
        rank = priorRank;
      }
      priorRank = rank;
      priorStack = playerMap[playerId].stack;

      return {
        player: playerMap[playerId],
        handsWon: handsWon.length,
        handsPlayed: handsPlayed.length,
        stack: playerMap[playerId].stack,
        winnings,
        contributed,
        net: winnings - contributed,
        remaining: winnings - contributed,
        payments: [],
        rank,
      };
    })
    .sort((p1, p2) => p2.net - p1.net);

  // Ok let's loop over the players (outside in) and settle debts
  for (let start = 0, end = rows.length - 1; ;) {
    const top = rows[start];
    const bottom = rows[end];
    if (!top || !bottom) {
      break;
    }
    if (top.remaining === 0) {
      start++;
      continue;
    }
    if (bottom.remaining === 0) {
      end--;
      continue;
    }
    const isTopPositive = top.remaining > 0;
    const isBottomPositive = bottom.remaining > 0;
    if (isTopPositive === isBottomPositive || start >= end) {
      // We've run out of things to do
      break;
    }
    if (top.remaining > -bottom.remaining) {
      // The person getting paid is owed more than the person paying
      bottom.payments.push({
        to: top.player,
        amount: -bottom.remaining,
      });
      top.remaining += bottom.remaining;
      bottom.remaining = 0;
      end--;
      continue;
    } else {
      // The person paying has more than the person being paid
      bottom.payments.push({ to: top.player, amount: top.remaining });
      bottom.remaining += top.remaining;
      top.remaining = 0;
      start++;
      continue;
    }
  }

  return rows;
}

export function calculatePlayerPayouts(
  players: IPlayer[],
  tournament: ITournamentDetails
) {
  const playerPayoutMap: { [key: string]: number } = {};
  const playerGroups = groupBy(
    (p: IPlayer) => String(p.bustedTimestamp),
    players
  );

  // Get the timestamps
  const winnerGroupKeys = Object.keys(playerGroups).sort((bt1, bt2) =>
    bt2.localeCompare(bt1)
  );
  // Walk through the winner groups until we've run out of winner ranks
  let appliedWinnerRanks = 0;
  const totalPot = players.reduce((sum, p) => sum + p.contributed, 0);
  let potRemaining = totalPot;

  // TODO: check for loop `continue`
  for (const group of winnerGroupKeys) {
    const groupPlayers = playerGroups[group];
    const winnerRanks = tournament.winners.slice(
      appliedWinnerRanks,
      appliedWinnerRanks + groupPlayers.length
    );
    const percentOfPot = winnerRanks.reduce(
      (sum, rank) => sum + rank.percent,
      0
    );

    const totalPayout = Math.min(
      potRemaining,
      Math.ceil(percentOfPot * totalPot)
    );

    potRemaining -= totalPayout;
    appliedWinnerRanks += winnerRanks.length;

    const perPlayerPayout = Math.ceil(totalPayout / groupPlayers.length);
    let totalPayoutRemaining = totalPayout;
    for (const player of groupPlayers) {
      playerPayoutMap[player.id] = Math.min(
        totalPayoutRemaining,
        perPlayerPayout
      );
      totalPayoutRemaining -= perPlayerPayout;
    }
  }

  return playerPayoutMap;
}

export function ResultsTable(props: IResultsTableProps) {
  const classes = useStyles();
  const paidPlayers = getPaidPlayers(props.game);

  const rows = calculateRankingRows(
    paidPlayers,
    props.hands,
    props.game.tournamentDetails
  );

  return (
    <TableContainer component={Paper} className="results">
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Player</TableCell>
            <TableCell align="center">Winnings</TableCell>
            <TableCell align="center">Contribution</TableCell>
            <TableCell align="center">Hands Played</TableCell>
            <TableCell align="center">Hands Won</TableCell>
            <TableCell align="right">Settling Payments</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.player.id}>
              <TableCell component="th" scope="row">
                {row.player.name}
              </TableCell>
              <TableCell align="center">${toCurrency(row.net)}</TableCell>
              <TableCell align="center">
                ${toCurrency(row.contributed)}
              </TableCell>
              <TableCell align="center">{row.handsPlayed}</TableCell>
              <TableCell align="center">{row.handsWon}</TableCell>
              <TableCell component="th" scope="row" align="right">
                {row.payments.length ? (
                  row.payments.map((p) => (
                    <div key={p.to.id}>
                      <Link
                        href={`https://www.paypal.com/cgi-bin/webscr?&cmd=_donations&business=${encodeURIComponent(
                          p.to.email
                        )}&currency_code=USD&amount=${p.amount
                        }&item_name=${encodeURIComponent("Poker winnings")}`}
                        variant="subtitle2"
                        target="_blank"
                      >
                        Pay ${toCurrency(p.amount)} to {p.to.name}
                      </Link>
                    </div>
                  ))
                ) : (
                  <div>-</div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function Results() {
  const { user } = useAppState();
  const { URLTableID } = useParams<IURLTableIDParams>();

  const tableId: string = URLTableID || "";
  const [table, setTable] = useState<IGame>(null);
  const [hands, setHands] = useState<IHand[]>([]);
  const [showDonateDialog, setShowDonateDialog] = useState<boolean>(true);

  const drawerItems = [
    {
      title: "Leave Game",
      callback: () => {
        if (window.confirm("Are you sure you want to leave?")) {
          onLeaveGame();
        }
        return true;
      },
      icon: <InboxIcon />,
    },
  ];

  useEffect(() => {
    if (user) {
      const tableDoc = firebase
        .firestore()
        .collection("tables")
        .doc(URLTableID);
      const unwatchTable = tableDoc.onSnapshot((tableSnapshot) => {
        setTable(tableSnapshot.data() as IGame);
      });
      return () => unwatchTable();
    }
    return () => { };
  }, [user, URLTableID]);

  useEffect(() => {
    if (table) {
      const handDocs = firebase
        .firestore()
        .collection("tables")
        .doc(URLTableID)
        .collection("hands");

      const unwatchHands = handDocs.onSnapshot((handsSnapshot) => {
        setHands(handsSnapshot.docs.map((doc) => doc.data() as IHand));
      });
      return () => unwatchHands();
    }
    return () => { };
  }, [table, URLTableID]);

  const onLeaveGame = async () => {
    const endpoint = `${process.env.REACT_APP_API_ENDPOINT}/leave`;
    const params = new window.URLSearchParams({
      tableId,
    });

    const headers = new window.Headers();
    const idToken = await user!.getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
    headers.set("Domain", document.location.hostname);

    await fetch(`${endpoint}?${params}`, {
      headers,
      method: "POST",
    }).then((res) => res.json());
  };

  return (
    <Container>
      <Header
        title={table ? `${table!.name}` : "Loading..."}
        renderVideoControls
        drawerItems={drawerItems}
        mobileModeEnabled={false}
      />
      <div className="results-container">
        {!table && <div>Loading...</div>}
        <ReconnectingNotification />
        {/* Do something if people are still hanging out */}
        {table && <ResultsTable game={table} hands={hands} />}
      </div>
      <div className="feedback">
        <Link href="nick@pokerinplace.app">Send feedback</Link>
        <Link
          href={`https://www.paypal.com/cgi-bin/webscr?&cmd=_donations&business=${encodeURIComponent(
            "nbclark@gmail.com"
          )}&currency_code=USD&item_name=${encodeURIComponent(
            `${title} Donation`
          )}`}
          target="_blank"
        >
          Make Donation
        </Link>
        <Link
          className="twitter-hashtag-button"
          href={`https://twitter.com/intent/tweet?button_hashtag=pokerinplace&text=${encodeURIComponent(
            "Just finished playing online video poker with my friends at https://pokerinplace.app! #pokerinplace"
          )}`}
        >
          Tweet #pokerinplace
        </Link>
        {/* <script async src="https://platform.twitter.com/widgets.js"></script> */}
      </div>
      <DonateDialog
        open={showDonateDialog}
        onClose={() => setShowDonateDialog(false)}
        isGameOver
      />
    </Container>
  );
}

export default Results;
