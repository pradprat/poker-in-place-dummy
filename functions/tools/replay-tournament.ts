import {
  // IGame,
  ITournamentDetails,
  // IPocketPosition,
  // IPlayer,
  // IAction,
  // IRound,
  // IHand,
  // HandRound,
  // GameDirective,
  // ActionDirective,
  // GameStage,
  // GameType,
  // IPayout,
  // IPlayerState,
  IGame,
} from "../src/engine/types";
import {
  setTimeoutInSeconds,
  setRebuyTimeInSeconds,
  setHandPayoutTimeoutInSeconds,
} from "../src/engine";
import { advanceTournamentHand } from "../src/engine/tournament";
import { typedDb } from "../src/poker/utils";
const stringify = require("json-stringify-safe");

(async function run() {
  const tournamentId = process.argv[2];
  const snapshotId = process.argv[3];

  // const tournament = (
  //   await typedDb
  //     .collection<ITournamentDetails>("tournaments")
  //     .doc(tournamentId)
  //     .get()
  // ).data();
  const snapshot = (
    await typedDb
      .collection<ITournamentDetails>("tournaments")
      .doc(tournamentId)
      .collection<{ tournament: ITournamentDetails; tables: IGame[] }>(
        "snapshots"
      )
      .doc(snapshotId)
      .get()
  ).data();
  // console.log({ tournament, snapshot });
  // const players = (
  //   await typedDb
  //     .collection<IGame>("tables")
  //     .doc(tableId)
  //     .collection<IHand>("hands")
  //     .doc(handId)
  //     .collection<IPlayerState>("players")
  //     .get()
  // ).docs.map((d) => d.data());

  // game.activeHandId = hand.id;
  // game.hands = [hand];
  // hand.playerStates = players;
  // hand.payoutsApplied = false;
  // hand.payouts = [];
  console.log("lets go");
  let snapshotTournament = snapshot.tournament;
  snapshotTournament.timeoutInSeconds = -1;
  snapshotTournament.rebuyTimeInSeconds = -1;
  snapshotTournament.tables = snapshot.tables;
  setTimeoutInSeconds(0);
  setRebuyTimeInSeconds(0);
  setHandPayoutTimeoutInSeconds(0);
  snapshotTournament.rounds = snapshotTournament.rounds.map((r) => ({
    ...r,
    timestamp: new Date().getTime(),
  }));
  for (let x = 0; x < 30; ++x) {
    for (let i = 0; i < snapshotTournament.tables.length; ++i) {
      let table = snapshotTournament.tables[i];
      console.log("tableid", table.id);
      table.hands = table.hands.map((h: any) => ({
        ...h,
        playerStates: h.players,
      }));
      let newHandCount = 0;
      while (true) {
        const result = advanceTournamentHand(snapshotTournament, table, null);
        console.log("zzz", {
          activeHandId: snapshotTournament.tables[i].activeHandId,
          gameUpdatesActiveHandId: result.gameUpdates?.game?.activeHandId,
          pauseMessage: result.gameUpdates?.game?.pauseMessage,
        });
        // if (!result.gameUpdates?.game?.activeHandId) {
        //   if (table.id === "bY5EMC1czeyG95bietpR") {
        //     console.log(result);
        //     process.exit(0);
        //   }
        // }
        if (!snapshotTournament.tables[i].activeHandId) {
          newHandCount++;
        }
        if (result.gameUpdates) {
          if (
            snapshotTournament.tables[i].activeHandId !==
            result.gameUpdates.game.activeHandId
          ) {
            console.log("xxxyyy", result.gameUpdates.game.activeHandId);
            newHandCount++;
            // if (
            //   table.id === "bY5EMC1czeyG95bietpR" &&
            //   result.gameUpdates.game.activeHandId &&
            //   !snapshotTournament.tables[i].activeHandId
            // ) {
            //   process.exit(0);
            // }
          }
          snapshotTournament.tables[i] = result.gameUpdates.game;
        }
        if (newHandCount > 1) {
          break;
        }
        snapshotTournament = {
          ...result.tournamentUpdates.tournament,
          tables: snapshotTournament.tables,
        };
        console.log(
          "directive1: ",
          table.id,
          result.gameUpdates?.directive,
          result.gameUpdates?.game?.activeHandId
        );
        if (
          result.gameUpdates?.directive !== "next-to-act" &&
          result.gameUpdates?.directive !== "hand-payout" &&
          result.gameUpdates?.directive !== "short-hand-payout" &&
          result.gameUpdates?.directive !== "next-hand" &&
          result.gameUpdates?.directive !== "eliminate-player"
        ) {
          console.log(`breaking from`, result);
          break;
        }
        table = snapshotTournament.tables[i];
      }
    }
    const tournamentResult = advanceTournamentHand(
      snapshotTournament,
      null,
      null
    );
    console.log(
      "tournamentResult",
      tournamentResult,
      tournamentResult.tournamentUpdates.tableUpdates,
      snapshotTournament.tables.map((t) => ({
        id: t.id,
        activeHandId: t.activeHandId,
      }))
    );
    snapshotTournament = tournamentResult.tournamentUpdates.tournament;
  }
  // console.log(advanceHand(game, null).game.hands[0].payouts);
})();
