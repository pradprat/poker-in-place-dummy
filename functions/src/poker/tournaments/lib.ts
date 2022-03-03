import * as admin from "firebase-admin";
import {
  ITournamentDetails,
  IGame,
  ITournamentPlayer,
  IHand,
  IPlayerState,
  ActionDirective,
  IGameStats,
  // TournamentStatus,
  GameStage,
  TournamentStatus,
} from "../../engine/types";
import logger from "../../utils/log";
// const bluebird = require("bluebird");

import {
  AUTO_ADVANCE_DIRECTIVES,
  ERROR_ADVANCE_WITHOUT_ACTION,
  ERROR_INVALID_HAND,
  flatMap,
  isPlayerTabled,
} from "../../engine/index";
import {
  advanceTournamentHand,
  pauseTournament,
  resumeTournament,
  IFullTournamentUpdate,
  IGameUpdate,
} from "../../engine/tournament";
import {
  acquireLockAndExecute,
  diffObject,
  typedDb,
  FirebaseTypedDoc,
  FirebaseTypedWriteBatch,
  cache,
} from "../utils";

const stringify = require("json-stringify-safe");

const TOURNAMENT_LOCK_ERROR = "Requires tournament lock";

export interface IServerGame extends IGame {
  hostedMedia: string;
  mediasoupHost: string;
  smartMediasoupHost?: string;
  enableAutomation?: boolean;
}
class TournamentLockError extends Error {
  constructor(message: string) {
    super(message);
  }
}
export interface IServerTournamentPlayer extends ITournamentPlayer {
  suggestedTableIdentifier?: string;
}

export interface IServerTournamentDetails extends ITournamentDetails {
  prng: string;
  hostedMedia: string;
  organizerCode?: string;
  clientVersion?: any;
  serverVersion?: any;
  players: { [key: string]: IServerTournamentPlayer };
  paymentType?: string;
  startDate: string;
  organizerIds: string[];

  // Is this tournament managed by our hosted API
  managed?: boolean;
}

export type GetTournamentFunction = {
  (
    tournamentId: string,
    args?: {
      includeTables?: boolean;
      allowPartialTables?: boolean;
      activeTableId?: string;
      currentUserId?: string;
    }
  ): Promise<{
    tournament: FirebaseTypedDoc<IServerTournamentDetails>;
    tables: {
      docs: FirebaseTypedDoc<IServerGame>[];
    };
  }>;
};

export const getTournament = async (
  tournamentId: string,
  {
    includeTables = false,
    allowPartialTables = false,
    activeTableId,
    currentUserId,
  }: {
    includeTables?: boolean;
    allowPartialTables?: boolean;
    activeTableId?: string;
    currentUserId?: string;
  } = {}
) => {
  const rootTableQueryDoc = typedDb
    .collection<IServerTournamentDetails>("tournaments")
    .doc(tournamentId);
  const tournament = await rootTableQueryDoc.get();
  const tournamentData = tournament.data();

  let tables = {
    docs: Object.values(
      Object.values(tournamentData.players)
        .filter((p) => !p.removed && p.tableId)
        .reduce((map, player: ITournamentPlayer) => {
          if (!map[player.tableId]) {
            const tableData = Object.values(
              tournamentData.tableIdentifiers || {}
            ).find((t) => t.id === player.tableId);
            map[player.tableId] = {
              id: tableData.id,
              activeHandId: tableData.activeHandId,
              players: {},
            };
          }
          map[player.tableId].players[player.id] = player;
          return map;
        }, {} as { [key: string]: { activeHandId?: string; id: string; players: { [key: string]: ITournamentPlayer } } })
    ).map(
      (doc) =>
        new FirebaseTypedDoc(
          null,
          typedDb.collection<IGame>("tables").doc(doc.id),
          "tables",
          doc
        )
    ),
  };

  if (!tables.docs.length) {
    tables = {
      docs: (Object.values(tournamentData.tableIdentifiers || {}) || []).map(
        (table) =>
          new FirebaseTypedDoc(
            null,
            typedDb.collection<IGame>("tables").doc(table.id),
            "tables",
            { players: {} }
          )
      ),
    };
  }

  // Optimization for getting the table for the current user
  if (currentUserId && tournamentData.players[currentUserId]?.tableId) {
    const tableId = tournamentData.players[currentUserId]?.tableId;
    const activeTable = await typedDb
      .collection<IServerGame>("tables")
      .doc(tableId)
      .get();
    tables = {
      docs: tables.docs.map((t) => (t.id === activeTableId ? activeTable : t)),
    };
  } else if (includeTables && !allowPartialTables) {
    // TODO - perf for cache
    tables = await typedDb
      .collection<IServerGame>("tables")
      .where("tournamentId", "==", tournamentData.id)
      .get();
  } else if (allowPartialTables && includeTables && activeTableId) {
    // We need to load the single table we're operating on
    const activeTable = await typedDb
      .collection<IServerGame>("tables")
      .doc(activeTableId)
      .get();
    tables = {
      docs: tables.docs.map((t) => (t.id === activeTableId ? activeTable : t)),
    };
  }

  return { tournament, tables };
};

