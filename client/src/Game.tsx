import React, { useState, useEffect, useImperativeHandle } from "react";
import { TwilioError } from "twilio-video";
import Button from "@material-ui/core/Button";
import { useParams, useHistory } from "react-router-dom";
import firebase from "firebase";
import { styled } from "@material-ui/core/styles";
import {
  ChevronRight as ChevronRightIcon,
  SupervisorAccount as SupervisorAccountIcon,
  AccountBalance as AccountBalanceIcon,
  ExitToApp as ExitToAppIcon,
} from "@material-ui/icons";
import Div100vh from "react-div-100vh";

import { useDialog } from "./components/muibox";
import { VIDEO_AUDIO_PERMISSIONS_GRANTED } from "./constants";
import { useThemeProvider } from "./components/ThemeProvider";
import Table from "./components/Table";
import Header from "./components/Header";
import PreGameOverlay from "./components/PreGameOverlay";
import { WrappedSummaryTable } from "./Summary";
import ExtendGameDialog, {
  onExtendSubmitPayload,
} from "./components/ExtendGameDialog";
import DonateDialog from "./components/DonateDialog";
import LocalVideoPreview from "./twilio/components/LocalVideoPreview/LocalVideoPreview";
import ReconnectingNotification from "./twilio/components/ReconnectingNotification/ReconnectingNotification";
import useVideoContext from "./twilio/hooks/useVideoContext/useVideoContext";
import { useAppState } from "./twilio/state";
import {
  AUTO_ADVANCE_DIRECTIVES,
  isPaid,
  getTimeRemaining,
  isNumeric,
  isPlayerTabledAndActive,
  canRebuy,
  getModeVideoEnabled,
} from "./engine";
import {
  GameStage,
  IGame,
  IAction,
  IPlayerState,
  IPlayer,
  IHand,
  PayType,
  IUserDetails,
  ILoggedInUser,
  IWatchHand,
  IWatchPlayerState,
  IHandWatcher,
  IPlayerStateWatcher,
  PlayerStateSnapshotCallback,
  HandSnapshotCallback,
} from "./engine/types";
import RebuyDialog from "./components/RebuyDialog";
import { DeviceSelectorDialog as ConfigureDialog } from "./twilio/components/MenuBar/DeviceSelector/DeviceSelectorDialog";
import Chat from "./components/Chat";
import AdministerDialog from "./components/AdministerDialog";
import {
  callFirebaseGameFunction,
  callFirebaseGameFunctionWithJson,
} from "./firebase/rest";
import { IOnShowCardsParams } from "./components/Tournament/interface";
import IURLTableIDParams from "./types/IURLTableIDParams";

import "./Game.css";

const Container = styled(Div100vh)({
  display: "flex",
  flexDirection: "column",
  // height: "100vh",
  overflow: "hidden",
});

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

function copyStringToClipboard(text: string, mimeType = "text/plain") {
  function handler(event: ClipboardEvent) {
    event.clipboardData.setData(mimeType, text);
    if (mimeType === "text/html") {
      event.clipboardData.setData(
        "text/plain",
        text.replace(/<br \/>/g, "\n").replace(/<[^>]*>/g, "")
      );
    }
    event.preventDefault();
    document.removeEventListener("copy", handler, true);
  }

  document.addEventListener("copy", handler, true);
  document.execCommand("copy");
}

interface IProps {
  game: IGame;
  currentUserId: string;
  // roomState?: string;
  // onStartVideo?: { (): void };
  onActionClicked?: { (): void };
  actionMessage: string;
  waitingMessage?: string;
  showCopyLink?: boolean;
}

