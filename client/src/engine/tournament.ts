/* eslint-disable no-loop-func, no-lone-blocks */
import {
  IGame,
  IAction,
  IBlindRound,
  ITournamentDetails,
  TournamentStatus,
  IPlayer,
  ITournamentAction,
  TournamentDirective,
  GameDirective,
  GameStage,
  ITournmanentTableAction,
  ITournmanentPlayerAction,
  ITournmanentPauseAction,
  ITournamentRoundAction,
  ITournamentPlayer,
  TournamentPauseReason,
  GameType,
  PlayerRole,
  TournamentRegistrationMode,
} from "./types";

import {
  advanceHand as advanceGameHand,
  canRebuyInTournament,
  getForcedAction,
  REBUY_TIME_IN_SECONDS,
  ROUND_BREAK_TIME_IN_SECONDS,
  ROUND_BREAK_FINAL_REBUY_TIME_IN_SECONDS,
  isPlayerTabled,
} from "./";
import { getTournamentFinalizeTime } from "../utils/getTournamentFinalizeTime";

const merge = require("deepmerge");

export const MAX_TABLE_SIZE = 8;
export const MIN_TABLE_SIZE_BEFORE_REBALANCE = 8;

const stringify = require("json-stringify-safe");

const roundToNearestN = ({ roundUp = true }, n: number, value: number) => {
  const intValue = Math.floor(value);
  const remainder = intValue % n;

  let rounded;
  if (!remainder) {
    rounded = intValue;
  } else if (roundUp) {
    rounded = intValue + (n - remainder);
  } else {
    rounded = intValue - remainder;
  }

  return rounded;
};

export function getTabledPlayersInTournament(
  tournament: ITournamentDetails
): ITournamentPlayer[] {
  return Object.values(tournament.players).filter((p) =>
    isPlayerTabledInTournament(tournament, p)
  );
}

export function isPlayerTabledInTournament(
  tournament: ITournamentDetails,
  player: ITournamentPlayer
) {
  const isOpenTournament = tournament.registrationMode !== TournamentRegistrationMode.Code;
  const isAutomationTournament = tournament.enableAutomation;

  return !!player &&
    !player.removed &&
    (isOpenTournament || isAutomationTournament || player.arrived)
}

export function isPlayerTabledAndActiveInTournament(
  tournament: ITournamentDetails,
  player: IPlayer
) {
  return !!player && !player.removed && player.active;
}

export function isPlayerAliveInTournament(
  tournament: ITournamentDetails,
  player: IPlayer
) {
  return !!player && player.stack > 0 && !player.removed && !player.willRemove;
}

export function generateTournamentStructure(
  buyIn: number,
  playerCount: number,
  startingStack: number = 1000,
  duration: number,
  type: GameType = GameType.Tournament
): ITournamentDetails {
  const startingBigBlind = startingStack / 50;
  const bigBlindFinal = (startingStack * playerCount) / 10;
  const roundInterval = 10 + (duration / 60 - 1) * 5;

  const magicNumber = 1.6;
  const exponentialIncrease =
    startingStack / Math.pow(magicNumber, duration / roundInterval - 1);

  const getRoundAmount = (blindAmount: number) => {
    if (blindAmount < 50) return 10;
    if (blindAmount < 150) return 30;
    if (blindAmount < 400) return 50;
    if (blindAmount < 800) return 100;
    return 150;
  };

  let level = 0;
  let priorBigBlind = startingBigBlind;

  const blindSchedule: IBlindRound[] = [];
  while (true) {
    const bigBlindCurrentUnrounded =
      exponentialIncrease * Math.pow(magicNumber, level);
    const bigBlindCurrent = roundToNearestN(
      { roundUp: true },
      getRoundAmount(bigBlindCurrentUnrounded),
      bigBlindCurrentUnrounded
    );
    if (bigBlindCurrent >= bigBlindFinal) {
      blindSchedule.push({
        id: level + 1,
        roundIndex: level,
        bigBlind: Math.min(priorBigBlind * 2, bigBlindFinal * 1.5),
      });
      break;
    }
    blindSchedule.push({
      id: level + 1,
      roundIndex: level,
      bigBlind: bigBlindCurrent,
    });
    priorBigBlind = bigBlindCurrent;
    level++;
  }

  return {
    buyIn,
    roundInterval,
    startingStack,
    winners: [
      { rank: 1, percent: 0.8 },
      { rank: 2, percent: 0.2 },
    ],
    rounds: blindSchedule,
    rebuysThroughRound: -1,
    players: {},
    status: TournamentStatus.Initialized,
    pauseForRoundChange: ROUND_BREAK_TIME_IN_SECONDS * 1000,
    pauseForTopUp: ROUND_BREAK_FINAL_REBUY_TIME_IN_SECONDS * 1000,
    pauseForRebuy: REBUY_TIME_IN_SECONDS * 1000,
    topUpAmount:
      type === GameType.MultiTableTournament
        ? Math.floor(startingStack * 0.5)
        : 0,
    type,
  };
}

const hasActiveHand = (table: IGame) => {
  return (
    table.activeHandId !== null &&
    table.activeHandId !== undefined
  );
};

export const checkTournamentBlinds = (
  tournamentDetails: ITournamentDetails
): IBlindRound => {
  const activeRound = tournamentDetails.rounds.find(
    (round) => round.id === tournamentDetails.activeRoundId
  );
  // console.log("checkTournamentBlinds", activeRound);
  let nextActiveRound = activeRound;
  const now = new Date().getTime();
  if (!activeRound) {
    nextActiveRound = {
      ...tournamentDetails.rounds[0],
      timestamp: new Date().getTime(),
    };
  } else {
    const roundInterval = tournamentDetails.roundInterval * 1000 * 60;
    // console.log(
    //   "checkTournamentBlinds1",
    //   activeRound.timestamp,
    //   roundInterval,
    //   now
    // );
    if (activeRound.timestamp + roundInterval <= now) {
      // Round expired
      const nextRound = tournamentDetails.rounds.find(
        (round) => round.roundIndex === activeRound.roundIndex + 1
      );
      // console.log("checkTournamentBlinds2", nextRound);
      if (nextRound) {
        nextActiveRound = {
          ...nextRound,
          timestamp: new Date().getTime(),
        };
      }
    }
  }
  return nextActiveRound;
};

function hasTablesWithActiveHands(tournament: ITournamentDetails) {
  return tournament.tables.some(hasActiveHand);
}

// It will be necessary to simply balance tables when a player getting eliminated results in a table having at least 2 fewer players than at least one other table in the same tournament. Provided the number of tables cannot be reduced by breaking a table, we follow these steps:
// If a player being eliminated from a tournament means the remaining players can now be seated on one less table than is currently running, a table is selected for dissolving/breaking. Players from the broken table are moved according to their position relative to the button during the last hand played at the table being done away with.

