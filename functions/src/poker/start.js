const { shuffle } = require("../utils/deck");

/**
 * @swagger
 *
 * /start:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
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
 *         200:
 *           description: An object with stage property after starting the table
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   stage: 
 *                    type: string
 */
async function start(request, response, { getTable }) {
  const { tableId } = request.query;

  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({
      error: "Unauthorized",
    });
  }

  const tableData = tableDoc.data();
  if (tableData.stage !== "waiting") {
    return response.status(403).json({
      error: "Unauthorized",
    });
  }

  if (Object.keys(tableData.players).length <= 1) {
    return response.json({
      error: "Need at least 2 players to begin",
    });
  }

  // We need to assign positions to players
  const shuffledPlayers = shuffle(Object.values(tableData.players));
  const updates = {};
  for (let i = 0; i < shuffledPlayers.length; ++i) {
    updates[`players.${shuffledPlayers[i].id}.position`] = i;
  }

  await tableDoc.update({
    stage: "active",
    ...updates,
  });

  // // Create the hand and deal the cards...
  // let updatedTableDoc = await getTable(tableId, request.user.uid);
  // await respondAndAdvanceHand(updatedTableDoc);
  // updatedTableDoc = await getTable(tableId, request.user.uid);
  // await respondAndAdvanceHand(updatedTableDoc);

  return response.json({
    stage: "active",
  });
}

module.exports = { start };