export const getTable = async (
  db: FirebaseFirestore.Firestore,
  tableId: string
) => {
  const tables = await db
    .collection("tables")
    .where(admin.firestore.FieldPath.documentId(), "==", tableId)
    .get();

  return tables.docs[0];
};

export const processTournamentAction = async (
  tournament: FirebaseTypedDoc<ITournamentDetails>,
  tables: { docs: FirebaseTypedDoc<IGame>[] },
  activeTableId: string | null,
  uid: string | null,
  lambda: {
    (
      tournament: ITournamentDetails,
      game?: IGame
    ): Promise<IFullTournamentUpdate>;
  },
  isRecursed?: boolean,
  hasTournamentLock?: boolean,
  runIntegrityCheck?: boolean
): Promise<IFullTournamentUpdate> => {
  console.debug(
    "processTournamentAction",
    stringify({
      activeTableId,
      isRecursed,
      hasTournamentLock,
    })
  );
  if (!tables.docs) {
    return null;
  }
  // TODO - this might be slow
  const tableDatas = [];
  const tournamentData = tournament.data();
  for (const table of tables.docs) {
    const tableData = { ...table.data() };
    if (tableData.stage === GameStage.Ended) {
      continue;
    }
    tableData.id = table.id;
    tableData.tournamentDetails = { ...tournamentData };
    if (activeTableId === table.id) {
      const activeHand = tableData.activeHandId
        ? await table.ref
          .collection<IHand>("hands")
          .doc(tableData.activeHandId)
          .get()
        : null;

      if (!activeHand) {
        // Should we fetch the most recent hand?
        const lastActiveHands = await table.ref
          .collection<IHand>("hands")
          .orderBy("id", "desc")
          .limit(1)
          .get();
        if (lastActiveHands.size) {
          tableData.hands = [lastActiveHands.docs[0].data()];
        } else {
          tableData.hands = [];
        }
      } else {
        const activeHandData = activeHand.data();
        const playerStates = await table.ref
          .collection<IHand>("hands")
          .doc(tableData.activeHandId)
          .collection<IPlayerState>("players")
          .get();
        activeHandData.playerStates = playerStates.docs.map((p) => p.data());
        tableData.hands = [activeHandData];
      }
    }
    tableDatas.push(tableData);
  }
  tournamentData.tables = tableDatas as IGame[];

  // Add some tournament integrity checking
  if (!activeTableId) {
    try {
      checkTournamentIntegrity(tournament, tables, activeTableId);
    } catch (e) {
      console.error(e);
    }
  }

  const activeTableData = tournamentData.tables.find(
    (t) => t.id === activeTableId
  );
  const activeTable = tables.docs.find((t) => t.id === activeTableId);
  const result = await lambda(tournamentData, activeTableData);

  if (result.tournamentUpdates.hasCriticalActions && !hasTournamentLock) {
    throw new TournamentLockError(TOURNAMENT_LOCK_ERROR);
  }

  const hasTableUpdates =
    result.tournamentUpdates.tableUpdates &&
    Object.keys(result.tournamentUpdates.tableUpdates).length;

  const firebaseBatch = typedDb.batch();
  // const tournamentTables = result.tournamentUpdates.tournament.tables;
  // Pretty sure this is where we're hitting some state overwrite issues
  // This doesn't require table locks, so we could be stomping table level changes
  if (hasTableUpdates) {
    if (!result.tournamentUpdates.hasCriticalActions) {
      logger.error("Has table updates with no hasCriticalActions", {
        activeTableId,
      });
    }
    delete result.tournamentUpdates.tournament.tables;
    for (const key of Object.keys(result.tournamentUpdates.tableUpdates)) {
      const updatedTable = tables.docs.find((table) => table.id === key);
      console.log(
        "tableUpdates",
        key,
        stringify(result.tournamentUpdates.tableUpdates[key])
      );
      await firebaseBatch.update<IGame>(
        updatedTable.ref,
        result.tournamentUpdates.tableUpdates[key]
      );
    }
  }

  const updatedTournament = result.tournamentUpdates.tournament;
  if (activeTable) {
    if (result.gameUpdates) {
      console.log("result.gameUpdates", { activeTableId });
      await updateGame(
        firebaseBatch,
        tournament,
        activeTable,
        result.gameUpdates,
        tournamentData,
        true
      );

      updatedTournament.tableIdentifiers = {
        ...updatedTournament.tableIdentifiers,
        [result.gameUpdates.game.id]: {
          id: activeTable.id,
          stage: result.gameUpdates.game.stage,
          activeHandId: result.gameUpdates.game.activeHandId,
          name: activeTable.data().name,
        },
      };
    } else {
      const table = result.tournamentUpdates.tournament.tables?.find(
        (t) => t.id === activeTableId
      );
      console.log(2, result.tournamentUpdates.hasCriticalActions);
      if (table) {
        await updateGame(
          firebaseBatch,
          tournament,
          activeTable,
          { game: table },
          tournamentData,
          false
        );
      }
    }
  }

  delete updatedTournament.tables;
  const diffedUpdates = diffObject(tournamentData, updatedTournament);
  // Players may end up busted when we kick the tires....
  if (Object.keys(diffedUpdates).length) {
    console.log(3, result.tournamentUpdates.hasCriticalActions, activeTableId);
    if (activeTable && !result.tournamentUpdates.hasCriticalActions) {
      console.log("diffedUpdates", diffedUpdates);
    }
    await firebaseBatch.update<ITournamentDetails>(
      tournament.ref,
      diffedUpdates
    );
  }
  await firebaseBatch.commit();

  if (result.gameUpdates) {
    console.debug(
      "lock - game updates",
      result.gameUpdates.directive,
      JSON.stringify({
        activeTableId,
        isRecursed,
      })
    );
    console.log(
      5,
      result.tournamentUpdates.hasCriticalActions,
      { isRecursed },
      result.gameUpdates.directive
    );
    // Auto-advance these baby ones
    if (
      !isRecursed &&
      AUTO_ADVANCE_DIRECTIVES[result.gameUpdates.directive] === 0
    ) {
      if (!activeTableId) {
        throw new Error("no active table id");
      }
      console.log("no recursion");
      if (false) {
        // process.exit(0);
        const {
          tournament: recentlyUpdatedTournament,
          tables: updatedTables,
        } = await getTournament(tournament.id, {
          includeTables: true,
          allowPartialTables: false,
        });
        const start = new Date().getTime();
        const subResult = await processTournamentAction(
          recentlyUpdatedTournament,
          updatedTables,
          activeTableId,
          null,
          lambda,
          true,
          hasTournamentLock
        );
        console.debug("lock - subResult", new Date().getTime() - start);
        return subResult;
      }
    }
  }

  // // TODO - we really should fetch the tournament and all the games here...
  // // Then we can just run them all at once...
  // const DISABLE_AUTOADVANCE = true;
  // // We trigger advances in a loop anyway
  // if (
  //   !isRecursed &&
  //   (result.tournamentUpdates.autoAdvanceGames ||
  //     result.tournamentUpdates.tournamentProcessingNeeded) &&
  //   !DISABLE_AUTOADVANCE
  // ) {
  //   console.debug(
  //     "lock - autoadvancegames",
  //     JSON.stringify({
  //       autoAdvanceGames: result.tournamentUpdates.autoAdvanceGames,
  //       tournamentProcessingNeeded:
  //         result.tournamentUpdates.tournamentProcessingNeeded,
  //     })
  //   );
  //   const {
  //     tournament: recentlyUpdatedTournament,
  //     tables: updatedTables,
  //   } = await getTournament(tournament.id, {
  //     includeTables: true,
  //     allowPartialTables: false,
  //   });
  //   if (result.tournamentUpdates.tournamentProcessingNeeded) {
  //     const start = new Date().getTime();
  //     await processTournamentAction(
  //       recentlyUpdatedTournament,
  //       updatedTables,
  //       activeTableId,
  //       uid,
  //       lambda,
  //       true,
  //       hasTournamentLock
  //     );
  //     console.debug(
  //       "lock - tournamentProcessingNeeded",
  //       new Date().getTime() - start
  //     );
  //   } else {
  //     const start = new Date().getTime();
  //     console.debug("lock - start - bluebird");
  //     const tablesRunWithLock: IGame[] = [];
  //     await bluebird.map(
  //       tournamentTables,
  //       async (table: IGame) => {
  //         if (table.stage === GameStage.Active) {
  //           if (
  //             tournamentData.status === TournamentStatus.PauseRequested &&
  //             !table.activeHandId
  //           ) {
  //             return;
  //           }
  //           try {
  //             // Lock the table and fix up the player
  //             const tableLockName = `tournament.${recentlyUpdatedTournament.id}.table.${table.id}`;
  //             await acquireLockAndExecute(
  //               tableLockName,
  //               async () => {
  //                 await processTournamentAction(
  //                   recentlyUpdatedTournament,
  //                   updatedTables,
  //                   table.id,
  //                   uid,
  //                   lambda,
  //                   true,
  //                   false // don't allow tournament updates
  //                 );
  //               },
  //               ""
  //             );
  //           } catch (e) {
  //             if (e.message === TOURNAMENT_LOCK_ERROR && hasTournamentLock) {
  //               tablesRunWithLock.push(table);
  //             }
  //           }
  //         }
  //       },
  //       { concurrency: 40 }
  //     );
  //     if (tablesRunWithLock.length) {
  //       const tableLockName = `tournament.${recentlyUpdatedTournament.id}.table.${tablesRunWithLock[0].id}`;
  //       const result2 = await acquireLockAndExecute(
  //         tableLockName,
  //         async () => {
  //           await processTournamentAction(
  //             recentlyUpdatedTournament,
  //             updatedTables,
  //             tablesRunWithLock[0].id,
  //             uid,
  //             lambda,
  //             true,
  //             hasTournamentLock
  //           );
  //         },
  //         ""
  //       );
  //       console.debug({ result2 });
  //       // process.exit(0);
  //     }
  //     console.debug(
  //       "lock - bluebird",
  //       new Date().getTime() - start,
  //       recentlyUpdatedTournament
  //     );
  //   }
  // }

  console.log("processTournamentAction done");
  return result;
};

