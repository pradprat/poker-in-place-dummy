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
