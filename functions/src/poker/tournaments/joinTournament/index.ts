import express from "express";

import { canRebuyInTournament, getMaximumParticipants } from "../../../engine";
import { getTabledPlayersInTournament, isPlayerAliveInTournament, isPlayerTabledInTournament, MAX_TABLE_SIZE, tableSortFunc } from "../../../engine/tournament";
import {
  IGame, ITournamentDetails, TournamentStatus,
  TournamentRegistrationMode, PlayerRole, ITournamentRegistration,
  IHand, IPlayerState, ITournamentPlayer
} from '../../../engine/types';

import { AuthenticatedRequest } from '../../lib';
import { acquireLockAndExecute, FirebaseTypedDoc, typedDb } from '../../utils';
import { addPlayerToTable } from "../addPlayerToTable";
import { GetTournamentFunction, lockTournamentAndRun } from '../lib';

import {
  IProcessPlayerCodeParams, IProcessPlayerCodeResponse,
  IAssignCurrentPlayerToTableParams, IAssignPlayerToTournamentParams,
  IAssignPlayerToClosedTournamentParams, IAssignPlayerToClosedTournamentResponse,
  IAssignNewPlayerToTableParams,
  IGetPlayersCountParams
} from './interface';

/**
 * @swagger
 *
 * /tournament/join:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: code
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         403:
 *           description: Something went wrong
 *         200:
 *           description: An object with  after joining a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   joined: 
 *                    type: boolean
 */
export const joinTournament = async (
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) => {
  const { tournamentId, code: inputCode } = JSON.parse(request.body);
  const userId = request.user.uid;

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc1, tables: tableDocs1 } =
      await getTournament(tournamentId, {
        includeTables: true,
        allowPartialTables: false,
      });

    let tournamentDoc: FirebaseTypedDoc<ITournamentDetails> = tournamentDoc1;
    let tableDocs: {
      docs: FirebaseTypedDoc<IGame>[];
    } = tableDocs1;

    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    let tournamentData = tournamentDoc.data();
    let isAlreadyJoined = isPlayerTabledInTournament(
      tournamentData,
      tournamentData.players[userId]
    );

    const isNewPlayerForClosedTournament = !isAlreadyJoined &&
      tournamentData.registrationMode === TournamentRegistrationMode.Code

    if (isNewPlayerForClosedTournament) {
      const { error } = await assignPlayerToClosedTournament({
        inputCode, tournamentId, tournamentDoc, tableDocs, request, getTournament
      });

      if (error) {
        return response.status(403).json({ error });
      }

      isAlreadyJoined = true;

      // Refresh the tables since we've now joined
      const { tournament: tournamentDoc2, tables: tableDocs2 } =
        await getTournament(tournamentId, {
          includeTables: true,
          allowPartialTables: false,
        });

      tournamentDoc = tournamentDoc2;
      tableDocs = tableDocs2;
      tournamentData = tournamentDoc.data();
    }

    const maximumParticipants = getMaximumParticipants(tournamentData.mode);

    if (isAlreadyJoined) {
      if (tournamentData.status === TournamentStatus.Initialized) {
        await tournamentDoc.update({
          [`players.${userId}.active`]: true,
          [`players.${userId}.removed`]: false,
          [`players.${userId}.away`]: false,
          [`players.${userId}.created`]: new Date().getTime(),
        });
      } else {
        const tableId = tournamentData.players[userId]
          ? tournamentData.players[userId].tableId
          : null;

        const tableDoc = tableDocs.docs.find((t) => t.id === tableId);
        if (!tableDoc) {
          return response
            .status(403)
            .json({ error: "Unauthorized", tableId, userId });
        }

        const tableData = tableDoc.data();
        if (!tableData || !tableData.players[userId]) {
          return response
            .status(403)
            .json({ error: "Unauthorized", tableId, userId });
        }

        const propertyToUpdate = {
          [`players.${userId}.away`]: false,
        };

        await tableDoc.update(propertyToUpdate);
        await tournamentDoc.update(propertyToUpdate);
      }
    } else {
      if (tournamentData.status !== TournamentStatus.Initialized) {
        return response.status(403).json({ error: "Unauthorized" });
      }
      const tabledPlayers = getTabledPlayersInTournament(tournamentData);
      const playerCount = tabledPlayers.length;
      if (playerCount + 1 > maximumParticipants) {
        return response
          .status(403)
          .json({ error: "Participant limit reached" });
      }

      const position = -1;

      const buyIn = tournamentData.buyIn;
      const stack = tournamentData.startingStack;

      const playerRole = tournamentData.players[userId]
        ? tournamentData.players[userId].role
        : PlayerRole.Player;
      await tournamentDoc.update({
        [`players.${userId}`]: {
          active: true,
          stack,
          contributed: buyIn,
          position,
          id: userId,
          name: request.user.name || userId,
          email: request.user.email || "",
          photoURL: request.user.picture || "",
          role: playerRole,
          removed: false,
          created: new Date().getTime(),
          arrived: true,
        },
      });
    }

    return response.json({
      joined: true,
    });
  });
}