const STUCK_HAND_DURATION = 1000 * 60 * 15;
const STUCK_ACTION_DURATION = 1000 * 60 * 5;
const checkGameIntegrity = (
  tournamentData: ITournamentDetails,
  tableUpdates: IGameUpdate
) => {
  // Hand started more X minutes ago
  if (tableUpdates.game.activeHandId) {
    const deltaSinceHandStart =
      new Date().getTime() - parseInt(tableUpdates.game.activeHandId, 10);
    if (
      deltaSinceHandStart > STUCK_HAND_DURATION &&
      tournamentData.status === TournamentStatus.Active
    ) {
      console.error(
        `Hand appears to be stuck: ${tableUpdates.game.activeHandId} (${deltaSinceHandStart})`
      );
    }

    const activeHand = tableUpdates.game.hands?.find(
      (hand) => hand.id === tableUpdates.game.activeHandId
    );
    if (activeHand) {
      const actions = flatMap(activeHand.rounds, (r) => r.actions);
      const lastAction = actions[0];
      if (
        lastAction &&
        lastAction.timestamp &&
        tournamentData.status === TournamentStatus.Active
      ) {
        const deltaSinceLastAction =
          new Date().getTime() - lastAction.timestamp;
        if (deltaSinceLastAction > STUCK_ACTION_DURATION) {
          console.error(
            `Hand appears to be stuck since action: ${tableUpdates.game.activeHandId} (${lastAction.timestamp})`
          );
        }
      }
    }
  }
};

