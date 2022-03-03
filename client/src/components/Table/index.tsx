import React, { useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import {
  Button,
  Fab,
  makeStyles,
  createStyles,
  Theme,
  Backdrop,
} from "@material-ui/core";
import { ChevronRight } from "@material-ui/icons";
import ObjectHash from "object-hash";

import { useDialog } from "../muibox";
import Deck from "../Deck";
import Seat from "../Seat";
import {
  IPlayerState,
  IPocketPosition,
  IPlayer,
  IGame,
  IAction,
  IHand,
  HandRound,
  ActionDirective,
  GameType,
} from "../../engine/types";
import { MiscOverrides } from "../../theme";
import useMockingContext from "../../twilio/hooks/useMockingContext/useMockingContext";
import { toCurrency } from "../../engine/utils";
import "./Table.css";
import ActionsMenu from "../ActionsMenu";
import {
  isPlayerActive,
  calculatePlayerBalance,
  calculatePlayerRoundMaximum,
  calculateRoundContributions,
  calculateHandContributions,
  calculateTotalHandContributions,
  getTabledPlayers,
  getBestAction,
  flatMap,
  canRebuy,
  calculateFutureOptions,
} from "../../engine";
import useGameType from "../../hooks/useGameType";
import useWhispers from "../../twilio/hooks/useWhispers/useWhispers";
import useStructuredMessages from "../../twilio/hooks/useStructuredMessages/useStructuredMessages";
import { formatTimeRemaining } from "../../utils/formatTimeRemaining";
import { IOnShowCardsParams } from "../Tournament/interface";

import ObserversGallery from "./ObserversGallery";
import FeaturedGallery from "./FeaturedGallery";

const configurations = [
  ["p1"], // 1 player
  ["p1", "p2"], // 2 player
  ["p1", "p3", "p2"], // 3 player
  ["p1", "p3", "p2", "p4"], // 4 player
  ["p1", "p5", "p3", "p2", "p4"], // 5 player
  ["p1", "p5", "p3", "p2", "p6", "p4"], // 6 player
  ["p1", "p5", "p3", "p8", "p2", "p6", "p4"], // 7 player
  ["p1", "p5", "p3", "p8", "p2", "p6", "p4", "p7"], // 8 player
  ["p1", "p5", "p9", "p3", "p8", "p2", "p6", "p4", "p7"], // 9 player
  ["p1", "p5", "p9", "p3", "p8", "p2", "p6", "p10", "p4", "p7"], // 10 player
  ["p1", "p5", "p9", "p3", "p9", "p8", "p2", "p6", "p10", "p4", "p7"], // 11 player
  ["p1", "p5", "p9", "p3", "p9", "p8", "p2", "p6", "p10", "p4", "p11", "p7"], // 12 player
];

function getTitleFromAction(game: IGame, action: IAction) {
  const playerName = game.players[action.uid]
    ? game.players[action.uid].name
    : "";
  if (action.allIn && action.total)
    return `${playerName} went ALL-IN to $${toCurrency(action.total)}`;
  if (action.action === ActionDirective.Bet && !action.voluntary)
    return `${playerName} POSTED SMALL BLIND of $${toCurrency(
      action.contribution
    )}`;
  if (action.action === ActionDirective.Raise && !action.voluntary)
    return `${playerName} POSTED BIG BLIND of $${toCurrency(
      action.contribution
    )}`;
  if (action.action === ActionDirective.Bet)
    return `${playerName} BET $${toCurrency(action.total)}`;
  if (action.action === ActionDirective.Raise)
    return `${playerName} RAISED to $${toCurrency(action.total)}`;
  if (action.action === ActionDirective.Call)
    return `${playerName} CALLED $${toCurrency(action.total)}`;
  if (action.action === ActionDirective.Check) return `${playerName} CHECKED`;
  return `${playerName} ${action.action.toString().toUpperCase()}ED`;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    table: {
      backgroundColor: theme.palette.primary.main,
    },
    options: {
      border: `4px solid ${theme.palette.secondary.main}`,
    },
    invisible: {
      display: "none",
    },
    whisperLine: {
      stroke: theme.palette.secondary.main,
      strokeWidth: 10,
      strokeLinecap: "round",
      strokeDasharray: "10 20",
      opacity: 0.5,
    },
    backdrop: {
      zIndex: 101,
      backgroundColor: "rgba(0,0,0,0.75)",
    },
  })
);

