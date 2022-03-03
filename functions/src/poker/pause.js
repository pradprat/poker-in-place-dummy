/**
 * @swagger
 *
 * /pause:
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
 *           description: An object with boolean value to show after table is paused
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   paused: 
 *                    type: boolean
 */
async function pause(request, response, { getTable }) {
  const { tableId } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const tableData = tableDoc.data();
  if (!tableData.players[request.user.uid]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  await tableDoc.update({
    paused: true,
  });

  return response.json({
    paused: true,
  });
}

/**
 * @swagger
 *
 * /unpause:
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
 *           description: An object with boolean value to show after table is unpaused
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   paused: 
 *                    type: boolean
 */
async function unpause(request, response, { getTable }) {
  const { tableId } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const tableData = tableDoc.data();
  if (!tableData.players[request.user.uid]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  await tableDoc.update({
    paused: false,
  });

  return response.json({
    paused: false,
  });
}

module.exports = { pause, unpause };
