/**
 * @swagger
 *
 * /end:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
 *         in: body
 *         required: true
 *         type: string
 *       - name: playerId
 *         in: body
 *         required: true
 *         type: string
 *       - name: away
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         403:
 *           description: Not Authorized
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 *         200:
 *           description: An object with boolean value after game is expired on table
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   stage: 
 *                    type: string
 */
async function end(request, response, { getTable }) {
  const { tableId } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).send("Unauthorized");
  }

  const tableData = tableDoc.data();
  if (!tableData.players[request.user.uid]) {
    return response.status(403).send("Unauthorized");
  }

  await tableDoc.update({
    stage: "ended",
  });

  console.log(`Expiring game ${tableDoc.id}`);

  return response.json({ stage: "ended" });
}

module.exports = { end };
