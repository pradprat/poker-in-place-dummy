import {
  advanceTournamentHand,
} from "../tournament";
import {
  GameMode,
  GameStage,
  GameType,
  IGame,
  ITournamentDetails,
  ITournamentPlayer,
  PlayerRole,
  TournamentStatus,
  HandRound
} from "../types";


export interface IFinishHandOnTournamentTableParams {
  tournament: ITournamentDetails,
  tableIndex: number,
  payoutPlayerIndex: number,
}

export const finishHandOnTournamentTable = ({ tournament, tableIndex, payoutPlayerIndex }: IFinishHandOnTournamentTableParams): ITournamentDetails => {
  const tablePlayers = Object.keys(tournament.tables[tableIndex].players);
  tournament.tables[tableIndex].hands[0].payouts = [
    {
      amount: 0,
      uid: tablePlayers[payoutPlayerIndex],
      total: 0,
      cards: [],
      handCards: [],
      handDescription: "",
    },
  ];

  const resultTable = advanceTournamentHand(tournament, tournament.tables[tableIndex]);
  if (resultTable.gameUpdates) {
    tournament.tables = tournament.tables.map((t) =>
      t.id === resultTable.gameUpdates.game.id
        ? resultTable.gameUpdates.game
        : t
    );
  }

  const { tournamentUpdates } = advanceTournamentHand(resultTable.tournamentUpdates.tournament, null);
  return tournamentUpdates.tournament;
}

export function createTournament({
  name,
  playerCount,
  tableCount
}: {
  name: string,
  playerCount: number,
  tableCount: number
}) {
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
      rebuys: [],
      arrived: true,
    };
    players[player.id] = { ...player, tableId: tables[tableId].id };
    tables[tableId].players[player.id] = player;
  }
  tournament.tables = tables;
  tournament.players = players;

  for (let i = 0; i < tournament.tables.length; ++i) {
    const id = String(i);
    tournament.tables[i].activeHandId = id;
    tournament.tables[i].hands.push({
      id,
      activeDeckId: "TESTDECK",
      cardsDealt: 0,
      smallBlind: 0,
      bigBlind: 0,
      activeRound: HandRound.Flop,
      rounds: [],
      playerStates: [],
      payouts: [],
      payoutsApplied: false,
      dealerId: Object.values(tournament.tables[i].players)[0].id,
      smallBlindId: Object.values(tournament.tables[i].players)[1].id,
      bigBlindId: Object.values(tournament.tables[i].players)[2].id,
      actingPlayerId: Object.values(tournament.tables[i].players)[3].id,
      playerIds: Object.keys(tournament.tables[i].players),
    });
  }

  return tournament;
}