function WaitingRoom(props: IProps) {
  const copyToClipboard = (ev: React.MouseEvent<HTMLDivElement>) => {
    copyStringToClipboard(
      `${window.location.href.replace(window.location.search, "")}?join`
    );
    ev.preventDefault();
    alert("Copied!");
  };
  return (
    <div className="room-overlay">
      {/* <div
        className={`player-grid player-grid-${getMaximumParticipants(
          props.game.mode
        )}`}
      >
        {players.map((player) => (
          <div
            key={player.id}
            style={{ backgroundImage: `url(${player.photoURL})` }}
          >
            <div>{player.name}</div>
          </div>
        ))}
      </div> */}
      {props.showCopyLink && !props.game?.features?.hideCopyLink && (
        <div className="copy-link" onClick={copyToClipboard} role="button">
          Copy Share Link:{" "}
          {`${window.location.href.replace(window.location.search, "")}?join`}
        </div>
      )}
      {props.waitingMessage && (
        <div className="waiting-message">
          <div>{props.waitingMessage}</div>
        </div>
      )}
      {props.game.features?.allowNonOrganizerStart ||
        !props.game.organizerId ||
        props.game.organizerId === props.currentUserId ? (
          <Button
            type="submit"
            color="primary"
            variant="contained"
            onClick={props.onActionClicked}
            className="button"
            size="large"
          >
            {props.actionMessage} <ChevronRightIcon />
          </Button>
        ) : null}
    </div>
  );
}

// function VideoWaitingRoom(props: IProps) {
//   return (
//     <div className="room-overlay">
//       {/* {props.roomState === "connected" && (
//         <div className="room">
//           <Room />
//         </div>
//       )} */}
//       {!props.game.organizerId ||
//       props.game.organizerId === props.currentUserId ? (
//         <Button
//           type="submit"
//           color="primary"
//           variant="contained"
//           onClick={props.onStartGame}
//           className="button"
//           size="large"
//         >
//           Play Poker <ChevronRightIcon />
//         </Button>
//       ) : null}
//     </div>
//   );
// }

export function firebaseWatchHand(
  tableId: string,
  activeHandId: string
): IHandWatcher {
  const handDocRef = firebase
    .firestore()
    .collection("tables")
    .doc(tableId)
    .collection("hands")
    .doc(activeHandId);
  return {
    onSnapshot: (callback: HandSnapshotCallback) =>
      handDocRef.onSnapshot((hand) => {
        callback(hand.data() as IHand);
      }),
  };
}

export function firebaseWatchPlayerState(
  tableId: string,
  activeHandId: string,
  playerId: string
): IPlayerStateWatcher {
  const playerStateDocRef = firebase
    .firestore()
    .collection("tables")
    .doc(tableId)
    .collection("hands")
    .doc(activeHandId)
    .collection("players")
    .doc(playerId);
  return {
    onSnapshot: (callback: PlayerStateSnapshotCallback) =>
      playerStateDocRef.onSnapshot((playerState) => {
        callback(playerState.data() as IPlayerState);
      }),
  };
}

interface IGameTableProps {
  table: IGame;
  user: ILoggedInUser;
  activeHand?: IHand;
  playerState?: IPlayerState;
  userDetails: IUserDetails;
  showAdvance?: boolean;
  showActions?: boolean;
  hidePlayerActions?: boolean;
  onTimeoutPlayer: { (): void };
  onAdvanceHand: { (action: IAction | null, uid: string): Promise<void> };
  onRebuy: { (result: boolean, type?: string): Promise<void> };
  onSetAway?: { (away: boolean): Promise<void> };
  onShowCards?: { (params: IOnShowCardsParams): Promise<void> };
  watchHand?: IWatchHand;
  watchPlayerState?: IWatchPlayerState;
  determineShouldShowRebuy?: { (table: IGame, player: IPlayer): boolean };
  className?: string;
}

interface IGameTableForwardRef {
  determineShouldShowRebuy: { (): void };
  setShowRebuyOption: { (show: boolean): void };
}

export const GameTable = React.forwardRef<
  IGameTableForwardRef,
  IGameTableProps
