import {
  IPlayer,
  IGame,
  IAction,
  IRound,
  IHand,
  HandRound,
  GameDirective,
  ActionDirective,
  IPayout,
  GameMode,
  PayType,
  ITournamentDetails,
  GameType,
  SubscriptionType,
  GameStage,
  IShownCards,
} from "./types";
import * as R from "ramda";
const SolverHand = require("pokersolver").Hand;
const stringify = require("json-stringify-safe");

const { generateDeck } = require("./deck");

export const ERROR_NO_NEXT_ACTIVE_PLAYER = "Could not find next active player";
export const ERROR_ADVANCE_WITHOUT_ACTION =
  "Attempted to advance without action";
export const ERROR_NOT_YOUR_TURN = "Not your turn to act";
export const ERROR_INVALID_HAND = "Invalid hand. Needs re-deal";

export let TIMEOUT_IN_SECONDS = 45;
export let REBUY_TIME_IN_SECONDS = 30;
export let SHORT_HAND_PAYOUT_TIMEOUT = 5000;
export let HAND_PAYOUT_TIMEOUT = 10000;
export let ROUND_BREAK_TIME_IN_SECONDS = 30;
export let ROUND_BREAK_FINAL_REBUY_TIME_IN_SECONDS = 60;
export let ELIMINATION_HANG_TIME_IN_SECONDS = 60;
const FREE_GAME_PROMOTION_OVER = new Date("2021-01-10T12:00:00Z").getTime();

export function setTimeoutInSeconds(timeout: number) {
  TIMEOUT_IN_SECONDS = timeout;
}
export function setRebuyTimeInSeconds(timeout: number) {
  REBUY_TIME_IN_SECONDS = timeout;
  setAutoAdvanceDirectives();
}
export function setHandPayoutTimeoutInSeconds(timeout: number) {
  HAND_PAYOUT_TIMEOUT = timeout;
  SHORT_HAND_PAYOUT_TIMEOUT = timeout;
  setAutoAdvanceDirectives();
}

interface IDeck {
  deal: (n: number) => string[];
  cardsDealt: () => number;
}