export function rebalanceTables(
  tournament: ITournamentDetails
): ITournamentAction[] {
  if (tournament.status === TournamentStatus.PauseRequested) {
    if (!hasTablesWithActiveHands(tournament)) {
      return [{ directive: TournamentDirective.Pause }];
    }
  }
  const actions: ITournamentAction[] = [];
  const eliminatedPlayers: IPlayer[] = [];
  const tableActivePlayerCount: {
    [key: string]: { count: number; table: IGame };
  } = {};
  let activePlayerCount = 0;
  const ignorePlayers = new Set();
  for (const table of tournament.tables) {
    // Determine eliminated players
    for (const player of Object.values(table.players)) {
      if (!player.removed) {
        if (
          !isPlayerAliveInTournament(tournament, player) &&
          !canRebuyInTournament(tournament, player)
        ) {
          // We have a newly eliminated player
          eliminatedPlayers.push(player);
          ignorePlayers.add(player.id);
          actions.push({
            directive: TournamentDirective.EliminatePlayer,
            data: { playerId: player.id, tableId: table.id },
          });
        } else {
          if (!tableActivePlayerCount[table.id]) {
            tableActivePlayerCount[table.id] = { count: 0, table };
          }
          tableActivePlayerCount[table.id].count++;
          activePlayerCount++;
        }
      } else {
        // //console.log('ignore', player);
        ignorePlayers.add(player.id);
      }
    }
  }
  if (eliminatedPlayers.length) {
    let willNeedRebalancing = false;
    // Go through each table
    let sortedTables = Object.values(tableActivePlayerCount).sort(
      (t1, t2) => t1.count - t2.count
    );
    // Check if we can remove a table
    const optimumTableSizeBeforeRebalance = Math.min(
      MAX_TABLE_SIZE,
      (tournament.minTableSizeBeforeRebalance || MAX_TABLE_SIZE) + 1
    );
    let neededTableCount = Math.ceil(
      activePlayerCount / optimumTableSizeBeforeRebalance
    );

    // TODO - we need to handle having 2 tables under the minTableSizeBeforeRebalance
    // but that when combined would not be under minTableSizeBeforeRebalance
    // Right now we are not rebalancing those
    // Let's just handle this one edge case explicitly
    if (activePlayerCount <= MAX_TABLE_SIZE) {
      neededTableCount = 1;
    }

    // Can we be more flexible here? That we only rebalance based on the
    const canBustTable = neededTableCount < sortedTables.length;

    console.log(
      stringify({
        neededTableCount,
        sortedTables: sortedTables.map((st) => ({
          count: st.count,
          table: {
            players: st.table.players,
            id: st.table.id,
            activeHandId: st.table.activeHandId,
          },
        })),
        activePlayerCount,
        MAX_TABLE_SIZE,
      })
    );

    if (canBustTable) {
      willNeedRebalancing = true;
      const tablesToBust = sortedTables.slice(
        0,
        sortedTables.length - neededTableCount
      );
      let tablesToKeep = sortedTables.slice(
        sortedTables.length - neededTableCount,
        sortedTables.length
      );
      // Take all the people in the bust tables and return move player directives
      for (const table of tablesToBust) {
        const bustedTablePlayers = Object.values(table.table.players).filter(
          (player) => !ignorePlayers.has(player.id)
        );

        console.log(
          "EliminateTable",
          stringify({ id: table.table.id, bustedTablePlayers })
        );
        // console.log(
        //   "EliminateTable",
        //   stringify({
        //     sortedTables: sortedTables.map((t) => ({
        //       count: t.count,
        //       id: t.table.id,
        //       players: Object.keys(t.table.players).map((id) => ({
        //         id,
        //         stack: t.table.players[id].stack,
        //         remove: t.table.players[id].removed,
        //       })),
        //     })),
        //     bustedTablePlayers,
        //     eliminatedPlayers,
        //     ignorePlayers: Array.from(ignorePlayers),
        //     tournamentPlayers: Object.keys(tournament.players).map((id) => ({
        //       id,
        //       stack: tournament.players[id].stack,
        //       remove: tournament.players[id].removed,
        //     })),
        //     tournamentTables: tournament.tableIds,
        //   })
        // );
        //         //console.log(sortedTables,
        // bustedTablePlayers,
        // eliminatedPlayers,
        // ignorePlayers);
        for (const player of bustedTablePlayers) {
          // Add players to the tables with few people
          tablesToKeep = tablesToKeep.sort((t1, t2) => t1.count - t2.count);
          // //console.log(sortedTables, bustedTablePlayers);
          actions.push({
            directive: TournamentDirective.RemovePlayer,
            data: {
              playerId: player.id,
              tableId: table.table.id,
            },
          });
          actions.push({
            directive: TournamentDirective.AddPlayer,
            data: {
              playerId: player.id,
              tableId: tablesToKeep[0].table.id,
              player,
            },
          });
          tablesToKeep[0].count++;
        }

        // Add the bust action last so we can check for non-removed players
        actions.push({
          directive: TournamentDirective.EliminateTable,
          data: { tableId: table.table.id },
        });
      }
    } else if (sortedTables.length) {
      let maxTableSize = sortedTables[sortedTables.length - 1].count;
      // Allow for a min table size to be reached before rebalancing
      const minTableSizeBeforeRebalance =
        tournament.minTableSizeBeforeRebalance ||
        MIN_TABLE_SIZE_BEFORE_REBALANCE;
      let tablesNeedingBalancing = sortedTables.filter(
        (t) =>
          t.count < minTableSizeBeforeRebalance && t.count < maxTableSize - 1
      );
      // Loop through tables needing balancing until they are all balanced
      const movedPlayers: { [key: string]: IPlayer } = {};
      while (tablesNeedingBalancing.length) {
        // console.log(
        //   `tablesNeedingBalancing - ${tablesNeedingBalancing.length}`
        // );
        for (const table of tablesNeedingBalancing) {
          willNeedRebalancing = true;
          // Move players from the tables with the most players
          sortedTables = sortedTables.sort((t1, t2) => t2.count - t1.count);
          const tableRemovingPlayers = sortedTables[0];
          const tablePlayers = Object.values(
            tableRemovingPlayers.table.players
          ).filter(
            (player) => !ignorePlayers.has(player.id) //!eliminatedPlayers.find((p) => p.id === player.id)
          );
          for (const player of tablePlayers.filter(
            (p) => !movedPlayers[p.id]
          )) {
            actions.push({
              directive: TournamentDirective.AddPlayer,
              data: {
                playerId: player.id,
                tableId: table.table.id,
                player,
              },
            });
            actions.push({
              directive: TournamentDirective.RemovePlayer,
              data: {
                playerId: player.id,
                tableId: sortedTables[0].table.id,
              },
            });
            movedPlayers[player.id] = player;
            table.count++;
            // if (table.count > 8) {
            //   //console.log(
            //     stringify({
            //       sortedTables,
            //       table,
            //       movedPlayers,
            //       actions,
            //       maxTableSize,
            //       tablesNeedingBalancing,
            //     })
            //   );
            //   setTimeout(() => {
            //     process.exit(0);
            //   }, 1000);
            //   throw new Error("wtf mate");
            // }
            sortedTables[0].count--;
            break;
          }
          break;
        }
        sortedTables = sortedTables.sort((t1, t2) => t2.count - t1.count);
        maxTableSize = sortedTables[0].count;
        tablesNeedingBalancing = sortedTables.filter(
          (t) => t.count < maxTableSize - 1
        );
      }
    }

    // Pause the tournament before we move players between tables
    // Players can be removed whenever
    if (willNeedRebalancing) {
      // If we are paused, we also need all HANDS to be finished
      if (
        tournament.status !== TournamentStatus.PauseRequested &&
        tournament.status !== TournamentStatus.Paused
      ) {
        return [
          {
            directive: TournamentDirective.RequestPause,
            data: {
              duration: 0,
              message: "Play is paused while tables are rebalancing",
              reason: TournamentPauseReason.TableBalancing,
            },
          },
        ];
      } else {
        if (hasTablesWithActiveHands(tournament)) {
          // We're already paused, so just let the actions proceed
          return [];
        }
      }
    }
  }
  return actions;
}

