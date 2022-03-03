import {
  ITournamentDetails,
  PlayerRole,
  TournamentStatus,
} from "../src/engine/types";
import { typedDb } from "../src/poker/utils";
// const stringify = require("json-stringify-safe");

(async function run() {
  const organizerIds = process.argv[2].split(",");

  const tournamentSet: { [id: string]: ITournamentDetails } = {};
  for (const organizerId of organizerIds) {
    const tournaments = await typedDb
      .collection<ITournamentDetails>("tournaments")
      .where("organizerIds", "array-contains", organizerId)
      .get();
    for (const tournament of tournaments.docs) {
      const data = tournament.data();
      if (data.status !== TournamentStatus.Initialized) {
        tournamentSet[tournament.id] = data;
      }
    }
  }
  const results = Object.values(tournamentSet)
    .map((t) => ({
      id: t.id,
      startTime: t.startTime,
      startDate: (t as any).startDate,
      status: t.status,
      endTime: Object.values(t.players)
        .filter((p) => p.bustedTimestamp)
        .map((p) => p.bustedTimestamp)
        .sort((b1, b2) => b2 - b1)[0],
      name: t.name,
      players: Object.values(t.players)
        .filter(
          (p) =>
            // p.arrived &&
            p.role === PlayerRole.Player &&
            p.name.toLocaleLowerCase().indexOf("backup") < 0
        )
        .map((p) => ({ id: p.id, name: p.name, role: p.role })),
    }))
    .sort((t1, t2) => t1.startTime - t2.startTime);
  console.log(
    JSON.stringify(
      results
        .map((r) => ({
          id: r.id,
          name: r.name,
          date: r.startDate,
          duration: (r.endTime - r.startTime) / 1000 / 60,
          playerCount: r.players.length,
        }))
        .filter(
          (r) =>
            r.duration > 45 &&
            r.playerCount > 8 &&
            r.name.toLocaleLowerCase().indexOf("test") < 0
        ),
      null,
      2
    )
  );
})();