const assignPlayerToClosedTournament = async ({
  inputCode, tournamentId, tournamentDoc, tableDocs, request
}: IAssignPlayerToClosedTournamentParams): Promise<IAssignPlayerToClosedTournamentResponse> => {
  const tournamentData = tournamentDoc.data();
  const {
    error, isObserver, userWithCode, registrationsWithCode
  } = await processPlayerCode({ inputCode, tournamentId, tournamentData, request })

  if (error) {
    return { error };
  }

  const player = await assignPlayerToTournament({ isObserver, tournamentData, request, tournamentDoc, userWithCode });

  if (player?.tableId) {
    await assignCurrentPlayerToTable({ tableDocs, player, tournamentId, userId: request.user.uid })
  } else {
    const shouldAssignNewPlayerToTable = player
      && !player.tableId
      && !player.removed
      && !player.bustedTimestamp
      && tournamentData.status !== TournamentStatus.Initialized;

    if (shouldAssignNewPlayerToTable) {
      if (!isPossibleToRegister(tournamentData)) {
        return { error: "Sorry, you can't join the tournament because late registration is over" };
      }

      const { error } = await assignNewPlayerToTable({ tableDocs, player, tournamentId, tournamentData });

      if (error) {
        return { error };
      }
    }
  }

  if (registrationsWithCode.length) {
    await registrationsWithCode[0].update({
      secret: request.user.uid,
      joined: true,
    });
  }

  return {};
}

const processPlayerCode = async ({
  inputCode, tournamentId, tournamentData, request
}: IProcessPlayerCodeParams): Promise<IProcessPlayerCodeResponse> => {
  if (!inputCode) {
    return { error: "Code Required" };
  }

  const code = String(inputCode).trim().toLowerCase();

  const isObserver =
    code === PlayerRole.Observer &&
    tournamentData.allowGuestsInOverflowRooms;

  const registrationsWithCode = (
    await typedDb
      .collection<ITournamentDetails>("tournaments")
      .doc(tournamentId)
      .collection<ITournamentRegistration>("registrants")
      .where("code", "==", code)
      .get()
  ).docs;

  const isPlayerCodeNotFound = !isObserver && (!registrationsWithCode.length || registrationsWithCode.length > 1);

  if (isPlayerCodeNotFound) {
    return { error: "Player code not found" };
  }

  const codePlayer = Object.values(tournamentData.players).find(
    (p) => p.id === registrationsWithCode[0].data().secret
  );

  if (!codePlayer && !isObserver) {
    return { error: "Player code not found" };
  }

  const userWithCode = isObserver ? {
    id: request.user.uid,
    tableId: "",
    name: request.user.name || request.user.uid,
    email: request.user.email || "",
    photoURL: request.user.picture || "",
    position: -1,
    stack: 0,
    contributed: 0,
    rebuys: [],
    active: false,
  } : codePlayer;

  return { userWithCode, isObserver, registrationsWithCode };
}

const assignPlayerToTournament = async (
  { isObserver, tournamentData, request, tournamentDoc, userWithCode }: IAssignPlayerToTournamentParams
): Promise<ITournamentPlayer> => {
  // Allow joining as an observer
  const defaultRole = isObserver ? PlayerRole.Observer : PlayerRole.Player;
  const playerRole = tournamentData.players[request.user.uid]
    ? tournamentData.players[request.user.uid].role
    : defaultRole;
  const extraOptions = isObserver ? { removed: true } : {};

  const player = {
    ...userWithCode,
    id: request.user.uid,
    name: request.user.name || request.user.uid,
    email: request.user.email || "",
    photoURL: request.user.picture || "",
    created: new Date().getTime(),
    role: playerRole,
    arrived: true,
    ...extraOptions,
  }

  // We need to "unregister" the player and register this one...
  await tournamentDoc.update({
    ...!isObserver && {
      [`players.${userWithCode.id}`]: { removed: true },
    },
    [`players.${request.user.uid}`]: player,
  });

  return player;
}

