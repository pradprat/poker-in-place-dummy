import React, { useState } from "react";

import {
  IPlayerState,
  IPlayer,
  IGame,
  IAction,
  HandRound,
  GameStage,
  GameType,
  GameMode,
  ActionDirective,
} from "../../engine/types";
import { MockingProvider } from "../../twilio/hooks/useMockingContext/useMockingContext";

import "./Table.css";
import Table from ".";

export interface IMockTableProps {}

const gameAbstraction = (players: IPlayer[]): IGame => ({
  id: "xxx",
  name: "xxx",
  activeHandId: "dummy",
  hands: [
    {
      id: "dummy",
      smallBlind: 10,
      bigBlind: 20,
      dealerId: "dummy-1",
      smallBlindId: "dummy-2",
      bigBlindId: "dummy-3",
      activeDeckId: "123",
      cardsDealt: 3 + players.length * 2,
      playerIds: players.map((p) => p.id),
      payouts: [],
      payoutsApplied: false,
      rounds: [
        {
          type: HandRound.PreFlop,
          actions: [
            {
              action: ActionDirective.Bet,
              contribution: 10,
              total: 10,
              voluntary: false,
              allIn: false,
              conforming: true,
              uid: "dummy-2",
              raise: 10,
            },
            {
              action: ActionDirective.Raise,
              contribution: 20,
              total: 20,
              voluntary: false,
              allIn: false,
              conforming: true,
              uid: "dummy-3",
              raise: 10,
            },
          ],
          cards: [],
          firstToActOffset: 0,
          active: false,
          timestamp: new Date().getTime(),
        },
        {
          type: HandRound.Flop,
          actions: [
            {
              action: ActionDirective.Raise,
              contribution: 500,
              total: 500,
              voluntary: true,
              allIn: false,
              conforming: true,
              uid: "dummy-2",
              raise: 500,
            },
          ],
          cards: ["Ah", "Kh", "Kc"],
          firstToActOffset: 0,
          active: false,
          timestamp: new Date().getTime(),
        },
      ],
      playerStates: [],
      actingPlayerId: "dummy-4",
      activeRound: HandRound.Flop,
    },
  ],
  players: players.reduce(
    (map: { [key: string]: IPlayer }, player: IPlayer) => {
      // eslint-disable-next-line no-param-reassign
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
  mode: GameMode.Premium_4_60,
});

const MAX_AVATAR_ID = 23;
const pickAvatars = (count: number): string[] => {
  const seenIds = new Set<string>();
  for (let i = 0; i < count; ++i) {
    let id: string;
    do {
      id = `/avatars/${Math.floor(Math.random() * MAX_AVATAR_ID) + 1}.jpg`;
    } while (seenIds.has(id));
    seenIds.add(id);
  }

  return Array.from(seenIds);
};

const avatarSet = pickAvatars(10);
const dummyPlayers: IPlayer[] = [
  {
    id: "dummy-1",
    position: 0,
    name: "Your Name",
    email: "nbclark@gmail.com",
    photoURL: "", // avatarSet[0],
    stack: 1000,
    contributed: 1000,
    active: true,
    rebuys: [],
  },
  {
    id: "dummy-2",
    position: 1,
    name: "Your Name",
    email: "nbclark@gmail.com",
    photoURL: avatarSet[1],
    stack: 1000,
    contributed: 1000,
    active: true,
    rebuys: [],
  },
  {
    id: "dummy-3",
    position: 2,
    name: "Your Name",
    email: "nbclark@gmail.com",
    photoURL: avatarSet[2],
    stack: 1000,
    contributed: 1000,
    active: true,
    rebuys: [],
  },
  {
    id: "dummy-4",
    position: 3,
    name: "Your Name",
    email: "nbclark@gmail.com",
    photoURL: avatarSet[3],
    stack: 1000,
    contributed: 1000,
    active: true,
    rebuys: [],
  },
];
const playerState: IPlayerState = {
  uid: "dummy-1",
  actions: [],
  cards: ["As", "Ks"],
  stack: 0,
};

function MockTable(props: IMockTableProps) {
  const [game] = useState(gameAbstraction(dummyPlayers));
  const activeHand = game.hands.find((h) => h.id === game.activeHandId);
  const onAdvanceHand = async (action: IAction, uid: string) => {
    //
  };
  const onTimeoutPlayer = () => {};
  return (
    <MockingProvider isMocking>
      <div className="tableContainer">
        <Table
          game={game}
          activeHand={activeHand}
          playerState={playerState}
          currentUserId="dummy-1"
          onAdvanceHand={onAdvanceHand}
          onTimeoutPlayer={onTimeoutPlayer}
        />
      </div>
    </MockingProvider>
  );
}

export default MockTable;
