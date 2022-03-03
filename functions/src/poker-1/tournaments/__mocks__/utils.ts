import {
  GameMode,
  GameStage,
  GameType,
  IGame,
  ITournamentDetails,
  ITournamentPlayer,
  PlayerRole,
  TournamentStatus,
} from "../../../engine/types";

export function createTournament(
  name: string,
  playerCount: number,
  tableCount: number
) {
  const tournament: ITournamentDetails = {
    winners: [
      { percent: 0.8, rank: 0 },
      { percent: 0.2, rank: 1 },
    ],
    pauseForRoundChange: 0,
    pauseForTopUp: 0,
    pauseForRebuy: 0,
    topUpAmount: 0,
    startingStack: 1000,
    type: GameType.MultiTableTournament,
    buyIn: 20,
    rebuysThroughRound: -1,
    tables: [] as IGame[],
    organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
    name,
    roundInterval: 4,
    paymentId: "free",
    // tableIds: [] as string[],
    activeRoundId: 1,
    rounds: [
      { bigBlind: 2000, roundIndex: 0, id: 0 },
      { bigBlind: 2000, roundIndex: 1, id: 1 },
      { bigBlind: 2000, roundIndex: 2, id: 2 },
      { bigBlind: 2000, roundIndex: 3, id: 3 },
      { bigBlind: 2000, roundIndex: 4, id: 4 },
    ],
    pauseDuration: 0,
    players: {},
    status: TournamentStatus.Active,
  };
  const tables: IGame[] = [];
  for (let i = 0; i < tableCount; ++i) {
    tables.push({
      increment: 1,
      type: GameType.MultiTableTournament,
      prng: "mulberry32",
      buyIn: 20,
      stage: GameStage.Active,
      name: `Tournament Table #${i}`,
      timestamp: 1596733227050,
      id: `table_${i}`,
      currentBigBlind: tournament.rounds[0].bigBlind,
      players: {},
      activeHandId: null,
      hands: [],
      startingBigBlind: 0,
      blindDoublingInterval: 0,
      mode: GameMode.Multi_Table_Tournament,
    });
  }
  const players: { [key: string]: ITournamentPlayer } = {};
  for (let i = 0; i < playerCount; ++i) {
    const tableId = i % tables.length;
    const player: ITournamentPlayer = {
      id: `player_${i}`,
      role: PlayerRole.Player,
      photoURL: "",
      name: `Dummy Player ${i}`,
      position: i,
      email: `${i}@pokerinplace.app`,
      contributed: 20,
      stack: 1000,
      active: true,
      removed: false,
      tableId: tables[tableId].id,
      rebuys: [],
      arrived: true,
    };
    players[player.id] = player;
    tables[tableId].players[player.id] = player;
  }
  tournament.tables = tables;
  tournament.players = players;
  return tournament;
}
