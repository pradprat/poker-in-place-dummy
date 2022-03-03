const R = require("ramda");

import {
  IPocketPosition,
  IPlayer,
  IGame,
  IAction,
  IRound,
  IHand,
  HandRound,
  GameDirective,
  ActionDirective,
  GameStage,
  GameType,
  IPayout,
  IPlayerState,
} from "./engine/types";
import {
  advanceHand,
  flatMap,
  toNearestCent,
  calculatePlayerRoundMaximum,
} from "./engine";
import { typedDb } from "./poker/utils";

(async function run() {
  const tableId = process.argv[2];
  const handId = process.argv[3];

  const game = (
    await typedDb.collection<IGame>("tables").doc(tableId).get()
  ).data();
  const hand = (
    await typedDb
      .collection<IGame>("tables")
      .doc(tableId)
      .collection<IHand>("hands")
      .doc(handId)
      .get()
  ).data();
  const players = (
    await typedDb
      .collection<IGame>("tables")
      .doc(tableId)
      .collection<IHand>("hands")
      .doc(handId)
      .collection<IPlayerState>("players")
      .get()
  ).docs.map((d) => d.data());

  game.activeHandId = hand.id;
  game.hands = [hand];
  hand.playerStates = players;
  hand.payoutsApplied = false;
  hand.payouts = [];

  console.log(advanceHand(game, null).game.hands[0].payouts);
})();