const checkTournamentIntegrity = (
  tournament: FirebaseTypedDoc<ITournamentDetails>,
  tables: { docs: FirebaseTypedDoc<IGame>[] },
  activeTableId: string | null
) => {
  const tournamentData = tournament.data();
  const tableDatas = tables.docs.map((t) => t.data());
  for (const player of Object.values(tournamentData.players)) {
    if (player.tableId && !player.removed) {
      const table = tableDatas.find((t) => t.id === player.tableId);
      if (!table) {
        console.error(
          `checkTournamentIntegrity: ${player.tableId} not found`,
          stringify(tableDatas)
        );
      }
    }
  }

  const seenPlayerIds = new Set<string>();
  for (const tableData of tableDatas) {
    for (const player of Object.values(tableData.players)) {
      if (isPlayerTabled(tableData, player)) {
        if (!seenPlayerIds.has(player.id)) {
          seenPlayerIds.add(player.id);
        } else {
          console.error(`Already seen ${player.id} before ${tableData.id}`);
        }
        const tournamentPlayer = tournamentData.players[player.id];
        if (
          tournamentPlayer &&
          tournamentPlayer.tableId &&
          tournamentPlayer.tableId !== tableData.id
        ) {
          console.error(
            `Table for ${player.id} (${tableData.id}) does not match tournament (${tournamentPlayer.tableId})`,
            stringify(tableData)
          );
        }
      }
    }
  }
};

