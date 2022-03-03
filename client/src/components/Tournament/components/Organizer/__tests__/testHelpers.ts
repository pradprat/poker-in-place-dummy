import {
  GameStage,
  IPlayer,
  ITournamentPlayer,
  PlayerRole,
} from "../../../../../engine/types";
import { ITableInfo } from "../interface";

export const generatePlayers = (playersCount: number, removed = false): Record<string, IPlayer> => {
  const players: { [key: string]: ITournamentPlayer } = {};

  for (let i = 0; i < playersCount; ++i) {
    const playerId = `player_${i}`;

    players[playerId] = {
      id: playerId,
      role: PlayerRole.Player,
      photoURL: "",
      name: `Dummy Player ${i}`,
      position: i,
      email: `${i}@pokerinplace.app`,
      contributed: 20,
      stack: 1000,
      active: true,
      removed,
      rebuys: [],
      arrived: true,
    };
  }

  return players;
}

export const generateStandardTable = (id: number, stage = GameStage.Active): ITableInfo => ({
  stage,
  id: `id-${id}`,
  name: `table-0${id}`,
  players: generatePlayers(3),
});

export const generateStandardTables = (): ITableInfo[] => [generateStandardTable(1), generateStandardTable(2)];