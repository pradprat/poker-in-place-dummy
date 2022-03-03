import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TwilioError } from "twilio-video";
import { useParams } from "react-router-dom";
import { Fab, TextField } from "@material-ui/core";
import { ArrowBack, SupervisorAccount as SupervisorAccountIcon } from "@material-ui/icons";
import firebase from "firebase";
import { styled } from "@material-ui/core/styles";
import Div100vh from "react-div-100vh";

import useVideoContext from "../../../../twilio/hooks/useVideoContext/useVideoContext";
import { ChatProvider } from "../../../../hooks/useChat";
import { useThemeProvider } from "../../../ThemeProvider";
import Header, { IDrawerItem } from "../../../Header";
import { useSessionRecording } from "../../../SessionRecordingProvider";
import { useAppState } from "../../../../twilio/state";
import { TOURNAMENT_AUTO_ADVANCE_DIRECTIVES, isNumeric } from "../../../../engine";
import { useDialog } from "../../../muibox";
import IURLTournamentIDParams from "../../../../types/IURLTournamentIDParams";
import {
  IAction,
  ITournamentDetails,
  TournamentStatus,
  GameStage,
  IGameSnapshot,
  PlayerRole,
} from "../../../../engine/types";
import { callFirebaseTournamentFunctionWithJson } from "../../../../firebase/rest";
import { useRoomDisconnectOnTournamentEnd } from "../../../../hooks/useRoomDisconnectOnTournamentEnd";
import { NetworkStatusVisibilityContext } from "../../../Seat/SeatVideo/components/NetworkConnectionStatus";
import usePauseMessage from "../../hooks/usePauseMessage";
import TournamentDetails from "../../../TournamentDetails";
import WaitingRoom from "../WaitingRoom";
import AdministerDialog from "../AdministerDialog";
import WaitingMessage from "../WaitingMessage";
import Results from "../Results";
import CopyLink from "../CopyLink";
import MessagesBadge from "../MessagesBadge";
import RightDrawer from "../RightDrawer";

import DebugTournament from "./components/DebugTournament";
import Table from "./components/Table";
import { getFilteredTableIds, isTableActive, isFeaturedGuest, isOrganizer } from "./utils";
import { ITableInfo, ITournamentProps } from "./interface";

import "../../Tournament.css";
import "./styles.css";