const updateGame = async (
  firebaseBatch: FirebaseTypedWriteBatch,
  tournament: FirebaseTypedDoc<ITournamentDetails>,
  table: FirebaseTypedDoc<IGame>,
  tableUpdates: IGameUpdate,
  tournamentData: ITournamentDetails,
  isActiveTable: boolean
) => {
  if (
    tableUpdates &&
    tableUpdates.error &&
    tableUpdates.error === ERROR_INVALID_HAND
  ) {
    // The table has an invalid hand for some reason
    // Let's just reset it
    if (isActiveTable) {
      // // await firebaseBatch.update<IGame>(table.ref, { activeHandId: null });
      // // if (tableUpdates.game.activeHandId) {
      // //   await firebaseBatch.update<IHand>(
      // //     table.ref
      // //       .collection<IHand>("hands")
      // //       .doc(tableUpdates.game.activeHandId),
      // //     { error: "Invalid hand - resetting" }
      // //   );
      // // }
      // return tableUpdates;
      console.error(`ERROR_INVALID_HAND`, table.id);
    }
  }

  if (
    tableUpdates &&
    tableUpdates.error &&
    tableUpdates.error !== ERROR_ADVANCE_WITHOUT_ACTION
  ) {
    console.error(`TableUpdates.error: ${tableUpdates.error}`, table.id);
    return tableUpdates;
  }

  try {
    checkGameIntegrity(tournamentData, tableUpdates);
  } catch (e) {
    console.error(e);
  }

  const hands = tableUpdates.game.hands;
  delete tableUpdates.game.hands;

  if (isActiveTable) {
    const tableData = table.data();
    const activeHandId = tableData.activeHandId;
    if (activeHandId) {
      const updatedActiveHand = hands.find((h) => h.id === activeHandId);
      updatedActiveHand.actingPlayerId = tableUpdates.actingPlayerId || null;
      const playerStates = updatedActiveHand.playerStates;

      const priorTable = tournamentData.tables.find((t) => t.id === table.id);
      const priorHand = priorTable.hands.find(
        (h) => h.id === tableData.activeHandId
      );

      const priorPlayerStates = priorHand.playerStates;
      delete priorHand.playerStates;
      delete updatedActiveHand.playerStates;
      const handUpdates = diffObject(priorHand, updatedActiveHand);
      if (Object.keys(handUpdates).length) {
        console.log("handUpdates", stringify(handUpdates));
        await firebaseBatch.update<IHand>(
          table.ref.collection<IHand>("hands").doc(activeHandId),
          handUpdates
        );
      }

      for (const playerState of playerStates) {
        const updatedPlayerState =
          playerState.uid === tableUpdates.actingPlayerId
            ? { ...playerState, actions: tableUpdates.actions || [] }
            : { ...playerState, actions: [] };

        const priorPlayerState = priorPlayerStates.find(
          (p) => p.uid === playerState.uid
        );
        const playerStateUpdates = diffObject(
          priorPlayerState,
          updatedPlayerState
        );

        if (Object.keys(playerStateUpdates).length) {
          console.log("playerStateUpdates", stringify(playerStateUpdates));
          await firebaseBatch.update<IPlayerState>(
            table.ref
              .collection<IHand>("hands")
              .doc(activeHandId)
              .collection<IPlayerState>("players")
              .doc(playerState.uid),
            playerStateUpdates
          );
        }
      }
    }

    // Some update was made
    if (tableUpdates.game.activeHandId !== tableData.activeHandId) {
      // Let's check the previous hand and see what's up...
      const priorHand = hands.find((h) => h.id === tableData.activeHandId);

      // We have a new hand. Save the stats for the old hand (if we had one)
      if (tableData.activeHandId) {
        const statsRef = await tournament.ref
          .collection<IGameStats>("stats")
          .doc(tableData.id)
          .get();
        const statsData = statsRef.exists
          ? statsRef.data()
          : {
            id: tableData.id,
            name: tableData.name,
            activeHandId: tableData.activeHandId,
            stage: tableData.stage,
            handCount: 0,
            handDuration: 0,
            handAmount: 0,
            winners: {},
          };
        const lastHandDuration =
          (tableUpdates.game.activeHandId
            ? parseInt(tableUpdates.game.activeHandId, 10)
            : new Date().getTime()) - parseInt(tableData.activeHandId, 10);
        statsData.handDuration += lastHandDuration;
        statsData.handAmount += priorHand.payouts.reduce(
          (sum, p) => sum + p.total,
          0
        );
        statsData.handCount++;
        for (const payout of priorHand.payouts.filter((p) => p.amount > 0)) {
          if (!statsData.winners[payout.uid]) {
            statsData.winners[payout.uid] = { amount: 0, count: 0 };
          }
          statsData.winners[payout.uid].amount += payout.total;
          statsData.winners[payout.uid].count += 1;
        }
        await firebaseBatch.set<IGameStats>(statsRef.ref, statsData);
        await statsRef.ref.set(statsData);
      }
      const newHand = hands.find(
        (h) => h.id === tableUpdates.game.activeHandId
      );
      if (newHand) {
        if (priorHand && !priorHand.payoutsApplied) {
          throw new Error(
            "Prior hand not completed " + JSON.stringify(tableUpdates.game)
          );
        }

        const playerStates = newHand.playerStates;
        delete newHand.playerStates;
        await firebaseBatch.set<IHand>(
          table.ref.collection<IHand>("hands").doc(newHand.id),
          newHand
        );

        for (const playerState of playerStates) {
          const updatedPlayerState =
            playerState.uid === tableUpdates.actingPlayerId
              ? { ...playerState, actions: tableUpdates.actions || [] }
              : { ...playerState, actions: [] };
          await firebaseBatch.set<IPlayerState>(
            table.ref
              .collection<IHand>("hands")
              .doc(newHand.id)
              .collection<IPlayerState>("players")
              .doc(playerState.uid),
            updatedPlayerState
          );
        }
      }
    }
  }

  delete tableUpdates.game.tournamentDetails;
  const diffedUpdates = diffObject(table.data(), tableUpdates.game);

  if (Object.keys(diffedUpdates).length) {
    console.log("GamediffedUpdates", diffedUpdates);
    await firebaseBatch.update<IGame>(table.ref, diffedUpdates);
  }

  return tableUpdates;
};

