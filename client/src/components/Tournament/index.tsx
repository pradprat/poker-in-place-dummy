import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TwilioError } from "twilio-video";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import {
  Theme,
  Fab,
  useMediaQuery,
} from "@material-ui/core";
import firebase from "firebase";
import { styled } from "@material-ui/core/styles";
import "react-chat-elements/dist/main.css";
import Div100vh from "react-div-100vh";
import {
  SupervisorAccount as SupervisorAccountIcon,
  AccountBalance as AccountBalanceIcon,
  ExitToApp as ExitToAppIcon,
  Inbox as InboxIcon,
  ArrowBack,
} from "@material-ui/icons";

import "./Tournament.css";
import Header from "../Header";
import RebuyDialog from "../RebuyDialog";
import { ChatProvider } from "../../hooks/useChat";
import { useDialog } from "../muibox";
import { useThemeProvider } from "../ThemeProvider";
import useVideoContext from "../../twilio/hooks/useVideoContext/useVideoContext";
import {
  GameTable,
  firebaseWatchHand,
  firebaseWatchPlayerState,
} from "../../Game";
import { useAppState } from "../../twilio/state";
import {
  isNumeric,
  canRebuyInTournament,
  canTopUpInTournament,
} from "../../engine";
import {
  IGame,
  IAction,
  IPlayerState,
  IHand,
  ITournamentDetails,
  TournamentStatus,
  IUserDetails,
  ILoggedInUser,
  GameType,
  TournamentRegistrationMode,
  PlayerRole,
} from "../../engine/types";
import IURLTournamentIDParams from "../../types/IURLTournamentIDParams";
import { callFirebaseTournamentFunctionWithJson } from "../../firebase/rest";
import { useSessionRecording } from "../SessionRecordingProvider";
import { useRoomDisconnectOnTournamentEnd } from "../../hooks/useRoomDisconnectOnTournamentEnd";
import TournamentDetails from "../TournamentDetails";

import AdministerDialog from "./components/AdministerDialog";
import WelcomeMessageDialog from "./WelcomeMessageDialog";
import { IOnShowCardsParams } from "./interface";
import WaitingRoom from "./components/WaitingRoom";
import ConnectedRoom from "./components/ConnectedRoom";
import SystemMessage from "./components/SystemMessage";
import WaitingMessage from "./components/WaitingMessage";
import Results from "./components/Results";
import CopyLink from "./components/CopyLink";
import MessagesBadge from "./components/MessagesBadge";
import RightDrawer from "./components/RightDrawer";
import useSystemMessage from "./hooks/useSystemMessage";
import usePauseMessage from "./hooks/usePauseMessage";
import { copyStringToClipboard } from "./components/CopyLink/utils";
import FinishedDialog from "./components/FinishedDialog";
import useShouldShowFinishedDialog from "./hooks/useShouldShowFinishedDialog";
import { isOrganizer } from "./components/Organizer/utils";

const useIsMobile = (): boolean =>
  useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

