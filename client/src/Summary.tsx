import React, { useState, useEffect, useCallback } from "react";
import { makeStyles, styled } from "@material-ui/core/styles";
import {
  ExpansionPanel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  Paper,
  ExpansionPanelSummary,
  Typography,
  ExpansionPanelDetails,
} from "@material-ui/core";
import { useParams } from "react-router-dom";
import firebase from "firebase";
import {
  Inbox as InboxIcon,
  ExpandMore as ExpandMoreIcon,
} from "@material-ui/icons";

import { useAppState } from "./twilio/state";
import { toCurrency } from "./engine/utils";
import { flatMap } from "./engine";
import { IGame, IHand } from "./engine/types";
import Card from "./components/Card";
import { MiscOverrides } from "./theme";
import "./Results.css";
import IURLTableIDParams from "./types/IURLTableIDParams";
import useWatchActiveTable from "./hooks/useWatchActiveTable";

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

interface ISummaryTableProps {
  game: IGame;
  hands: IHand[];
}

const useStyles = makeStyles((theme) => ({
  table: {
    width: "100%",
  },
  root: {
    width: "100%",
    overflowY: "scroll",
    maxWidth: 1000,
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  icon: {
    verticalAlign: "bottom",
    height: 20,
    width: 20,
  },
  details: {
    alignItems: "center",
    padding: 0,
  },
  column: {
    flexBasis: "33.33%",
  },
  helper: {
    borderLeft: `2px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 2),
  },
  link: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  hand: {
    flex: 1,
  },
  cards: {
    flexDirection: "row",
    display: "flex",
    marginBottom: "1em",
  },
  playerCard: {
    position: "relative",
    "&::after": {
      content: "''",
      borderBottom: "4px solid blue",
      borderBottomColor: `${theme.palette.primary.main} !important`,
      position: "absolute",
      bottom: "-15px",
      left: 0,
      right: 0,
    },
  },
  payout: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    "&:nth-child(2n+1)": {
      backgroundColor: theme.palette.background.default,
    },
    "&:nth-child(2n)": {
      // backgroundColor: theme.palette.action.disabledBackground,
    },
    padding: "2em 16px",
  },
  payoutHand: {
    textAlign: "center",
  },
  player: { flex: 1, textAlign: "center" },
  activeCard: {
    position: "relative",
    marginRight: "0.5rem",
    marginTop: "-1rem",
    boxShadow: `0px 0px 3px 3px ${theme.palette.secondary.main}`,
  },
  passiveCard: {
    marginRight: "0.5rem",
    opacity: 0.35,
  },
  panel: {
    "&.Mui-expanded": {
      margin: "1px 0",
    },
  },
}));

export function SummaryTable(props: ISummaryTableProps) {
  const classes = useStyles();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setSize(node.getBoundingClientRect());
    }
  }, []);

  return (
    <div className={classes.root} ref={measuredRef}>
      {props.hands
        .filter((hand) => hand.payoutsApplied)
        .map((hand, index) => (
          <ExpansionPanel
            className={classes.panel}
            defaultExpanded={index === 0}
          >
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1c-content"
              id="panel1c-header"
            >
              <div className={classes.column}>
                <Typography className={classes.heading}>
                  {new Date(parseInt(hand.id)).toLocaleTimeString()}
                </Typography>
              </div>
              <div className={classes.column}>
                <Typography className={classes.secondaryHeading}>
                  {hand.payouts
                    .filter((p) => p.amount >= 0 && props.game.players[p.uid])
                    .map((p) => (
                      <div>
                        {props.game.players[p.uid].name} ($
                        {toCurrency(p.amount)})
                      </div>
                    ))}
                </Typography>
              </div>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.details}>
              <div style={{ flex: 1 }} className={classes.hand}>
                {hand.payouts
                  .filter((p) => props.game.players[p.uid])
                  .map((payout) => (
                    <div className={classes.payout}>
                      <div className={classes.payoutHand}>
                        <div className={classes.cards}>
                          {[
                            ...payout.cards,
                            ...flatMap(hand.rounds, (round) => round.cards),
                          ].map((hc) => {
                            const isHandCard =
                              payout.handCards.indexOf(hc) >= 0;
                            const isPlayerCard =
                              payout.cards.indexOf(hc) >= 0;
                            const style = isHandCard
                              ? classes.activeCard
                              : classes.passiveCard;
                            const playerStyle = isPlayerCard
                              ? classes.playerCard
                              : null;
                            return (
                              <Card
                                height={`${size.width / 10}px`}
                                visible
                                card={hc}
                                className={`${style} ${playerStyle}`}
                              />
                            );
                          })}
                        </div>
                        <Typography variant="body2">
                          {payout.handDescription}
                        </Typography>
                      </div>
                      <div className={classes.player}>
                        <Typography variant="h6">
                          {props.game.players[payout.uid].name} ($
                          {toCurrency(payout.amount)})
                        </Typography>
                      </div>
                    </div>
                  ))}
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        ))}
    </div>
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
          {props.hands.map((hand) => (
            <>
              <TableRow key={hand.id} />
              {hand.payouts.map((payout) => (
                <TableRow key={`${hand.id}-payouts`}>
                  <TableCell component="th" scope="row">
                    {new Date(parseInt(hand.id)).toLocaleTimeString()} -{" "}
                    {JSON.stringify(payout)}
                  </TableCell>
                  <TableCell align="center">
                    <div style={{ flexDirection: "row", display: "flex" }}>
                      {payout.handCards.map((hc) => {
                        const isPlayerCard = payout.cards.indexOf(hc) >= 0;
                        const style = isPlayerCard
                          ? {
                            marginRight: "0.5rem",
                            marginTop: "-0.5rem",
                            boxShadow: "0px 0px 3px 3px #a8326b",
                          }
                          : { marginRight: "0.5rem" };
                        return (
                          <Card
                            height="3rem"
                            visible
                            card={hc}
                            style={style}
                          />
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    {/* ${toCurrency(row.contributed)} */}
                  </TableCell>
                  <TableCell align="center">--</TableCell>
                  <TableCell align="center">--</TableCell>
                  <TableCell component="th" scope="row" align="right">
                    --
                  </TableCell>
                </TableRow>
              ))}
            </>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface IWrappedSummaryTableProps {
  gameId: string;
}

export function WrappedSummaryTable({ gameId }: IWrappedSummaryTableProps): JSX.Element {
  const [hands, setHands] = useState<IHand[]>([]);

  const table = useWatchActiveTable(gameId);

  useEffect(() => {
    if (gameId) {
      const handDocs = firebase
        .firestore()
        .collection("tables")
        .doc(gameId)
        .collection("hands")
        .orderBy("id", "desc");

      const unwatchHands = handDocs.onSnapshot((handsSnapshot) => {
        setHands(handsSnapshot.docs.map((doc) => doc.data() as IHand));
      });

      return (): void => unwatchHands();
    }
    return (): void => { };
  }, [gameId]);

  return <SummaryTable game={table} hands={hands} />;
}

function App() {
  const { user } = useAppState();
  const { URLTableID } = useParams<IURLTableIDParams>();

  const tableId: string = URLTableID || "";
  const [table, setTable] = useState<IGame>(null);
  const [hands, setHands] = useState<IHand[]>([]);

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
      {/* <Header
        title={table ? `${table!.name}` : "Loading..."}
        renderVideoControls
        drawerItems={drawerItems}
      /> */}
      <div className="results-container">
        {!table && <div>Loading...</div>}
        {table && <SummaryTable game={table} hands={hands} />}
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
    </Container>
  );
}

export default App;
//
