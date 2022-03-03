import firebase from "firebase";
import * as Engine from "./index";
import {
  IPlayer,
  IGame,
  IAction,
  IHand,
  HandRound,
  GameDirective,
  ActionDirective,
  GameStage,
  GameType,
  IRebuy,
  GameMode,
} from "./types";
const flatMap = require("array.prototype.flatmap");
// @ts-ignore
Array.prototype.flatMap = flatMap.shim();

const players = [
  {
    active: true,
    stack: 1000,
    contributed: 1000,
    position: 0,
    id: "0",
    name: "Nicholas Clark",
    photoURL:
      "https://lh3.googleusercontent.com/a-/AOh14GjFEblXmvoupVKEdnyTuFq2JEtXZtegnU28l1AWHg=s96-c",
    email: "xxx",
    rebuys: [] as IRebuy[],
  },
  {
    active: true,
    stack: 1000,
    contributed: 1000,
    position: 1,
    id: "1",
    name: "Nicholas Clark",
    photoURL:
      "https://lh3.googleusercontent.com/a-/AOh14GjFEblXmvoupVKEdnyTuFq2JEtXZtegnU28l1AWHg=s96-c",
    email: "xxx",
    rebuys: [] as IRebuy[],
  },
  {
    active: true,
    stack: 1000,
    contributed: 1000,
    position: 2,
    id: "2",
    name: "Nicholas Clark",
    photoURL:
      "https://lh3.googleusercontent.com/a-/AOh14GjFEblXmvoupVKEdnyTuFq2JEtXZtegnU28l1AWHg=s96-c",
    email: "xxx",
    rebuys: [] as IRebuy[],
  },
  {
    active: true,
    stack: 1000,
    contributed: 1000,
    position: 3,
    id: "3",
    name: "Nicholas Clark",
    photoURL:
      "https://lh3.googleusercontent.com/a-/AOh14GjFEblXmvoupVKEdnyTuFq2JEtXZtegnU28l1AWHg=s96-c",
    email: "xxx",
    rebuys: [] as IRebuy[],
  },
];

const gameAbstraction = (players: IPlayer[]): IGame => ({
  id: "xxx",
  name: "xxx",
  hands: [],
  players: players.reduce(
    (map: { [key: string]: IPlayer }, player: IPlayer) => {
      map[player.id] = player;
      return map;
    },
    {}
  ) as { [key: string]: IPlayer },
  buyIn: 1000,
  startingBigBlind: 100,
  currentBigBlind: 100,
  blindDoublingInterval: 0,
  increment: 1,
  type: GameType.Cash,
  stage: GameStage.Active,
  mode: GameMode.Premium_8_1440,
});

const createAction = (
  uid: string,
  directive: ActionDirective,
  contribution: number,
  total: number,
  allIn: boolean,
  conforming: boolean
): IAction => {
  return {
    uid,
    action: directive,
    contribution,
    total,
    allIn: false,
    conforming: true,
    raise: 0,
    voluntary: true,
    timestamp: 0,
  };
};

