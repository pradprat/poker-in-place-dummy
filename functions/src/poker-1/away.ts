import express from "express";
import { GetTableFunction, AuthenticatedRequest } from "./lib";

export async function away(
  request: AuthenticatedRequest,
  response: express.Response,
  { getTable }: { getTable: GetTableFunction }
) {
  const { tableId, playerId, away: isAway } = JSON.parse(request.body);
  const tableDoc = await getTable(tableId as string, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }
  const userId = (playerId as string) || request.user.uid;

  const tableData = tableDoc.data();
  if (!tableData.players[request.user.uid] || !tableData.players[userId]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  await tableDoc.update({
    [`players.${userId}.away`]: isAway,
  });

  return response.json({
    away: true,
  });
}