type RebalancingTable = {
  count: number;
  table: IGame;
};

// If we are asking for a specific table, we just need to know if that
// table is involved in the rebalancing. If we're asking across the tournament
// we need to know if any hands need to end
const doesPerformantRebalanceNeedHandsToEnd = (
  tournament: ITournamentDetails,
  actions: ITournamentAction[],
  activeTableId?: string,
  // If we haven't evaluated game state, block new hands from being
  // dealt if the table in question is needed for rebalancing
  preHandAdvance?: boolean
) => {
  return actions.some((action) => {
    switch (action.directive) {
      case TournamentDirective.AddPlayer: {
        const data = action.data as ITournmanentPlayerAction;
        const correspondingRemovePlayer = actions.find(
          (a) =>
            a.directive === TournamentDirective.RemovePlayer &&
            (a.data as ITournmanentPlayerAction).playerId === data.playerId
        );
        // Only allow adding a player if we also remove them
        if (correspondingRemovePlayer) {
          const removeData = action.data as ITournmanentPlayerAction;
          if (activeTableId && removeData.tableId !== activeTableId) {
            return false;
          }
          const table = tournament.tables.find(
            (t) => t.id === removeData.tableId
          );
          if (!!activeTableId) {
            return true;
          }
          return preHandAdvance || !!table.activeHandId;
        }
        return false;
      }
      case TournamentDirective.RemovePlayer: {
        const data = action.data as ITournmanentPlayerAction;
        if (activeTableId && data.tableId !== activeTableId) {
          return false;
        }
        const table = tournament.tables.find((t) => t.id === data.tableId);
        if (!!activeTableId) {
          return true;
        }
        return preHandAdvance || !!table.activeHandId;
      }
      case TournamentDirective.EliminatePlayer: {
        const data = action.data as ITournmanentPlayerAction;
        if (activeTableId && data.tableId !== activeTableId) {
          return false;
        }
        const table = tournament.tables.find((t) => t.id === data.tableId);
        if (!!activeTableId) {
          return true;
        }
        return preHandAdvance || !!table.activeHandId;
      }
      case TournamentDirective.EliminateTable: {
        const data = action.data as ITournmanentTableAction;
        if (activeTableId && data.tableId !== activeTableId) {
          return false;
        }
        const table = tournament.tables.find((t) => t.id === data.tableId);
        if (!!activeTableId) {
          return true;
        }
        return preHandAdvance || !!table.activeHandId;
      }
    }
    return false;
  });
};

// If the active table is one that can fulfill the moves needed
export function rebalanceTablesPerformantly(
  tournament: ITournamentDetails
): ITournamentAction[] {
  // Pausing not needed?
  if (tournament.status === TournamentStatus.PauseRequested) {
    if (!hasTablesWithActiveHands(tournament)) {
      return [{ directive: TournamentDirective.Pause }];
    }
  }
  const actions: ITournamentAction[] = [];
  const eliminatedPlayers: IPlayer[] = [];
  const tableActivePlayerCount: Record<string, { count: number; table: IGame }> = {};
  let activePlayerCount = 0;
  const ignorePlayers = new Set();
  for (const table of tournament.tables) {
    // Determine eliminated players
    for (const player of Object.values(table.players)) {
      if (!player.removed) {
        if (
          !isPlayerAliveInTournament(tournament, player) &&
          !canRebuyInTournament(tournament, player)
        ) {
          // We have a newly eliminated player
          eliminatedPlayers.push(player);
          ignorePlayers.add(player.id);
          actions.push({
            directive: TournamentDirective.EliminatePlayer,
            data: { playerId: player.id, tableId: table.id },
          });
        } else {
          if (!tableActivePlayerCount[table.id]) {
            tableActivePlayerCount[table.id] = { count: 0, table };
          }
          tableActivePlayerCount[table.id].count++;
          activePlayerCount++;
        }
      } else {
        // //console.log('ignore', player);
        ignorePlayers.add(player.id);
      }
    }
  }

  if (eliminatedPlayers.length) {
    // Go through each table
    let sortedTables = Object.values(tableActivePlayerCount).sort(
      tableSortFunc
    );
    // Check if we can remove a table
    const optimumTableSizeBeforeRebalance = Math.min(
      MAX_TABLE_SIZE,
      (tournament.minTableSizeBeforeRebalance || MAX_TABLE_SIZE) + 1
    );
    let neededTableCount = Math.ceil(
      activePlayerCount / optimumTableSizeBeforeRebalance
    );

    // TODO - we need to handle having 2 tables under the minTableSizeBeforeRebalance
    // but that when combined would not be under minTableSizeBeforeRebalance
    // Right now we are not rebalancing those
    // Let's just handle this one edge case explicitly
    if (activePlayerCount <= MAX_TABLE_SIZE) {
      neededTableCount = 1;
    }

    // Can we be more flexible here? That we only rebalance based on the
    const canBustTable = neededTableCount < sortedTables.length;

    // console.log(
    //   stringify({
    //     neededTableCount,
    //     eliminatedPlayers,
    //     sortedTables: sortedTables.map((st) => ({
    //       count: st.count,
    //       table: {
    //         players: st.table.players,
    //         id: st.table.id,
    //         activeHandId: st.table.activeHandId,
    //       },
    //     })),
    //     activePlayerCount,
    //     MAX_TABLE_SIZE,
    //   })
    // );

    if (canBustTable) {
      const tablesToBust = sortedTables.slice(
        0,
        sortedTables.length - neededTableCount
      );
      let tablesToKeep = sortedTables.slice(
        sortedTables.length - neededTableCount,
        sortedTables.length
      );
      // Take all the people in the bust tables and return move player directives
      for (const table of tablesToBust) {
        const bustedTablePlayers = Object.values(table.table.players).filter(
          (player) => !ignorePlayers.has(player.id)
        );

        console.log(
          "EliminateTable",
          stringify({ id: table.table.id, bustedTablePlayers })
        );
        for (const player of bustedTablePlayers) {
          // Add players to the tables with few people
          tablesToKeep = tablesToKeep.sort(tableSortFunc);
          actions.push({
            directive: TournamentDirective.RemovePlayer,
            data: {
              playerId: player.id,
              tableId: table.table.id,
            },
          });
          actions.push({
            directive: TournamentDirective.AddPlayer,
            data: {
              playerId: player.id,
              tableId: tablesToKeep[0].table.id,
              player,
            },
          });
          tablesToKeep[0].count++;
        }

        // Add the bust action last so we can check for non-removed players
        actions.push({
          directive: TournamentDirective.EliminateTable,
          data: { tableId: table.table.id },
        });
      }
    } else if (sortedTables.length) {
      let maxTableSize = sortedTables[sortedTables.length - 1].count;
      // Allow for a min table size to be reached before rebalancing
      const minTableSizeBeforeRebalance =
        tournament.minTableSizeBeforeRebalance ||
        MIN_TABLE_SIZE_BEFORE_REBALANCE;
      let tablesNeedingBalancing = sortedTables.filter(
        (t) =>
          t.count < minTableSizeBeforeRebalance && t.count < maxTableSize - 1
      );
      // Loop through tables needing balancing until they are all balanced
      const movedPlayers: { [key: string]: IPlayer } = {};
      while (tablesNeedingBalancing.length) {
        // console.log(
        //   `tablesNeedingBalancing - ${tablesNeedingBalancing.length}`
        // );
        for (const table of tablesNeedingBalancing) {
          // Move players from the tables with the most players
          // Flip the order to get tables with the most people. Still put tables later
          // in the hand action first
          sortedTables = sortedTables.sort((t1, t2) =>
            tableSortFunc(t2, t1, true)
          );
          const tableRemovingPlayers = sortedTables[0];
          const tablePlayers = Object.values(
            tableRemovingPlayers.table.players
          ).filter(
            (player) => !ignorePlayers.has(player.id) //!eliminatedPlayers.find((p) => p.id === player.id)
          );
          for (const player of tablePlayers.filter(
            (p) => !movedPlayers[p.id]
          )) {
            actions.push({
              directive: TournamentDirective.AddPlayer,
              data: {
                playerId: player.id,
                tableId: table.table.id,
                player,
              },
            });
            actions.push({
              directive: TournamentDirective.RemovePlayer,
              data: {
                playerId: player.id,
                tableId: sortedTables[0].table.id,
              },
            });
            movedPlayers[player.id] = player;
            table.count++;
            sortedTables[0].count--;
            break;
          }
          break;
        }
        // Flip the order to get tables with the most people. Still put tables later
        // in the hand action first
        sortedTables = sortedTables.sort((t1, t2) =>
          tableSortFunc(t2, t1, true)
        );
        // console.log({
        //   minTableSizeBeforeRebalance,
        //   sortedTables,
        //   minSize: tournament.minTableSizeBeforeRebalance,
        // });
        maxTableSize = sortedTables[0].count;
        tablesNeedingBalancing = sortedTables.filter(
          (t) =>
            t.count < minTableSizeBeforeRebalance && t.count < maxTableSize - 1
          // (t) => t.count < maxTableSize - 1
        );
      }
    }
  }
  return actions;
}

