const { respondAndAdvanceHand } = require("./lib");

/**
 * @swagger
 *
 * /reset:
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
 *           description: An object with boolean value after resetting  the table
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   reset: 
 *                    type: boolean
 */
async function reset(request, response, { getTable }) {
  const { tableId } = request.query;
  let tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const tableData = tableDoc.data();
  if (!tableData.players[request.user.uid]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  await tableDoc.update({
    activeHandId: null,
  });

  // Kick off the next hand
  const uid = request.user.uid;
  await respondAndAdvanceHand(tableId, uid, null, null);

  return response.json({
    reset: true,
  });
}

module.exports = { reset };
