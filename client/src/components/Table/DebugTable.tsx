import React, { useState } from "react";
import Div100vh from "react-div-100vh";
import { styled } from "@material-ui/core/styles";
import { Fab } from "@material-ui/core";
import { AllInclusive } from "@material-ui/icons";

import {
  IPlayerState,
  IPlayer,
  IGame,
  IAction,
  GameStage,
  GameType,
  HandRound,
  ActionDirective,
  GameMode,
  ITournamentPlayer,
  IHand,
} from "../../engine/types";
import { useThemeProvider } from "../ThemeProvider";
import {
  advanceHand,
  enforceTimeout,
  AUTO_ADVANCE_DIRECTIVES,
} from "../../engine";
import { generateTournamentStructure } from "../../engine/tournament";
import { MockingProvider } from "../../twilio/hooks/useMockingContext/useMockingContext";
import "./Table.css";
import { useAppState } from "../../twilio/state";
import Header from "../Header";
import { IOnShowCardsParams } from "../Tournament/interface";

import Table from ".";

export interface IMockTableProps { }

const gameAbstraction = (players: IPlayer[]): IGame => ({
  id: "xxx",
  name: "xxx",
  activeHandId: "dummy",
  hands: [],
  players: players.reduce(
    (map: { [key: string]: IPlayer }, player: IPlayer) => {
      // eslint-disable-next-line no-param-reassign
      map[player.id] = player;
      return map;
    },
    {}
  ) as { [key: string]: IPlayer },
  buyIn: 1000,
  startingBigBlind: 1,
  currentBigBlind: 100,
  blindDoublingInterval: 0,
  increment: 0.1,
  type: GameType.Tournament,
  stage: GameStage.Active,
  tournamentDetails: {
    ...generateTournamentStructure(1000, players.length, 1000, 180),
    roundInterval: 1,
    rounds: [
      {
        id: 0,
        roundIndex: 0,
        bigBlind: 1000,
      },
    ],
    players: players.reduce(
      (map: { [key: string]: ITournamentPlayer }, player: IPlayer) => {
        // eslint-disable-next-line no-param-reassign
        map[player.id] = { ...player, arrived: true };
        return map;
      },
      {}
    ) as { [key: string]: ITournamentPlayer },
  },
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
const dummyPlayers = (currentUserId: string): IPlayer[] => [
  {
    id: currentUserId,
    position: 0,
    name: "1 nclarksf",
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
    name: "2 nclarksf",
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
    name: "3 nclarksf",
    email: "nbclark@gmail.com",
    photoURL: avatarSet[2],
    stack: 200,
    contributed: 200,
    active: true,
    rebuys: [],
  },
  {
    id: "dummy-4",
    position: 3,
    name: "4 Nicholas Clarkerson",
    email: "nbclark@gmail.com",
    photoURL: avatarSet[3],
    stack: 1000,
    contributed: 1000,
    active: true,
    rebuys: [],
  },
  {
    id: "dummy-5",
    position: 4,
    name: "5",
    photoURL: avatarSet[2],
    stack: 1000,
    contributed: 1000,
    active: true,
    email: "nbclark@gmail.com",
    rebuys: [],
  },
  {
    id: "dummy-6",
    position: 5,
    name: "6",
    photoURL: avatarSet[3],
    stack: 1000,
    contributed: 1000,
    active: true,
    email: "nbclark@gmail.com",
    rebuys: [],
  },
  {
    id: "dummy-7",
    position: 6,
    name: "7",
    photoURL: avatarSet[2],
    stack: 1000,
    contributed: 1000,
    active: true,
    email: "nbclark@gmail.com",
    rebuys: [],
  },
  {
    id: "dummy-8",
    position: 7,
    name: "8",
    photoURL: avatarSet[3],
    stack: 1000,
    contributed: 1000,
    active: true,
    email: "nbclark@gmail.com",
    rebuys: [],
  },
  // {
  //   id: "dummy-9",
  //   position: 8,
  //   name: "9",
  //   photoURL: avatarSet[2],
  //   stack: 1000,
  //   contributed: 1000,
  //   active: true,
  //   email: "nbclark@gmail.com",
  //   rebuys: [],
  // },
  // {
  //   id: "dummy-10",
  //   position: 9,
  //   name: "10",
  //   photoURL: avatarSet[3],
  //   stack: 1000,
  //   contributed: 1000,
  //   active: true,
  //   email: "nbclark@gmail.com",
  //   rebuys: [],
  // },
  // {
  //   id: "dummy-11",
  //   position: 10,
  //   name: "11",
  //   photoURL: avatarSet[2],
  //   stack: 1000,
  //   contributed: 1000,
  //   active: true,
  //   email: "nbclark@gmail.com",
  //   rebuys: [],
  // },
  // {
  //   id: "dummy-12",
  //   position: 11,
  //   name: "12",
  //   photoURL: avatarSet[3],
  //   stack: 1000,
  //   contributed: 1000,
  //   active: true,
  //   email: "nbclark@gmail.com",
  //   rebuys: [],
  // },
];
const dummyPlayerState = (userId: string): IPlayerState => ({
  uid: userId,
  actions: [],
  cards: [],
  stack: 0,
});

const Container = styled(Div100vh)({
  display: "flex",
  flexDirection: "column",
  // height: "100vh",
  overflow: "hidden",
});

function MockTable(props: IMockTableProps) {
  const { user } = useAppState();
  const { setCustomColors } = useThemeProvider();
  const [game, setGame] = useState(gameAbstraction(dummyPlayers(user.uid)));
  const [playerState, setPlayerState] = useState(dummyPlayerState(user.uid));
  const gameRef = React.useRef(game);
  const counterRef = React.useRef(0);
  gameRef.current = game;

  const activeHand = game.hands.find((h) => h.id === game.activeHandId);
  const onTimeoutPlayer = () => {
    const result = enforceTimeout(gameRef.current);
    setGame(result.game);

    const updatedActiveHand = gameRef.current.hands.find(
      (h) => h.id === result.game.activeHandId
    );
    const activePlayerState = updatedActiveHand
      ? updatedActiveHand.playerStates.find(
        (ps) => ps.uid === result.actingPlayerId
      )
      : dummyPlayerState(user.uid);
    setPlayerState({
      ...activePlayerState,
      actions: result.actions || [],
    });
  };

  const onAdvanceHand = async (
    action: IAction,
    uid: string,
    gameOverride?: IGame
  ) => {
    // playAudio();
    let result = advanceHand(gameRef.current, action);
    setGame(result.game);
    if (AUTO_ADVANCE_DIRECTIVES[result.directive]) {
      // setTimeout(() => {
      //   onAdvanceHand(null, null, result.game);
      // }, AUTO_ADVANCE_DIRECTIVES[result.directive]);
    } else {
      result = enforceTimeout(result.game);
      setGame(result.game);
    }

    const updatedActiveHand = gameRef.current.hands.find(
      (h) => h.id === result.game.activeHandId
    );
    const activePlayerState = updatedActiveHand
      ? updatedActiveHand.playerStates.find(
        (ps) => ps.uid === result.actingPlayerId
      )
      : dummyPlayerState(user.uid);
    setPlayerState({
      ...activePlayerState,
      actions: result.actions || [],
    });
  };

  const setAway = (away: boolean) => {
    setGame({
      ...game,
      players: {
        ...game.players,
        [user.uid]: { ...game.players[user.uid], away },
      },
    });
  };
  const showCards = () => {
    const uid = user.uid;
    const activeHand: IHand = {
      ...gameRef.current.hands.find(
        (h) => h.id === gameRef.current.activeHandId
      ),
    };
    activeHand.shownCards = [
      {
        uid,
        cards: activeHand.playerStates.find((p) => p.uid === uid).cards,
      },
    ];
    setGame({
      ...game,
      hands: game.hands.map((h) => h.id === activeHand.id ? activeHand : h),
    });
  };

  const onPlay = () => {
    const handleAutomation = () => {
      const advance = document.getElementById("auto-advance");
      const raise =
        document.getElementById("action-raise") ||
        document.getElementById("action-bet");
      const allIn = document.getElementById("action-all-in");
      const fold = document.getElementById("action-fold");
      const checkCall =
        document.getElementById("action-check") ||
        document.getElementById("action-call");
      counterRef.current += 1;

      let timer = 1000;

      try {
        if (counterRef.current % 8 === 0) {
          if (fold) {
            fold.click();
            return;
          }
        } else if ((counterRef.current + 5) % 10 === 0) {
          if (raise) {
            raise.click();
            timer = 2500;
            setTimeout(() => {
              // @ts-ignore
              window.sliderSetValue(window.sliderMarks[1].value);
              setTimeout(() => {
                const confirmBet = document.getElementById("confirm-bet");
                confirmBet.click();
              }, 750);
            }, 750);
            return;
          }
        }
        if (checkCall) {
          checkCall.click();
          return;
        }
        advance.click();
        timer = 750;
      } finally {
        setTimeout(handleAutomation, timer);
      }
    };
    setTimeout(handleAutomation, 500);
  };

  return (
    <MockingProvider isMocking>
      <Container>
        <Header
          title="Debug Poker Table"
          renderVideoControls
          drawerItems={[]}
          mobileModeEnabled
        />
        <div style={{ flex: 1, position: "relative", display: "flex" }}>
          <Table
            game={game}
            activeHand={activeHand}
            // playerState={
            //   playerState && playerState.uid === user.uid ? playerState : null
            // }
            // playerState={
            //   playerState && playerState.uid === user.uid
            //     ? playerState
            //     : playerState
            //     ? { ...playerState, cards: [] }
            //     : null
            // }
            playerState={playerState}
            currentUserId={user.uid}
            onAdvanceHand={onAdvanceHand}
            onTimeoutPlayer={onTimeoutPlayer}
            onSetAway={async (away: boolean) => setAway(away)}
            onShowCards={async (params: IOnShowCardsParams) => showCards()}
            // invisibleActions={playerState.uid !== user.uid}
            showAdvance
          />
          <Fab
            color="primary"
            aria-label="edit"
            onClick={onPlay}
            style={{ position: "absolute", top: "1rem", left: "1rem" }}
          >
            <AllInclusive />
          </Fab>
        </div>
      </Container>
    </MockingProvider>
  );
}

export default () => {
  const { user } = useAppState();
  if (user) {
    return <MockTable />;
  }
  return <div />;
};
