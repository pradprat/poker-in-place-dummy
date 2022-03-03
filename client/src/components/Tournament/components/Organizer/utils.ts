import { GameStage, ILoggedInUser, IPlayer, ITournamentDetails, PlayerRole } from "../../../../engine/types";

import { ITableInfo } from "./interface";

const isTableNameMatch = (tableName: string, query: string): boolean => tableName.toLowerCase().indexOf(query) >= 0;

const isPlayerNameMatch = (players: Record<string, IPlayer>, query: string): boolean => Object
  .values(players)
  .some((player) => player?.name.toLowerCase().indexOf(query) >= 0);

export const getFilteredTableIds = ({ tables, query }: { tables: ITableInfo[]; query?: string }): Set<string> => {
  const loweredQuery = (query || "").toLowerCase();

  const filteredTableIds = tables
    .filter((t) => isTableNameMatch(t.name, loweredQuery) || isPlayerNameMatch(t.players, loweredQuery))
    .map((t) => t.id);

  return new Set(filteredTableIds);
};

export const isTableActive = (table: ITableInfo, isTournamentEnded: boolean): boolean =>
  ([GameStage.Active, GameStage.Paused].includes(table.stage) || isTournamentEnded) &&
  Object.values(table.players).filter((p) => !p.removed).length > 0;

export const isOrganizer = (tournament: ITournamentDetails, user: ILoggedInUser): boolean => {
  if (tournament?.players[user.uid]) {
    return tournament.players[user.uid].role === PlayerRole.Organizer;
  }
  return tournament?.organizerId === user.uid;
};
export const isFeaturedGuest = (tournament: ITournamentDetails, user: ILoggedInUser): boolean => {
  if (tournament?.players[user.uid]) {
    return tournament.players[user.uid].role === PlayerRole.Featured;
  }
  return false;
};