export function isNumeric(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export const toNearestCent = (x: number) => Math.round(x * 100) / 100;

const generateAndWrapDeck = (
  seed: string,
  cardsDealt: number,
  secureSeed?: string,
  prng?: string
): IDeck => {
  const _deck = generateDeck(seed, secureSeed, { prng });
  let index = cardsDealt;
  return {
    deal: (n: number) => {
      const cards = _deck.slice(index, index + n);
      index += n;
      return cards;
    },
    cardsDealt: () => index,
  };
};

export function getBuyInAmount(game: IGame) {
  const stackAddition =
    game.type === GameType.Tournament
      ? game.tournamentDetails!.startingStack
      : game.buyIn;

  return { buyIn: game.buyIn, stack: stackAddition };
}

export function getBuyInAmountInTournament(tournament: ITournamentDetails) {
  return {
    buyIn: tournament.buyIn,
    stack: tournament.startingStack,
    rebuyOptions: tournament.rebuyOptions,
    round: tournament.activeRoundId,
  };
}

export function getRebuyTimeRemaining(player: IPlayer) {
  if (!player.bustedTimestamp) return 0;
  const now = new Date().getTime();
  return now - (player.bustedTimestamp + REBUY_TIME_IN_SECONDS * 1000);
}

export function getRebuyPercentageRemaining(player: IPlayer) {
  return Math.max(
    0,
    Math.min(1, getRebuyTimeRemaining(player) / (REBUY_TIME_IN_SECONDS * 1000))
  );
}

export function canRebuyInTournament(
  tournament: ITournamentDetails,
  player: IPlayer
) {
  if (
    !player ||
    player.stack !== 0 ||
    player.removed ||
    player.willRemove ||
    player.rebuyDeclined
  )
    return false;

  const now = new Date().getTime();
  // If you missed your window to rebuy
  if (
    player.bustedTimestamp &&
    player.bustedTimestamp + REBUY_TIME_IN_SECONDS * 1000 < now
  ) {
    return false;
  }

  const activeRound = tournament.rounds.find(
    (round) => round.id === tournament.activeRoundId
  );
  if (!activeRound) return false;
  const roundIndex = tournament.rounds.indexOf(activeRound);
  return roundIndex >= 0 && roundIndex <= tournament.rebuysThroughRound;
}

export function canTopUpInTournament(
  tournament: ITournamentDetails,
  player: IPlayer
) {
  if (!player || player.stack === 0 || player.removed || player.willRemove)
    return false;

  const activeRound = tournament.rounds.find(
    (round) => round.id === tournament.activeRoundId
  );
  if (!activeRound) return false;
  const roundIndex = tournament.rounds.indexOf(activeRound);

  // We're in a pause between rounds - everyone with a stack can top-up in the last rebuy round
  return (
    tournament.topUpAmount &&
    roundIndex === tournament.rebuysThroughRound &&
    !!tournament.upcomingRoundId
  );
}

export function canRebuy(game: IGame, player: IPlayer) {
  if (!player || player.stack !== 0 || player.removed) return false;
  if (game.type !== GameType.Tournament) {
    if (game.features?.disableRebuys) {
      return false;
    }
    return true;
  }

  return canRebuyInTournament(game.tournamentDetails!, player);
}

export function canTopUp(game: IGame, player: IPlayer) {
  if (!player || player.stack !== 0 || player.removed) return false;
  if (game.type !== GameType.Tournament) return false;

  return canTopUpInTournament(game.tournamentDetails!, player);
}

export function isPlayerTabled(gameState: IGame, player: IPlayer) {
  return player && !player.removed && isPaid(gameState, player.id);
}

export function isPlayerTabledAndActive(gameState: IGame, player: IPlayer) {
  return (
    player && !player.removed && isPaid(gameState, player.id) && player.active
  );
}

export function isPlayerPaid(gameState: IGame, player: IPlayer) {
  return player && isPaid(gameState, player.id);
}

export function getTabledPlayers(gameState: IGame): IPlayer[] {
  return Object.values(gameState.players).filter((p) =>
    isPlayerTabled(gameState, p)
  );
}

export function getPlayersInHand(gameState: IGame, hand?: IHand): IPlayer[] {
  return hand
    ? Object.values(gameState.players).filter(
        (p) => hand.playerIds.indexOf(p.id) >= 0
      )
    : [];
}

export function getPaidPlayers(gameState: IGame): IPlayer[] {
  return Object.values(gameState.players).filter((p) =>
    isPlayerPaid(gameState, p)
  );
}

export function getPlayersWithAction(game: IGame): IPlayer[] {
  const activeHand = game.hands.find((h: IHand) => h.id === game.activeHandId);
  return getPlayersInHand(game, activeHand).filter((p) => {
    const startingStack = calculatePlayerBalance(game, p);
    const canAct =
      !!activeHand && isPlayerActive(activeHand, p) && startingStack > 0;
    return canAct;
  });
}

export function isPaid(
  gameState: IGame,
  playerId: string,
  subscriptionType?: SubscriptionType
) {
  if (gameState.payType === PayType.PerPlayer) {
    return (
      getModeCost(gameState.mode, gameState.payType, subscriptionType) === 0 ||
      (gameState.players[playerId] && gameState.players[playerId].paymentId)
    );
  }
  return (
    getModeCost(gameState.mode, gameState.payType, subscriptionType) === 0 ||
    gameState.paymentId
  );
}
export function getModeCostDescription(
  mode: GameMode,
  payType?: PayType,
  subscriptionType?: SubscriptionType
) {
  if (mode === GameMode.Multi_Table_Tournament) {
    return `Per-player Invoice`;
  }
  const cost = getModeCost(mode, payType, subscriptionType);
  const internalCost = getInternalModeCost(mode, payType, subscriptionType);
  if (cost === 0) {
    if (internalCost) {
      return `Free this week! (normally $${internalCost})`;
    }
    return "Free";
  }
  return `$${cost}`;
}

export function getModeCost(
  mode: GameMode,
  payType?: PayType,
  subscriptionType?: SubscriptionType
) {
  if (new Date().getTime() <= FREE_GAME_PROMOTION_OVER) return 0;
  const modeCost = getInternalModeCost(mode, payType, subscriptionType);
  return modeCost;
}

function getInternalModeCost(
  mode: GameMode,
  payType?: PayType,
  subscriptionType?: SubscriptionType
) {
  if (subscriptionType === SubscriptionType.Unlimited) {
    return 0;
  }
  switch (mode) {
    case GameMode.Premium_8_60:
      return payType === PayType.PerPlayer ? 1 : 3;
    case GameMode.Premium_8_120:
      return payType === PayType.PerPlayer ? 1 : 5;
    case GameMode.Premium_8_180:
      return payType === PayType.PerPlayer ? 1 : 8;
    case GameMode.Premium_12_180:
    case GameMode.Premium_8_1440:
      return 0; //10;
    case GameMode.Poker501_8_45:
      return 0;
    case GameMode.Poker501_8_180:
      return 8;
    // case GameMode.NoVideo_8_180:
    //   return 0;
    case GameMode.Multi_Table_Tournament:
      return 0;
    default:
      return 0;
  }
}

export function getModeVideoEnabled(mode: GameMode) {
  switch (mode) {
    // case GameMode.NoVideo_8_180:
    //   return false;
    default:
      return true;
  }
}

export function isGameModeSupported(mode: GameMode, type: GameType) {
  switch (mode) {
    // case GameMode.Free:
    case GameMode.Premium_4_120:
    case GameMode.Premium_4_60:
    case GameMode.Premium_4_180:
    case GameMode.Premium_8_60:
    case GameMode.Premium_8_120:
    case GameMode.Premium_8_180:
    case GameMode.Poker501_8_45:
    case GameMode.Poker501_8_180:
      // case GameMode.NoVideo_8_180:
      return type === GameType.Cash || type === GameType.Tournament;
    case GameMode.Premium_8_1440:
    case GameMode.Premium_12_180:
      return false;
    case GameMode.Multi_Table_Tournament:
      return type === GameType.MultiTableTournament;
  }
}

export function getMaximumParticipants(mode: GameMode) {
  switch (mode) {
    // case GameMode.Free:
    //   return 8;
    case GameMode.Premium_4_120:
    case GameMode.Premium_4_60:
    case GameMode.Premium_4_180:
      return 4;
    case GameMode.Premium_8_60:
    case GameMode.Premium_8_120:
    case GameMode.Premium_8_180:
    case GameMode.Premium_8_1440:
    case GameMode.Poker501_8_45:
    case GameMode.Poker501_8_180:
      // case GameMode.NoVideo_8_180:
      return 8;
    case GameMode.Premium_12_180:
      return 12;
    case GameMode.Multi_Table_Tournament:
      return 100;
    default:
      return 4;
  }
}

export function getMaximumDuration(mode: GameMode) {
  switch (mode) {
    // case GameMode.Free:
    //   return 20 * 60;
    case GameMode.Poker501_8_45:
      return 60 * 45;
    case GameMode.Premium_4_60:
    case GameMode.Premium_8_60:
      return 60 * 60;
    case GameMode.Premium_4_120:
    case GameMode.Premium_8_120:
      return 120 * 60;
    case GameMode.Premium_4_180:
    case GameMode.Premium_8_180:
    case GameMode.Premium_12_180:
    case GameMode.Poker501_8_180:
      // case GameMode.NoVideo_8_180:
      return 180 * 60;
    case GameMode.Multi_Table_Tournament:
      return 240 * 60;
    case GameMode.Premium_8_1440:
      return 1440 * 60;
    default:
      return 15 * 60;
  }
}

export function getTimeRemaining(gameState: IGame) {
  const duration = gameState.timestamp
    ? (new Date().getTime() - gameState.timestamp) / 1000
    : 0;
  const maxDuration = getMaximumDuration(gameState.mode);
  return maxDuration - duration;
}

export function isGameExpired(gameState: IGame) {
  return getTimeRemaining(gameState) < 0;
}

export const startGame = (gameState: IGame): IGame => {
  const tabledPlayersWithRebuys = getTabledPlayers(gameState);
  const tabledPlayers = tabledPlayersWithRebuys.filter((p) => !p.willRemove);
  const lastDealerId = gameState.hands.length
    ? R.last(gameState.hands)?.dealerId
    : tabledPlayers[0].id;

  const playersByIndex = tabledPlayers.sort((p1: IPlayer, p2: IPlayer) => {
    return p1!.position! - p2!.position!;
  });

  let updatedGameState = gameState;
  if (gameState.type === GameType.Tournament) {
    // updatedGameState = checkTournament(updatedGameState);
  }

  let lastDealerIndex = playersByIndex.findIndex((p) => p.id === lastDealerId);
  const newHand: IHand = {
    id: `${new Date().getTime()}`,
    activeDeckId: `${new Date().toISOString()}`,
    cardsDealt: 0,
    dealerId: "0",
    smallBlindId: "0",
    bigBlindId: "0",
    actingPlayerId: null,
    activeRound: HandRound.PreDeal,
    rounds: [],
    playerStates: playersByIndex.map((p) => ({
      cards: [],
      actions: [],
      uid: p.id,
      stack: p.stack,
    })),
    playerIds: playersByIndex.filter((p) => p.active).map((p) => p.id),
    smallBlind: updatedGameState.currentBigBlind / 2,
    bigBlind: updatedGameState.currentBigBlind,
    payouts: [],
    payoutsApplied: false,
  };

  // TODO - button continuation should be better
  // I've added in some logic here to help assign the next
  // dealer more correctly when the dealer busts out
  if (lastDealerIndex < 0) {
    console.error("Last dealer index not found...", stringify(gameState.hands));
    if (gameState.hands.length) {
      const lastHand = R.last(gameState.hands);
      const dealerId = lastHand.dealerId;
      const dealerIndexOnLastHand = lastHand.playerIds.findIndex(
        (pid) => pid === dealerId
      );
      // Walk backwards to find the player at or before the prior dealer
      // We'll then select the player after that person to be the next dealer
      // If the dealer from last hand is still active, great. We'll pick the next player
      for (let i = 0; i > -lastHand.playerIds.length; --i) {
        const playerId =
          lastHand.playerIds[
            (dealerIndexOnLastHand + i) % lastHand.playerIds.length
          ];
        const player = tabledPlayers.find((p) => p.id === playerId);
        // console.log("zzz", {
        //   i,
        //   index: (dealerIndexOnLastHand + i) % lastHand.playerIds.length,
        //   playerId,
        //   dealerId,
        //   dealerIndexOnLastHand,
        //   playerIds: lastHand.playerIds,
        //   tabled: !!isPlayerTabled(gameState, player),
        // });
        if (isPlayerTabled(gameState, player)) {
          lastDealerIndex = playersByIndex.findIndex((p) => p.id === player.id);
          // console.log({ playersByIndex, lastDealerIndex });
          if (lastDealerIndex >= 0) {
            break;
          }
        }
      }
    }
    if (lastDealerIndex < 0) {
      // Not sure how we're getting here...
      lastDealerIndex = 0;
    }
  }
  // Advance the button 1 person
  newHand.dealerId = activePlayerFromIndex(
    newHand,
    playersByIndex,
    lastDealerIndex,
    1
  ).id;
  newHand.smallBlindId = activePlayerFromIndex(
    newHand,
    playersByIndex,
    lastDealerIndex,
    2
  ).id;
  newHand.bigBlindId = activePlayerFromIndex(
    newHand,
    playersByIndex,
    lastDealerIndex,
    3
  ).id;

  updatedGameState = {
    ...updatedGameState,
    hands: [...updatedGameState.hands, newHand],
    activeHandId: newHand.id,
  };
  return updatedGameState;
};

export const calculateFutureOptions = (
  game: IGame,
  hand: IHand,
  firstActiveRound: IRound,
  player: IPlayer
): IAction[] => {
  const playersByIndex = getPlayersInHand(game, hand).sort(
    (p1: IPlayer, p2: IPlayer) => {
      return p1!.position! - p2!.position!;
    }
  );
  const playersLeftToAct = calculatePlayersLeftToAct(
    hand,
    firstActiveRound,
    playersByIndex
  );

  if (playersLeftToAct.indexOf(player.id) < 0) {
    return [];
  }
  return calculateOptions(game, hand, firstActiveRound, player).filter(
    (a) => a.contribution === 0
  );
};

export const calculateOptions = (
  game: IGame,
  hand: IHand,
  firstActiveRound: IRound,
  player: IPlayer
): IAction[] => {
  const priorActivePlayerActions = firstActiveRound.actions.filter(
    (a) => a.uid === player.id
  );
  const maxBetActions = firstActiveRound.actions
    .slice(0)
    .sort((a1, a2) => {
      const diff = toNearestCent(a2.total - a1.total);
      // Default to non-all-ins
      if (!diff) {
        return a1.allIn ? 1 : -1;
      }
      return diff;
    })
    .filter((a) => a.uid !== player.id);

  const activePlayerPotContribution = toNearestCent(
    priorActivePlayerActions.reduce((sum, a) => sum + a.contribution, 0)
  );
  const playerBalance = calculatePlayerBalance(game, player);
  const roundContributions = calculateRoundContributions(hand, player);
  if (roundContributions !== activePlayerPotContribution) {
    // This happens if there is only 1 player left
    console.error({
      playerBalance,
      roundContributions,
      activePlayerPotContribution,
      priorActivePlayerActions,
      player,
    });
    throw new Error(
      "roundContributions !== activePlayerPotContribution: " +
        stringify({ roundContributions, activePlayerPotContribution })
    );
  }
  const _options = [
    {
      uid: player.id,
      action: ActionDirective.Fold,
      total: activePlayerPotContribution,
      raise: 0,
      contribution: 0,
      allIn: false,
      voluntary: true,
      conforming: false,
      // TODO - do we need timestamp
      // timestamp: new Date().getTime(),
    },
  ];
  const maxBetAction = maxBetActions.length ? maxBetActions[0] : null;
  let maxBetActionTotal = maxBetAction ? maxBetAction.total : 0;
  let maxBetActionRaise = maxBetAction ? maxBetAction.raise : hand.bigBlind;

  if (maxBetActionTotal) {
    maxBetActionTotal = Math.max(hand.bigBlind, maxBetActionTotal);
  }
  if (maxBetActionRaise) {
    maxBetActionRaise = Math.max(hand.bigBlind, maxBetActionRaise);
  }

  const playersWithAction = getPlayersWithAction(game).filter(
    (p) => p.id !== player.id
  );
  if (!playersWithAction.length) {
    // If no action left...
    if (maxBetAction && maxBetAction.allIn && !maxBetAction.voluntary) {
      // If the player is all in, let's only require checking/betting UP to that amount
      maxBetActionTotal = Math.max(
        maxBetAction.contribution,
        activePlayerPotContribution
      );
    }
  }

  let delta = maxBetActionTotal - activePlayerPotContribution;
  const totalAllowedInHand = playerBalance + roundContributions;

  if (delta < 0) {
    console.log("xxx - delta < 0");
    delta = 0;
  } else if (delta > 0) {
    const allIn = totalAllowedInHand <= activePlayerPotContribution + delta;
    // TODO - the call for someone all in over the top is the wrong amount
    const total = allIn
      ? totalAllowedInHand
      : activePlayerPotContribution + delta;
    _options.push({
      uid: player.id,
      action: ActionDirective.Call,
      total,
      raise: 0,
      contribution: toNearestCent(total - roundContributions),
      allIn,
      voluntary: true,
      conforming: false,
      // TODO - do we need timestamp
      // timestamp: new Date().getTime(),
    });
  } else if (delta === 0) {
    // TODO - We showed this after a raise, re-raise, call
    _options.push({
      uid: player.id,
      action: ActionDirective.Check,
      total: activePlayerPotContribution,
      raise: 0,
      contribution: 0,
      allIn: false,
      voluntary: true,
      conforming: false,
      // TODO - do we need timestamp
      // timestamp: new Date().getTime(),
    });
    // TODO - is this person the last to act?
  } else {
    // This might happens if someone calls a bet with less than the bet
    // due to an all-in
    console.error(
      "THIS SHOULD NOT HAPPEN",
      maxBetAction,
      activePlayerPotContribution,
      maxBetActions
    );
    throw new Error(
      `THIS SHOULD NOT HAPPEN,
          ${maxBetAction},
          ${activePlayerPotContribution}`
    );
  }

  const canPlayerRaise =
    activePlayerPotContribution + delta < totalAllowedInHand;

  if (canPlayerRaise) {
    // So the raise needs to be a few things:
    //    1. >= the bigBlind
    //    2. >= the prior conforming raise (all-in under prior raise does not count)
    //    3. >
    const lastConformingRaise = maxBetActions.find(
      (action) => action.conforming
    );
    if (lastConformingRaise && lastConformingRaise !== maxBetAction) {
      maxBetActionRaise = lastConformingRaise.raise;
      maxBetActionTotal = Math.max(
        maxBetActionTotal,
        lastConformingRaise.total
      );
      delta = toNearestCent(maxBetActionTotal - activePlayerPotContribution);
    }
    const raise = Math.max(hand.bigBlind, maxBetActionRaise);
    const totalConforming = toNearestCent(
      activePlayerPotContribution + delta + raise
    );
    const conforming = totalAllowedInHand >= totalConforming;
    const isAllIn = totalAllowedInHand <= totalConforming;
    const total = conforming ? totalConforming : totalAllowedInHand;

    // Let's see if other people can do anything
    const playersRemainingWithAction = getPlayersWithAction(game).filter(
      (p) => p.id !== player.id
    );
    // Don't allow raising with no one else that can call
    // TODO if a raise goes above what anyone has, add a simpler call
    if (playersRemainingWithAction.length > 0) {
      if (!isAllIn) {
        _options.push({
          uid: player.id,
          action: total === raise ? ActionDirective.Bet : ActionDirective.Raise,
          total,
          raise,
          contribution: toNearestCent(
            conforming ? delta + raise : totalAllowedInHand - roundContributions
          ),
          allIn: isAllIn,
          voluntary: true,
          conforming,
          // TODO - do we need timestamp
          // timestamp: new Date().getTime(),
        });
      }
      _options.push({
        uid: player.id,
        action: ActionDirective.AllIn,
        total: totalAllowedInHand,
        raise: totalAllowedInHand - maxBetActionTotal,
        contribution: toNearestCent(totalAllowedInHand - roundContributions),
        allIn: true,
        voluntary: true,
        conforming,
        // TODO - do we need timestamp
        // timestamp: new Date().getTime(),
      });
    }
  }
  return _options;
};

const calculateNextToActWithOptions = (
  game: IGame,
  hand: IHand,
  firstActiveRound: IRound,
  playersByIndex: IPlayer[],
  dealerPosition: number
): { uid: string; options: IAction[] } | null => {
  const firstToActPlayer =
    playersByIndex[
      (firstActiveRound.firstToActOffset + dealerPosition - 1) %
        playersByIndex.length
    ];

  // The last to act is either the last person to act OR one before the first to act
  const lastToActId = firstActiveRound.actions.length
    ? firstActiveRound.actions[firstActiveRound.actions.length - 1].uid
    : firstToActPlayer.id;

  const lastToActIndex = playersByIndex.findIndex(
    (player) => player.id === lastToActId
  );

  for (let i = 0; i < playersByIndex.length; i++) {
    // Deal to small blind first
    const player =
      playersByIndex[(i + lastToActIndex + 1) % playersByIndex.length];

    // If they've folded, find the next person
    if (!isPlayerActive(hand, player)) continue;

    const options = calculateOptions(game, hand, firstActiveRound, player);
    return {
      uid: player.id,
      options,
    };
  }
  return null;
};

export function flatMap<T, S>(array: T[], lambda: (elem: T) => S[]) {
  return array.reduce(
    (flatArr, elem) => [...flatArr, ...lambda(elem)],
    [] as S[]
  );
}

export const isPlayerActive = (hand: IHand, player: IPlayer) => {
  return (
    player &&
    player.active &&
    (!hand ||
      (hand.playerIds.indexOf(player.id) >= 0 &&
        !flatMap(hand.rounds, (r) => r.actions).find(
          (action) =>
            action.uid === player.id && action.action === ActionDirective.Fold
        )))
  );
};

export const isPlayerAway = (hand: IHand, player: IPlayer) => {
  return player.away || !isPlayerActive(hand, player);
};

export const calculatePlayerBalance = (game: IGame, player: IPlayer) => {
  const activeHand = game.hands.find((h: IHand) => h.id === game.activeHandId);
  return (
    player.stack -
    (activeHand && !activeHand.payoutsApplied
      ? flatMap(activeHand.rounds, (r) => r.actions)
          .filter((action) => action.uid === player.id)
          .reduce((sum, action) => sum + action.contribution, 0)
      : 0)
  );
};

export const calculateRoundContributions = (hand: IHand, player: IPlayer) => {
  const firstActiveRound = hand.rounds.find((round) => round.active);

  return toNearestCent(
    firstActiveRound?.actions
      .filter((action) => action.uid === player.id)
      .reduce((sum, action) => sum + action.contribution, 0) || 0
  );
};

export const calculateHandContributions = (hand: IHand, player: IPlayer) => {
  return toNearestCent(
    flatMap(hand.rounds, (round) => round.actions)
      .filter((action) => action.uid === player.id)
      .reduce((sum, action) => sum + action.contribution, 0) || 0
  );
};

export const calculateTotalRoundContributions = (hand: IHand) => {
  const firstActiveRound = hand.rounds.find((round) => round.active);

  return toNearestCent(
    firstActiveRound?.actions.reduce(
      (sum, action) => sum + action.contribution,
      0
    ) || 0
  );
};

export const calculateTotalHandContributions = (hand: IHand) => {
  return toNearestCent(
    flatMap(hand.rounds, (round) => round.actions).reduce(
      (sum, action) => sum + action.contribution,
      0
    ) || 0
  );
};

export const activePlayerFromIndex = (
  hand: IHand,
  playersByIndex: IPlayer[],
  index: number,
  offset: number
) => {
  let activePlayerCount = 0;
  for (let i = 0; i < playersByIndex.length * 2; ++i) {
    const player = playersByIndex[(index + i) % playersByIndex.length];
    if (isPlayerActive(hand, player)) {
      activePlayerCount++;
      if (activePlayerCount > offset) {
        return player;
      }
    }
  }

  throw new Error(ERROR_NO_NEXT_ACTIVE_PLAYER);
};

export const calculatePlayerRoundMaximum = (
  game: IGame,
  hand: IHand,
  player: IPlayer
) => {
  // Check if they have folded in this hand
  return toNearestCent(
    calculateRoundContributions(hand, player) +
      calculatePlayerBalance(game, player)
  );
};

export const getTimeOfLastAction = (hand: IHand): number => {
  const firstActiveRound = hand.rounds.find((round) => round.active);
  if (!firstActiveRound) return Number.MAX_SAFE_INTEGER;
  if (!firstActiveRound.actions.length) return firstActiveRound.timestamp;
  return firstActiveRound.actions[firstActiveRound.actions.length - 1]
    .timestamp;
};

const calculatePlayersLeftToAct = (
  hand: IHand,
  activeRound: IRound,
  playersByIndex: IPlayer[]
) => {
  // How to determine if the last person has acted...
  // all players are folded or in for the same amount
  // one exception is big blind
  const reversedActions = activeRound.actions.slice(0).reverse();
  const playerState = playersByIndex
    .map((player) => {
      const lastPlayerAction = reversedActions.find((a) => a.uid === player.id);
      return { player, lastPlayerAction };
    })
    .filter(
      (state) =>
        // Only active players who have made no action or
        isPlayerActive(hand, state.player) &&
        (!state.lastPlayerAction || state.lastPlayerAction.action !== "fold")
    );

  if (playerState.find((state) => !state.lastPlayerAction)) {
    // carry on - some people left to act
    return playerState
      .filter((state) => !state.lastPlayerAction)
      .map((state) => state.player.id);
  } else {
    // IndexBy includes only the last item if multiple exist
    // Get a list of players still in the hand
    const groupedActions = R.indexBy(
      (a) => a.uid,
      activeRound.actions.filter((a) =>
        playerState.find((p) => p.player.id === a.uid)
      )
    );

    // Check the totals of every player
    // If they are equal OR everyone not allIn is equal
    // we are done

    const maxTotal = Object.values(groupedActions).reduce(
      (max, action) => Math.max(max, action.total),
      0
    );
    const finalActions = Object.values(groupedActions).filter((a) => !a.allIn);

    // TODO - is this right?
    const finalTotal = maxTotal; //finalActions.length ? finalActions[0].total : -1;
    return finalActions
      .filter((a) => a.total !== finalTotal || !a.voluntary)
      .map((a) => a.uid);
  }
};

const advanceHandGameState = (
  deck: IDeck,
  gameState: IGame,
  activeHand: IHand,
  selectedAction?: IAction
  // uid?: string
): {
  hand: IHand;
  directive: GameDirective;
  actingPlayerId: string;
  actions: IAction[];
  error: any;
} => {
  const handClone = { ...activeHand };

  // Short-circuit here
  if (handClone.payouts.length) {
    return {
      hand: handClone,
      directive: GameDirective.NextHand,
      actingPlayerId: null,
      actions: null,
      error: null,
    };
  }

  const playersByIndex = getPlayersInHand(gameState, handClone).sort(
    (p1: IPlayer, p2: IPlayer) => {
      return p1!.position! - p2!.position!;
    }
  );
  const dealerPosition = playersByIndex.findIndex(
    (p) => p.id === activeHand.dealerId
  );

  if (dealerPosition < 0) {
    console.log(
      activeHand.dealerId,
      handClone.playerIds,
      playersByIndex
      // stringify(gameState)
    );
    throw new Error(ERROR_INVALID_HAND);
  }

  let firstActiveRound = activeHand.rounds.find((round) => round.active);
  // Play out the active round
  if (firstActiveRound) {
    let error = null;
    // Loop over players + actions starting at firstToAct
    // Evaluate the set of actions versus who needs to act.
    try {
      // Make sure the correct user is acting
      const nextToActTest = calculateNextToActWithOptions(
        gameState,
        activeHand,
        firstActiveRound,
        playersByIndex,
        dealerPosition
      );

      if (nextToActTest && !selectedAction) {
        throw new Error(ERROR_ADVANCE_WITHOUT_ACTION);
      }

      // console.log({ nextToActTest, uid });

      if (selectedAction) {
        if (
          !nextToActTest ||
          !selectedAction.uid ||
          nextToActTest.uid !== selectedAction.uid
        ) {
          throw new Error(ERROR_NOT_YOUR_TURN);
        }

        const actingPlayer = gameState.players[selectedAction.uid];
        const allowedActions = calculateOptions(
          gameState,
          activeHand,
          firstActiveRound,
          actingPlayer
        );
        const allowedAction = allowedActions.find(
          (action) => action.action === selectedAction.action
        );
        if (!allowedAction) {
          throw new Error(
            `Invalid action ${stringify({
              selectedAction,
              allowedActions,
            })}`
          );
        }
        // TODO - add action validation
        if (
          selectedAction.action === ActionDirective.Bet ||
          selectedAction.action === ActionDirective.Raise ||
          selectedAction.action === ActionDirective.AllIn
        ) {
          const playerBalance = calculatePlayerBalance(gameState, actingPlayer);
          const roundContributions = calculateRoundContributions(
            activeHand,
            actingPlayer
          );
          // Balance reflects this rounds payments too
          const totalAllowedInHand = toNearestCent(
            playerBalance + roundContributions
          );
          if (totalAllowedInHand < selectedAction.total) {
            throw new Error(
              `Invalid action ${stringify({
                totalAllowedInHand,
                selectedAction,
              })}`
            );
          }

          const delta = toNearestCent(
            selectedAction.total - allowedAction.total
          );
          if (selectedAction.total > totalAllowedInHand) {
            throw new Error(
              `Invalid action ${stringify({
                totalAllowedInHand,
                selectedAction,
              })}`
            );
          }
          const isConforming = delta >= 0;
          const isAllIn = selectedAction.total === playerBalance;

          // console.dir(
          //   {
          //     action: selectedAction,
          //     playerBalance,
          //     roundContributions,
          //     totalAllowedInHand,
          //     nextToActTest,
          //     delta,
          //     allowedAction,
          //     isConforming,
          //     isAllIn,
          //   },
          //   { depth: null }
          // );

          // We only operate on the total
          selectedAction.raise = toNearestCent(allowedAction.raise + delta);
          selectedAction.contribution = toNearestCent(
            allowedAction.contribution + delta
          );
          selectedAction.conforming = isConforming;
          selectedAction.allIn = isAllIn;
          selectedAction.voluntary = true;
          selectedAction.timestamp = new Date().getTime();

          if (
            !isNumeric(selectedAction.total) ||
            !isNumeric(selectedAction.raise) ||
            !isNumeric(selectedAction.contribution)
          ) {
            throw new Error("Raise is not a valid number");
          }

          firstActiveRound = {
            ...firstActiveRound,
            actions: [...firstActiveRound.actions, selectedAction],
          };
          // console.dir(
          //   {
          //     selectedAction,
          //   },
          //   { depth: null }
          // );
        } else {
          allowedAction.timestamp = new Date().getTime();
          // Don't allow user input changes - just take the allowed action that matches
          // TODO - add some checks that it does match
          firstActiveRound = {
            ...firstActiveRound,
            actions: [...firstActiveRound.actions, allowedAction],
          };
        }

        // Deduct amounts from player
        handClone.rounds = handClone.rounds.map((round) =>
          round.type === firstActiveRound!.type! ? firstActiveRound! : round
        );

        const hasActionRemaining = !!calculatePlayersLeftToAct(
          handClone,
          firstActiveRound,
          playersByIndex
        ).length;

        // How to determine if the last person has acted...
        // all players are folded or in for the same amount
        // one exception is big blind
        const reversedActions = firstActiveRound.actions.slice(0).reverse();
        const playerState = playersByIndex
          .map((player) => {
            const lastPlayerAction = reversedActions.find(
              (a) => a.uid === player.id
            );
            return { player, lastPlayerAction };
          })
          .filter(
            (state) =>
              // Only active players who have made no action or
              isPlayerActive(handClone, state.player) &&
              (!state.lastPlayerAction ||
                state.lastPlayerAction.action !== "fold")
          );

        if (playerState.find((state) => !state.lastPlayerAction)) {
          // carry on - some people left to act
          if (!hasActionRemaining) {
            throw new Error("hasActionRemaining");
          }
        } else {
          // IndexBy includes only the last item if multiple exist
          // Get a list of players still in the hand
          const groupedActions = R.indexBy(
            (a) => a.uid,
            firstActiveRound.actions.filter((a) =>
              playerState.find((p) => p.player.id === a.uid)
            )
          );

          // Check the totals of every player
          // If they are equal OR everyone not allIn is equal
          // we are done

          const maxTotal = Object.values(groupedActions).reduce(
            (max, action) => Math.max(max, action.total),
            0
          );
          const finalActions = Object.values(groupedActions).filter(
            (a) => !a.allIn
          );

          // TODO - is this right?
          const finalTotal = maxTotal; //finalActions.length ? finalActions[0].total : -1;
          const notFinalizedActions = !!finalActions.find(
            (a) => a.total !== finalTotal || !a.voluntary
          );

          if (hasActionRemaining !== notFinalizedActions) {
            debugger;
          }

          console.log({ hasActionRemaining, notFinalizedActions });

          if (!notFinalizedActions) {
            // We are done with actions from this round
            firstActiveRound.active = false;
            handClone.rounds = handClone.rounds.map((round) =>
              round.type === firstActiveRound!.type! ? firstActiveRound! : round
            );

            const activePlayersRemaining = playersByIndex.filter((p) =>
              isPlayerActive(handClone, p)
            );

            const payoutDirective =
              activePlayersRemaining.length > 1
                ? GameDirective.HandPayout
                : GameDirective.ShortHandPayout;

            const directive =
              activePlayersRemaining.length === 1
                ? payoutDirective
                : GameDirective.NextRound;

            if (directive === GameDirective.NextRound) {
              return advanceHandGameState(deck, gameState, handClone);
            }

            handClone.payoutsEndTimestamp =
              new Date().getTime() + AUTO_ADVANCE_DIRECTIVES[payoutDirective] ||
              0;

            return {
              hand: handClone,
              // If only one player is left, end the hand
              directive,
              actingPlayerId: null,
              actions: null,
              error: null,
            };
            // Kinda feels like we're fine here...
            // Move on to the next round
          }

          // TODO - gonna have to sort out split pots and what not
          // Maybe introduce the concept of pots...

          // Object.keys(groupedActions).
        }
      }

      const activePlayers = playersByIndex.filter((p) =>
        isPlayerActive(handClone, p)
      );
      if (activePlayers.length === 1) {
        firstActiveRound.active = false;
        handClone.rounds = handClone.rounds.map((round) =>
          round.type === firstActiveRound!.type! ? firstActiveRound! : round
        );
        handClone.payoutsEndTimestamp =
          new Date().getTime() +
            AUTO_ADVANCE_DIRECTIVES[GameDirective.ShortHandPayout] || 0;
        return {
          hand: handClone,
          directive: GameDirective.ShortHandPayout,
          actingPlayerId: null,
          actions: null,
          error: null,
        };
      }
    } catch (e) {
      // Something was going wrong
      if (
        e.message !== ERROR_ADVANCE_WITHOUT_ACTION &&
        e.message !== ERROR_NOT_YOUR_TURN
      ) {
        console.warn(e);
      }
      error = e.message;
    }

    // Actions are based on prior bets, we should run this after updating the game state
    const nextToAct = calculateNextToActWithOptions(
      gameState,
      activeHand,
      firstActiveRound,
      playersByIndex,
      dealerPosition
    );

    // We can advance to the next round
    if (nextToAct) {
      return {
        hand: handClone,
        directive: GameDirective.NextToAct,
        actingPlayerId: nextToAct.uid,
        actions: nextToAct.options,
        error,
      };
    }
  }

  const preFlop = activeHand.rounds.find(
    (round) => round.type === HandRound.PreFlop
  );
  const flop = activeHand.rounds.find((round) => round.type === HandRound.Flop);
  const turn = activeHand.rounds.find((round) => round.type === HandRound.Turn);
  const river = activeHand.rounds.find(
    (round) => round.type === HandRound.River
  );

  if (!preFlop) {
    handClone.playerStates = [];

    for (let i = 0; i < playersByIndex.length; i++) {
      // Deal to small blind first
      const player =
        playersByIndex[(i + dealerPosition + 1) % playersByIndex.length];
      if (isPlayerActive(handClone, player)) {
        const cards = deck.deal(2);
        if (!cards.length) {
          throw new Error("Failed to deal cards to player: " + deck.cardsDealt);
        }
        handClone.playerStates.push({
          uid: player.id,
          actions: [],
          cards,
          stack: player.stack,
        });
      } else {
        console.error("WARNING - player not active", player, handClone);
      }
    }

    // TODO - can't blind more than you have
    const smallBlindAllowedAmount = toNearestCent(
      Math.min(
        playersByIndex.find((p) => p.id === handClone.smallBlindId).stack,
        activeHand.smallBlind
      )
    );
    // TODO - need to make sure you can't win more than you put in
    const smallBlindAction: IAction = {
      uid: handClone.smallBlindId,
      action: ActionDirective.Bet,
      // TODO - do all ins behave differently now?
      // total: toNearestCent(activeHand.smallBlind),
      // raise: toNearestCent(activeHand.smallBlind),
      total: smallBlindAllowedAmount,
      raise: smallBlindAllowedAmount,
      contribution: smallBlindAllowedAmount,
      allIn: smallBlindAllowedAmount < activeHand.smallBlind,
      voluntary: false,
      conforming: false,
      timestamp: new Date().getTime(),
    };

    if (!playersByIndex.find((p) => p.id === handClone.bigBlindId)) {
      console.error(
        "Player is missing",
        stringify({ playersByIndex, handClone })
      );
    }

    // TODO - need to handle all-ins here better if they are short
    const bigBlindAllowedAmount = toNearestCent(
      Math.min(
        playersByIndex.find((p) => p.id === handClone.bigBlindId)?.stack ||
          activeHand.bigBlind,
        activeHand.bigBlind
      )
    );
    const bigBlindAction: IAction = {
      uid: handClone.bigBlindId,
      action: ActionDirective.Bet,
      // TODO - do all ins behave differently now?
      // total: toNearestCent(activeHand.bigBlind),
      // raise: toNearestCent(activeHand.smallBlind),
      total: bigBlindAllowedAmount,
      raise: toNearestCent(activeHand.smallBlind),
      contribution: bigBlindAllowedAmount,
      allIn: bigBlindAllowedAmount < activeHand.bigBlind,
      voluntary: false,
      conforming: true,
      timestamp: new Date().getTime(),
    };

    handClone.rounds = [
      ...handClone.rounds,
      {
        type: HandRound.PreFlop,
        cards: [],
        actions: [smallBlindAction, bigBlindAction],
        active: true,
        firstToActOffset: 3,
        timestamp: new Date().getTime(),
      },
    ];
    handClone.activeRound = HandRound.PreFlop;
  } else if (!flop) {
    handClone.rounds = [
      ...handClone.rounds,
      {
        type: HandRound.Flop,
        cards: deck.deal(3),
        actions: [],
        active: true,
        firstToActOffset: 1,
        timestamp: new Date().getTime(),
      },
    ];
    handClone.activeRound = HandRound.Flop;
  } else if (!turn) {
    handClone.rounds = [
      ...handClone.rounds,
      {
        type: HandRound.Turn,
        cards: deck.deal(1),
        actions: [],
        active: true,
        firstToActOffset: 1,
        timestamp: new Date().getTime(),
      },
    ];
    handClone.activeRound = HandRound.Turn;
  } else if (!river) {
    handClone.rounds = [
      ...handClone.rounds,
      {
        type: HandRound.River,
        cards: deck.deal(1),
        actions: [],
        active: true,
        firstToActOffset: 1,
        timestamp: new Date().getTime(),
      },
    ];
    handClone.activeRound = HandRound.River;
  } else if (!handClone.payouts.length) {
    const activePlayersRemaining = playersByIndex.filter((p) =>
      isPlayerActive(handClone, p)
    );
    const payoutDirective =
      activePlayersRemaining.length > 1
        ? GameDirective.HandPayout
        : GameDirective.ShortHandPayout;
    handClone.payoutsEndTimestamp =
      new Date().getTime() + AUTO_ADVANCE_DIRECTIVES[payoutDirective] || 0;
    return {
      hand: handClone,
      directive: payoutDirective,
      actingPlayerId: null,
      actions: null,
      error: null,
    };
  } else {
    return {
      hand: handClone,
      directive: GameDirective.NextHand,
      actingPlayerId: null,
      actions: null,
      error: null,
    };
  }

  return advanceHandGameState(deck, gameState, handClone);
  // return {
  //   hand: handClone,
  //   directive: GameDirective.NextRound,
  //   actingPlayerId: handClone.actingPlayerId,
  //   actions: null,
  //   error: null,
  // };
};

export const calculateHandWinners = (gameState: IGame, activeHand: IHand) => {
  const getCommunityCards = (hand: IHand) =>
    flatMap(hand.rounds, (round) => round.cards || []) || [];

  // This only works for ACTIVE players
  const calculateHandContribution = (hand: IHand, player: IPlayer) => {
    const handActions = flatMap(activeHand.rounds, (round) => round.actions)
      .filter(
        (action) =>
          action.uid === player.id &&
          action.action !== ActionDirective.Fold &&
          action.total > 0
      )
      .reverse();
    const finalSum = handActions.reduce(
      (sum, action) => toNearestCent(sum + action.contribution),
      0
    );
    return finalSum;
    // Taking the total only works for the last round, not all rounds
  };
  const communityCards = getCommunityCards(activeHand);

  const splitHands: { [index: string]: string[] } = {};
  let maxContribution = 0;
  const allPlayers = getPlayersInHand(gameState, activeHand)
    .filter(
      // Could this include someone who left
      (player) => player.active && activeHand.playerIds.indexOf(player.id) >= 0
    )
    .map((player) => {
      const playerState = activeHand.playerStates.find(
        (pc) => pc.uid === player.id
      );
      const player1Hand = SolverHand.solve([
        ...playerState.cards,
        ...communityCards,
      ]);
      const isActive = isPlayerActive(activeHand, player);
      const contribution = calculateHandContribution(activeHand, player);
      maxContribution = !isActive
        ? maxContribution
        : Math.max(contribution, maxContribution);
      return {
        player,
        hand: player1Hand,
        contribution,
        // Don't show cards if they've folded
        cards: isActive ? playerState.cards : [],
        handCards: isActive
          ? player1Hand.cards.map(
              (c: { value: string; suit: string }) => `${c.value}${c.suit}`
            )
          : [],
        handDescription: isActive ? player1Hand.descr : null,
        soleWinner: false,
      };
    });

  for (const player of allPlayers) {
    if (
      !isPlayerActive(activeHand, player.player) &&
      player.contribution > maxContribution
    ) {
      console.warn(
        "Player overcontributed",
        player.player.id,
        player.contribution,
        maxContribution
      );
      player.contribution = maxContribution;
    }
  }

  const activePlayers = allPlayers
    .filter((player) => isPlayerActive(activeHand, player.player))
    .sort((p1, p2) => {
      const winners = SolverHand.winners([p1.hand, p2.hand]);
      if (winners.length === 2) {
        // if (!splitHands[p1.player.id]) {
        //   splitHands[p1.player.id] = [p1.player.id];
        // }
        // splitHands[p1.player.id].push(p2.player.id);
        // if (!splitHands[p2.player.id]) {
        //   splitHands[p2.player.id] = [p2.player.id];
        // }
        // splitHands[p2.player.id].push(p1.player.id);
        return 0;
      }
      return winners[0] === p1.hand ? -1 : 1;
    });

  for (let outer = 0; outer < activePlayers.length; outer++) {
    for (let inner = outer + 1; inner < activePlayers.length; inner++) {
      const outerPlayer = activePlayers[outer];
      const innerPlayer = activePlayers[inner];
      if (outerPlayer === innerPlayer) continue;
      const winners = SolverHand.winners([outerPlayer.hand, innerPlayer.hand]);
      if (winners.length === 2) {
        if (!splitHands[outerPlayer.player.id]) {
          splitHands[outerPlayer.player.id] = [outerPlayer.player.id];
        }
        splitHands[outerPlayer.player.id].push(innerPlayer.player.id);
        if (!splitHands[innerPlayer.player.id]) {
          splitHands[innerPlayer.player.id] = [innerPlayer.player.id];
        }
        splitHands[innerPlayer.player.id].push(outerPlayer.player.id);
      }
    }
  }

  if (activePlayers.length === 1) {
    // activePlayers[0] = { ...activePlayers[0]};
    // debugger;
    // Don't show cards if only 1 player
    activePlayers[0].cards = [];
    activePlayers[0].handCards = [];
    activePlayers[0].handDescription = "-Not Shown-";
    activePlayers[0].soleWinner = true;
  }

  // For all players, group by contribution amounts
  const playerContributionsAll: {
    [key: string]: {
      contribution: number;
      allocated: number;
      payout: number;
      net: number;
      cards: string[];
      handCards: string[];
      handDescription: string;
      soleWinner: boolean;
    };
  } = allPlayers.reduce(
    (map, player) => ({
      ...map,
      [player.player.id]: {
        contribution: toNearestCent(player.contribution),
        allocated: 0,
        payout: 0,
        net: 0,
        cards: player.cards,
        handCards: player.handCards,
        handDescription: player.handDescription,
        soleWinner: player.soleWinner,
      },
    }),
    {}
  );

  // For active players, group by contribution amounts
  const contributionBucketsActive = R.groupBy(
    (player) => String(player.contribution),
    activePlayers
  );

  const contributionAmountsActive = Object.keys(contributionBucketsActive)
    .map((bucket) => toNearestCent(parseFloat(bucket)))
    .sort((b1, b2) => b1 - b2);

  // Walk through the amounts and create pots for it and determine the winner of each...
  // We need to deduct the prior contribution amounts
  let priorContributionSum = 0;
  for (const totalContributionAmount of contributionAmountsActive) {
    const contributionAmount = totalContributionAmount;
    const contributors = activePlayers.filter(
      (p) => p.contribution >= contributionAmount
    );
    const activeEligiblePlayers = activePlayers.filter(
      (p) => contributors.findIndex((c) => c.player.id === p.player.id) >= 0
    );

    // We will have 1 or more winners
    const firstWinner = activeEligiblePlayers[0];
    if (!firstWinner) {
      throw new Error("should not happen");
    }

    const winnerIds = splitHands[firstWinner.player.id]
      ? splitHands[firstWinner.player.id].filter(
          (winnerId) =>
            contributors.findIndex((c) => c.player.id === winnerId) >= 0
        )
      : [firstWinner.player.id];

    // console.log({ firstWinner: firstWinner.player.id, winnerIds, splitHands });

    let potSum = 0;
    const perPlayerPotAllocation = toNearestCent(
      contributionAmount - priorContributionSum
    );
    for (const player of allPlayers) {
      // We can allocate UP TO contribution amount
      const playerAmount = playerContributionsAll[player.player.id];
      const maxAllowed = toNearestCent(
        playerAmount.contribution - playerAmount.allocated
      );
      const willAllocate = toNearestCent(
        Math.min(maxAllowed, perPlayerPotAllocation)
      );
      playerAmount.allocated = toNearestCent(
        playerAmount.allocated + willAllocate
      );
      potSum = toNearestCent(potSum + willAllocate);
    }

    priorContributionSum = toNearestCent(contributionAmount);

    // TODO - if we raise, we are losing the blinds somehow
    // console.log(`Pot of ${potSum} split amongst ${winnerIds.join(", ")}`);

    const amountPerWinner = toNearestCent(
      Math.floor(potSum / winnerIds.length / gameState.increment) *
        gameState.increment
    );

    for (let i = 0; i < winnerIds.length; ++i) {
      // If we have to round to an increment, let the first winner get the rounded amount
      const winnerAmount =
        i === 0
          ? toNearestCent(potSum - amountPerWinner * (winnerIds.length - 1))
          : amountPerWinner;
      playerContributionsAll[winnerIds[i]].payout += winnerAmount;
    }
  }

  Object.values(playerContributionsAll).forEach((c) => {
    c.net = toNearestCent(c.payout - c.contribution);
  });

  const net = toNearestCent(
    Object.values(playerContributionsAll).reduce((sum, p) => sum + p.net, 0)
  );

  if (net) {
    throw new Error(
      "Money is being lost: " +
        stringify({
          net,
          contributions: Object.values(playerContributionsAll),
        })
    );
  }

  return playerContributionsAll;
};

export const getBestAction = (actions: IAction[]) => {
  const bestAction = actions
    .filter((x) => x.contribution === 0)
    .sort((a1: IAction) => (a1.action === ActionDirective.Fold ? 1 : -1))[0];
  return bestAction;
};

export const getForcedAction = (gameState: IGame) => {
  const activeHand = gameState.hands.find(
    (h: IHand) => h.id === gameState.activeHandId
  );
  if (activeHand) {
    const playersByIndex = getPlayersInHand(gameState, activeHand).sort(
      (p1: IPlayer, p2: IPlayer) => {
        return p1!.position! - p2!.position!;
      }
    );
    const dealerPosition = playersByIndex.findIndex(
      (p) => p.id === activeHand.dealerId
    );

    let firstActiveRound = activeHand.rounds.find((round) => round.active);
    if (firstActiveRound) {
      const nextToActTest = calculateNextToActWithOptions(
        gameState,
        activeHand,
        firstActiveRound,
        playersByIndex,
        dealerPosition
      );
      if (nextToActTest) {
        const player = gameState.players[nextToActTest.uid];
        const isAway = isPlayerAway(activeHand, player);
        const timestamp = getTimeOfLastAction(activeHand);
        const elapsed = (new Date().getTime() - timestamp) / 1000;
        // Auto-act for away players
        const timeoutInSeconds =
          gameState.tournamentDetails &&
          gameState.tournamentDetails.timeoutInSeconds
            ? gameState.tournamentDetails.timeoutInSeconds
            : TIMEOUT_IN_SECONDS;
        if (isAway || elapsed > timeoutInSeconds) {
          const bestAction = nextToActTest.options
            .filter((x) => x.contribution === 0)
            .sort((a1: IAction) =>
              a1.action === ActionDirective.Fold ? 1 : -1
            )[0];
          if (bestAction) {
            return { ...bestAction, forced: true };
          }
        }
      }
    }
  }
  return null;
};

export const enforceTimeout = (
  gameState: IGame
): {
  game: IGame;
  directive: GameDirective;
  actingPlayerId: string | null;
  actions: IAction[] | null;
} => {
  const bestAction = getForcedAction(gameState);
  return advanceHand(gameState, bestAction);
};

export const advanceHand = (
  gameState: IGame,
  selectedAction?: IAction,
  isGamePaused: boolean = false,
  enforceTimeouts: boolean = false,
  skipSetAwayOnTimeout: boolean = false
): {
  game: IGame;
  directive: GameDirective;
  actingPlayerId: string | null;
  actions: IAction[] | null;
  error?: any;
} => {
  const activeHand = gameState.hands.find(
    (h: IHand) => h.id === gameState.activeHandId
  );

  const deck = activeHand
    ? generateAndWrapDeck(
        activeHand.activeDeckId,
        activeHand.cardsDealt,
        gameState.id,
        gameState.prng
      )
    : null;

  let actionOrForceAction = selectedAction;
  let wasActionForced = false;
  if (!selectedAction && enforceTimeouts) {
    // Get a forced action if we didn't specify one to kick the tires
    const forcedAction = getForcedAction(gameState);
    actionOrForceAction = forcedAction;

    wasActionForced = !!forcedAction;
  }

  const mutatedActiveHand = activeHand
    ? advanceHandGameState(deck, gameState, activeHand, actionOrForceAction)
    : null;

  // TODO - eww
  if (mutatedActiveHand) {
    mutatedActiveHand.hand.actingPlayerId = mutatedActiveHand.actingPlayerId;

    // Finalize the game here
    if (
      mutatedActiveHand?.directive === GameDirective.HandPayout ||
      mutatedActiveHand?.directive === GameDirective.ShortHandPayout
    ) {
      const playerPayouts = calculateHandWinners(
        gameState,
        mutatedActiveHand.hand
      );
      mutatedActiveHand.hand.payouts = Object.keys(playerPayouts).map(
        (uid: string): IPayout => ({
          uid,
          amount: playerPayouts[uid].net,
          total: playerPayouts[uid].payout,
          cards: playerPayouts[uid].cards,
          handCards: playerPayouts[uid].handCards,
          handDescription: playerPayouts[uid].handDescription,
          soleWinner: playerPayouts[uid].soleWinner,
        })
      );
    }

    mutatedActiveHand.hand.cardsDealt = deck.cardsDealt();
  }

  let mutatedGame: IGame = mutatedActiveHand
    ? {
      ...gameState,
      hands: gameState.hands.map((hand: IHand) => {
        if (hand.id === activeHand?.id) {
          return mutatedActiveHand?.hand;
        }
        return hand;
      }),
    }
    : gameState;

  if (wasActionForced && !skipSetAwayOnTimeout) {
    mutatedGame.players = { ...mutatedGame.players };
    // Set the forced action player away
    // TODO - should we set someone away to inactive?
    // mutatedGame.players[actionOrForceAction.uid].active = false;
    mutatedGame.players[actionOrForceAction.uid].away = true;
  }

  if (mutatedActiveHand?.directive === GameDirective.NextHand || !activeHand) {
    const handPayoutWindowNotElapsed =
      mutatedActiveHand &&
      mutatedActiveHand.hand.payoutsEndTimestamp &&
      mutatedActiveHand.hand.payoutsEndTimestamp > new Date().getTime();

    if (handPayoutWindowNotElapsed) {
      return {
        game: mutatedGame,
        directive: GameDirective.ShortHandPayout,
        actingPlayerId: null,
        actions: null,
        error: null,
      };
    }

    if (activeHand && !mutatedActiveHand.hand.payoutsApplied) {
      const now = new Date().getTime();
      mutatedGame.players = { ...mutatedGame.players };
      for (const payout of mutatedActiveHand.hand.payouts) {
        const stack = toNearestCent(
          mutatedGame.players[payout.uid].stack + payout.amount
        );
        mutatedGame.players[payout.uid] = {
          ...mutatedGame.players[payout.uid],
          stack,
          // We will sort the tournament by the busted timestamp to determine winners
          bustedTimestamp: stack === 0 ? now : undefined, // Number.MAX_SAFE_INTEGER,
        };
        if (!mutatedGame.players[payout.uid].stack) {
          mutatedGame.players[payout.uid].active = false;
        }
      }
      mutatedActiveHand.hand.payoutsApplied = true;
      mutatedGame.activeHandId = null;

      // Let's also mark all willRemove players as emptied stacks
      Object.values(mutatedGame.players)
        .filter((p) => p.willRemove)
        .forEach((p) => {
          // Set their stack to 0 so they will get removed
          mutatedGame.players[p.id] = { ...p, stack: 0 };
        });
    }

    const activePlayers = getTabledPlayers(mutatedGame).filter((p) => p.active);
    const startingPlayers = getTabledPlayers(gameState).filter((p) => p.active);
    const activePlayerCount = activePlayers.length;
    const startingPlayerCount = startingPlayers.length;

    if (activePlayerCount < startingPlayerCount) {
      if (activePlayerCount <= 1) {
        console.log(`Only ${activePlayerCount} players left`);
      }

      const playersWhoCanRebuy = getTabledPlayers(mutatedGame).filter((p) =>
        canRebuy(mutatedGame, p)
      );

      // Allow for rebuys, end tables, eliminate players

      if (
        activePlayerCount <= 1 &&
        mutatedGame.type === GameType.Tournament &&
        playersWhoCanRebuy.length === 0
      ) {
        mutatedGame.stage = GameStage.Ended;
        // TODO - also check for if rebuys are ALLOWED
        return {
          game: mutatedGame,
          directive: GameDirective.EliminatePlayer,
          actingPlayerId: null,
          actions: null,
          error: mutatedActiveHand ? mutatedActiveHand.error : null,
        };
      }

      // If we have a player bust, throw them into the rebuy option logic
      if (playersWhoCanRebuy.length) {
        return {
          game: mutatedGame,
          directive: GameDirective.RebuyOption,
          actingPlayerId: null,
          actions: null,
          error: mutatedActiveHand ? mutatedActiveHand.error : null,
        };
      }

      // If someone was knocked out, let the system know
      return {
        game: mutatedGame,
        directive: GameDirective.EliminatePlayer,
        actingPlayerId: null,
        actions: null,
        error: mutatedActiveHand ? mutatedActiveHand.error : null,
      };
    }

    if (!isGamePaused) {
      // Don't start the next hand until time has elapsed
      mutatedGame = startGame(mutatedGame);
    }
  }

  if (mutatedActiveHand && mutatedActiveHand.actions) {
    const firstActiveRound = mutatedActiveHand.hand.rounds.find(
      (round) => round.active
    );
    // Calculate the actions AFTER the last updates were made
    mutatedActiveHand.actions = calculateOptions(
      mutatedGame,
      mutatedActiveHand.hand,
      firstActiveRound,
      mutatedGame.players[mutatedActiveHand.actingPlayerId]
    );
  }

  if (
    mutatedActiveHand &&
    mutatedActiveHand.directive === GameDirective.NextToAct
  ) {
    const player = mutatedGame.players[mutatedActiveHand.actingPlayerId];
    const isAway = isPlayerAway(mutatedActiveHand.hand, player);
    // console.log('xxx', {mutatedActiveHand, player, isAway});
    if (isAway) {
      // The player is away - let's skip their turn by auto-forcing action
      console.log("Player is away - We are forcing action");
      return enforceTimeout(mutatedGame);
    }
  }

  if (
    mutatedGame.features &&
    mutatedGame.features.autoFlipEnabled &&
    mutatedActiveHand &&
    mutatedActiveHand.directive === GameDirective.NextRound
  ) {
    const playersByIndex = getPlayersInHand(
      gameState,
      mutatedActiveHand.hand
    ).sort((p1: IPlayer, p2: IPlayer) => {
      return p1!.position! - p2!.position!;
    });
    const activePlayers = playersByIndex.filter((p) =>
      isPlayerActive(mutatedActiveHand.hand, p)
    );
    const activePlayersWithAgencyRemaining = activePlayers.filter((p) =>
      calculatePlayerBalance(mutatedGame, p)
    );

    if (activePlayersWithAgencyRemaining.length <= 1) {
      mutatedActiveHand.hand.shownCards = activePlayers.map(
        (p: IPlayer): IShownCards => ({
          uid: p.id,
          cards: mutatedActiveHand.hand.playerStates.find(
            (pc) => pc.uid === p.id
          ).cards,
        })
      );
    }
  }

  return {
    game: mutatedGame,
    directive: mutatedActiveHand
      ? mutatedActiveHand.directive
      : GameDirective.NextHand,
    actingPlayerId: mutatedActiveHand ? mutatedActiveHand.actingPlayerId : null,
    actions: mutatedActiveHand ? mutatedActiveHand.actions : null,
    error: mutatedActiveHand ? mutatedActiveHand.error : null,
  };
};

type DirectivesSet = { [index: string]: number };

export const TOURNAMENT_AUTO_ADVANCE_DIRECTIVES = (
  tournament: ITournamentDetails
): DirectivesSet => ({
  [GameDirective.NextHand]: 0,
  [GameDirective.NextRound]: 0,
  [GameDirective.RebuyOption]: (1000 * REBUY_TIME_IN_SECONDS) / 4,
  [GameDirective.ShortHandPayout]: SHORT_HAND_PAYOUT_TIMEOUT,
  [GameDirective.HandPayout]: HAND_PAYOUT_TIMEOUT,
});

export const AUTO_ADVANCE_DIRECTIVES: { [index: string]: number } = {};
function setAutoAdvanceDirectives() {
  AUTO_ADVANCE_DIRECTIVES[GameDirective.NextHand] = 0;
  AUTO_ADVANCE_DIRECTIVES[GameDirective.NextRound] = 0;
  AUTO_ADVANCE_DIRECTIVES[GameDirective.RebuyOption] =
    (1000 * REBUY_TIME_IN_SECONDS) / 4;
  AUTO_ADVANCE_DIRECTIVES[
    GameDirective.ShortHandPayout
  ] = SHORT_HAND_PAYOUT_TIMEOUT;
  AUTO_ADVANCE_DIRECTIVES[GameDirective.HandPayout] = HAND_PAYOUT_TIMEOUT;
}
setAutoAdvanceDirectives();
