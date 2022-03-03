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
} from "./types";
import {
  advanceHand,
  flatMap,
  toNearestCent,
  calculatePlayerRoundMaximum,
} from "./index";

const recreateStart = (futureState: any) => {
  return {
    ...futureState,
    hands: Object.keys(futureState.__collections__.hands).map(
      (k) => futureState.__collections__.hands[k]
    ),
    players: Object.keys(futureState.players).reduce((map, uid) => {
      map[uid] = {
        ...futureState.players[uid],
        contributed: futureState.buyIn,
        stack: futureState.buyIn,
      };
      return map;
    }, {} as { [key: string]: any }),
    __collections__: null,
  };
};

function replay() {
  const gameRecording = recreateStart(
    // require("../../../firebase-export-andy-bad-hand.json")
    require("../../../Eb09NfURf0ckpiu5prLz.json")
  ) as IGame;

  let original = { ...gameRecording };
  let gameState = gameRecording as IGame;
  let gameStart: IGame = {
    ...gameState,
    activeHandId: null,
    hands: [],
  };

  const autoAdvance = (gs: IGame) => advanceHand(gs);

  for (const hand of gameRecording.hands.slice(0, 1130)) {
    // if (hand.id !== '1592015404921') continue;
    console.log(`\n\nStarting hand: ${hand.id}`);
    const priorHandStacks = Object.keys(gameStart.players).reduce(
      (map, uid) => {
        map[uid] = {
          ...gameStart.players[uid],
        };
        return map;
      },
      {} as { [key: string]: any }
    );

    gameStart.activeHandId = hand.id;
    const activePlayers = flatMap(hand.rounds, (round: IRound) =>
      round.actions.map((a) => a.uid)
    );
    gameStart.players = Object.keys(gameStart.players).reduce((map, uid) => {
      map[uid] = {
        ...gameStart.players[uid],
        active: !!activePlayers.find((id: string) => id === uid),
        // @ts-ignore
        stack: hand.__collections__.players[uid]
          ? // @ts-ignore
            hand.__collections__.players[uid].stack
          : 0,
      };
      return map;
    }, {} as { [key: string]: any });
    gameStart.hands.push({
      ...hand,
      rounds: [],
      payoutsApplied: false,
      cardsDealt: 0,
      payouts: [],
      activeRound: HandRound.PreDeal,
    });
    let result = autoAdvance(gameStart);
    gameStart = result.game;
    result = autoAdvance(gameStart);
    gameStart = result.game;
    // console.log({
    //   x: 222,
    //   hand: gameStart.hands[gameStart.hands.length - 1],
    //   gameStart,
    // });
    // console.log({
    //   x: 333,
    //   hand: gameStart.hands[gameStart.hands.length - 1],
    //   gameStart,
    // });
    let roundIndex = 0;
    for (const round of hand.rounds) {
      let actionIndex = 0;
      for (let action of round.actions) {
        if (action.voluntary) {
          const result = advanceHand(gameStart, action);
          gameStart = result.game;
          if (result.error == "Not your turn to act") {
            // console.log("mnsnsnsn");
            // process.exit(0);
          }
        }
        actionIndex++;
      }
      gameStart = autoAdvance(gameStart).game;
      roundIndex++;
    }
    const outcome = autoAdvance(gameStart);
    gameStart = outcome.game;
    const handResult = outcome.game.hands.find((h: IHand) => h.id === hand.id);
    const sum = handResult.payouts.reduce(
      (sum: number, p: IPayout) => toNearestCent(sum + p.amount),
      0
    );
    const kick = autoAdvance(outcome.game);
    gameStart = kick.game;
    if (sum < 0) {
      const groups = R.groupBy(
        (x: IAction) => x.uid,
        flatMap(handResult.rounds, (r: IRound) => r.actions)
      );
      console.error(
        "xxx",
        sum,
        "payouts",
        handResult.payouts,
        "constributions",
        flatMap(handResult.rounds, (r: IRound) => r.actions).reduce(
          (sum: number, x: IAction) => sum + x.contribution,
          0
        ),
        "actions",
        flatMap(handResult.rounds, (r: IRound) => r.actions),
        "groups",
        Object.keys(groups).reduce((map, key) => {
          let contributed = 0;
          const actionSet = groups[key].map((action: IAction) => {
            const result = {
              ...action,
              runningTotal: action.contribution + contributed,
            };
            contributed += action.contribution;
            return result;
          });
          return {
            ...map,
            [key]: actionSet,
          };
        }, {})
      );
      process.exit(-1);
    }
    // updatedGameState = Engine.advanceHand(
    //   gameState,
    //   updatedGameState.actions[2]
    // );
    // gameStart.players = Object.keys(gameStart.players).reduce((map, uid) => {
    //   let player = gameStart.players[uid];
    //   if (Math.round(player.stack) === 0) {
    //     console.log("topping up: ", player.id);
    //     player.stack = gameStart.buyIn;
    //   }
    //   map[uid] = player;
    //   return map;
    // }, {} as { [key: string]: any });
    const currentPayoutString = handResult.payouts
        .sort((p1, p2) => p1.uid.localeCompare(p2.uid))
        .map((p) => `${p.amount} (${p.uid} ${p.handDescription})`).join(', ');
        const historicalPayoutString = hand.payouts
          .sort((p1, p2) => p1.uid.localeCompare(p2.uid))
          .map((p) => `${p.amount} (${p.uid} ${p.handDescription})`)
          .join(", ");
    console.log(
      `Results (${historicalPayoutString !== (currentPayoutString) ? 'ERROR!!!!':''})\n`,
      `\t${currentPayoutString}\n`,
      `\t${historicalPayoutString}\n\n`
    );
    console.log(
      Object.keys(gameStart.players)
        .map(
          (id) =>
            `${id}: ${gameStart.players[id].name}\t${gameStart.players[id].stack}\t${priorHandStacks[id].stack}`
        )
        .join("\n")
    );
  }
}

console.log(1);
replay();