const Container = styled(Div100vh)({
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

function getUrlVars(): URLSearchParams {
  return new URLSearchParams(window.location.search.slice(1));
}

function FirebaseOrganizerTournament() {
  const { URLTournamentID } = useParams<IURLTournamentIDParams>();
  const { alert, prompt } = useDialog();
  const [tournament, setTournament] = useState<ITournamentDetails>(null);
  const [activeTableId, setActiveTableId] = useState<string>(null);
  const [tables, setTables] = useState<ITableInfo[]>([]);
  const [tableIds, setTableIds] = useState<IGameSnapshot[]>([]);
  const [codeAccepted, setCodeAccepted] = useState<boolean>(false);
  const [codeRejected, setCodeRejected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const { user, getToken, setError } = useAppState();
  const { connect, room, getLocalVideoTrack, getLocalAudioTrack } = useVideoContext();
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

  const tablesRef = React.useRef(tables);
  tablesRef.current = tables;

  const code = getUrlVars().get("code");

  const onAcceptOrganizer = async (code: string) => callFirebaseTournamentFunctionWithJson(
    "tournament/organizer/accept",
    { code },
    () => user!.getIdToken(),
    () => tournament?.apiServerHost,
    tournamentId,
    setError,
    tracker
  );

  const onStart = async () => prompt({
    title: "Start Tournament",
    message:
      "Are you ready to start the tournament? No new players may be added.",
    placeholder: "Start paused by inputting a pause message...",
    ok: { text: "Start Tournament", color: "primary" },
    defaultValue: "",
    cancel: { text: "Cancel" },
  })
    .then((pauseMessage: string) => {
      handleOnStart(pauseMessage);
    })
    .catch((e: any) => {
      if (e) {
        handleOnStart("");
      }
    });

  const handleOnStart = async (pauseMessage: string) => {
    callFirebaseTournamentFunctionWithJson(
      "tournament/start",
      { pauseMessage },
      () => user!.getIdToken(),
      () => tournament?.apiServerHost,
      tournamentId,
      setError,
      tracker
    ).then((result) => {
      if (!result || !result.started) {
        const startTime =
          result && result.startTime
            ? result.startTime
            : new Date().getTime() + 30000;
        const delay = startTime - new Date().getTime();
        setTimeout(() => handleOnStart(pauseMessage), delay);
      } else {
        onAdvanceHand(null, null);
      }
    });
  };

  // Set a global flag for testing?
  // @ts-ignore
  window._onStart = () => handleOnStart();

  const onAdvanceHand = async (action: IAction | null, puppetUid?: string, tableId?: string) => {
    if (autoAdvanceTimeoutRef.current) {
      console.warn("Clearing auto-advance timer");
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    const params: { [key: string]: any } = {
      ...puppetUid && { puppetUid },
      ...tableId && { tableId }
    };

    if (action) {
      if (!isNumeric(action.total)) {
        alert("Invalid amount");
        return;
      }
      params.action = action.action;
      params.amount = action.total;
    }

    try {
      const result = await callFirebaseTournamentFunctionWithJson(
        "tournament/respond",
        params,
        () => user!.getIdToken(),
        () => tournament?.apiServerHost,
        tournamentId,

        (error: TwilioError) => {
          console.warn(error);
        },
        tracker
      );

      if (result) {
        const AUTO_ADVANCE_DIRECTIVES = TOURNAMENT_AUTO_ADVANCE_DIRECTIVES(
          tournament
        );
        if (AUTO_ADVANCE_DIRECTIVES[result.gameDirective]) {
          const timeout = setTimeout(() => {
            onAdvanceHand(null, null);
          }, AUTO_ADVANCE_DIRECTIVES[result.gameDirective]);
          setAutoAdvanceTimeout(timeout);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onSelectTable = async (tableId: string, isActive: boolean) => {
    if (room && room.disconnect) {
      room.disconnect();
    }
    setActiveTableId(tableId);
  };

  useEffect(() => {
    if (user && !codeRejected) {
      const handleAcceptInvite = () => {
        if (code && !codeAccepted && !codeRejected) {
          onAcceptOrganizer(code).then((res) => {
            if (res && res.accepted) {
              setCodeAccepted(true);
            } else {
              alert("Invalid (or already claimed) invite code");
              setCodeRejected(true);
            }
          });
        } else {
          alert("Access denied. Please contact the tournament administrator.");
        }
      };
      try {
        const tournamentDoc = firebase
          .firestore()
          .collection("tournaments")
          .where(
            firebase.firestore.FieldPath.documentId(),
            "==",
            URLTournamentID
          )
          .where(`players.${userId}.role`, "in", [
            PlayerRole.Organizer,
            PlayerRole.Featured,
          ]);
        const unwatchTournament = tournamentDoc.onSnapshot(
          (tournamentSnapshots) => {
            if (tournamentSnapshots.size) {
              const data = tournamentSnapshots.docs[0].data() as ITournamentDetails;
              setTournament(data);
              if (data.tableIdentifiers) {
                const activeTableIds = Object.values(data.tableIdentifiers)
                  .sort((t1, t2) => t1.name.localeCompare(t2.name))
                  .filter((t) => t.stage === GameStage.Active);
                if (activeTableIds.length !== tableIds.length) {
                  setTableIds(activeTableIds);
                }
              }
            } else {
              handleAcceptInvite();
            }
          },
          (error) => {
            console.error(error);
            handleAcceptInvite();
            // setError({ message: "Error Loading Tournament" } as TwilioError);
          }
        );
        return (): void => unwatchTournament();
      } catch (e) { }
    }
    return (): void => { };
  }, [userId, URLTournamentID, code, codeAccepted, codeRejected]);

  // Watch changes to the table
  const hasTableIds = tableIds?.length;
  useEffect(() => {
    if (hasTableIds) {
      const tournamentTables = tableIds.map((t) => ({
        id: t.id,
        stage: t.stage,
        name: t.name,
        players: Object.values(tournament.players)
          .filter((p) => p.tableId === t.id)
          .reduce((map, player) => ({ ...map, [player.id]: player }), {}),
      }));
      setTables(tournamentTables);
      return (): void => { };
    }
    setTables([]);
    return (): void => { };
  }, [hasTableIds, tableIds, setError, tournamentId]);

  const onJoinVideo = useCallback(async () => {
    setIsConnecting(true);
    const isFeatured = isFeaturedGuest(tournament, user);

    await getLocalAudioTrack();

    if (isFeatured) {
      await getLocalVideoTrack();
    }

    const token = await getToken(userName, tournamentId, activeTableId, "tournament");
    await connect(token, { disableVideoProduce: !isFeatured });

    setIsConnecting(false);
  }, [
    userName,
    tournamentId,
    activeTableId,
    tournament,
    user,
  ]);

  useEffect(() => {
    if (isConnecting) return;
    if (room?.disconnect && !activeTableId) {
      room.disconnect();
      return;
    }

    const currentConnectedRoom = room ? room.id : null;
    const activeTableToConnect = activeTableId
      ? `${tournamentId}-${activeTableId}`
      : null;
    const shouldConnectToRoom =
      !isConnecting && currentConnectedRoom !== activeTableToConnect && activeTableId && userName;

    if (shouldConnectToRoom) {
      onJoinVideo();
    }
    return (): void => { };
  }, [activeTableId, tournamentId, room, userName]);

  useRoomDisconnectOnTournamentEnd(room?.state);

  return (
    <OrganizerTournament
      tournament={tournament}
      tables={tables}
      user={user}
      setError={setError}
      onAdvanceHand={onAdvanceHand}
      onStart={onStart}
      onSelectTable={onSelectTable}
      activeTableId={activeTableId}
    />
  );
}

export function OrganizerTournament(props: ITournamentProps): JSX.Element {
  const [showAdministerDialog, setShowAdministerDialog] = useState<boolean>(
    false
  );
  const [bumpTimeout, setBumpTimeout] = useState<NodeJS.Timeout>();
  const timeoutRef = React.useRef(bumpTimeout);
  const [query, setQuery] = useState("");
  timeoutRef.current = bumpTimeout;

  const { room } = useVideoContext();

  const {
    tournament,
    tables,
    user,
    onAdvanceHand,
    onStart,
    activeTableId,
  } = props;

  const playerRole = tournament?.players[user.uid]?.role;
  const isAdmin = playerRole === PlayerRole.Organizer;

  const onSelectTable = (table: ITableInfo, isActiveTable: boolean): void => {
    props.onSelectTable(table?.id, isActiveTable);
  };

  const drawerItems: IDrawerItem[] = isAdmin
    ? [
      {
        title: "Admin Options",
        callback: () => {
          setShowAdministerDialog(true);
          return true;
        },
        icon: <SupervisorAccountIcon />,
      },
    ]
    : [];

  const renderRightDrawer = (): JSX.Element => (
    <RightDrawer
      tournament={tournament}
      user={user}
      tableId={activeTableId}
      isOrganizer
    />
  );

  const onShowAdminOptions = (): void => {
    setShowAdministerDialog(true);
  };

  const isTournamentActive = tournament && ![TournamentStatus.Finalized, TournamentStatus.Initialized].includes(tournament.status);
  const isTournamentEnded = tournament?.status === TournamentStatus.Ended;
  const showResults = tournament && tournament.status === TournamentStatus.Finalized;
  const shouldRenderDetails = tournament && ![TournamentStatus.Finalized, TournamentStatus.Ended, TournamentStatus.Initialized].includes(tournament.status);
  const shouldRenderDetailsOnTable = shouldRenderDetails && activeTableId;
  const shouldRenderDetailsOnLobby = shouldRenderDetails && !activeTableId;
  const shouldRenderAutomation = isTournamentActive && tournament.enableAutomation;
  const isUserOrganizer = useMemo(() => isOrganizer(tournament, user), [tournament, user]);

  const filteredTableIds = getFilteredTableIds({ tables, query });

  let filteredTables = tables
    ? tables
      .filter((table) => filteredTableIds.has(table.id) && isTableActive(table, isTournamentEnded))
      .filter((t) => !activeTableId || t.id === activeTableId)
    : [];

  if (tables && activeTableId && !filteredTables.length) {
    filteredTables = tables.filter(
      (table) => filteredTableIds.has(table.id) && isTableActive(table, isTournamentEnded)
    );
  }

  const pauseMessage = usePauseMessage({ tournament });

  useEffect(() => {
    if (tournament?.status === TournamentStatus.Finalized && room?.disconnectAndWait) {
      room.disconnectAndWait();
    }

  }, [tournament, room]);

  return (
    <ChatProvider tournament={tournament} currentUserId={user.uid}>
      <Container className="organizer tournament">
        <Header
          title={tournament ? `${tournament.name}` : "Loading..."}
          renderTitleAction={(): JSX.Element => (
            <>
              <CopyLink />
              <WaitingMessage
                message={pauseMessage}
                position={isTournamentActive && activeTableId ? "bottom" : "top"}
              />
            </>
          )}
          renderVideoControls
          drawerItems={drawerItems}
          rightDrawerIcon={<MessagesBadge />}
          rightDrawer={{
            title: "Chat + Results + History",
            render: renderRightDrawer,
          }}
          renderHeaderVideoControls
          mobileModeEnabled
        />
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            overflowY: "auto",
            scrollBehavior: "smooth",
          }}
        >
          {!tournament && <div className="loading">Loading...</div>}
          {tournament?.status === TournamentStatus.Initialized && (
            <WaitingRoom
              tournament={tournament}
              onActionClicked={onStart}
              actionMessage="Start the Tournament"
              waitingMessage={
                tournament.status === TournamentStatus.Initialized
                  ? "Tournament waiting to start..."
                  : ""
              }
              showCopyLink={tournament.organizerId === user.uid}
              currentUserId={user.uid}
              isOrganizer
              shouldRenderActionBtn={isUserOrganizer}
              onSelectTable={async (tableId: string) => { }}
            />
          )}
          {showResults && <Results tournament={tournament} />}
          {tables && isTournamentActive && !shouldRenderAutomation && (
            <div className="tournamentContainer">
              <div className="search">
                <TextField
                  placeholder="Search by typing a table number or player name..."
                  value={query}
                  onChange={(ev): void => setQuery(ev.target.value)}
                  fullWidth
                  size="medium"
                />
              </div>
              {!filteredTables.length && (
                <div className="empty">Search for a table...</div>
              )}
              {filteredTables?.map((table) => (
                <div
                  key={table.id}
                  className={`tournamentTable ${activeTableId === table.id ? "active" : ""}`}
                  onClick={() => {
                    if (activeTableId !== table.id) {
                      onSelectTable(table, true);
                    }
                  }}
                >
                  <span className="hover">{table.name}</span>
                  {filteredTables.length > 5 && (
                    <div className="light-table">{table.name}</div>
                  )}
                  {filteredTables.length <= 5 && (
                    <NetworkStatusVisibilityContext.Provider value>
                      <Table
                        id={table.id}
                        tournament={tournament}
                      />
                    </NetworkStatusVisibilityContext.Provider>
                  )}
                  {table.id === activeTableId && (
                    <Fab
                      color="secondary"
                      aria-label="back-to-lobby"
                      onClick={(ev): void => {
                        ev.stopPropagation();
                        onSelectTable(null, false);
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
                  {isAdmin && table.id === activeTableId && (
                    <Fab
                      color="secondary"
                      aria-label="account-info"
                      onClick={(ev): void => {
                        ev.stopPropagation();
                        onShowAdminOptions();
                      }}
                      style={{
                        position: "absolute",
                        top: "1rem",
                        left: "6rem",
                        zIndex: 100,
                      }}
                    >
                      <SupervisorAccountIcon />
                    </Fab>
                  )}
                  {shouldRenderDetailsOnTable && (
                    <TournamentDetails tournament={tournament} />
                  )}
                </div>
              ))
              }
            </div>
          )}
          {shouldRenderAutomation && (
            <DebugTournament
              tournament={tournament}
              tables={filteredTables}
              onAdvanceHand={onAdvanceHand}
            />
          )}
          {shouldRenderDetailsOnLobby && (
            <TournamentDetails tournament={tournament} />
          )}
          {tournament && (
            <AdministerDialog
              tableId={activeTableId}
              tournamentId={tournament.id}
              tournament={tournament}
              open={showAdministerDialog}
              onClose={(): void => setShowAdministerDialog(false)}
            />
          )}
        </div>
      </Container>
    </ChatProvider>
  );
}

export default FirebaseOrganizerTournament;
