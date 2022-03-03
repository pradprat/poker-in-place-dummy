import { HandRound } from "../../../engine/types";
import { createTournament } from "./utils";

// 8 players per table;
const tournament = createTournament("Single Table", 8, 1);

// Let's add some hands to the tables
for (let i = 0; i < tournament.tables.length; ++i) {
  const id = String(i);
  tournament.tables[i].activeHandId = id;
  tournament.tables[i].hands.push({
    id,
    activeDeckId: "TESTDECK",
    cardsDealt: 0,
    smallBlind: 0,
    bigBlind: 0,
    activeRound: HandRound.Flop,
    rounds: [],
    playerStates: [],
    payouts: [],
    payoutsApplied: false,
    dealerId: Object.values(tournament.tables[i].players)[0].id,
    smallBlindId: Object.values(tournament.tables[i].players)[1].id,
    bigBlindId: Object.values(tournament.tables[i].players)[2].id,
    actingPlayerId: Object.values(tournament.tables[i].players)[3].id,
    playerIds: Object.keys(tournament.tables[i].players),
  });
}

export default tournament;