const Container = styled(Div100vh)({
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

function FirebaseTournament() {
  const { URLTournamentID } = useParams<IURLTournamentIDParams>();
  const { prompt, alert } = useDialog();
  const { connect, room, getLocalVideoTrack, getLocalAudioTrack } = useVideoContext();
  const { enqueueSnackbar } = useSnackbar();
  const [tournament, setTournament] = useState<ITournamentDetails>(null);
  const [tableId, setTableId] = useState<string>(null);
  const [isTableActive, setIsTableActive] = useState(true);
  const [isTableAssigned, setIsTableAssigned] = useState(false);
  const [table, setTable] = useState<IGame>(null);
  const [playerState, setPlayerState] = useState<IPlayerState>(null);
  const [activeHand, setActiveHand] = useState<IHand>(null);
  const [isObserving, setIsObserving] = useState(false);
  const [showLobby, setShowLobby] = useState(0);
  const { user, userDetails, getToken, setError } = useAppState();
  const [
    autoAdvanceTimeout,
    setAutoAdvanceTimeout,
  ] = useState<NodeJS.Timeout>();
  const autoAdvanceTimeoutRef = React.useRef(autoAdvanceTimeout);
  autoAdvanceTimeoutRef.current = autoAdvanceTimeout;
  const { setCustomColors, setCustomCss } = useThemeProvider();
  const { tracker } = useSessionRecording();

  const userName = user ? user.displayName : null;
  const tournamentId: string = URLTournamentID || "";
  const userId = user ? user.uid : null;

  useEffect(() => {
    if (userId && tournamentId && tracker) {
      if (!tracker.active()) {
        tracker.userID(userId);
        tracker.metadata("tournamentId", tournamentId);
        tracker.metadata("uid", userId);
        tracker.metadata("userName", userName);
        tracker.start();
      }
    }
  }, [userId, userName, tournamentId, tracker]);

  useEffect(() => {
    if (tournament) {
      if (
        tournament.branding?.primaryColor &&
        tournament.branding?.secondaryColor
      ) {
        setCustomColors(
          tournament.branding?.primaryColor,
          tournament.branding?.secondaryColor
        );
      }
      if (tournament.branding?.customCss) {
        setCustomCss(tournament.branding?.customCss);
      }
    }
  }, [!!tournament]);

  const onJoinVideo = useCallback(async () => {
    if (showLobby) return;
    const token = await getToken(
      userName,
      tournamentId,
      tableId,
      "tournament"
    );

    if (!isObserving) {
      await getLocalVideoTrack();
      await getLocalAudioTrack();
    }

    connect(token, { disableVideoProduce: isObserving, disableAudioProduce: isObserving });
  }, [
    userName,
    tableId,
    tournamentId,
    isObserving,
    showLobby,
    isTableAssigned,
  ]);

  const tableDotId = table?.id;
  const activeHandId = table?.activeHandId;
  useEffect(() => {
    if (tableDotId) {
      if (activeHandId) {
        const watchHand = firebaseWatchHand;
        const watchPlayerState = firebaseWatchPlayerState;

        // TODO: Don't watchPlayerState on observer
        const connectSnapshots = () => {
          const unwatchHandsCallback = watchHand(
            tableDotId,
            activeHandId
          ).onSnapshot((hand) => {
            setActiveHand(hand);
          });
          const unwatchPlayerCallback = watchPlayerState(
            tableDotId,
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
  }, [tableDotId, activeHandId, userId]);

  useEffect(() => {
    if (!activeHandId && tournament?.status === TournamentStatus.Ended) {
      setActiveHand(null);
    }
  }, [activeHandId, tournament]);

  const onSelectTable = useCallback(
    async (watchTableId: string, isActive: boolean) => {
      const playerTableId = tournament.players[user.uid]?.tableId;
      setIsObserving(watchTableId !== playerTableId);
      setTableId(watchTableId);
      setIsTableActive(isActive);
      setIsTableAssigned(false);
      setShowLobby(null);
    },
    [user, tournament, tournamentId]
  );

  const onShowLobby = useCallback(async () => {
    setTableId(null);
    setShowLobby(new Date().getTime());
    setIsTableAssigned(false);
  }, [tournament]);

  const onTimeoutPlayer = useCallback(async () => {
    await callFirebaseTournamentFunctionWithJson(
      "tournament/timeout",
      {},
      () => user!.getIdToken(),
      () => tournament?.apiServerHost || table?.apiServerHost,
      tournamentId,
      setError,
      tracker
    );
    // Advance the hand to the next player
    onAdvanceHand(null, null);
  }, [user, tournament, table, tournamentId]);

  const onJoin = useCallback(
    async (code: string) => {
      const result = await callFirebaseTournamentFunctionWithJson(
        "tournament/join",
        { code },
        () => user!.getIdToken(),
        () => tournament?.apiServerHost || table?.apiServerHost,
        tournamentId,
        setError,
        tracker
      );
      return !!result && !!result.joined;
    },
    [user, tournament, table, tournamentId, setError]
  );

  const onSetAway = useCallback(
    async (away: boolean) => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/away",
        { away },
        () => user!.getIdToken(),
        () => tournament?.apiServerHost || table?.apiServerHost,
        tournamentId,
        null,
        tracker
      );
    },
    [user, tournament, table, tournamentId]
  );

  const onShowCards = useCallback(
    async ({ show, hand }: IOnShowCardsParams) => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/flip",
        { show, tableId, handId: hand.id },
        () => user!.getIdToken(),
        () => tournament?.apiServerHost || table?.apiServerHost,
        tournamentId,
        null,
        tracker
      );
    },
    [user, tournament, table, tableId, tournamentId]
  );

  const onLeave = useCallback(async () => {
    await callFirebaseTournamentFunctionWithJson(
      "tournament/leave",
      {},
      () => user!.getIdToken(),
      () => tournament?.apiServerHost || table?.apiServerHost,
      tournamentId,
      setError,
      tracker
    );
  }, [user, tournament, table, tournamentId]);

  const onStart = useCallback(async () => prompt({
    title: "Start Tournament",
    message:
      "Are you ready to start the tournament? No new players may be added.",
    placeholder: "Start paused by inputting a pause message...",
    ok: { text: "Start Tournament", color: "primary" },
    defaultValue: "",
    cancel: { text: "Cancel" },
  }).then((pauseMessage: string) => {
    onHandleStart(pauseMessage);
  }), [user, tournament, table, tournamentId]);

  const onHandleStart = useCallback(
    async (pauseMessage: string) => {
      const result = await callFirebaseTournamentFunctionWithJson(
        "tournament/start",
        { pauseMessage },
        () => user!.getIdToken(),
        () => tournament?.apiServerHost || table?.apiServerHost,
        tournamentId,
        null,
        tracker
      );
      if (!result || !result.started) {
        const startTime =
          result && result.startTime
            ? result.startTime
            : new Date().getTime() + 30000;
        const delay = startTime - new Date().getTime();
        if (tournament.status === TournamentStatus.Initialized) {
          setTimeout(() => onHandleStart(pauseMessage), delay);
        }
      } else {
        onAdvanceHand(null, null);
      }
    },
    [user, tournament, table, tournamentId]
  );

  const onUploadWelcomeMessage = useCallback(
    async (welcomeMessageUrl?: string) => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/profile",
        { welcomeMessageUrl },
        () => user!.getIdToken(),
        () => tournament?.apiServerHost || table?.apiServerHost,
        tournamentId,
        null,
        tracker
      );
    },
    [user, tournament, table, tournamentId]
  );

  const onAdvanceHand = useCallback(
    async (action: IAction | null, uid: string) => {
      if (autoAdvanceTimeoutRef.current) {
        console.warn("Clearing auto-advance timer");
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      const params: { [key: string]: string | number } = { tableId };

      if (action) {
        if (!isNumeric(action.total)) {
          alert("Invalid amount");
          return;
        }
        params.action = action.action;
        params.amount = action.total;
      }

      const result = await callFirebaseTournamentFunctionWithJson(
        "tournament/respond",
        params,
        () => user!.getIdToken(),
        () => tournament?.apiServerHost || table?.apiServerHost,
        tournamentId,
        (error: TwilioError) => {
          console.warn(error);
        },
        tracker,
        2
      );

      if (!result) {
        console.warn("Tournament respond result is null...");
      }
    },
    [user, tournament, table, tournamentId]
  );

  const onRebuy = useCallback(
    async (result: boolean, type?: string) => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/rebuy",
        { confirm: result, type },
        () => user!.getIdToken(),
        () => tournament?.apiServerHost || table?.apiServerHost,
        tournamentId,
        setError,
        tracker,
        1
      );
    },
    [user, tournament, table, tournamentId]
  );

  const onTopUp = useCallback(
    async (result: boolean) => {
      if (result) {
        await callFirebaseTournamentFunctionWithJson(
          "tournament/topup",
          {},
          () => user!.getIdToken(),
          () => tournament?.apiServerHost || table?.apiServerHost,
          tournamentId,
          setError,
          tracker
        );
      }
    },
    [user, tournament, table, tournamentId]
  );

  const connectToChatRoom = useCallback(
    async (id: string) => {
      const token = await getToken(
        user!.displayName!,
        tournamentId,
        id,
        "tournament"
      );
      connect(token);
    },
    [user, tournament, table, tournamentId]
  );

  const hasUser = !!user;
  useEffect(() => {
    if (hasUser) {
      try {
        const tournamentDoc = firebase
          .firestore()
          .collection("tournaments")
          .doc(URLTournamentID);
        const unwatchTournament = tournamentDoc.onSnapshot(
          (tournamentSnapshot) => {
            setTournament(tournamentSnapshot.data() as ITournamentDetails);
          },
          (error) => {
            console.error(error);
            setError({ message: "Error Loading Tournament" } as TwilioError);
          }
        );
        return () => unwatchTournament();
      } catch (e) {
        console.log(e);
      }
    }
    return () => { };
  }, [hasUser, URLTournamentID, setError]);

  // ToDo: To hook
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    if (tournament) {
      if (tournament.status === TournamentStatus.Finalized) {
        setIsTableActive(false);
        setTableId(null);
        return;
      }

      const player = tournament.players[userId];
      if (player) {
        const currentTableId = player.removed ? null : player.tableId;
        if (!table && currentTableId) {
          // Assigning first table
          timeout = setTimeout(() => {
            setIsTableActive(true);
            setTableId(currentTableId);
            setIsTableAssigned(true);
          }, 500);
        } else if (
          table &&
          currentTableId &&
          table.id &&
          table.id !== currentTableId
        ) {
          // Moving tables
          // alert(`Moving tables from ${currentTableId} to ${table.id}`);
          enqueueSnackbar(
            `Moving tables from ${currentTableId} to ${table.id}`,
            {
              anchorOrigin: {
                vertical: "top",
                horizontal: "right",
              },
              autoHideDuration: 3500,
              variant: "info",
            }
          );
          timeout = setTimeout(() => {
            setIsTableActive(true);
            setTableId(currentTableId);
            setIsTableAssigned(true);
          }, 500);
        } else if (table && !currentTableId) {
          setIsTableActive(true);
          setTableId(table.id);
          setIsObserving(true);
        }
      }

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [tournament, setError, enqueueSnackbar, table, userId]);

  // Watch changes to the table
  useEffect(() => {
    let promise = Promise.resolve();

    if (room?.disconnectAndWait && tableId) {
      // We're in a table & not removed
      promise = room.disconnectAndWait();
    }

    if (tableId) {
      // Wait for the disconnect, then reconnect
      promise.then(() => onJoinVideo());
      const tableDoc = firebase.firestore().collection("tables").doc(tableId);
      const unwatchTable = tableDoc.onSnapshot(
        (tableSnapshot) => {
          setTable(tableSnapshot.data() as IGame);
        },
        (error) => {
          console.error(error);
          setError({ message: "Error Loading Table" } as TwilioError);
        }
      );
      return (): void => {
        unwatchTable();
      };
    }

    setTable(null);
    return (): void => {};
  }, [tableId]);

  useRoomDisconnectOnTournamentEnd(room?.state);

  return (
    <ChatProvider tournament={tournament} currentUserId={user.uid}>
      <Tournament
        tournament={tournament}
        table={table}
        isTableActive={isTableActive}
        user={user}
        userDetails={userDetails}
        activeHand={activeHand}
        playerState={playerState}
        setError={setError}
        onAdvanceHand={onAdvanceHand}
        onTimeoutPlayer={onTimeoutPlayer}
        onRebuy={onRebuy}
        onTopUp={onTopUp}
        onJoin={onJoin}
        onLeave={onLeave}
        onStart={onStart}
        onUploadWelcomeMessage={onUploadWelcomeMessage}
        onSetAway={isObserving ? null : onSetAway}
        onShowCards={onShowCards}
        onShowLobby={onShowLobby}
        connectToChatRoom={connectToChatRoom}
        showLobby={showLobby}
        onSelectTable={onSelectTable}
        isObserving={isObserving}
        showActions
      />
    </ChatProvider>
  );
}