export const checkTournament = (
  tournamentDetails: ITournamentDetails
): ITournamentAction[] => {
  // Balance tables
  // Adjust blinds
  const nextActiveRound = checkTournamentBlinds(tournamentDetails);

  //console.log(
  //   "nextActiveRound",
  //   nextActiveRound,
  //   tournamentDetails.upcomingRoundId,
  //   tournamentDetails.activeRoundId
  // );
  // We're already planning the next round
  if (
    tournamentDetails.upcomingRoundId !== null &&
    tournamentDetails.upcomingRoundId !== undefined
  ) {
    return [];
  }

  if (nextActiveRound.id !== tournamentDetails.activeRoundId) {
    if (
      tournamentDetails.status === TournamentStatus.PauseRequested &&
      tournamentDetails.pauseReason === TournamentPauseReason.RoundAdvance
    ) {
      //console.log(
      //   "nextActiveRound",
      //   tournamentDetails.status,
      //   tournamentDetails.pauseReason
      // );
      return [];
    }
    // If this is the last round
    const directive =
      tournamentDetails.status === TournamentStatus.Paused
        ? TournamentDirective.AdvanceRound
        : TournamentDirective.RequestPause;

    //console.log(
    //   "nextActiveRound",
    //   directive,
    //   tournamentDetails.rebuysThroughRound
    // );
    if (
      tournamentDetails.rebuysThroughRound === tournamentDetails.activeRoundId
    ) {
      const duration =
        tournamentDetails.roundBreakFinalRebuyTimeInSeconds * 1000;
      if (!duration) {
        // case TournamentDirective.AdvanceRound:
        //   {
        //     const data = action.data as ITournamentRoundAction;
        //     // Request a pause and then issue it IF all tables are paused
        //     updatedTournament.upcomingRoundId = data.blindRoundId;
        //     updatedTournament.rounds = updatedTournament.rounds.map((round) =>
        //       round.id === data.blindRoundId
        //         ? { ...round, timestamp: new Date().getTime() }
        //         : round
        //     );
        //   }
        //   break;
        return [
          {
            directive: TournamentDirective.AdvanceRound,
            data: { blindRoundId: nextActiveRound.id },
          },
        ];
      }
      return [
        {
          directive,
          data: {
            blindRoundId: nextActiveRound.id,
            duration,
            message: "Rebuy rounds over. Last chance to rebuy/top-up...",
            reason: TournamentPauseReason.RoundAdvance,
          },
        },
      ];
    } else {
      return [
        {
          directive: TournamentDirective.AdvanceRound,
          data: { blindRoundId: nextActiveRound.id },
        },
      ];
    }
  }

  return [];
};

function advanceRound(
  updatedTournament: ITournamentDetails,
  blindRoundId: number,
  tableUpdates: { [key: string]: any } = {}
): [ITournamentDetails, { [key: string]: any }] {
  // If we are advancing the round (not through a pause) update the blinds
  updatedTournament.activeRoundId = blindRoundId;
  updatedTournament.rounds = updatedTournament.rounds.map((round) =>
    round.id === blindRoundId
      ? { ...round, timestamp: new Date().getTime() }
      : round
  );
  const nextActiveRound = updatedTournament.rounds.find(
    (round) => round.id === blindRoundId
  );
  if (nextActiveRound) {
    updatedTournament.tables = updatedTournament.tables.map((t) => {
      tableUpdates = merge(tableUpdates, {
        [t.id]: {
          currentBigBlind: nextActiveRound.bigBlind,
        },
      });
      return {
        ...t,
        currentBigBlind: nextActiveRound.bigBlind,
      };
    });
  }
  return [updatedTournament, tableUpdates];
}