>((props, ref) => {
  const [hasDeclinedRebuy, setHasDeclinedRebuy] = useState(false);
  const [showRebuyOption, setShowRebuyOption] = useState(false);

  const {
    table,
    activeHand,
    playerState,
    onTimeoutPlayer,
    onAdvanceHand,
    user,
    showActions,
    determineShouldShowRebuy: inputDetermineShouldShowRebuy,
    className
  } = props;

  const determineShouldShowRebuy = React.useCallback(() => {
    const currentPlayer = table.players[user.uid];
    if (inputDetermineShouldShowRebuy) {
      if (inputDetermineShouldShowRebuy(table, currentPlayer)) {
        setShowRebuyOption(true);
      }
    } else if (canRebuy(table, currentPlayer)) {
      setShowRebuyOption(true);
    }
  }, [table, inputDetermineShouldShowRebuy, user]);

  useEffect(() => {
    if (table) {
      determineShouldShowRebuy();
    }
  }, [table, determineShouldShowRebuy]);

  useImperativeHandle(ref, () => ({
    determineShouldShowRebuy,
    setShowRebuyOption,
  }));

  return (
    <div className={className} style={{ flex: 1, position: "relative", display: "flex" }}>
      {!table && <div className="loading">Loading...</div>}
      <Table
        game={{ ...table, hands: activeHand ? [activeHand] : [] }}
        activeHand={activeHand}
        playerState={playerState}
        onAdvanceHand={onAdvanceHand}
        onTimeoutPlayer={onTimeoutPlayer}
        currentUserId={user.uid}
        showAdvance={!!props.showAdvance}
        showActions={showActions}
        onSetAway={props.onSetAway}
        onShowCards={props.onShowCards}
        hidePlayerActions={props.hidePlayerActions}
      />
      <RebuyDialog
        game={table}
        onClose={() => {
          setHasDeclinedRebuy(true);
          props.onRebuy(false);
        }}
        onSubmit={(type) => {
          setShowRebuyOption(false);
          props.onRebuy(true, type);
        }}
        open={!hasDeclinedRebuy && showRebuyOption}
      />
    </div>
  );
});