function WhisperLines() {
  const whispers = useWhispers();
  const classes = useStyles();
  return (
    <>
      {Object.entries(whispers)
        .map(([from, to]) => {
          const fromEl = document.getElementById(`player-${from}`);
          const toEl = document.getElementById(`player-${to}`);
          if (fromEl && toEl) {
            // debugger;
            const width = Math.abs(fromEl.offsetLeft - toEl.offsetLeft);
            const height = Math.abs(fromEl.offsetTop - toEl.offsetTop);
            const offsetWidth = fromEl.offsetWidth / 2;
            const offsetHeight = fromEl.offsetHeight / 2;

            const left = Math.min(fromEl.offsetLeft, toEl.offsetLeft);
            const top = Math.min(fromEl.offsetTop, toEl.offsetTop);

            return (
              <svg
                width={Math.max(10, width)}
                height={Math.max(10, height)}
                style={{
                  position: "absolute",
                  left: left + offsetWidth,
                  top: top + offsetHeight,
                }}
              >
                <line
                  x1={fromEl.offsetLeft - left}
                  y1={fromEl.offsetTop - top}
                  x2={toEl.offsetLeft - left}
                  y2={toEl.offsetTop - top}
                  className={classes.whisperLine}
                />
              </svg>
            );
          }
          return null;
        })
        .filter((e) => e)}
    </>
  );
}

export interface ITableProps {
  className?: string;
  game: IGame;
  activeHand: IHand;
  playerState: IPlayerState;
  onAdvanceHand: (action: IAction | null, uid: string) => Promise<void>;
  onTimeoutPlayer: () => void;
  currentUserId: string;
  showAdvance?: boolean;
  showActions?: boolean;
  hidePlayerActions?: boolean;
  onSetAway?: { (away: boolean): Promise<void> };
  onShowCards?: { (params: IOnShowCardsParams): Promise<void> };
  invisibleActions?: boolean;
}

const positions: { [index: string]: IPocketPosition } = {
  p1: IPocketPosition.Top,
  p2: IPocketPosition.Bottom,
  p3: IPocketPosition.Left,
  p4: IPocketPosition.Right,
  p5: IPocketPosition.Top,
  p6: IPocketPosition.Bottom,
  p7: IPocketPosition.Top,
  p8: IPocketPosition.Bottom,
  p9: IPocketPosition.Left,
  p10: IPocketPosition.Right,
  // p11: IPocketPosition.Left,
  // p12: IPocketPosition.TopLeft,
};

const positionsPortrait: { [index: string]: IPocketPosition } = {
  p1: IPocketPosition.Top,
  p2: IPocketPosition.Bottom,
  p3: IPocketPosition.Left,
  p4: IPocketPosition.Right,
  p5: IPocketPosition.Left,
  p6: IPocketPosition.Right,
  p7: IPocketPosition.Right,
  p8: IPocketPosition.Left,
  p9: IPocketPosition.Left,
  p10: IPocketPosition.Right,
  // p11: IPocketPosition.BottomLeft,
  // p12: IPocketPosition.TopLeft,
};