export function processActions(
  tournament: ITournamentDetails,
  actions: ITournamentAction[],
  tableUpdates: { [key: string]: any } = {}
): [ITournamentDetails, { [key: string]: any }] {
  // console.log("actions", stringify(actions));
  const now = new Date().getTime();
  let updatedTournament = { ...tournament };
  for (const action of actions) {
    switch (action.directive) {
      case TournamentDirective.AdvanceRound:
        {
          const data = action.data as ITournamentRoundAction;
          [updatedTournament, tableUpdates] = advanceRound(
            updatedTournament,
            data.blindRoundId,
            tableUpdates
          );
        }
        break;
      case TournamentDirective.RequestPause:
        {
          const data = action.data as ITournmanentPauseAction;
          // Request a pause and then issue it IF all tables are paused
          let isPaused = updatedTournament.status === TournamentStatus.Paused;
          if (!hasTablesWithActiveHands(tournament)) {
            updatedTournament.pauseStartTimestamp = new Date().getTime();
            updatedTournament.status = TournamentStatus.Paused;
            isPaused = true;
          } else {
            updatedTournament.status = !isPaused
              ? TournamentStatus.PauseRequested
              : updatedTournament.status;
          }
          // If we're already paused, extend it
          updatedTournament.pauseDuration = Math.max(
            data.duration,
            updatedTournament.pauseDuration || 0
          );
          updatedTournament.pauseReason = data.reason;
          updatedTournament.pauseMessage = data.message;
          if (isPaused) {
            updatedTournament.pauseEndTimestamp =
              new Date().getTime() + updatedTournament.pauseDuration;
          }
        }
        break;
      case TournamentDirective.Pause:
        {
          // Request a pause and then issue it IF all tables are paused
          updatedTournament.status = TournamentStatus.Paused;
          // Start the timer
          updatedTournament.pauseEndTimestamp =
            new Date().getTime() + updatedTournament.pauseDuration;
          updatedTournament.pauseStartTimestamp = new Date().getTime();
        }
        break;
      case TournamentDirective.Resume:
      case TournamentDirective.ForceResume:
        {
          const force = action.directive === TournamentDirective.ForceResume;
          if (
            force ||
            !updatedTournament.pauseEndTimestamp ||
            updatedTournament.pauseEndTimestamp < now
          ) {
            let actualPauseDuration: number;
            if (updatedTournament.pauseStartTimestamp) {
              actualPauseDuration = new Date().getTime() - updatedTournament.pauseStartTimestamp;
            }

            updatedTournament.status = TournamentStatus.Active;
            updatedTournament.pauseDuration = 0;
            updatedTournament.pauseEndTimestamp = 0;
            updatedTournament.pauseStartTimestamp = null;
            updatedTournament.pauseMessage = null;
            const upcomingRoundId = updatedTournament.upcomingRoundId;
            const pauseReason = updatedTournament.pauseReason;
            updatedTournament.pauseReason = null;
            updatedTournament.upcomingRoundId = null;

            if (pauseReason) {
              switch (pauseReason) {
                case TournamentPauseReason.Administrative: {
                  if (
                    updatedTournament.activeRoundId !== null &&
                    updatedTournament.activeRoundId !== undefined &&
                    actualPauseDuration
                  ) {
                    updatedTournament.rounds = updatedTournament.rounds.map(
                      (round) =>
                        round.id === updatedTournament.activeRoundId
                          ? { ...round, timestamp: round.timestamp + actualPauseDuration }
                          : round
                    );
                  }
                  break;
                }
                case TournamentPauseReason.TournamentEnded: {
                  updatedTournament.status = TournamentStatus.Ended;
                  break;
                }
                case TournamentPauseReason.RoundAdvance: {
                  if (
                    upcomingRoundId !== null &&
                    upcomingRoundId !== undefined
                  ) {
                    // Set the timestamp to now for the updated round
                    updatedTournament.activeRoundId = upcomingRoundId || 0;
                    updatedTournament.rounds = updatedTournament.rounds.map(
                      (round) =>
                        round.id === updatedTournament.activeRoundId
                          ? { ...round, timestamp: new Date().getTime() }
                          : round
                    );
                    const nextActiveRound = updatedTournament.rounds.find(
                      (round) => round.id === updatedTournament.activeRoundId
                    );
                    if (nextActiveRound) {
                      updatedTournament.tables = updatedTournament.tables.map(
                        (t) => {
                          tableUpdates = merge(tableUpdates, {
                            [t.id]: {
                              currentBigBlind: nextActiveRound.bigBlind,
                            },
                          });
                          return {
                            ...t,
                            currentBigBlind: nextActiveRound.bigBlind,
                          };
                        }
                      );
                    }
                  } else {
                    console.error("Upcomingroundid not defined", {
                      upcomingRoundId,
                      pauseReason,
                    });
                  }
                  break;
                }
              }
            }
          }
        }
        break;
      case TournamentDirective.EliminateTable:
        {
          const data = action.data as ITournmanentTableAction;
          updatedTournament.tables = updatedTournament.tables.map((table) => {
            if (table.id === data.tableId) {
              // 2021-02-15 - Something is up with joining/setting away and not be assigned
              // to the table
              const oldTable = tournament.tables.find((t) => t.id === table.id);
              const stillAlivePlayers = Object.values(table.players).filter(
                (p) => p.id && !p.removed
              );
              if (stillAlivePlayers.length) {
                console.error(
                  "Eliminating table with active players",
                  table.id,
                  JSON.stringify({
                    stillAlivePlayers,
                    players: Object.values(table.players),
                    oldTable,
                  })
                );
                // process.exit(0);
                throw new Error("Eliminating table with active players");
              }
              tableUpdates = merge(tableUpdates, {
                [table.id]: {
                  // TODO - skip this as it conflicts with player removal
                  // players: {},
                  stage: GameStage.Ended,
                },
              });
              return {
                ...table,
                players: {},
                stage: GameStage.Ended,
              };
            }
            return table;
          });
        }
        break;
      case TournamentDirective.EliminatePlayer:
        {
          const data = action.data as ITournmanentPlayerAction;
          updatedTournament.tables = updatedTournament.tables.map((table) => {
            if (table.id === data.tableId) {
              const updatedTable = {
                ...table,
                players: {
                  ...table.players,
                },
              };
              updatedTable.players[data.playerId] = {
                ...updatedTable.players[data.playerId],
                bustedTimestamp: now,
                removed: true,
                away: false,
              };
              tableUpdates = merge(tableUpdates, {
                [table.id]: {
                  [`players.${data.playerId}`]: {
                    bustedTimestamp: now,
                    removed: true,
                    away: false,
                  },
                },
              });
              return updatedTable;
            }
            return table;
          });
          updatedTournament.players = {
            ...updatedTournament.players,
            [data.playerId]: {
              ...updatedTournament.players[data.playerId],
              bustedTimestamp: now,
              removed: true,
              role: PlayerRole.Observer,
              away: false,
              stack: 0,
              tableId: null,
            },
          };
        }
        break;
      case TournamentDirective.AddPlayer:
        {
          const data = action.data as ITournmanentPlayerAction;
          updatedTournament.tables = updatedTournament.tables.map((table) => {
            if (table.id === data.tableId) {
              const updatedTable = {
                ...table,
                players: {
                  ...table.players,
                },
              };
              let maxPlayerIndex = Object.values(table.players)
                .filter((p) => isPlayerTabled(table, p))
                .reduce((max, player) => Math.max(max, player.position), 0);

              if (Number.isNaN(maxPlayerIndex)) {
                console.error(
                  "Error: maxPlayerIndex is NaN",
                  stringify(table.players)
                );
                maxPlayerIndex = 0;
              }
              tableUpdates = merge(tableUpdates, {
                [table.id]: {
                  [`players.${data.playerId}`]: {
                    ...data.player,
                    position: maxPlayerIndex + 1,
                    removed: false,
                    tableId: data.tableId,
                  },
                },
              });
              updatedTable.players[data.playerId] = {
                ...data.player,
                position: maxPlayerIndex + 1,
                removed: false,
              };
              // We should make sure that the order here is correct
              return updatedTable;
            }
            return table;
          });
          updatedTournament.players = {
            ...updatedTournament.players,
            [data.playerId]: {
              ...updatedTournament.players[data.playerId],
              tableId: data.tableId,
            },
          };
        }
        break;
      case TournamentDirective.RemovePlayer:
        {
          const data = action.data as ITournmanentPlayerAction;
          updatedTournament.tables = updatedTournament.tables.map((table) => {
            if (table.id === data.tableId) {
              const updatedTable = {
                ...table,
                players: {
                  ...table.players,
                },
              };
              // Fully remove the player (ran into bug where when they got merged
              // back-in, the removed key stayed set)
              delete updatedTable.players[data.playerId];
              tableUpdates = merge(tableUpdates, {
                [table.id]: {
                  [`players.${data.playerId}`]: { removed: true },
                },
              });
              return updatedTable;
            }
            return table;
          });
        }
        break;
      default:
        break;
    }
  }
  return [updatedTournament, tableUpdates];
}

