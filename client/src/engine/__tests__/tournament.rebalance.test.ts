import {
  advanceTournamentHand,
} from "../tournament";
import {
  GameDirective,
  ITournamentDetails,
  GameStage,
  IPayout,
} from "../types";

import { createTournament } from "./testHelpers";

describe("Tournament rebalancing", () => {
  describe("Performant rebalancing", () => {
    it("Should take players from one table to another, but let third table continue", () => {
      let tournament: ITournamentDetails = {
        ...createTournament({ name: "Rebalance", playerCount: 24, tableCount: 3 }),
        enablePerformantRebalances: true,
      };

      // Knock 2 people out - This should cause someone from another table to get moved
      const table0Players = Object.keys(tournament.tables[0].players);
      tournament.tables[0].players[table0Players[0]].stack = 0;
      tournament.tables[0].players[table0Players[0]].rebuyDeclined = true;
      tournament.tables[0].players[table0Players[1]].stack = 0;
      tournament.tables[0].players[table0Players[1]].rebuyDeclined = true;
      tournament.tables[0].hands[0].payouts = [
        {
          amount: 0,
          uid: table0Players[2],
          total: 0,
          cards: [],
          handCards: [],
          handDescription: "",
        },
      ];

      let resultTable0 = advanceTournamentHand(
        tournament,
        tournament.tables[0]
      );

      expect(resultTable0).toMatchObject({
        gameUpdates: {
          directive: GameDirective.NextHand,
        },
      });

      tournament = resultTable0.tournamentUpdates.tournament;
      if (resultTable0.gameUpdates) {
        tournament.tables = tournament.tables.map((t) =>
          t.id === resultTable0.gameUpdates.game.id
            ? resultTable0.gameUpdates.game
            : t
        );
      }
      tournament.tables[1].hands[0].payouts = [
        {
          amount: 0,
          uid: Object.keys(tournament.tables[1].players)[0],
          total: 0,
          cards: [],
          handCards: [],
          handDescription: "",
        },
      ];
      const resultTable1 = advanceTournamentHand(
        tournament,
        tournament.tables[1]
      );
      expect(resultTable1).toMatchObject({
        gameUpdates: {
          directive: GameDirective.NextHand,
        },
      });
      tournament = resultTable1.tournamentUpdates.tournament;
      if (resultTable1.gameUpdates) {
        tournament.tables = tournament.tables.map((t) =>
          t.id === resultTable1.gameUpdates.game.id
            ? resultTable1.gameUpdates.game
            : t
        );
      }
      tournament.tables[2].hands[0].payouts = [
        {
          amount: 0,
          uid: Object.keys(tournament.tables[2].players)[0],
          total: 0,
          cards: [],
          handCards: [],
          handDescription: "",
        },
      ];
      const resultTable2 = advanceTournamentHand(
        tournament,
        tournament.tables[2]
      );
      expect(resultTable2).toMatchObject({
        gameUpdates: {
          directive: GameDirective.NextHand,
        },
      });
      expect(resultTable2.gameUpdates.game.activeHandId).not.toEqual(
        tournament.tables[2].activeHandId
      );
      tournament = resultTable2.tournamentUpdates.tournament;
      if (resultTable2.gameUpdates) {
        tournament.tables = tournament.tables.map((t) =>
          t.id === resultTable2.gameUpdates.game.id
            ? resultTable2.gameUpdates.game
            : t
        );
      }
      const resultTournament = advanceTournamentHand(tournament, null);
      expect(resultTournament.tournamentUpdates.tournament).toMatchObject({
        players: {
          'player_0': { removed: true },
          'player_3': { removed: true },
          'player_1': { tableId: 'table_0' },
        },
      });
    });

    it("Should consolidate tables after players elimination", () => {
      let tournament: ITournamentDetails = {
        ...createTournament({ name: "Rebalance", playerCount: 8, tableCount: 2 }),
        enablePerformantRebalances: true,
        minTableSizeBeforeRebalance: 4,
      };

      expect(tournament).toMatchObject({
        players: {
          'player_0': { removed: false, tableId: 'table_0' },
          'player_1': { removed: false, tableId: 'table_1' },
          'player_2': { removed: false, tableId: 'table_0' },
          'player_3': { removed: false, tableId: 'table_1' },
          'player_4': { removed: false, tableId: 'table_0' },
          'player_5': { removed: false, tableId: 'table_1' },
          'player_6': { removed: false, tableId: 'table_0' },
          'player_7': { removed: false, tableId: 'table_1' },
        },
      });

      tournament.tables[0].hands[0].payouts = loseWithPlayersOnTable({
        tournament,
        tableIndex: 0,
        loserIndexes: [0, 1],
        winnerIndex: 2
      })
      tournament = advanceHandOnTable({ tournament, tableIndex: 0 });

      tournament.tables[1].hands[0].payouts = loseWithPlayersOnTable({
        tournament,
        tableIndex: 1,
        loserIndexes: [0, 1],
        winnerIndex: 2
      })
      tournament = advanceHandOnTable({ tournament, tableIndex: 1 });

      const resultTournament = advanceTournamentHand(tournament, null);
      tournament = resultTournament.tournamentUpdates.tournament;

      expect(resultTournament.tournamentUpdates.tournament.tables[0]).toMatchObject({
        stage: GameStage.Ended
      });
      expect(resultTournament.tournamentUpdates.tournament.tables[1]).toMatchObject({
        stage: GameStage.Active
      });
      expect(resultTournament.tournamentUpdates.tournament).toMatchObject({
        players: {
          'player_0': { removed: true, tableId: null },
          'player_1': { removed: true, tableId: null },
          'player_2': { removed: true, tableId: null },
          'player_3': { removed: true, tableId: null },
          'player_4': { removed: false, tableId: 'table_1' },
          'player_5': { removed: false, tableId: 'table_1' },
          'player_6': { removed: false, tableId: 'table_1' },
          'player_7': { removed: false, tableId: 'table_1' },
        },
      });
      expect(resultTournament.tournamentUpdates.tournament.tables[1]).toMatchObject({
        players: {
          'player_4': { removed: false },
          'player_5': { removed: false },
          'player_6': { removed: false },
          'player_7': { removed: false },
        },
      });
    });
  });
});

export const loseWithPlayersOnTable = (
  { tournament, tableIndex, loserIndexes, winnerIndex }: { tournament: ITournamentDetails, tableIndex: number, loserIndexes: number[], winnerIndex: number }
): IPayout[] => {
  const tablePlayers = Object.keys(tournament.tables[tableIndex].players);

  loserIndexes.forEach((loserIndex: number) => {
    tournament.tables[tableIndex].players[tablePlayers[loserIndex]].stack = 0;
    tournament.tables[tableIndex].players[tablePlayers[loserIndex]].rebuyDeclined = true;
  })

  return [
    {
      amount: 0,
      uid: tablePlayers[winnerIndex],
      total: 0,
      cards: [],
      handCards: [],
      handDescription: "",
    },
  ];
}

export const advanceHandOnTable = (
  { tournament, tableIndex }: { tournament: ITournamentDetails, tableIndex: number }
): ITournamentDetails => {
  let resultTable = advanceTournamentHand(
    tournament,
    tournament.tables[tableIndex]
  );

  const updatedTournament = resultTable.tournamentUpdates.tournament;
  if (resultTable.gameUpdates) {
    updatedTournament.tables = updatedTournament.tables.map((t) =>
      t.id === resultTable.gameUpdates.game.id
        ? resultTable.gameUpdates.game
        : t
    );
  }

  return updatedTournament;
}