function Table(props: ITableProps) {
  const [hideActions, setHideActions] = useState(false);
  const [inflightRequest, setInflightRequest] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { isMocking } = useMockingContext();
  const { enqueueSnackbar } = useSnackbar();
  const [lastActionTimestamp, setLastActionTimestamp] = useState(
    new Date().getTime()
  );
  // const [actionsHash, setActionsHash] = useState("");
  const { gameType } = useGameType();
  const { confirm } = useDialog();
  const formatCurrency = (num: number) => {
    if (gameType === GameType.Cash) {
      return `$${toCurrency(num)}`;
    }
    return toCurrency(num);
  };
  const classes = useStyles();
  const {
    addStructuredMessageHandler,
    removeStructuredMessageHandler,
  } = useStructuredMessages();

  const { activeHand, onAdvanceHand, hidePlayerActions } = props;
  const { finalizeTime } = props.game.tournamentDetails || {};

  const onOptionClicked = React.useCallback(
    async (uid: string, option: IAction) => {
      if (
        option.action !== ActionDirective.AllIn ||
        (await confirm({
          title: "All In",
          message: "Are you sure you want to go all in?",
        }))
      ) {
        setInflightRequest(true);
        setHideActions(true);
        onAdvanceHand(option, uid)
          .then(() => {
            // setInflightRequest(false);
          })
          .catch((error) => {
            setInflightRequest(false);
            setHideActions(false);
          });
        // const nextGameState = advanceHand(gameState, option);
        // setOptionState(nextGameState.actions);
        // setActivePlayerId(nextGameState.actingPlayerId);
        // setGameState(nextGameState.game);
      }
    },
    [confirm, onAdvanceHand]
  );

  const playAudio = React.useCallback(() => {
    if (!isMocking) {
      const audioEl = document.getElementsByClassName(
        "audio-element"
      )[0] as HTMLAudioElement;
      if (audioEl) {
        try {
          audioEl.volume = 0.4;
          audioEl.play();
        } catch (e) {
          // console.warn("Error playing sound effects", e);
        }
      }
    }
  }, [isMocking]);

  useEffect(() => {
    if (finalizeTime) {
      const interval = setInterval(() => {
        if (!finalizeTime) {
          setTimeRemaining(0);
          return;
        }
        const remaining = Math.max(0, finalizeTime - new Date().getTime());
        setTimeRemaining(remaining);
      }, 250);
      return () => clearInterval(interval);
    }
  }, [finalizeTime]);

  useEffect(() => {
    const handleAlertMessage = (msg: any) => {
      if (msg.type === "alert") {
        playAudio();
        return true;
      }
      return false;
    };
    addStructuredMessageHandler(handleAlertMessage);
    return () => removeStructuredMessageHandler(handleAlertMessage);
  }, [addStructuredMessageHandler, removeStructuredMessageHandler, playAudio]);

  const [dimensions, setDimensions] = React.useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  React.useEffect(() => {
    let timeout: NodeJS.Timeout = null;
    function handleResize() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setDimensions({
          height: window.innerHeight,
          width: window.innerWidth,
        });
      }, 100);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // It is possible for the actions to be identical if someone is all in...
  // We should include the round or something
  const playerActionHash =
    props.playerState &&
    props.playerState.actions &&
    props.playerState.actions.length
      ? ObjectHash({
        actions: props.playerState.actions,
        round: activeHand ? activeHand.rounds : [],
      })
      : null;
  useEffect(() => {
    setInflightRequest(false);
    if (playerActionHash) {
      playAudio();
    }
  }, [playerActionHash, playAudio]);

  useEffect(() => {
    const hasActions = !!playerActionHash;
    if (hasActions && hideActions && !inflightRequest) {
      // We are just now showing actions
      const hasBetOrRaise = !!props.playerState.actions.find(
        (action) =>
          action.action === ActionDirective.AllIn ||
          action.action === ActionDirective.Raise ||
          action.action === ActionDirective.Bet ||
          (action.action === ActionDirective.Call && action.total > 0)
      );
      // Player can only check or fold - skip them
      if (!hasBetOrRaise) {
        setHideActions(true);
        const bestAction = getBestAction(props.playerState.actions);
        onOptionClicked(props.playerState.uid, bestAction);
        return;
      }
    }
    setHideActions(!hasActions || inflightRequest);
  }, [
    playerActionHash,
    hideActions,
    inflightRequest,
    onOptionClicked,
    props.playerState,
  ]);

  const onClick = () => {
    props.onAdvanceHand(null, null);
  };
  React.useEffect(() => {
    if (activeHand && props.showActions) {
      const newActions = flatMap(
        activeHand.rounds,
        (round) => round.actions
      ).filter((a: IAction) => a.timestamp > lastActionTimestamp);

      if (newActions.length) {
        newActions.forEach((a) =>
          enqueueSnackbar(getTitleFromAction(props.game, a), {
            anchorOrigin: {
              vertical: "top",
              horizontal: "left",
            },
            autoHideDuration: 1500,
            variant: "info",
          })
        );
        setLastActionTimestamp(newActions[newActions.length - 1].timestamp);
      }
    }
  }, [
    activeHand,
    props.playerState,
    props.showActions,
    isMocking,
    enqueueSnackbar,
    props.game,
    lastActionTimestamp,
  ]);

  const flopCards = activeHand
    ? activeHand.rounds
      .filter((round) => round.type === HandRound.Flop)
      .map((r) => r.cards)[0]
    : [];

  const turnCards = activeHand
    ? activeHand.rounds
      .filter((round) => round.type === HandRound.Turn)
      .map((r) => r.cards)[0]
    : [];

  const riverCards = activeHand
    ? activeHand.rounds
      .filter((round) => round.type === HandRound.River)
      .map((r) => r.cards)[0]
    : [];

  // TODO - Bet followed by all in raise did not ask for a call

  const playerList = [
    ...getTabledPlayers(props.game),
    // ...Object.values(props.game.players),
  ].sort((p1: IPlayer, p2: IPlayer) => p1!.position! - p2!.position!);

  // Players by current player index
  const currentPlayerIndex = Math.max(
    0,
    playerList.findIndex((p) => p.id === props.currentUserId)
  );
  const isCurrentPlayerActive =
    playerList.some((p) => p.id === props.currentUserId);

  // We always want the current player at the bottom of the screen, so split around that
  const players =
    currentPlayerIndex === 0
      ? playerList
      : [
        ...playerList.slice(currentPlayerIndex, playerList.length),
        ...playerList.slice(0, currentPlayerIndex),
      ];

  const miscOverrides = MiscOverrides[window.location.hostname];
  const tableLogo =
    miscOverrides && miscOverrides.tableLogo
      ? miscOverrides.tableLogo
      : "/images/logotype-white.png";
  const seatConfiguration =
    configurations[
      Math.min(configurations.length - 1, Math.max(0, players.length - 1))
    ];
  let backgroundImageUrl =
    props.game.branding && props.game.branding.tableImageUrl
      ? props.game.branding.tableImageUrl
      : tableLogo;

  let leftBackgroundImageUrl: string;
  let rightBackgroundImageUrl: string;
  let customTableLogo: string;

  if (props.game.tournamentDetails && props.game.tournamentDetails.branding) {
    if (props.game.tournamentDetails.branding.tableImageUrl) {
      backgroundImageUrl = props.game.tournamentDetails.branding.tableImageUrl;
    }
    leftBackgroundImageUrl = props.game.tournamentDetails?.branding
      ?.leftTableImageUrl
      ? props.game.tournamentDetails.branding.leftTableImageUrl
      : "";
    rightBackgroundImageUrl = props.game.tournamentDetails?.branding
      ?.rightTableImageUrl
      ? props.game.tournamentDetails.branding.rightTableImageUrl
      : "";
    const tableIndex = Object.values(
      props.game.tournamentDetails.tableIdentifiers
    )
      .sort((t1, t2) => t1.name.localeCompare(t2.name))
      .findIndex((x) => x.id === props.game.id);
    customTableLogo = props.game.tournamentDetails.branding.customTableLogos
      ?.length
      ? props.game.tournamentDetails.branding.customTableLogos[
        tableIndex %
            props.game.tournamentDetails.branding.customTableLogos.length
      ]
      : backgroundImageUrl;
    // Keep the custom logo for the first N rounds
    if (props.game.tournamentDetails.activeRoundId >= 4) {
      customTableLogo = backgroundImageUrl;
    }
  }

  const backgroundImage = customTableLogo
    ? `url(${customTableLogo})`
    : `url(${backgroundImageUrl})`;
  const handContributions = activeHand
    ? calculateTotalHandContributions(activeHand)
    : 0;
  const currentPlayer = playerList[currentPlayerIndex];
  const hasActiveHand = activeHand && handContributions > 0;
  const actions =
    props.playerState && !hideActions ? props.playerState.actions : [];
  let futureActions: IAction[] = [];
  if (activeHand && !actions.length && currentPlayer && isCurrentPlayerActive) {
    // Calculate future actions
    if (isPlayerActive(activeHand, currentPlayer)) {
      const firstActiveRound = activeHand.rounds.find((round) => round.active);
      if (firstActiveRound && !inflightRequest) {
        futureActions = calculateFutureOptions(
          props.game,
          activeHand,
          firstActiveRound,
          currentPlayer
        );
      }
    }
  }
  const shouldHighlightTimeRemaining = timeRemaining <= 60 * 1000;

  const shouldOpenAwayMessage = !!props.onSetAway && isCurrentPlayerActive && !!currentPlayer?.away;

  return (
    <div className={`tableContainer ${props.game.stage}`}>
      <div
        className={`table ${classes.table} ${
          players.length > 8 ? "jumbo" : ""
        }`}
      >
        {hasActiveHand && !hidePlayerActions && (
          <div
            className={`options ${classes.options} ${
              !actions.length && !futureActions.length ? classes.invisible : ""
            } ${props.invisibleActions ? classes.invisible : ""}`}
          >
            <ActionsMenu
              actions={actions}
              futureActions={futureActions}
              onClick={(option: IAction) =>
                onOptionClicked(props.playerState.uid, option)
              }
              formatCurrency={formatCurrency}
              maxBet={
                props.playerState &&
                activeHand &&
                props.game.players[props.playerState.uid]
                  ? calculatePlayerRoundMaximum(
                    props.game,
                    activeHand,
                    props.game.players[props.playerState.uid]
                  )
                  : 0
              }
              increment={props.game.increment}
            />
          </div>
        )}

        {players.map((player, index) => {
          let playerCards =
            props.playerState && player.id === props.playerState?.uid
              ? props.playerState.cards
              : [];
          let handCards: string[] = null;
          let handDescription: string = null;
          let net = 0;
          let payout = 0;
          let soleWinner = false;
          if (activeHand && activeHand.payouts) {
            const payoutDetails = activeHand.payouts.find(
              (p) => p.uid === player.id
            );
            if (payoutDetails) {
              payout = payoutDetails.total;
              net = payoutDetails.amount;
              handCards = payoutDetails.handCards;
              handDescription = payoutDetails.handDescription;
              playerCards = payoutDetails.cards;

              if (payoutDetails.soleWinner && !payoutDetails.cards?.length) {
                soleWinner = true;
              }
            }
          }
          if (!playerCards.length && activeHand && activeHand.shownCards) {
            const shownCards = activeHand.shownCards.find(
              (sc) => sc.uid === player.id
            );
            if (shownCards) {
              playerCards = shownCards.cards;
            }
          }

          return (
            <Seat
              key={player.id}
              className={`player ${seatConfiguration[index]}`}
              player={player}
              position={
                positions[seatConfiguration[index]] || IPocketPosition.Top
              }
              portraitPosition={
                positionsPortrait[seatConfiguration[index]] ||
                IPocketPosition.Top
              }
              isDealer={activeHand?.dealerId === player.id}
              isSmallBlind={activeHand?.smallBlindId === player.id}
              isBigBlind={activeHand?.bigBlindId === player.id}
              action={activeHand?.actingPlayerId === player.id}
              active={isPlayerActive(activeHand, player)}
              canRebuy={canRebuy(props.game, player)}
              hand={activeHand}
              handCards={handCards}
              handDescription={handDescription}
              winningsNet={net}
              winningsTotal={payout}
              // Add on hover event for showing the hand cards
              cards={playerCards}
              stack={calculatePlayerBalance(props.game, player)}
              handContributions={
                activeHand ? calculateHandContributions(activeHand, player) : 0
              }
              roundContributions={
                activeHand ? calculateRoundContributions(activeHand, player) : 0
              }
              onSetAway={props.onSetAway}
              away={player.away}
              increment={props.game.increment}
              dimensions={dimensions}
              timeout={
                props.game.tournamentDetails
                  ? props.game.tournamentDetails.timeoutInSeconds
                  : 0
              }
              soleWinner={soleWinner}
              onShowCards={(show) =>
                props.onShowCards &&
                props.onShowCards({ hand: activeHand, show })
              }
            />
          );
        })}
        <div className="potCards">
          {leftBackgroundImageUrl && (
            <div id="left-logo" className="left-logo">
              <img alt="Sponsor Logo" src={leftBackgroundImageUrl} />
            </div>
          )}
          {hasActiveHand ? (
            <>
              <div id="potSize" className="potSize">
                {activeHand && `${formatCurrency(handContributions)}`}
              </div>
              <Deck
                height={dimensions.height > dimensions.width ? "5rem" : "7rem"}
                flop={flopCards}
                turn={turnCards}
                river={riverCards}
              />
            </>
          ) : null}
          {finalizeTime && (
            <div
              className={`countdown ${
                shouldHighlightTimeRemaining ? "countdown-red" : ""
              }`}
            >
              Tournament will end in {formatTimeRemaining(timeRemaining)}
            </div>
          )}
          <div
            className={`splash splash-${hasActiveHand ? "hidden" : "visible"}`}
          >
            <div
              style={{
                backgroundImage,
              }}
            />
          </div>
          {rightBackgroundImageUrl && (
            <div id="right-logo" className="right-logo">
              <img alt="Sponsor Logo" src={rightBackgroundImageUrl} />
            </div>
          )}
        </div>
        <WhisperLines />
        <Backdrop
          open={shouldOpenAwayMessage}
          className={classes.backdrop}
        >
          <Button
            onClick={() => props.onSetAway(false)}
            size="large"
            color="secondary"
            variant="contained"
          >
            I'm back and ready to play!
          </Button>
        </Backdrop>
        {props.game?.tournamentDetails?.players && (
          <ObserversGallery
            players={props.game.tournamentDetails.players}
          />
        )}
        {props.game.tournamentDetails &&
          props.game.tournamentDetails.players && (
          <FeaturedGallery
            game={props.game}
            players={props.game.tournamentDetails.players}
          />
        )}
      </div>
      <audio className="audio-element">
        <source src="/sound/ding.mp3" />
      </audio>
      {props.showAdvance && (
        <Fab
          id="auto-advance"
          color="secondary"
          aria-label="edit"
          onClick={onClick}
          style={{ position: "absolute", bottom: "1rem", left: "1rem" }}
        >
          <ChevronRight />
        </Fab>
      )}
    </div>
  );
}

export default Table;
