/**
 * @swagger
 *
 * /update/blinds:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
 *         in: query
 *         required: true
 *         type: string
 *       - name: bigBlindAmount
 *         in: query
 *         required: true
 *         type: number
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
 *           description: An object with updated blind amount and increment after updating the blind
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   currentBigBlind: 
 *                    type: number
 *                   increment: 
 *                    type: number
 */
async function updateBlinds(request, response, { getTable }) {
  const { tableId, bigBlindAmount } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const tableData = tableDoc.data();
  if (!tableData.players[request.user.uid]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const bigBlindDecimal = parseFloat(bigBlindAmount);

  await tableDoc.update({
    currentBigBlind: bigBlindDecimal,
    increment: bigBlindDecimal / 2
  });

  return response.json({
    currentBigBlind: bigBlindDecimal,
    increment: bigBlindDecimal / 2
  });
}
module.exports = { updateBlinds };
