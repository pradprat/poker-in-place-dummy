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