export const respondAndAdvanceTournamentHand = async (
  tournamentId: string,
  activeTableId: string | null,
  uid: string | null,
  action: ActionDirective | null,
  amount: number | null,
  lockMetadata?: any,
  isRecursed?: boolean,
  alreadyHasTournamentLock?: boolean,
  disableTournamentLock?: boolean,
  runIntegrityCheck?: boolean
): Promise<any> => {
  console.log(`respondAndAdvanceTournamentHand`, tournamentId, activeTableId);
  const tableLockName = `tournament.${tournamentId}.table.${activeTableId}`;
  const tournamentLockName = `tournament.${tournamentId}`;
  // Just lock at the tourney level if we have the fast cache
  const lockName = activeTableId ? tableLockName : tournamentLockName;
  // const lockName =
  //   activeTableId && !cache.isEnabled() ? tableLockName : tournamentLockName;
  const hasTournamentLock = !activeTableId || alreadyHasTournamentLock;
  return acquireLockAndExecute(
    lockName,
    async () => {
      const executeTournamentAction = async (
        currentlyHasTournamentLock: boolean
      ) => {
        const start = new Date().getTime();
        const { tournament, tables } = await getTournament(tournamentId, {
          includeTables: true,
          allowPartialTables: false, // true,
          activeTableId,
        });
        console.debug(
          `lock getTournament - ${tournamentId}`,
          new Date().getTime() - start
        );
        let result;
        result = await processTournamentAction(
          tournament,
          tables,
          activeTableId,
          uid,
          async (tournamentData, tableData) => {
            return advanceTournamentHand(
              tournamentData,
              tableData,
              action
                ? {
                  action,
                  total: amount,
                  uid,
                  raise: 0,
                  contribution: 0,
                  voluntary: true,
                  allIn: false,
                  conforming: false,
                }
                : null
            );
          },
          isRecursed || disableTournamentLock,
          currentlyHasTournamentLock,
          runIntegrityCheck
        );
        console.debug(
          "lock getTournament - process done",
          new Date().getTime() - start
        );
        return result;
      };
      try {
        const result = await executeTournamentAction(hasTournamentLock);
        return result;
      } catch (e) {
        if (
          !disableTournamentLock &&
          !hasTournamentLock &&
          (e as any).message === TOURNAMENT_LOCK_ERROR
        ) {
          console.log("need tournament lock");
          return acquireLockAndExecute(
            tournamentLockName,
            async () => {
              return executeTournamentAction(true);
            },
            "respondAndAdvanceTournamentHand-tlock",
            lockMetadata
          );
        }
        throw e;
      }
    },
    `respondAndAdvanceTournamentHand-${lockMetadata?.reason}`,
    lockMetadata
  );
};

