/* eslint-disable no-nested-ternary */
/* eslint-disable no-restricted-syntax */
import React, { useState, useEffect } from "react";
import { Avatar, IconButton, Tooltip, Button, makeStyles, createStyles, Theme, useTheme } from "@material-ui/core";
import {
  VolumeUp as AudioOnIcon,
  VolumeMute as AudioOffIcon,
  RecordVoiceOver as WhisperOnIcon,
  NotificationsActive as AlertIcon,
  Snooze as AwayIcon,
} from "@material-ui/icons";
import { SuperRoom } from "twilio-video";

import { IPocketPosition, IPlayer, IHand, GameType, ShowCards } from "../../engine/types";
import { useAppState } from "../../twilio/state";
import useRoomState from "../../twilio/hooks/useRoomState/useRoomState";
import useVideoContext from "../../twilio/hooks/useVideoContext/useVideoContext";
import useMockingContext from "../../twilio/hooks/useMockingContext/useMockingContext";
import useIsDominantSpeaker from "../../twilio/hooks/useIsDominantSpeaker/useIsDominantSpeaker";
import useGameType from "../../hooks/useGameType";
import {
  getRebuyPercentageRemaining,
  TIMEOUT_IN_SECONDS,
  getTimeOfLastAction,
} from "../../engine";
import { toCurrency } from "../../engine/utils";
import Card from "../Card";
import ProgressLabel from "../ProgressLabel";
import ChipStack from "../ChipStack";
import { MiscOverrides } from "../../theme";

import SeatVideo from "./SeatVideo";
import MockSeatVideo from "./MockSeatVideo";
import PulsatingCircle from "./PulsatingCircle";
import "./Seat.css";
import AudioVideoControls from "./Controls/AudioVideoControls";

const miscOverrides = MiscOverrides[window.location.hostname];
const logoUrl = miscOverrides ? miscOverrides.logoDark : "/logo.png";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    dealer: {
      "&::before": {
        backgroundColor: theme.palette.secondary.dark,
      },
    },
    smallBlind: {
      "&::before": {
        backgroundColor: theme.palette.secondary.dark,
      },
    },
    bigBlind: {
      "&::before": {
        backgroundColor: theme.palette.secondary.dark,
      },
    },
    rebuy: {
      color: theme.palette.secondary.main,
      border: `1px solid ${theme.palette.secondary.dark}`,
    },
    "round-contributions": {
      border: `2px solid ${theme.palette.secondary.dark}`,
    },
    payout: {
      border: `2px solid ${theme.palette.secondary.dark}`,
    },
    win: {
      border: `0px solid ${theme.palette.secondary.dark}`,
      boxShadow: `0px 0px 20px 10px ${theme.palette.secondary.dark}`,
    },
    stack: {
      backgroundColor: theme.palette.secondary.dark,
    }
  })
);

export interface IPerfSeatProps {
  className?: string;
  position: IPocketPosition;
  portraitPosition: IPocketPosition;
  player: IPlayer;
  cards: string[];
  hand?: IHand;
  handCards: string[] | null;
  handDescription: string | null;
  winningsNet: number | 0;
  winningsTotal: number | 0;
  active: boolean;
  action: boolean;
  canRebuy: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  stack: number;
  roundContributions: number;
  handContributions: number;
  countdownPercentage?: number;
  away?: boolean;
  soleWinner?: boolean;
  onSetAway?: { (away: boolean): Promise<void> };
  onShowCards?: { (show: ShowCards): Promise<void> };
  increment?: number;
  dimensions?: { width: number; height: number };
  timeout?: number;
}

export interface ISeatProps extends IPerfSeatProps {
  roomState: string;
  room: SuperRoom;
}

interface ICountdownProps {
  player: IPlayer;
  hand: IHand;
  action: boolean;
  canRebuy: boolean;
  className?: string;
  timeout?: number;
}

const AnimatedProgressLabel = React.memo((props: ICountdownProps) => {
  const theme = useTheme();
  const [countdownPercentage, setCountdownPercentage] = useState(0);
  React.useEffect(() => {
    let interval: number;
    if (props.canRebuy) {
      interval = setInterval(() => {
        const perc = 1 - getRebuyPercentageRemaining(props.player);
        if (!perc) clearInterval(interval);
        setCountdownPercentage(perc);
      });
    } else if (props.action && props.hand) {
      interval = setInterval(() => {
        const timestamp = getTimeOfLastAction(props.hand);
        const elapsed = (new Date().getTime() - timestamp) / 1000;
        const timeoutInSeconds = props.timeout || TIMEOUT_IN_SECONDS;
        const perc = Math.max(0.01, 1 - elapsed / timeoutInSeconds);
        if (!perc) clearInterval(interval);
        setCountdownPercentage(perc);
      });
    }
    return () => {
      setCountdownPercentage(0);
      clearInterval(interval);
    };
  }, [props.canRebuy, props.action, props.hand, props.timeout, props.player]);
  return countdownPercentage ? (
    <ProgressLabel
      className={props.className}
      progress={countdownPercentage}
      progressColor={theme.palette.secondary.main}
    />
  ) : null;
});