interface ITournamentProps {
  tournament?: ITournamentDetails;
  table?: IGame;
  isTableActive: boolean;
  activeHand?: IHand;
  playerState?: IPlayerState;
  user: ILoggedInUser;
  userDetails: IUserDetails;
  showActions?: boolean;
  showLobby?: number;
  isObserving?: boolean;
  setError: { (error: TwilioError): void };
  onTimeoutPlayer: { (): void };
  onAdvanceHand: { (action: IAction | null, uid: string): Promise<void> };
  onRebuy: { (result: boolean): Promise<void> };
  onTopUp: { (result: boolean): Promise<void> };
  onJoin: { (code: string): Promise<boolean> };
  onLeave: { (): Promise<void> };
  onStart: { (): Promise<void> };
  onSetAway?: { (away: boolean): Promise<void> };
  onUploadWelcomeMessage?: { (welcomeMessageUrl?: string): Promise<void> };
  onShowCards?: (params: IOnShowCardsParams) => Promise<void>;
  connectToChatRoom?: { (id: string): Promise<void> };
  onSelectTable: { (tableId: string, isActive: boolean): Promise<void> };
  onShowLobby: { (): void };
}

export const Tournament = React.memo(
  (props: ITournamentProps) => {
    const { confirm, prompt } = useDialog();
    const [hasJoined, setHasJoined] = useState(false);
    const [invalidCodeEntered, setInvalidCodeEntered] = useState(false);
    const [isPrompting, setIsPrompting] = useState(false);
    const [showAdministerDialog, setShowAdministerDialog] = useState(false);
    const [showTopUpOption, setShowTopUpOption] = useState(false);
    const [showWelcomeMessageDialog, setShowWelcomeMessageDialog] = useState(false);

    const {
      tournament,
      table,
      isTableActive,
      user,
      userDetails,
      activeHand,
      playerState,
      showActions,
      isObserving,
      onTimeoutPlayer,
      onAdvanceHand,
      onRebuy,
      onTopUp,
      onStart,
      onLeave,
      onSetAway,
      onShowCards,
      onShowLobby,
      onUploadWelcomeMessage,
      onJoin,
      showLobby,
    } = props;

    const upcomingRoundId = tournament ? tournament.upcomingRoundId : null;
    const currentPlayer = tournament ? tournament.players[user.uid] : null;

    const shouldShowFinishedDialog = useShouldShowFinishedDialog({ currentPlayer, table, tournament });
    const systemMessage = useSystemMessage({ tournament, table });
    const pauseMessage = usePauseMessage({ tournament });
    const isMobile = useIsMobile();
    const { room } = useVideoContext();

    const userId = user ? user.uid : null;

    const handleUnload = useCallback(
      (event: BeforeUnloadEvent) => {
        if (!hasJoined) return;
        onLeave();
        setTimeout(() => {
          alert("Welcome back");
          onJoin(null);
        }, 2000);
        const message =
          "\n Are you sure you want to leave? You will be removed from the table.";
        (event || window.event).returnValue = message; // Gecko + IE
        return message;
      },
      [onJoin, onLeave, hasJoined]
    );

    const renderRightDrawer = (): JSX.Element => (
      <RightDrawer tournament={tournament} user={user} tableId={table.id} />
    );

    const isTournamentActive =
      tournament &&
      ![TournamentStatus.Finalized, TournamentStatus.Initialized].includes(tournament.status);
    const playerIsBusted =
      isTournamentActive &&
      tournament.tableIdentifiers &&
      Object.values(tournament.tableIdentifiers).length &&
      !table;
    const shouldRenderTable = table && !showLobby && isTournamentActive;
    const shouldRenderWaitingRoom =
      tournament &&
      tournament.status !== TournamentStatus.Finalized &&
      (showLobby || tournament.status === TournamentStatus.Initialized || playerIsBusted);
    const shouldRenderTournamentDetails =
      shouldRenderTable && tournament.status !== TournamentStatus.Ended;
    const playerIsRemoved = tournament?.players[user.uid] && tournament.players[user.uid].removed;
    const shouldRenderLobbyButton =
      table && (playerIsBusted || isObserving || playerIsRemoved) &&
      onShowLobby && tournament.status !== TournamentStatus.Finalized;
    const shouldRenderAutoAdvance = tournament?.type !== GameType.MultiTableTournament ||
      tournament?.organizerId === user.uid;
    const showResults = tournament?.status === TournamentStatus.Finalized;
    const shouldRenderVideoControls = room?.shouldProduce && tournament?.status !== TournamentStatus.Finalized;
    const isHandEnd = !activeHand?.id || activeHand?.payouts?.length > 0;
    const shouldRenderSystemMessage = isHandEnd
      && systemMessage
      && !shouldRenderWaitingRoom
      && tournament?.status !== TournamentStatus.Finalized;
    const isUserOrganizer = useMemo(() => isOrganizer(tournament, user), [tournament, user]);

    const activeDrawerItems = isTournamentActive
      ? [
        tournament.organizerId === user.uid ? {
          title: "Admin Options",
          callback: () => {
            setShowAdministerDialog(true);
            return true;
          },
          icon: <SupervisorAccountIcon />,
        } : null,
        shouldRenderAutoAdvance ? {
          title: "Trigger Auto-Advance (if stuck)",
          callback: () => {
            onAdvanceHand(null, null);
            return true;
          },
          icon: <InboxIcon />,
        } : null,
        canRebuyInTournament(tournament, tournament.players[user.uid]) ? {
          title: "Re-buy (stack is 0)",
          callback: () => {
            onRebuy(true);
            return true;
          },
          icon: <AccountBalanceIcon />,
        } : null,
      ]
      : [];

    const drawerItems =
      tournament && tournament.players[user.uid]
        ? activeDrawerItems
          .concat([
            isMobile && {
              title: "Copy Link",
              callback: () => {
                copyStringToClipboard(
                  window.location.toString().replace("/organizer", "?join")
                );
                alert("Copied!");
                return true;
              },
              icon: (
                <img
                  src="/custom/poker501.com/copy-link.png"
                  alt="Click to Copy Link"
                  width="18px"
                  height="18px"
                />
              ),
            },
            {
              title: "Leave Game",
              callback: () => {
                confirm({
                  title: "Leave Tournament",
                  message: "Are you sure you want to leave?",
                }).then(() => {
                  onLeave();
                });
                return true;
              },
              icon: <ExitToAppIcon />,
            },
          ])
          .filter((x) => x)
        : [];

    useEffect(() => {
      if (hasJoined) {
        if (
          tournament.enablePlayerWelcomeVideos &&
          tournament.status === TournamentStatus.Initialized &&
          !tournament.players[userId]?.welcomeMessageUrl
        ) {
          setShowWelcomeMessageDialog(true);
        }
      }
    }, [hasJoined]);

    useEffect(() => {
      if (!tournament) return;
      if (tournament.status !== TournamentStatus.Finalized) {
        if (!hasJoined) {
          if (
            tournament.players[userId] &&
            tournament.players[userId].active &&
            !tournament.players[userId].away &&
            !tournament.players[userId].removed
          ) {
            setHasJoined(true);
          } else {
            const autoJoin =
              window.location.search.indexOf("join") >= 0 ||
              true ||
              tournament.players[userId];
            if (autoJoin && !isPrompting) {
              const player = tournament.players[userId];
              const playerNotInTournament = !player || player.removed;
              const playerIsObserver =
                player && player.role === PlayerRole.Observer;
              (async function () {
                if (
                  tournament.status !== TournamentStatus.Ended &&
                  tournament.status !== TournamentStatus.Finalized &&
                  tournament.status !== TournamentStatus.Initialized &&
                  !(
                    tournament.registrationMode ===
                    TournamentRegistrationMode.Code
                  ) &&
                  playerNotInTournament
                ) {
                  return;
                }
                if (playerIsObserver) {
                  setHasJoined(true);
                  return;
                }
                let code: string;
                if (
                  playerNotInTournament &&
                  tournament.registrationMode ===
                  TournamentRegistrationMode.Code
                ) {
                  const urlVars = new URLSearchParams(
                    window.location.search.slice(1)
                  );
                  if (urlVars.get("code") && !invalidCodeEntered) {
                    code = urlVars.get("code");
                  } else {
                    setIsPrompting(true);
                    code = await prompt({
                      title: "Join Tournament",
                      message: "Please input your registration code",
                      placeholder: "Tournament registration code...",
                    }).then((c: string) => (c || "").trim());
                  }
                }
                onJoin(code)
                  .then((result) => setHasJoined(result))
                  .catch(() => {
                    setHasJoined(false);
                    setInvalidCodeEntered(true);
                  })
                  .finally(() => setIsPrompting(false));
              })();
            }
          }
        }
        // TODO - let's mark people away
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
      }

      if (room?.disconnectAndWait) {
        room.disconnectAndWait();
      }
    }, [
      tournament,
      userId,
      prompt,
      hasJoined,
      isPrompting,
      onJoin,
      handleUnload,
      invalidCodeEntered,
    ]);

    useEffect(() => {
      if (showWelcomeMessageDialog && tournament?.startTime) {
        setShowWelcomeMessageDialog(false);
      }
    }, [tournament?.startTime]);

    useEffect(() => {
      if (upcomingRoundId && currentPlayer) {
        setShowTopUpOption(canTopUpInTournament(tournament, currentPlayer));
      }
    }, [tournament, upcomingRoundId, currentPlayer]);

    return (
      <Container className="tournament">
        <Header
          title={tournament ? `${tournament.name}` : "Loading..."}
          renderTitleAction={() => (
            <>
              {!isMobile && <CopyLink />}
              <WaitingMessage
                message={pauseMessage}
                position={showLobby || !table ? "top" : "bottom"}
              />
            </>
          )}
          renderVideoControls={shouldRenderVideoControls}
          drawerItems={drawerItems}
          rightDrawerIcon={<MessagesBadge />}
          rightDrawer={
            table
              ? {
                title: "Chat + Results + History",
                render: renderRightDrawer,
              }
              : null
          }
          mobileModeEnabled
        />
        <div style={{}} className="inner-container">
          {!tournament && <div className="loading">Loading...</div>}
          {showResults && (
            <div className="inline-results">
              <Results tournament={tournament} />
            </div>
          )}
          {shouldRenderTable && (
            <>
              {isTableActive && (
                <GameTable
                  table={{ ...table, tournamentDetails: tournament }}
                  user={user}
                  userDetails={userDetails}
                  activeHand={activeHand}
                  playerState={playerState}
                  onTimeoutPlayer={onTimeoutPlayer}
                  onAdvanceHand={onAdvanceHand}
                  onRebuy={onRebuy}
                  showActions={showActions}
                  onSetAway={onSetAway}
                  onShowCards={onShowCards}
                />
              )}
              {!isTableActive && (
                <ConnectedRoom tournament={tournament} />
              )}
            </>
          )}
          {shouldRenderTournamentDetails && (
            <TournamentDetails tournament={tournament} />
          )}
          {shouldRenderWaitingRoom && (
            <WaitingRoom
              tournament={tournament}
              onActionClicked={onStart}
              actionMessage={tournament.startTime ? "" : "Start the Tournament"}
              showCopyLink={tournament.organizerId === user.uid}
              currentUserId={user.uid}
              timestamp={showLobby}
              onSelectTable={props.onSelectTable}
              isWelcomeMessageDialogOpened={showWelcomeMessageDialog}
              shouldRenderActionBtn={isUserOrganizer}
            />
          )}
          {shouldRenderLobbyButton && (
            <Fab
              color="secondary"
              aria-label="back-to-lobby"
              onClick={(ev) => {
                ev.stopPropagation();
                onShowLobby();
              }}
              style={{
                position: "absolute",
                top: "1rem",
                left: "1rem",
                zIndex: 100,
              }}
            >
              <ArrowBack />
            </Fab>
          )}
          {tournament && isTournamentActive && table && (
            <AdministerDialog
              table={table}
              tableId={table.id}
              tournamentId={tournament.id}
              tournament={tournament}
              open={showAdministerDialog}
              onClose={() => setShowAdministerDialog(false)}
            />
          )}
          {tournament && table && (
            <RebuyDialog
              game={{ ...table, tournamentDetails: tournament }}
              onClose={() => {
                setShowTopUpOption(false);
                onTopUp(false);
              }}
              onSubmit={() => {
                setShowTopUpOption(false);
                onTopUp(true);
              }}
              open={showTopUpOption}
              isTopUp
            />
          )}
        </div>
        {shouldRenderSystemMessage && (
          <SystemMessage
            message={systemMessage}
          />
        )}
        <WelcomeMessageDialog
          open={showWelcomeMessageDialog}
          onClose={(imageUrl) => {
            setShowWelcomeMessageDialog(false);
            if (imageUrl) {
              onUploadWelcomeMessage(imageUrl);
            }
          }}
        />
        <FinishedDialog
          shouldShow={shouldShowFinishedDialog}
          tournament={tournament}
        />
      </Container>
    );
  }
);

export default FirebaseTournament;