const assignCurrentPlayerToTable = async (
  { tableDocs, player, tournamentId, userId }: IAssignCurrentPlayerToTableParams
): Promise<void> => {
  const tableDoc = tableDocs.docs.find(
    (t) => t.id === player.tableId
  );
  const tableData = tableDoc.data();
  const tablePlayer = tableData.players[player.id];

  if (!tablePlayer) {
    return Promise.resolve();
  }

  // Lock the table and fix up the player
  const tableLockName = `tournament.${tournamentId}.table.${player.tableId}`;
  return acquireLockAndExecute(
    tableLockName,
    async () => {
      const batch = typedDb.batch();
      await batch.update<IGame>(tableDoc.ref, {
        [`players.${player.id}`]: { removed: true },
        [`players.${userId}`]: tablePlayer,
      });

      if (tableData.activeHandId) {
        const hand = await typedDb
          .collection<IGame>("tables")
          .doc(player.tableId)
          .collection<IHand>("hands")
          .doc(tableData.activeHandId)
          .get();

        if (hand) {
          const handData = hand.data();
          await batch.update<IHand>(hand.ref, {
            dealerId:
              handData.dealerId === player.id
                ? userId
                : handData.dealerId,
            smallBlindId:
              handData.smallBlindId === player.id
                ? userId
                : handData.smallBlindId,
            bigBlindId:
              handData.bigBlindId === player.id
                ? userId
                : handData.bigBlindId,
            actingPlayerId:
              handData.actingPlayerId === player.id
                ? userId
                : handData.actingPlayerId,
            playerIds: handData.playerIds.map((pid) =>
              pid === player.id ? userId : pid
            ),
            rounds: handData.rounds.map((round) => ({
              ...round,
              actions: round.actions.map((a) => ({
                ...a,
                uid:
                  a.uid === player.id
                    ? userId
                    : a.uid,
              })),
            })),
          });

          const playerState = await hand.ref
            .collection<IPlayerState>("players")
            .doc(player.id)
            .get();

          if (playerState) {
            const playerData = playerState.data();
            await batch.set<IPlayerState>(
              hand.ref
                .collection<IPlayerState>("players")
                .doc(userId),
              {
                ...playerData,
                uid: userId,
              }
            );
          }
        }
      }
      return await batch.commit();
    },
    "join"
  );
}

const assignNewPlayerToTable = async ({
  player, tableDocs, tournamentId, tournamentData,
}: IAssignNewPlayerToTableParams): Promise<{ error?: string }> => {
  const tableId = getTableIdForNewPlayer({ tableDocs, tournamentData })

  if (!tableId) {
    return { error: 'No available tables, please try again later' };
  }

  return await addPlayerToTable({ tournamentId, tableId, player });
}

const getTableIdForNewPlayer = ({ tableDocs, tournamentData }: IGetPlayersCountParams) => {
  const tablesWithCountOfActivePlayers = getTablesWithCountOfActivePlayers({ tableDocs, tournamentData });
  const sortedTables = Object
    .values(tablesWithCountOfActivePlayers)
    .sort(tableSortFunc);

  return sortedTables[0]?.count < MAX_TABLE_SIZE ? sortedTables[0].table?.id: null;
}

const getTablesWithCountOfActivePlayers = ({
  tableDocs, tournamentData
}: IGetPlayersCountParams): Record<string, { count: number; table: IGame }> => {
  const tableActivePlayerCount: Record<string, { count: number; table: IGame }> = {};

  for (const tableDoc of tableDocs.docs) {
    const table = tableDoc.data();
    // Determine count of active players for each table
    for (const player of Object.values(table.players)) {
      const isActivePlayer = !player.removed && (
        isPlayerAliveInTournament(tournamentData, player) ||
        canRebuyInTournament(tournamentData, player)
      );

      if (isActivePlayer) {
        if (!tableActivePlayerCount[table.id]) {
          tableActivePlayerCount[table.id] = { count: 0, table };
        }
        tableActivePlayerCount[table.id].count++;
      }
    }
  }

  return tableActivePlayerCount;
}

const isPossibleToRegister = (tournamentData: ITournamentDetails): boolean => {
  const now = new Date().getTime();
  const registrationCloseTime = tournamentData.startTime + tournamentData.lateRegistrationTimeInMinutes * 60 * 1000;

  return now < registrationCloseTime;
}