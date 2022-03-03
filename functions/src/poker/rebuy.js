const { canRebuy, getBuyInAmount } = require("../engine/index");

/**
 * @swagger
 *
 * /rebuy:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
 *         in: query
 *         required: true
 *         type: string
 *       - name: playerId
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *         403:
 *           description: Something went wrong
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 *         400:
 *           description: Resource Not Found
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 *         200:
 *           description: An object with boolean value to show after table is rebought by user
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   rebuy: 
 *                    type: boolean
 */
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