export const pauseOrResumeTournament = async (
  tournamentId: string,
  pause: boolean,
  message: string
): Promise<any> => {
  const tournamentLockName = `tournament.${tournamentId}`;
  return acquireLockAndExecute(
    tournamentLockName,
    async () => {
      const { tournament, tables } = await getTournament(tournamentId, {
        includeTables: true,
        allowPartialTables: false,
        activeTableId: null,
      });
      return processTournamentAction(
        tournament,
        tables,
        null,
        null,
        async (tournamentData, tableData) => {
          return pause
            ? pauseTournament(tournamentData, message)
            : resumeTournament(tournamentData);
        },
        false,
        true
      );
    },
    "pauseOrResumeTournament"
  );
};

export function lockTournamentAndRun<ReturnType>(
  tournamentId: string,
  activeTableId: string,
  lambda: { (): Promise<ReturnType> },
  source?: string
): Promise<ReturnType> {
  if (!cache.isEnabled()) return lambda();

  const lockTournamentLambda = () => {
    const tournamentLockName = `tournament.${tournamentId}`;
    console.debug("lockTournamentAndRun");
    return acquireLockAndExecute(
      tournamentLockName,
      async () => {
        console.debug("lockTournamentAndRun - run");
        const result = await lambda();
        return result;
      },
      `lockTournamentAndRun-${source}`
    );
  };
  if (activeTableId) {
    const tournamentTableLockName = `tournament.${tournamentId}.table.${activeTableId}`;
    console.debug("lockTournamentTableAndRun");
    return acquireLockAndExecute(
      tournamentTableLockName,
      async () => {
        console.debug("lockTournamentTableAndRun - run");
        const result = await lambda();
        return result;
      },
      `lockTournamentTableAndRun-${source}`
    );
  }
  return lockTournamentLambda();
}

export const handleEnforceTimeout = async (
  table: IGame,
  uid: string,
  action: string,
  amount: number
) => {
  // return processGameAction(table, uid, (tableData) => {
  //   return enforceTimeout(tableData);
  // });
};

export async function handleSnapshotTournament(
  tournamentId: string,
  reason: string,
  getTournament: GetTournamentFunction
): Promise<void> {
  const { tournament, tables: tableDocs } = await getTournament(tournamentId, {
    includeTables: true,
  });

  const tables = [];
  for (const table of tableDocs.docs) {
    const tableData = table.data();
    const hands = await table.ref.collection<IHand>("hands").get();
    tableData.hands = [];
    for (const hand of hands.docs) {
      const handData = hand.data();
      handData.players = [];
      const players = await hand.ref.collection<IPlayerState>("players").get();
      for (const player of players.docs) {
        handData.players.push(player.data());
      }
      tableData.hands.push(handData);
    }
    tables.push(tableData);
  }

  const tournamentData = tournament.data();

  const time = new Date().getTime();
  await tournament.ref.collection("snapshots").doc(`${time}`).set({
    reason,
    tournament: tournamentData,
    tables,
  });
}