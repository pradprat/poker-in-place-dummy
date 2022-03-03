import express from "express";
import * as admin from "firebase-admin";
import {
  IGame,
  IHand,
  IPlayerState,
  PlayerRole,
  GameDirective,
  ActionDirective,
  IAction,
  IJwtUser,
  GameStage,
} from "../engine/types";
import {
  typedDb,
  FirebaseTypedDoc,
  acquireLockAndExecute,
  diffObject,
} from "./utils";
import {
  advanceHand,
  enforceTimeout,
  AUTO_ADVANCE_DIRECTIVES,
  ERROR_ADVANCE_WITHOUT_ACTION,
  ERROR_NO_NEXT_ACTIVE_PLAYER,
} from "../engine/index";

export interface IServerGame extends IGame {
  hostedMedia: string;
  mediasoupHost: string;
}

export interface AuthenticatedRequest extends express.Request {
  user: IJwtUser;
}

export type GetTableFunction = {
  (tableId: string, uid: string, args?: {}): Promise<
    FirebaseTypedDoc<IServerGame>
  >;
};

export const getTable: GetTableFunction = async (
  tableId: string,
  uid: string,
  args?: {}
) => {
  const rootTableQuery = typedDb
    .collection<IServerGame>("tables")
    .where(admin.firestore.FieldPath.documentId(), "==", tableId);

  const tables = !uid
    ? await rootTableQuery.get()
    : await rootTableQuery
        .where(`players.${uid}.role`, "in", [
          PlayerRole.Player,
          PlayerRole.Organizer,
          PlayerRole.Featured,
          PlayerRole.Observer,
        ])
        .get();

  return tables.docs[0];
};

type GameAdvanceResponse = {
  game: IGame;
  directive: GameDirective;
  actingPlayerId: string;
  actions: IAction[];
  error?: any;
};

export const processGameAction = async (
  table: FirebaseTypedDoc<IServerGame>,
  uid: string,
  lambda: {
    (game: IServerGame): GameAdvanceResponse;
  }
): Promise<GameAdvanceResponse> => {
  const tableData = table.data();
  const activeHand = tableData.activeHandId
    ? await table.ref
        .collection<IHand>("hands")
        .doc(tableData.activeHandId)
        .get()
    : null;

  if (!activeHand) {
    tableData.hands = [];
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

  // Attemped to advance the hand as the current
  let updates: GameAdvanceResponse;
  try {
    updates = lambda(tableData);
  } catch (e) {
    if (e.message === ERROR_NO_NEXT_ACTIVE_PLAYER) {
      // The game is over - either restart it OR end it
      if (tableData.features?.restartOnEnd) {
        await table.update({
          players: {},
          stage: GameStage.Waiting,
          timestamp: new Date().getTime(),
          activeHandId: null,
        });
      } else {
        await table.update({ stage: GameStage.Ended });
      }
      return {
        game: tableData,
        directive: GameDirective.End,
        actingPlayerId: null,
        actions: null,
      };
    }
    throw e;
  }

  const hands = updates.game.hands;
  delete updates.game.hands;

  if (updates.error && updates.error !== ERROR_ADVANCE_WITHOUT_ACTION) {
    return updates;
  }

  const firebaseBatch = typedDb.batch();
  if (activeHand) {
    const activeHandId = tableData.activeHandId;
    const updatedActiveHand = hands.find((h) => h.id === activeHandId);
    updatedActiveHand.actingPlayerId = updates.actingPlayerId || null;
    const playerStates = updatedActiveHand.playerStates;

    const priorHand = tableData.hands[0];

    const priorPlayerStates = priorHand.playerStates;
    delete priorHand.playerStates;
    delete updatedActiveHand.playerStates;
    const handUpdates = diffObject(priorHand, updatedActiveHand);
    if (Object.keys(handUpdates).length) {
      await firebaseBatch.update<IHand>(
        table.ref.collection<IHand>("hands").doc(activeHandId),
        handUpdates
      );
    }

    for (const playerState of playerStates) {
      const updatedPlayerState =
        playerState.uid === updates.actingPlayerId
          ? {
              ...playerState,
              actions: updates.actions || [],
            }
          : { ...playerState, actions: [] };

      const priorPlayerState = priorPlayerStates.find(
        (p) => p.uid === playerState.uid
      );
      const playerStateUpdates = diffObject(
        priorPlayerState,
        updatedPlayerState
      );

      if (Object.keys(playerStateUpdates).length) {
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
  if (updates.game.activeHandId !== tableData.activeHandId) {
    const newHand = hands.find((h) => h.id === updates.game.activeHandId);

    if (newHand) {
      // Let's check the previous hand and see what's up...
      const priorHand = hands.find((h) => h.id === tableData.activeHandId);
      if (priorHand && !priorHand.payoutsApplied) {
        throw new Error(
          "Prior hand not completed " + JSON.stringify(updates.game)
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
          playerState.uid === updates.actingPlayerId
            ? { ...playerState, actions: updates.actions || [] }
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

    // Remove will-remove players
    Object.keys(updates.game.players).forEach((playerId) => {
      if (
        !updates.game.players[playerId].removed &&
        updates.game.players[playerId].willRemove
      ) {
        console.log("xxx", `removing player ${playerId}`);
        updates.game.players[playerId].removed = true;
      }
    });
  }

  const diffedUpdates = diffObject(table.data(), updates.game);
  // console.log("diff-table", diffedUpdates);

  if (Object.keys(diffedUpdates).length) {
    await firebaseBatch.update<IGame>(table.ref, diffedUpdates);
  }

  // await table.update(updates.game);
  await firebaseBatch.commit();

  // Auto-advance these baby ones
  if (AUTO_ADVANCE_DIRECTIVES[updates.directive] === 0) {
    const updatedTable = await table.ref.get();
    return processGameAction(updatedTable, uid, (updatedTableData: IGame) => {
      return advanceHand(updatedTableData, null);
    });
  }

  return updates;
};

export const respondAndAdvanceHand = async (
  tableId: string,
  uid?: string,
  action?: ActionDirective,
  amount?: number,
  lockMetadata?: any
) => {
  return acquireLockAndExecute(
    `table.${tableId}`,
    async () => {
      const table = await getTable(tableId, uid);
      return processGameAction(table, uid, (tableData: IServerGame) => {
        return advanceHand(
          tableData,
          action
            ? {
                action,
                total: amount,
                uid,
                raise: 0,
                contribution: 0,
                voluntary: false,
                allIn: false,
                conforming: false,
              }
            : null,
          false,
          true,
          false
        );
      });
    },
    "respondAndAdvanceHand",
    lockMetadata
  );
};

export const handleEnforceTimeout = async (
  tableId: string,
  uid?: string,
  lockMetadata?: any
) => {
  return acquireLockAndExecute(
    `table.${tableId}`,
    async () => {
      const table = await getTable(tableId, uid);
      return processGameAction(table, uid, (tableData: IServerGame) => {
        return enforceTimeout(tableData);
      });
    },
    "handleEnforceTimeout",
    lockMetadata
  );
};

export { typedDb };
