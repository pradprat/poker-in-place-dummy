const { canRebuy, getBuyInAmount } = require("../engine/index");

async function rebuy(request, response, { getTable }) {
  const { tableId, playerId } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const userId = playerId || request.user.uid;

  const tableData = tableDoc.data();
  if (!tableData.players[userId]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  if (!canRebuy(tableData, tableData.players[userId])) {
    console.error("Not allowed to rebuy", {
      uid: userId,
      stack: tableData.players[userId].stack,
      active: tableData.players[userId].active,
    });
    return response.status(400).json({ error: "Not allowed to rebuy" });
  }

  const rebuys = tableData.players[userId].rebuys || [];
  const { buyIn, stack } = getBuyInAmount(tableData);
  const updates = {
    [`players.${userId}.active`]: true,
    [`players.${userId}.stack`]: stack,
    [`players.${userId}.rebuys`]: [
      ...rebuys,
      { amount: buyIn, timestamp: new Date().getTime() },
    ],
    [`players.${userId}.contributed`]:
      tableData.players[userId].contributed + buyIn,
    [`players.${userId}.bustedTimestamp`]: Number.MAX_SAFE_INTEGER,
  };
  await tableDoc.update(updates);
  // const tableDoc2 = await getTable(tableId, request.user.uid);
  // console.log("rebuy", request.user.uid, updates);

  return response.json({
    rebuy: true,
  });
}
module.exports = { rebuy };
