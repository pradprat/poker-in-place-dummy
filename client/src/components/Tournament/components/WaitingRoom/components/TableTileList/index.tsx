import React, { useState } from "react";
import { TwilioError } from "twilio-video";
import { TextField } from "@material-ui/core";

import "./styles.css";
import { GameTable } from "../../../../../../Game";
import { useAppState } from "../../../../../../twilio/state";
import {
  IGame,
  IAction,
  IPlayerState,
  IHand,
  ITournamentDetails,
  TournamentStatus,
  IUserDetails,
  ILoggedInUser,
  GameStage,
  IPlayer,
} from "../../../../../../engine/types";

interface IFirebaseTableTileListParams {
  tournament: ITournamentDetails;
  onSelectTable: { (tableId: string, isActive: boolean): Promise<void> };
}

function FirebaseTableTileList(props: IFirebaseTableTileListParams) {
  const { user, userDetails, setError } = useAppState();

  const { tournament } = props;

  const tables: IGame[] = tournament.tableIdentifiers
    ? Object.values(tournament.tableIdentifiers)
      .sort((t1, t2) => t1.name.localeCompare(t2.name))
      .map((t) => ({
        id: t.id,
        players: Object.values(tournament.players)
          .filter((p) => p.tableId === t.id)
          .sort((p1, p2) => p1.name?.localeCompare(p2.name))
          .reduce((map, player) => ({ ...map, [player.id]: player }), {}),
        stage: t.stage,
        activeHandId: t.activeHandId,
        buyIn: 0,
        currentBigBlind: 0,
        hands: [],
        startingBigBlind: 0,
        increment: 0,
        blindDoublingInterval: 0,
        type: null,
        name: t.name,
        mode: null,
      }))
    : [];

  return (
    <TableTileList
      tournament={tournament}
      tables={tables}
      user={user}
      userDetails={userDetails}
      activeHands={[]}
      playerState={null} // playerState}
      setError={setError}
      onSelectTable={props.onSelectTable}
      activeTableId={null}
    />
  );
}

interface ITournamentProps {
  tournament?: ITournamentDetails;
  tables?: IGame[];
  activeTableId?: string;
  activeHands: IHand[];
  playerState?: IPlayerState;
  user: ILoggedInUser;
  userDetails: IUserDetails;
  setError: { (error: TwilioError): void };
  showFilter?: boolean;
  onSelectTable: { (tableId: string, isActive: boolean): Promise<void> };
}

export function TableTileList(props: ITournamentProps) {
  const [query, setQuery] = useState("");

  const {
    tournament,
    tables,
    user,
    userDetails,
    activeHands,
    playerState,
    activeTableId,
  } = props;

  const onSelectTable = (table: IGame, isActive: boolean) => {
    props.onSelectTable(table.id, isActive);
  };

  const isTournamentActive = tournament && ![TournamentStatus.Initialized, TournamentStatus.Finalized].includes(tournament?.status);

  const lowerQuery = (query || "").toLowerCase();
  const filteredTableIdsFromPlayers = tournament?.players
    ? Object.values(tournament.players)
      .filter((p) => p.tableId && p?.name.toLowerCase().indexOf(query) >= 0)
      .map((p) => p.tableId)
    : [];
  const filteredTableIdsFromTables =
    tables &&
    tables
      .filter((t) => t.name?.toLowerCase().indexOf(lowerQuery) >= 0)
      .map((t) => t.id);

  const filteredTableIds = new Set(
    filteredTableIdsFromPlayers.concat(...filteredTableIdsFromTables)
  );

  const isTableActive = (table: IGame) =>
    (table.stage === GameStage.Active || table.stage === GameStage.Paused) &&
    Object.values(table.players).filter((p) => !p.removed).length;

  let filteredActiveTables = tables
    ? tables
      .filter(
        (table) => filteredTableIds.has(table.id) && isTableActive(table)
      )
      .filter((t) => !activeTableId || t.id === activeTableId)
    : [];
  if (tables && activeTableId && !filteredActiveTables.length) {
    filteredActiveTables = tables.filter(
      (table) => filteredTableIds.has(table.id) && isTableActive(table)
    );
  }
  const filteredSpilloverTables =
    tables && props.tournament.enableOverflowRooms
      ? tables
        .filter(
          (table) => filteredTableIds.has(table.id) && !isTableActive(table)
        )
        .filter((t) => !activeTableId || t.id === activeTableId)
      : [];

  const tableGroups = [
    { title: "Active Tables", tables: filteredActiveTables, isActive: true },
  ];

  if (props.tournament.enableOverflowRooms) {
    tableGroups.push({
      title: "Discussion Tables",
      tables: filteredSpilloverTables.map((t) => ({
        ...t,
        players: Object.values(tournament.players)
          .filter((p) => p.tableId === t.id)
          .reduce(
            (map, value) => ({
              ...map,
              [value.id]: { ...value, removed: false } as IPlayer,
            }),
            {}
          ),
      })),
      isActive: false,
    });
  }

  return tables && isTournamentActive ? (
    <div className="tableTileContainer">
      <div className="search">
        <TextField
          placeholder="Search by typing a table number or player name..."
          value={query}
          onChange={(ev) => {
            setQuery(ev.target.value);
          }}
          fullWidth
          size="medium"
        />
      </div>
      {tableGroups.map((group) => (
        <>
          <h2>{group.title}</h2>
          <div className="tables-container">
            {group.tables?.map((table) => (
              <div
                key={table.name}
                className="tableTileTable"
                onClick={() => onSelectTable(table, group.isActive)}
              >
                <span className="hover">{table.name}</span>
                {group.tables.length > 5 ? (
                  <div className="light-table">{table.name}</div>
                ) : (
                  <GameTable
                    table={{ ...table, tournamentDetails: tournament }}
                    user={user}
                    userDetails={userDetails}
                    activeHand={activeHands.find(
                      (h) => h.id === table.activeHandId
                    )}
                    playerState={playerState}
                    onTimeoutPlayer={() => { }}
                    onAdvanceHand={async (action: IAction, uid: string) => { }}
                    onRebuy={async (result: boolean) => { }}
                    showActions={false}
                  />
                )}
              </div>
            ))}
            {!group.tables.length && (
              <div className="empty">No matching tables...</div>
            )}
          </div>
        </>
      ))}
    </div>
  ) : null;
}

export default FirebaseTableTileList;
