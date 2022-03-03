import express from "express";
import { GameStage, PlayerRole } from "../engine/types";
import { GetTableFunction, AuthenticatedRequest } from "./lib";

import {
  isPaid,
  isPlayerTabled,
  getMaximumParticipants,
  getTabledPlayers,
  getBuyInAmount,
} from "../engine/index";

export async function join(
  request: AuthenticatedRequest,
  response: express.Response,
  { getTable }: { getTable: GetTableFunction }
) {
  const { tableId, role } = request.query;

  const tableDoc = await getTable(tableId as string, null);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const tableData = tableDoc.data();

  if (!isPaid(tableData, request.user.uid)) {
    return response.status(403).json({ error: "Payment not received" });
  }

  const isAlreadyJoined = isPlayerTabled(
    tableData,
    tableData.players[request.user.uid]
  );

  const maximumParticipants = getMaximumParticipants(tableData.mode);
  if (!isAlreadyJoined) {
    // TODO - do we want to block active games? If the game is active
    // we need to place the new comer at some position - probably
    // after the last player for simplicity
    const canJoinWithoutAssignment =
      tableData.stage === GameStage.Initialized ||
      tableData.stage === GameStage.Waiting;
    // if (
    //   tableData.type !== "open" ||
    //   (tableData.stage !== "initialized" && tableData.stage !== "waiting")
    // ) {
    //   console.log({ tableData });
    //   return response.status(403).json({ error: "Unauthorized"});
    // }
    const tabledPlayers = getTabledPlayers(tableData);
    const playerCount = tabledPlayers.length;
    if (playerCount + 1 > maximumParticipants) {
      return response.status(403).json({ error: "Participant limit reached" });
    }

    let position = -1;
    if (!canJoinWithoutAssignment) {
      // We need to assign a position to the new-comer

      position = tabledPlayers.reduce(
        (pos, player) => Math.max(pos, player.position + 1),
        0
      );

      // TODO - add new player joining
      // Maybe think about blinds? or not?
    }

    const { buyIn, stack } = getBuyInAmount(tableData);
    const isObserver = role === PlayerRole.Observer;
    const existingPlayerRole = tableData.players[request.user.uid]
      ? tableData.players[request.user.uid].role
      : PlayerRole.Player;
    const playerRole = isObserver ? PlayerRole.Observer : existingPlayerRole;
    if (isObserver) {
      await tableDoc.update({
        [`players.${request.user.uid}`]: {
          active: false,
          stack: 0,
          contributed: 0,
          position: -1,
          id: request.user.uid,
          name: request.user.name || `${request.user.uid}`,
          email: request.user.email || "",
          photoURL: request.user.picture || "",
          role: playerRole,
          removed: true,
        },
      });
    } else {
      await tableDoc.update({
        [`players.${request.user.uid}`]: {
          active: true,
          stack,
          contributed: buyIn,
          position,
          id: request.user.uid,
          name: request.user.name || `${request.user.uid}`,
          email: request.user.email || "",
          photoURL: request.user.picture || "",
          role: playerRole,
          removed: false,
        },
      });
    }
  } else {
    await tableDoc.update({
      [`players.${request.user.uid}.active`]: true,
      [`players.${request.user.uid}.away`]: false,
      [`players.${request.user.uid}.willRemove`]: false,
      [`players.${request.user.uid}.removed`]: false,
    });
  }

  return response.json({
    joined: true,
  });
}