describe("Poker Engine", () => {
  beforeEach(jest.clearAllMocks);
  beforeEach(() => (process.env = {} as any));

  it("Handles all-in winner and splits side pot winners", () => {
    // Player 3 has the best hand, but wins the main pot
    // Player 0 has the high straight and wins the side pot
    let gameState = gameAbstraction(players);
    // We should expect:
    //  P3 to win 50+50+50+20
    //  P0 and P1 to split 100+100-50-50
    const hand: IHand = {
      id: "",
      dealerId: "",
      bigBlindId: "",
      smallBlindId: "",
      playerStates: [
        { uid: "0", cards: ["5h", "8s"], actions: [], stack: 0 },
        { uid: "1", cards: ["5c", "6s"], actions: [], stack: 0 },
        { uid: "2", cards: [], actions: [], stack: 0 }, // They fold, so who cares
        { uid: "3", cards: ["Tc", "Ah"], actions: [], stack: 0 }, // Goes all in, so should split a pot
      ],
      cardsDealt: 0,
      payoutsApplied: false,
      actingPlayerId: null,
      playerIds: ["0", "1", "2", "3"],
      payouts: [],
      activeRound: HandRound.PreDeal,
      activeDeckId: "",
      bigBlind: 100,
      smallBlind: 50,
      rounds: [
        {
          // We can cheat and have all 5 cards come out on the "river"
          cards: ["Ts", "Th", "5s", "3h", "As"],
          type: HandRound.River,
          actions: [
            createAction("0", ActionDirective.Bet, 10, 10, false, true),
            createAction("1", ActionDirective.Bet, 20, 20, false, true),
            createAction("2", ActionDirective.Call, 20, 20, false, true),
            createAction("3", ActionDirective.Raise, 50, 50, true, true),
            createAction("0", ActionDirective.Raise, 90, 100, false, true),
            createAction("1", ActionDirective.Call, 80, 100, false, true),
            createAction("2", ActionDirective.Fold, 0, 20, false, true),
          ],
          active: true,
          firstToActOffset: 0,
          timestamp: 0,
        },
      ],
    };
    const winners = Engine.calculateHandWinners(gameState, hand);
    expect(winners).toMatchObject({
      "0": { contribution: 100, allocated: 100, payout: 50 },
      "1": { contribution: 100, allocated: 100, payout: 50 },
      "2": { contribution: 20, allocated: 20, payout: 0 },
      "3": { contribution: 50, allocated: 50, payout: 170 },
    });
  });

  it("Handles all-in winner and single side pot winner", () => {
    // Player 3 has the best hand, but wins the main pot
    // Player 0 has the high straight and wins the side pot
    let gameState = gameAbstraction(players);
    // We should expect:
    //  P3 to win 50+50+50+20
    //  P0 and P1 to split 100+100-50-50
    const hand: IHand = {
      id: "",
      dealerId: "",
      bigBlindId: "",
      smallBlindId: "",
      playerStates: [
        { uid: "0", cards: ["5h", "8s"], actions: [], stack: 0 },
        { uid: "1", cards: ["4c", "6s"], actions: [], stack: 0 },
        { uid: "2", cards: [], actions: [], stack: 0 }, // They fold, so who cares
        { uid: "3", cards: ["Tc", "Ah"], actions: [], stack: 0 }, // Goes all in, so should split a pot
      ],
      cardsDealt: 0,
      payoutsApplied: false,
      actingPlayerId: null,
      playerIds: ["0", "1", "2", "3"],
      payouts: [],
      activeRound: HandRound.PreDeal,
      activeDeckId: "",
      bigBlind: 100,
      smallBlind: 50,
      rounds: [
        {
          // We can cheat and have all 5 cards come out on the "river"
          cards: ["Ts", "Th", "5s", "3h", "As"],
          type: HandRound.River,
          actions: [
            createAction("0", ActionDirective.Bet, 10, 10, false, true),
            createAction("1", ActionDirective.Bet, 20, 20, false, true),
            createAction("2", ActionDirective.Call, 20, 20, false, true),
            createAction("3", ActionDirective.Raise, 50, 50, true, true),
            createAction("0", ActionDirective.Raise, 90, 100, false, true),
            createAction("1", ActionDirective.Call, 80, 100, false, true),
            createAction("2", ActionDirective.Fold, 0, 20, false, true),
          ],
          active: true,
          firstToActOffset: 0,
          timestamp: 0,
        },
      ],
    };
    const winners = Engine.calculateHandWinners(gameState, hand);
    expect(winners).toMatchObject({
      "0": { contribution: 100, allocated: 100, payout: 100 },
      "1": { contribution: 100, allocated: 100, payout: 0 },
      "2": { contribution: 20, allocated: 20, payout: 0 },
      "3": { contribution: 50, allocated: 50, payout: 170 },
    });
  });

  it("Handles payout to a single winner", () => {
    // Player 3 has the best hand, but wins the main pot
    // Player 0 has the high straight and wins the side pot
    let gameState = gameAbstraction(players);
    // We should expect:
    //  P3 to win 50+50+50+20
    //  P0 and P1 to split 100+100-50-50
    const hand: IHand = {
      id: "",
      dealerId: "",
      bigBlindId: "",
      smallBlindId: "",
      playerStates: [
        { uid: "0", cards: ["5h", "8s"], actions: [], stack: 0 },
        { uid: "1", cards: ["4c", "6s"], actions: [], stack: 0 },
        { uid: "2", cards: [], actions: [], stack: 0 }, // They fold, so who cares
        { uid: "3", cards: ["9c", "Kh"], actions: [], stack: 0 }, // Goes all in, so should split a pot
      ],
      cardsDealt: 0,
      payoutsApplied: false,
      actingPlayerId: null,
      playerIds: ["0", "1", "2", "3"],
      payouts: [],
      activeRound: HandRound.PreDeal,
      activeDeckId: "",
      bigBlind: 20,
      smallBlind: 10,
      rounds: [
        {
          // We can cheat and have all 5 cards come out on the "river"
          cards: ["Ts", "Th", "5s", "3h", "As"],
          type: HandRound.River,
          actions: [
            createAction("0", ActionDirective.Bet, 10, 10, false, true),
            createAction("1", ActionDirective.Bet, 20, 20, false, true),
            createAction("2", ActionDirective.Call, 20, 20, false, true),
            createAction("3", ActionDirective.Raise, 50, 50, true, true),
            createAction("0", ActionDirective.Raise, 90, 100, false, true),
            createAction("1", ActionDirective.Call, 80, 100, false, true),
            createAction("2", ActionDirective.Fold, 0, 20, false, true),
            createAction("3", ActionDirective.Call, 50, 100, false, true),
          ],
          active: true,
          firstToActOffset: 0,
          timestamp: 0,
        },
      ],
    };
    const winners = Engine.calculateHandWinners(gameState, hand);
    expect(winners).toMatchObject({
      "0": { contribution: 100, allocated: 100, payout: 320 },
      "1": { contribution: 100, allocated: 100, payout: 0 },
      "2": { contribution: 20, allocated: 20, payout: 0 },
      "3": { contribution: 100, allocated: 100, payout: 0 },
    });
  });

  it("Handles turns and options correctly", () => {
    let gameState = gameAbstraction(players);
    let updatedGameState = Engine.advanceHand(gameState);
    expect(updatedGameState.game.activeHandId).toBeTruthy();
    expect(updatedGameState.actingPlayerId).toBeFalsy();
    expect(updatedGameState.directive).toEqual(GameDirective.NextHand);
    gameState = updatedGameState.game;
    updatedGameState = Engine.advanceHand(gameState);
    expect(updatedGameState.game.activeHandId).toBeTruthy();
    expect(updatedGameState.actingPlayerId).toEqual("0");
    expect(updatedGameState.directive).toEqual(GameDirective.NextToAct);
    expect(updatedGameState.game.hands[0].playerStates.length).toEqual(4);
    expect(updatedGameState.actions.length).toEqual(4);
    expect(updatedGameState.actions[2]).toMatchObject({
      uid: "0",
      action: "raise",
      total: 200,
      raise: 100,
      contribution: 200,
      allIn: false,
      voluntary: true,
    });
    gameState = updatedGameState.game;
    updatedGameState = Engine.advanceHand(
      gameState,
      updatedGameState.actions[2]
    );
    expect(updatedGameState.actingPlayerId).toEqual("1");
  });

  // it("should handle floating point", () => {
  //   const gameRecording = recreateStart(require("./fp.game.test.json"));

  //   let gameState = gameRecording as IGame;
  //   let gameStart = { ...gameState, hands: [], activeHandId: null } as IGame;

  //   const autoAdvance = (gs: IGame) => Engine.advanceHand(gs);

  //   for (const hand of gameRecording.hands.slice(0, 1)) {
  //     gameStart.activeHandId = hand.id;
  //     gameStart.hands.push(hand);
  //     gameStart = autoAdvance(gameStart).game;
  //     console.log({ hand });
  //     for (const round of hand.rounds) {
  //       console.log({ round });
  //       for (const action of round.actions.filter(
  //         (a: IAction) => a.voluntary
  //       )) {
  //         console.log({ action });
  //         gameStart = Engine.advanceHand(gameStart, action).game;
  //       }
  //       gameStart = autoAdvance(gameStart).game;
  //     }
  //     const outcome = autoAdvance(gameStart);
  //     console.log(-1, outcome);
  //     // updatedGameState = Engine.advanceHand(
  //     //   gameState,
  //     //   updatedGameState.actions[2]
  //     // );
  //   }
  // });
});

// const recreateStart = (futureState: any) => {
//   return {
//     ...futureState,
//     hands: Object.keys(futureState.__collections__.hands).map(
//       (k) => futureState.__collections__.hands[k]
//     ),
//     players: Object.keys(futureState.players).reduce(
//       (map: { [key: string]: IPlayer }, uid: string) => {
//         map[uid] = {
//           ...futureState.players[uid],
//           contributed: futureState.buyIn,
//           stack: futureState.buyIn,
//         };
//         return map;
//       },
//       {} as { [key: string]: IPlayer }
//     ),
//   };
// };