const criticalActionTypes = [
  TournamentDirective.AddPlayer,
  TournamentDirective.RemovePlayer,
  TournamentDirective.EliminatePlayer,
  TournamentDirective.BalanceTables,
  TournamentDirective.AssignTables,
  TournamentDirective.EliminateTable,
  // TournamentDirective.Pause,
  TournamentDirective.RequestPause,
  TournamentDirective.ForceResume,
  TournamentDirective.Resume,
  TournamentDirective.AdvanceRound,
];
const performantCriticalActionTypes = [
  TournamentDirective.AddPlayer,
  TournamentDirective.RemovePlayer,
  TournamentDirective.EliminatePlayer,
  TournamentDirective.BalanceTables,
  TournamentDirective.AssignTables,
  TournamentDirective.EliminateTable,
  // TournamentDirective.Pause,
  TournamentDirective.RequestPause,
  TournamentDirective.ForceResume,
  TournamentDirective.Resume,
  TournamentDirective.AdvanceRound,
];
export const checkCriticalActions = (
  actions: ITournamentAction[],
  enablePerformantRebalances: boolean
) => {
  const criticalActions = enablePerformantRebalances
    ? performantCriticalActionTypes
    : criticalActionTypes;
  return !!actions.find(
    (action) => criticalActions.indexOf(action.directive) >= 0
  );
};

export interface IGameUpdate {
  game: IGame;
  directive?: GameDirective;
  actingPlayerId?: string | null;
  actions?: IAction[] | null;
  error?: any;
}
export interface ITournamentUpdate {
  tournament: ITournamentDetails;
  autoAdvanceDuration?: number;
  autoAdvanceGames?: boolean;
  tournamentProcessingNeeded?: boolean;
  hasCriticalActions: boolean;
  tableUpdates: { [key: string]: any };
}
export interface IFullTournamentUpdate {
  tournamentUpdates: ITournamentUpdate;
  gameUpdates?: IGameUpdate;
}

export const pauseTournament = (
  tournament: ITournamentDetails,
  message: string
): IFullTournamentUpdate => {
  let updatedTournament = { ...tournament };
  const action: ITournamentAction = {
    directive: TournamentDirective.RequestPause,
    data: {
      duration: Number.MAX_SAFE_INTEGER,
      message,
      reason: TournamentPauseReason.Administrative,
    },
  };
  const isPaused = tournament.status === TournamentStatus.Paused;
  if (isPaused) {
    action.directive = TournamentDirective.Pause;
  }
  let tableUpdates: { [key: string]: any };
  [updatedTournament, tableUpdates] = processActions(updatedTournament, [
    action,
  ]);

  return {
    tournamentUpdates: {
      tournament: updatedTournament,
      hasCriticalActions: checkCriticalActions(
        [action],
        tournament.enablePerformantRebalances
      ),
      autoAdvanceGames: !isPaused,
      tableUpdates,
    },
  };
};

export const resumeTournament = (
  tournament: ITournamentDetails
): IFullTournamentUpdate => {
  const actions = [{ directive: TournamentDirective.ForceResume }];
  const [updatedTournament, tableUpdates] = processActions(
    { ...tournament },
    actions
  );
  return {
    tournamentUpdates: {
      tournament: updatedTournament,
      hasCriticalActions: checkCriticalActions(
        actions,
        tournament.enablePerformantRebalances
      ),
      autoAdvanceGames: true,
      tableUpdates,
    },
  };
};

