import express from "express";
import { GameStage } from "../engine/types";
import {
  GetTableFunction,
  AuthenticatedRequest,
  respondAndAdvanceHand,
} from "./lib";

export async function remove(
  request: AuthenticatedRequest,
  response: express.Response,
  { getTable }: { getTable: GetTableFunction }
) {
  const { tableId, playerId } = request.query;
  const tableDoc = await getTable(tableId as string, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }
  const userId = (playerId as string) || request.user.uid;

  const tableData = tableDoc.data();
  // Don't remove a player in an active hand
  const hasActiveHand = !!tableData.activeHandId;
  const removeKey = hasActiveHand
    ? `players.${userId}.willRemove`
    : `players.${userId}.removed`;

  await tableDoc.update({
    [removeKey]: true,
    [`players.${userId}.active`]: false,
    [`players.${userId}.away`]: true,
  });
  await tableDoc.update({
    [`removed_players.${userId}.timestamp`]: new Date().getTime(),
  });

  // Advance the hand if they leave
  if (tableData.stage === GameStage.Active) {
    await respondAndAdvanceHand(
      tableId as string,
      request.user.uid,
      null,
      null
    );
  }

  return response.json({
    remove: true,
  });
}