function Seat(props: ISeatProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { user } = useAppState();
  const { isMocking } = useMockingContext();
  const { gameType } = useGameType();
  const classes = useStyles();

  const { room, roomState } = props;

  const measuredRef = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    if (measuredRef.current) {
      setSize(measuredRef.current.getBoundingClientRect());
    }
  }, [props.dimensions, measuredRef]);

  const isPortrait = props.dimensions.width < props.dimensions.height;

  React.useEffect(() => {
    try {
      for (const card of document.getElementsByClassName("card")) {
        card.classList.remove("inactive");
        card.classList.remove("active");
      }
    } catch (e) {
      console.warn(e);
    }
  }, [props.handCards]);

  const onMouseOverDescription = () => {
    const elements = (props.handCards || [])
      .map((card) => document.getElementById(card.toUpperCase()))
      .filter((el) => el);
    for (const card of document.getElementsByClassName("card")) {
      card.classList.add("inactive");
    }
    elements.forEach((el) => el.classList.add("active"));
    // Make sure to undo this after x-seconds
  };

  const onMouseLeaveDescription = () => {
    const elements = (props.handCards || [])
      .map((card) => document.getElementById(card.toUpperCase()))
      .filter((el) => el);
    for (const card of document.getElementsByClassName("card")) {
      card.classList.remove("inactive");
    }
    elements.forEach((el) => el.classList.remove("active"));
  };

  const areCardsVisible = props.cards && props.cards.length > 0;
  const isCurrentPlayer =
    (isMocking && props.player.position === 0) || user?.uid === props.player.id;
  const cardScale = isCurrentPlayer ? 1.2 : areCardsVisible ? 1.5 : 2;
  const formatCurrency = (num: number) => {
    if (gameType === GameType.Cash) {
      return `$${toCurrency(num)}`;
    }
    return toCurrency(num);
  };

  const [isPlayerMuted, setIsPlayerMuted] = useState(false);
  const [isPlayerWhispering, setIsPlayerWhispering] = useState(false);

  const onToggleAudio = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setIsPlayerMuted(!isPlayerMuted);
  };
  const onToggleWhisper = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setIsPlayerWhispering(!isPlayerWhispering);
    if (isPlayerWhispering) {
      room.endWhisper(props.player.id).then((result) => {
        if (!result) setIsPlayerWhispering(false);
      });
    } else {
      room.startWhisper(props.player.id).then((result) => {
        if (!result) setIsPlayerWhispering(false);
      });
    }
  };
  const onAlert = (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    room.sendStructuredMessage({ uid: props.player.id, type: "alert" });
  };

  const onToggleAway = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    props.onSetAway(!props.player.away);
  };

  const [showAnimatedChipStack, setShowAnimatedChipStack] = useState(0);
  const [priorContriubtions, setPriorContributions] = useState(0);
  useEffect(() => {
    setPriorContributions(props.roundContributions);
    if (!props.roundContributions && priorContriubtions) {
      setShowAnimatedChipStack(priorContriubtions);
      setTimeout(() => {
        setShowAnimatedChipStack(0);
      }, 100000);
    }
  }, [props.roundContributions, priorContriubtions]);

  const activeRound = props.hand
    ? props.hand.rounds.find((r) => r.active)
    : null;
  let lastAction;
  if (activeRound) {
    const playerActions = activeRound.actions.filter(
      (a) => a.uid === props.player.id
    );
    if (playerActions.length) {
      lastAction = playerActions[playerActions.length - 1];
    }
  }

  const isDominantSpeaker = useIsDominantSpeaker(props.player.id);

  const shouldRenderCardsShowBtns = isCurrentPlayer && props.soleWinner && props.onShowCards && !areCardsVisible;

  return (
    <div
      id={`player-${props.player.id}`}
      className={`${props.className} seat ${props.action ? "action" : ""} ${props.active ? "active" : "folded"
      } ${isCurrentPlayer ? "current" : ""} ${props.isDealer ? `dealer ${classes.dealer}` : ""
      } ${props.isSmallBlind ? `small-blind ${classes.smallBlind}` : ""} ${props.isBigBlind ? `big-blind ${classes.bigBlind}` : ""
      } props.away ? "away" : ""
      }`}
    >
      {shouldRenderCardsShowBtns && (
        <div className="show">
          <Button
            onClick={() => props.onShowCards(ShowCards.First)}
            variant="contained"
            color="secondary"
            size="small"
            fullWidth
          >
            Show First Card
          </Button>
          <Button
            onClick={() => props.onShowCards(ShowCards.Second)}
            variant="contained"
            color="secondary"
            size="small"
            fullWidth
          >
            Show Second Card
          </Button>
          <Button
            onClick={() => props.onShowCards(ShowCards.Both)}
            variant="contained"
            color="secondary"
            size="small"
            fullWidth
          >
            Show Both Cards
          </Button>
        </div>
      )}
      {isDominantSpeaker && <PulsatingCircle />}
      {isCurrentPlayer && <AudioVideoControls />}
      <div
        className="video-progress"
        style={{
          backgroundImage: `url(${props.player.photoURL || logoUrl})`,
        }}
      >
        <AnimatedProgressLabel
          className="progress"
          hand={props.hand}
          player={props.player}
          canRebuy={props.canRebuy}
          action={props.action}
          timeout={props.timeout}
        />
        {roomState === "connected" && (
          <SeatVideo
            playerId={props.player.id}
            currentUserId={user?.uid}
            muted={isPlayerMuted}
            hideAudioLevels={isCurrentPlayer}
          />
        )}
        {!isMocking && roomState !== "connected" && isCurrentPlayer && (
          <MockSeatVideo />
        )}
        {isMocking && props.player.position === 0 && (
          <MockSeatVideo />
        )}
        {roomState === "connected" || isCurrentPlayer ? (
          <div className="actions">
            <div>
              {!isCurrentPlayer ? (
                <>
                  <Tooltip title={isPlayerMuted ? "Unmute" : "Mute"}>
                    <IconButton
                      aria-label="Mute/Unmute"
                      onClick={onToggleAudio}
                      color={!isPlayerMuted ? "secondary" : "default"}
                    >
                      {isPlayerMuted ? <AudioOffIcon /> : <AudioOnIcon />}
                    </IconButton>
                  </Tooltip>
                  {/* <Tooltip
                    title={
                      isPlayerWhispering
                        ? "Stop Whispering"
                        : "Start Whispering"
                    }
                  >
                    <IconButton
                      aria-label="Whisper"
                      onClick={onToggleWhisper}
                      color={isPlayerWhispering ? "secondary" : "default"}
                    >
                      <WhisperOnIcon />
                    </IconButton>
                  </Tooltip> */}
                  <Tooltip title="Alert/Notify">
                    <IconButton aria-label="delete" onClick={onAlert}>
                      <AlertIcon />
                    </IconButton>
                  </Tooltip>
                </>
              ) : props.onSetAway ? (
                <Tooltip
                  title={props.player.away ? "Resume Playing" : "Set Away"}
                >
                  <IconButton aria-label="delete" onClick={onToggleAway}>
                    <AwayIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <div className="profile">
        <Avatar
          alt={props.player.name}
          src={props.player.photoURL}
          className="avatar"
        />
        {isCurrentPlayer && props.onSetAway && (
          <div className="away">
            <Button
              onClick={() => props.onSetAway(true)}
              variant="contained"
              color="secondary"
              size="small"
              fullWidth
            >
              Set Away
            </Button>
          </div>
        )}
        <div className="name">{props.player.name}</div>
        <div className={`stack ${classes.stack}`}>{formatCurrency(props.stack)}</div>
      </div>
      <div
        ref={measuredRef}
        className={`pocket ${props.position.toString()} ${isPortrait ? `portrait_${props.portraitPosition.toString()}` : ""
        } ${areCardsVisible ? "visible" : ""}`}
      >
        <div className="cards">
          <Card
            className="card"
            height={`${size.height / cardScale}px`}
            /* TODO - change this if we deal one card at a time */
            visible={areCardsVisible}
            card={areCardsVisible ? props.cards[0] : null}
          />
          <Card
            className="card"
            height={`${size.height / cardScale}px`}
            visible={areCardsVisible}
            card={areCardsVisible ? props.cards[1] : null}
          />
        </div>
        <div className="pocket-art">
          {(lastAction || props.roundContributions) && props.active ? (
            <ChipStack
              key="main"
              value={props.roundContributions}
              startingValue={props.increment || props.hand?.smallBlind || 0}
              lastAction={lastAction ? lastAction.action : null}
            />
          ) : null}
          {showAnimatedChipStack ? (
            <ChipStack
              key="animated"
              value={showAnimatedChipStack}
              startingValue={props.increment || props.hand?.smallBlind || 0}
              animateIntoPot
              onAnimationComplete={() => setShowAnimatedChipStack(0)}
            />
          ) : null}
        </div>
        {props.canRebuy ? (
          <div
            className={`rebuy ${classes.rebuy}`}
            title="Awaiting Rebuy Decision"
          >
            Rebuy Option
          </div>
        ) : null}
        {props.handDescription ? (
          <div
            className={`payout ${classes.payout} ${props.winningsTotal > 0 ? `win ${classes.win}` : "lose"
            }`}
            onMouseOver={onMouseOverDescription}
            onMouseLeave={onMouseLeaveDescription}
          >
            {formatCurrency(props.winningsTotal)} - {props.handDescription}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PerfSeat(props: IPerfSeatProps) {
  const roomState = useRoomState();
  const { room } = useVideoContext();
  return <Seat {...props} roomState={roomState} room={room} />;
}