export const advanceTournamentHand = (
  tournament: ITournamentDetails,
  gameState: IGame,
  selectedAction?: IAction
): IFullTournamentUpdate => {
  // If we're a tournament, let's wrap the advance hand call
  let updatedTournament = { ...tournament };
  let hasCriticalActions = false;

  if (
    tournament.status === TournamentStatus.Ended ||
    tournament.status === TournamentStatus.Finalized ||
    tournament.status === TournamentStatus.Initialized
  ) {
    return {
      tournamentUpdates: {
        tournament: updatedTournament,
        hasCriticalActions,
        tableUpdates: null,
      },
    };
  }

  let playerWasEliminated = false;

  // 1. If we have a game to process, do that first unless:
  //    a. The game has a pause requested and the hand is not active or
  //    b. The game is paused and the hand is not active
  // 1. Check blinds to know if we should pause the game
  //    a. If we choose to request a pause,
  if (gameState) {
    if (gameState.stage === GameStage.Ended) {
      return {
        tournamentUpdates: {
          tournament: updatedTournament,
          hasCriticalActions,
          tableUpdates: null,
        },
      };
    }
    const gameActivePlayers = Object.values(gameState.players).filter((p) =>
      isPlayerAliveInTournament(tournament, p)
    );

    const tableHasActiveHand = hasActiveHand(gameState);
    let isTableAwaitingHandEnd = false;
    let pauseMessage: string = null;
    if (tournament.enablePerformantRebalances) {
      // Check if this table is needed for moving people around
      const rebalanceActions = rebalanceTablesPerformantly(tournament);
      // We only remove players from tables without an active hand
      // We can add players to a table with active hand
      isTableAwaitingHandEnd = doesPerformantRebalanceNeedHandsToEnd(
        tournament,
        rebalanceActions,
        gameState.id,
        true
      );
      if (isTableAwaitingHandEnd) {
        pauseMessage = "Play is paused while tables are rebalancing";
      }
    }

    // Only advance state if we have more than 1 person
    if (gameActivePlayers.length > 1 || tableHasActiveHand) {
      const canProcessNewHand =
        !isTableAwaitingHandEnd &&
        tournament.status !== TournamentStatus.PauseRequested &&
        tournament.status !== TournamentStatus.Paused;
      // If we're not paused/pausing or we have a hand needing finishing...
      if (canProcessNewHand || tableHasActiveHand) {
        const result = processGameState(
          updatedTournament,
          gameState,
          selectedAction,
          0,
          false,
          isTableAwaitingHandEnd // Hard pause here
        );
        updatedTournament = result.tournamentUpdates.tournament;
        // Set the pause message if need be
        if (result.gameUpdates) {
          result.gameUpdates.game.pauseMessage = pauseMessage;
        }

        if (result.gameUpdates.game.activeHandId) {
          return result;
        }
        // The hand has ended. If we had someone eliminated, we need to wait for their
        // rebuy window to end, and then pending if they rebuy, rebalance the tables...
        if (result.gameUpdates.directive === GameDirective.RebuyOption) {
          return result;
        }
        if (result.gameUpdates.directive === GameDirective.EliminatePlayer) {
          playerWasEliminated = true;
        }
        // Update the tournament here...
        updatedTournament.tables = updatedTournament.tables.map((t) =>
          t.id === result.gameUpdates.game.id ? result.gameUpdates.game : t
        );

        if (playerWasEliminated || isTableAwaitingHandEnd) {
          // We have a situation where a player was knocked out - we might not have full tables
          // We should let the caller know to call back with all the tables
          return {
            tournamentUpdates: {
              tournament: updatedTournament,
              autoAdvanceDuration: 0,
              tournamentProcessingNeeded: true,
              hasCriticalActions,
              tableUpdates: null,
            },
            gameUpdates: result.gameUpdates,
          };
        }
      }
    } else {
      return {
        tournamentUpdates: {
          tournament: updatedTournament,
          hasCriticalActions,
          tableUpdates: null,
        },
      };
    }
  }

  // After a hand action, check for eliminated players
  // If there are players eliminated that cannot rebuy

  // Deal with eliminated players, then deal with round changes
  let actions = updatedTournament.enablePerformantRebalances
    ? rebalanceTablesPerformantly(updatedTournament)
    : rebalanceTables(updatedTournament);
  let willReturn = !!actions.length;

  let autoAdvanceDuration = 0;
  // Auto advance games if we are just kicking the tourney along
  let autoAdvanceGames = !gameState;
  let didResume = false;

  let tableUpdates: { [key: string]: any };
  if (actions.length) {
    // Check if we need to wait for some tables to finish to process moves
    // This will see if any tables removing a player or being eliminated have
    // active hands
    if (
      tournament.enablePerformantRebalances &&
      doesPerformantRebalanceNeedHandsToEnd(
        tournament,
        actions,
        gameState ? gameState.id : null,
        false
      )
    ) {
      console.log(
        `Not rebalancing as we need hands to finish`,
        stringify(actions),
        tournament.tables.map((t) => ({ id: t.id, handId: t.activeHandId })),
        gameState?.id
      );
      actions = [];
      willReturn = false;
    }

    hasCriticalActions =
      hasCriticalActions ||
      checkCriticalActions(actions, tournament.enablePerformantRebalances);

    // Disable critical actions on the game updates
    if (
      tournament.enablePerformantRebalances &&
      !!gameState &&
      hasCriticalActions
    ) {
      console.log("nulling out actions?", gameState?.id);
      actions = [];
      willReturn = false;
      hasCriticalActions = false;
    }

    [updatedTournament, tableUpdates] = processActions(
      updatedTournament,
      actions
    );
    // TODO - UPDATE stacks each time through
    // TODO - sync the subscribed table based on tournament table
    // TODO - show paused messages
    // TODO - show table change messages (after subscribed ID changes)
    // TODO - add results for tournament as a whole
    // NOTE - some hands seem to start when they shouldn't when tournament is paused
    // TODO - maybe only allow scheduled processes to UNPAUSE tournament??
    autoAdvanceDuration = actions.reduce(
      (max, action) =>
        Math.max(
          max,
          AUTO_ADVANCE_DIRECTIVES[action.directive]
            ? AUTO_ADVANCE_DIRECTIVES[action.directive](action)
            : 0
        ),
      autoAdvanceDuration
    );
  }

  // We aren't processing any player moves or anything AND we're processing this
  // before game moves
  const blindActions = checkTournament({ ...tournament });
  if (!didResume && blindActions.length) {
    hasCriticalActions =
      hasCriticalActions ||
      checkCriticalActions(blindActions, tournament.enablePerformantRebalances);
    [updatedTournament, tableUpdates] = processActions(
      updatedTournament,
      blindActions,
      tableUpdates
    );
    autoAdvanceDuration = blindActions.reduce(
      (max, action) =>
        Math.max(
          max,
          AUTO_ADVANCE_DIRECTIVES[action.directive]
            ? AUTO_ADVANCE_DIRECTIVES[action.directive](action)
            : 0
        ),
      autoAdvanceDuration
    );
    willReturn = true;
  }

  if (
    tournament.status === TournamentStatus.Paused &&
    !hasTablesWithActiveHands(updatedTournament)
  ) {
    // We should also check if we are allowed to resume...
    if (
      !tournament.pauseEndTimestamp ||
      tournament.pauseEndTimestamp < new Date().getTime()
    ) {
      [updatedTournament, tableUpdates] = processActions(
        updatedTournament,
        [{ directive: TournamentDirective.Resume }],
        tableUpdates
      );
      autoAdvanceGames = true;
      didResume = true;
      willReturn = true;
    }
  }

  // console.log({ willReturn });

  if (willReturn) {
    return {
      tournamentUpdates: {
        tournament: updatedTournament,
        autoAdvanceDuration,
        autoAdvanceGames,
        hasCriticalActions,
        tableUpdates,
      },
    };
  }

  const activePlayers = Object.values(updatedTournament.players).filter(
    (p) =>
      isPlayerAliveInTournament(updatedTournament, p) ||
      canRebuyInTournament(updatedTournament, p)
  );

  if (activePlayers.length <= 1) {
    // We need to update player stacks here
    // Pause the tournament at the end instead of ended to allow for a smoother transition
    updatedTournament.status = TournamentStatus.Ended;
    updatedTournament.pauseReason = TournamentPauseReason.TournamentEnded;
    updatedTournament.finalizeTime = getTournamentFinalizeTime();
    // updatedTournament.pauseEndTimestamp = new Date().getTime() + 1000 * 60 * 60;
    return {
      tournamentUpdates: {
        tournament: updatedTournament,
        autoAdvanceDuration,
        autoAdvanceGames,
        hasCriticalActions,
        tableUpdates,
      },
    };
  }

  // // 1. If we are not yet active (initialized) and we want to start, assign players, blinds, etc. and set to active
  // // 2. If we hit a triggering rebalance event (time)
  // //    a. Pause the game and let all active hands finish
  // //    b. Update blinds if necessary
  // //    b. Once hands finish, move players tables? (show a message?) - or delay before updating
  // // 3. If we hit a bl
  // if (
  //   updatedTournament.status === TournamentStatus.Paused ||
  //   updatedTournament.status === TournamentStatus.PauseRequested
  // ) {
  //   if (gameState && !hasActiveHand(gameState)) {
  //     return {
  //       tournamentUpdates: {
  //         tournament: updatedTournament,
  //         autoAdvanceDuration,
  //         autoAdvanceGames,
  //       },
  //     };
  //   }
  // }

  // // If we are passed a particular game, run that logic
  // // Otherwise we likely need to check the status of the tournament
  // if (gameState) {
  //   return processGameState(
  //     tournament,
  //     gameState,
  //     selectedAction,
  //     autoAdvanceDuration,
  //     autoAdvanceGames
  //   );
  // }
  return {
    tournamentUpdates: {
      tournament: updatedTournament,
      autoAdvanceDuration,
      autoAdvanceGames,
      hasCriticalActions,
      tableUpdates,
    },
  };
};

