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
