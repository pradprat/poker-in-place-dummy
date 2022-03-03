import express from "express";
import { GetTableFunction, AuthenticatedRequest } from "./lib";

import { remove } from "./remove";

export async function leave(
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
  if (!tableData.players[request.user.uid] || !tableData.players[userId]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  // Remove players when they leave
  if (tableData.features?.removeOnLeave) {
    return remove(request, response, { getTable });
  }

  await tableDoc.update({
    [`players.${userId}.away`]: true,
    // [`players.${userId}.active`]: false,
  });

  return response.json({
    leave: true,
  });
}