function processGameState(
  updatedTournament: ITournamentDetails,
  gameState: IGame,
  selectedAction: IAction,
  autoAdvanceDuration: number,
  autoAdvanceGames: boolean,
  currentTableNeedsPause: boolean
): IFullTournamentUpdate {
  if (!updatedTournament.activeRoundId) {
    debugger;
  }
  const updatedGameState = {
    ...updatedTournament.tables.find((t) => t.id === gameState.id),
    tournamentDetails: updatedTournament,
  };
  // Only allow game actions that aren't starting new hands
  if (
    currentTableNeedsPause ||
    updatedTournament.status === TournamentStatus.Paused
  ) {
    if (!hasActiveHand(updatedGameState)) {
      return {
        tournamentUpdates: {
          tournament: updatedTournament,
          autoAdvanceDuration,
          autoAdvanceGames,
          hasCriticalActions: false,
          tableUpdates: null,
        },
      };
    }
  }

  if (!hasActiveHand(updatedGameState)) {
    // Is tournament paused?
    const playersWhoCanRebuy = Object.values(
      updatedGameState.players
    ).filter((player) => canRebuyInTournament(updatedTournament, player));
    if (playersWhoCanRebuy.length) {
      // TODO - declining rebuy should remove player
      //console.log(`Awaiting players who can still rebuy`);
      return {
        tournamentUpdates: {
          tournament: updatedTournament,
          autoAdvanceDuration,
          autoAdvanceGames,
          hasCriticalActions: false,
          tableUpdates: null,
        },
        gameUpdates: {
          game: updatedGameState,
          directive: GameDirective.RebuyOption,
          actingPlayerId: null,
          actions: null,
        },
      };
    } else {
      // if we have players without a stack...we need to rebalance/eliminate
      const playersWhoNeedToBeEliminated = Object.values(
        updatedGameState.players
      ).filter(
        (player) =>
          isPlayerTabledInTournament(updatedTournament, player) &&
          !isPlayerAliveInTournament(updatedTournament, player)
      );
      if (playersWhoNeedToBeEliminated.length) {
        return {
          tournamentUpdates: {
            tournament: updatedTournament,
            autoAdvanceDuration,
            autoAdvanceGames,
            hasCriticalActions: false,
            tableUpdates: null,
          },
          gameUpdates: {
            game: updatedGameState,
            directive: GameDirective.EliminatePlayer,
            actingPlayerId: null,
            actions: null,
          },
        };
      }
    }
  }

  // Get a forced action if we didn't specify one to kick the tires
  const forcedAction = getForcedAction(updatedGameState);
  const action = selectedAction ? selectedAction : forcedAction;

  const wasActionForced = !selectedAction && !!forcedAction;
  const { game, directive, actingPlayerId, actions, error } = advanceGameHand(
    updatedGameState,
    action,
    // Don't advance to next hand if we're paused - we already handle rebuys specially
    updatedTournament.status === TournamentStatus.Paused ||
    updatedTournament.status === TournamentStatus.PauseRequested || // block advancing if paused
    currentTableNeedsPause
  );

  // Set the forced action player to away
  if (wasActionForced) {
    console.log(`Forced action for ${forcedAction.uid}`);
    game.players[forcedAction.uid].away = true;
  }

  // Update player stacks
  updatedTournament.players = Object.values(updatedTournament.players).reduce(
    (players, player) => {
      const updatedPlayer = { ...player };
      if (player.tableId === game.id) {
        const tablePlayer = game.players[player.id];
        if (tablePlayer) {
          updatedPlayer.stack = tablePlayer.stack;
          updatedPlayer.bustedTimestamp = tablePlayer.bustedTimestamp || null;
        }
      }

      if(player?.id) {
        players[player.id] = updatedPlayer;
      }

      return players;
    },
    {} as { [key: string]: ITournamentPlayer }
  );

  return {
    tournamentUpdates: {
      tournament: updatedTournament,
      hasCriticalActions: false,
      tableUpdates: null,
    },
    gameUpdates: { game, directive, actingPlayerId, actions, error },
  };
}

export const tableSortFunc = (
  t1: RebalancingTable,
  t2: RebalancingTable,
  invertTimeSort = false
) => {
  if (t1.count < t2.count) return -1;
  else if (t2.count < t1.count) return 1;
  const inverter = invertTimeSort ? -1 : 1;
  // Same counts, prioritize hands that are paused
  if (t1.table.activeHandId === t2.table.activeHandId) {
    // If they're both null...just be deterministic
    return t1.table.id.localeCompare(t2.table.id);
  }
  if (!t1.table.activeHandId) return inverter * -1;
  if (!t2.table.activeHandId) return inverter * 1;
  // All things equal, table later in the hand or started earlier
  const handTimeSort =
    parseInt(t1.table.activeHandId, 10) - parseInt(t2.table.activeHandId, 10);
  return inverter * handTimeSort;
};

export const AUTO_ADVANCE_DIRECTIVES: {
  [index: string]: { (action: ITournamentAction): number };
} = {
  [TournamentDirective.RequestPause]: (action) =>
    (action.data as ITournmanentPauseAction).duration,
  [TournamentDirective.Pause]: (action) => 5000,
};