function Game() {
  const { user, userDetails, getToken, setError } = useAppState();
  const { URLTableID } = useParams<IURLTableIDParams>();
  const { confirm, alert } = useDialog();
  const history = useHistory();

  let hasPromptedBefore = false;
  try {
    hasPromptedBefore = !!window.localStorage.getItem(
      VIDEO_AUDIO_PERMISSIONS_GRANTED
    );
  } catch (e) { }

  const tableId: string = URLTableID || "";

  const { setCustomColors, setCustomCss } = useThemeProvider();
  const [table, setTable] = useState<IGame>(null);
  const [playerState, setPlayerState] = useState<IPlayerState>(null);
  const [activeHand, setActiveHand] = useState<IHand>(null);
  const { connect, room } = useVideoContext();
  const [hasJoined, setHasJoined] = useState(false);
  const [hasJoinedVideo, setHasJoinedVideo] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [showDonateDialog, setShowDonateDialog] = useState<boolean>(false);
  const [isShowingCards, setIsShowingCards] = useState<boolean>(false);
  const [showInfoDialog, setShowInfoDialog] = useState<boolean>(
    !hasPromptedBefore
  );
  const [showAdministerDialog, setShowAdministerDialog] = useState<boolean>(
    false
  );
  const [showExtendGameDialog, setShowExtendGameDialog] = useState<boolean>(
    false
  );
  const [showExtendGameOption, setShowExtendGameOption] = useState<boolean>(
    false
  );
  const [hasShownDonateDialog, setHasShowDonateDialog] = useState<boolean>(
    false
  );
  const [
    autoAdvanceTimeout,
    setAutoAdvanceTimeout,
  ] = useState<NodeJS.Timeout>();
  const [
    reconnectSnapshotTimeout,
    setReconnectSnapshotTimeout,
  ] = useState<number>(0);
  const autoAdvanceTimeoutRef = React.useRef(autoAdvanceTimeout);
  autoAdvanceTimeoutRef.current = autoAdvanceTimeout;
  const gameTableRef = React.useRef<IGameTableForwardRef>();
  const tableRef = React.useRef(table);
  tableRef.current = table;

  const drawerItems = [
    {
      title: "Admin Options",
      callback: () => {
        setShowAdministerDialog(true);
        return true;
      },
      icon: <SupervisorAccountIcon />,
    },
    // {
    //   title: "Trigger Auto-Advance (if stuck)",
    //   callback: () => {
    //     onAdvanceHand(null, null);
    //     return true;
    //   },
    //   icon: <InboxIcon />,
    // },
    {
      title: "Re-buy (stack is 0)",
      callback: () => {
        gameTableRef.current.determineShouldShowRebuy();
        return true;
      },
      icon: <AccountBalanceIcon />,
    },
    // {
    //   title: "Reset Hand (if stuck)",
    //   callback: () => {
    //     if (
    //       window.confirm(
    //         "Are you sure you want to reset this hand? Please report this situation."
    //       )
    //     ) {
    //       onResetHand();
    //     }
    //     return true;
    //   },
    //   icon: <InboxIcon />,
    // },
    {
      title: "Leave Game",
      callback: () => {
        confirm("Are you sure you want to leave?").then(() => {
          onLeaveGame();
        });
        return true;
      },
      icon: <ExitToAppIcon />,
    },
  ];

  const apiServerHost = table?.apiServerHost;
  const getServerHost = React.useCallback(() => apiServerHost, [apiServerHost]);
  const getUserToken = React.useCallback(() => user?.getIdToken(), [user]);

  const handleJoin = async () => {
    const urlVars = getUrlVars();
    await callFirebaseGameFunction(
      "join",
      {
        role: urlVars.get("join"),
      },
      getUserToken,
      getServerHost,
      tableId,
      setError
    );
    setHasJoined(true);
  };

  const onLeaveGame = React.useCallback(async () => {
    await callFirebaseGameFunction(
      "leave",
      {},
      getUserToken,
      getServerHost,
      tableId,
      setError
    );
  }, [tableId, setError, getServerHost, getUserToken]);

  useEffect(() => {
    if (hasJoined) {
      const handleUnload = (event: BeforeUnloadEvent) => {
        onLeaveGame();
        setTimeout(() => {
          alert("Welcome back");
          handleJoin();
        }, 5000);
        const message =
          "\n Are you sure you want to leave? You will be removed from the table.";
        // eslint-disable-next-line no-param-reassign
        (event || window.event).returnValue = message; // Gecko + IE
        return message;
      };
      window.addEventListener("beforeunload", handleUnload);
      return (): void => window.removeEventListener("beforeunload", handleUnload);
    }
  }, [hasJoined]);

  useEffect(() => {
    if (table) {
      if (table.branding?.primaryColor && table.branding?.secondaryColor) {
        setCustomColors(
          table.branding?.primaryColor,
          table.branding?.secondaryColor
        );
      }
      if (table.branding?.customCss) {
        setCustomCss(table.branding?.customCss);
      }
    }
  }, [!!table]);

  const displayName = user?.displayName;
  const mode = table?.mode;
  const handleJoinVideo = async () => {
    const timeRemaining = Math.max(0, getTimeRemaining(tableRef.current));
    setHasJoinedVideo(true);
    if (timeRemaining > 0) {
      const token = await getToken(displayName, tableId);
      if (getModeVideoEnabled(mode)) {
        connect(token);
      }
    }
  };

  const payType = table?.payType;
  const handlePaymentCheck = async () => {
    // session_id
    const paymentSessionId = getUrlVars().get("session_id");
    const { paid } = await callFirebaseGameFunction(
      "paid",
      { paymentSessionId },
      getUserToken,
      getServerHost,
      tableId,
      setError
    );

    if (!paid) {
      if (payType === PayType.PerPlayer) {
        confirm("It costs $2 to join. Click ok to continue...").then(() => {
          alert("1");
        });
      } else {
        setError({ message: "Payment Error" } as TwilioError);
      }
    }
  };

  const onShowCards = async ({ hand, show }: IOnShowCardsParams) => {
    if (!isShowingCards) {
      setIsShowingCards(true);
      callFirebaseGameFunction(
        "show",
        { handId: hand.id, show },
        getUserToken,
        getServerHost,
        tableId,
        setError
      )
        .finally(() => setIsShowingCards(false));
    }
  };

  const onSetAway = async (away: boolean) => {
    await callFirebaseGameFunctionWithJson(
      "away",
      { away },
      getUserToken,
      getServerHost,
      tableId,
      setError
    );
  };

  const onRebuy = async (result: boolean) => {
    gameTableRef.current.setShowRebuyOption(false);
    if (!result) {
      // Decline rebuy here
      await callFirebaseGameFunction(
        "leave",
        {},
        getUserToken,
        getServerHost,
        tableId,
        setError
      );
    }

    const currentPlayer = table.players[user.uid];
    if (canRebuy(table, currentPlayer)) {
      await callFirebaseGameFunction(
        "rebuy",
        {},
        getUserToken,
        getServerHost,
        tableId,
        setError
      );

      // Kick the wheels if there are just a couple of people
      onAdvanceHand(null, null);
    } else {
      alert("Rebuy not allowed");
    }
  };

  const onAdvanceHand = async (action: IAction | null, uid: string) => {
    if (autoAdvanceTimeoutRef.current) {
      console.warn("Clearing auto-advance timer");
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    const params: { [key: string]: string } = {};

    if (action) {
      if (!isNumeric(action.total)) {
        alert("Invalid amount");
        return;
      }
      params.action = action.action;
      params.amount = String(action.total);
    }

    const result = await callFirebaseGameFunction(
      "respond",
      params,
      getUserToken,
      getServerHost,
      tableId,
      // setError
      (e) => console.error(e)
    );

    if (result && AUTO_ADVANCE_DIRECTIVES[result.directive]) {
      const timeout = setTimeout(() => {
        onAdvanceHand(null, null);
      }, AUTO_ADVANCE_DIRECTIVES[result.directive]);
      setAutoAdvanceTimeout(timeout);
    }
  };

  const onTimeoutPlayer = async () => {
    await callFirebaseGameFunction(
      "timeout",
      {},
      getUserToken,
      getServerHost,
      tableId,
      setError
    );
    // Advance the hand to the next player
    onAdvanceHand(null, null);
  };

  const onExtendGame = async () => {
    setShowExtendGameDialog(true);
  };

  const handleExtendGame = async ({ mode }: onExtendSubmitPayload) => {
    setShowExtendGameDialog(false);

    const { paymentSessionId } = await callFirebaseGameFunction(
      "extend/create",
      { mode },
      getUserToken,
      getServerHost,
      tableId,
      setError
    );

    if (paymentSessionId) {
      window.open(
        `/extend/${URLTableID}?action=redirect&session_id=${paymentSessionId}`,
        "_blank"
      );
      alert(
        `Please visit ${`/extend/${URLTableID}?action=redirect&session_id=${paymentSessionId}`} to complete payment...`
      );

    }
  };

  const onStartGame = async () => {
    confirm(
      "NOTE: Players may come and go during cash games. Would you like to start now?"
    ).then(async () => {
      const result = await callFirebaseGameFunction(
        "start",
        {},
        getUserToken,
        getServerHost,
        tableId,
        setError
      );

      if (result && !result.error) {
        onAdvanceHand(null, null);
      }
    });
  };

  const onStartVideo = () => {
    confirm(
      getModeVideoEnabled(table.mode)
        ? "Do you want to start the video conferencing and start the countdown on your timer?"
        : "Do you want to start the countdown on your timer?"
    ).then(() => {
      handleJoinVideo();
    });
  };

  const hasTable = !!table;
  useEffect(() => {
    if (hasTable) {
      const interval = setInterval(() => {
        if (tableRef.current) {
          const timeRemaining = Math.max(0, getTimeRemaining(tableRef.current));
          const minutesLeft = Math.floor(timeRemaining / 60);
          setShowExtendGameOption(minutesLeft < 10);
          setTimeRemaining(`(${minutesLeft} minutes left)`);
          if (timeRemaining < 0) {
            // Game over
            room.disconnectAndWait();
            clearInterval(interval);
          }
        }
      }, 1000);
      const reconnectInterval = setInterval(() => {
        setReconnectSnapshotTimeout(new Date().getTime());
      }, 5000);
      return () => {
        clearInterval(interval);
        clearInterval(reconnectInterval);
      };
    }
  }, [hasTable, room]);

  const hasUser = !!user;
  useEffect(() => {
    if (hasUser) {
      try {
        const tableDoc = firebase
          .firestore()
          .collection("tables")
          .doc(URLTableID);
        const unwatchTable = tableDoc.onSnapshot(
          (tableSnapshot) => {
            setTable(tableSnapshot.data() as IGame);
          },
          (error) => {
            console.error(error);
            setError({ message: "Error Loading Game" } as TwilioError);
          }
        );
        return () => unwatchTable();
      } catch (e) {
        console.log(e);
      }
    }
    return () => { };
  }, [hasUser, URLTableID, setError]);

  const activeHandId = table?.activeHandId;
  const tableStage = table?.stage;
  const tableDotId = table?.id;
  const userId = user?.uid;
  useEffect(() => {
    if (hasTable) {
      if (activeHandId) {
        const watchHand = firebaseWatchHand;
        const watchPlayerState = firebaseWatchPlayerState;

        const connectSnapshots = () => {
          const unwatchHandsCallback = watchHand(
            tableDotId || URLTableID,
            activeHandId
          ).onSnapshot((hand) => {
            setActiveHand(hand);
          });
          const unwatchPlayerCallback = watchPlayerState(
            tableDotId || URLTableID,
            activeHandId,
            userId
          ).onSnapshot((player) => {
            setPlayerState(player);
          });
          return [unwatchHandsCallback, unwatchPlayerCallback];
        };

        const [unwatchHands, unwatchPlayer] = connectSnapshots();

        return () => {
          unwatchHands();
          unwatchPlayer();
        };
      }
    }
    return () => { };
  }, [
    activeHandId,
    hasTable,
    tableDotId,
    reconnectSnapshotTimeout,
    URLTableID,
    userId,
  ]);

  useEffect(() => {
    if (table) {
      if (table.stage === GameStage.Ended) {
        if (room.disconnectAndWait) {
          room?.disconnectAndWait()
        }
        history.push(`/results/${URLTableID}`);
        return () => { };
      }
      if (table.stage === GameStage.Active) {
        if (!hasShownDonateDialog) {
          setHasShowDonateDialog(true);
          if (!table.features?.hideDonateDialog) {
            setShowDonateDialog(true);
          }
        }
      }
      if (!hasJoined) {
        if (isPaid(table, userId, userDetails.subscriptionType)) {
          if (isPlayerTabledAndActive(table, table.players[userId])) {
            setHasJoined(true);
          } else {
            const autoJoin =
              window.location.search.indexOf("join") >= 0 ||
              table.players[userId];
            if (autoJoin) {
              handleJoin();
            }
          }
        } else {
          handlePaymentCheck();
        }
      }
      if (
        hasJoined &&
        !hasJoinedVideo &&
        (table.stage === GameStage.Waiting ||
          table.stage === GameStage.Active ||
          table.stage === GameStage.Paused)
      ) {
        handleJoinVideo();
      }
    }
    return () => { };
  }, [
    table,
    hasJoined,
    URLTableID,
    hasJoinedVideo,
    hasShownDonateDialog,
    userId,
    userDetails,
    room,
  ]);

  const stage = table?.stage;

  const renderRightDrawer = () => (
    <div>
      <WrappedSummaryTable gameId={URLTableID} />
    </div>
  );

  return (
    <Container className="game">
      <Header
        title={table ? `${table!.name} ${timeRemaining}` : "Loading..."}
        renderVideoControls
        drawerItems={drawerItems}
        rightDrawer={{ title: "View Hand History", render: renderRightDrawer }}
        mobileModeEnabled
      />
      <div style={{ flex: 1, position: "relative", display: "flex" }}>
        {!table && <div className="loading">Loading...</div>}
        {table /* && stage === GameStage.Active */ && (
          <GameTable
            ref={gameTableRef}
            table={table}
            user={user}
            userDetails={userDetails}
            onTimeoutPlayer={onTimeoutPlayer}
            onAdvanceHand={onAdvanceHand}
            onRebuy={onRebuy}
            onSetAway={onSetAway}
            activeHand={activeHand}
            playerState={playerState}
            onShowCards={onShowCards}
            showActions
          />
        )}
        {table && stage === GameStage.Initialized && (
          <>
            {/* <Modal open={true} onClose={() => {}}>
              <div className="join-link">Send this URL to others to join</div>
            </Modal> */}
            <WaitingRoom
              game={table}
              onActionClicked={onStartVideo}
              actionMessage="Start the Clock"
              waitingMessage={
                getModeVideoEnabled(table.mode)
                  ? "Waiting to start the video..."
                  : "Waiting to start the clock..."
              }
              showCopyLink
              currentUserId={user.uid}
            />
          </>
        )}
        {table && stage === GameStage.Waiting && (
          <WaitingRoom
            game={table}
            onActionClicked={onStartGame}
            actionMessage="Play Poker"
            waitingMessage="Waiting to start dealing..."
            showCopyLink
            currentUserId={user.uid}
          />
        )}
        {table && stage === GameStage.Active && showExtendGameOption && (
          <WaitingRoom
            game={table}
            onActionClicked={onExtendGame}
            actionMessage="Extend Game"
            currentUserId={user.uid}
          />
        )}
        <ReconnectingNotification />
        {table &&
          (hasJoined ? null : (
            <div className="join-overlay">
              <LocalVideoPreview />
              <PreGameOverlay
                game={table}
                title={
                  table.players[user.uid] ? "Re-join the game" : "Join the Game"
                }
                onClick={handleJoin}
              />
            </div>
          ))}
      </div>
      <DonateDialog
        open={showDonateDialog}
        onClose={() => setShowDonateDialog(false)}
        isGameOver={false}
      />
      {/* <ConfigureDialog
        open={true}
        onClose={() => setShowDonateDialog(false)}
        isGameOver={false}
      /> */}
      {stage === GameStage.Initialized && (
        <ConfigureDialog
          open={showInfoDialog}
          onClose={() => setShowInfoDialog(false)}
        />
      )}
      {table && user && (
        <Chat
          game={table}
          gameId={URLTableID}
          currentUserId={user.uid}
          isOpen={false}
        />
      )}
      {table && user && (
        <AdministerDialog
          game={table}
          gameId={URLTableID}
          open={showAdministerDialog}
          onClose={() => setShowAdministerDialog(false)}
        />
      )}
      {table && (
        <ExtendGameDialog
          currentMode={table.mode}
          open={showExtendGameDialog}
          onSubmit={handleExtendGame}
          onClose={() => setShowExtendGameDialog(false)}
        />
      )}
    </Container>
  );
}

export default Game;
//
