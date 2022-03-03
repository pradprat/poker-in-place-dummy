import React, { useState } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS, Step } from "react-joyride";
import Button from "@material-ui/core/Button";
import jsCookie from "js-cookie";

import {
  IPlayerState,
  IPlayer,
  IGame,
  IAction,
  GameStage,
  GameType,
  GameMode,
  ActionDirective,
} from "../../engine/types";
import {
  advanceHand,
  enforceTimeout,
  AUTO_ADVANCE_DIRECTIVES,
  setRebuyTimeInSeconds,
} from "../../engine";
import { generateTournamentStructure } from "../../engine/tournament";
import { MockingProvider } from "../../twilio/hooks/useMockingContext/useMockingContext";

import "./Table.css";
import Table from ".";

export interface IOnboardingProps {
  onComplete?: { (): void };
}

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
  startingBigBlind: 0.2,
  currentBigBlind: 1000,
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
    name: "Player #2",
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
    name: "Player #3",
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
    name: "Player #4",
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
    name: "Player #5",
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
    name: "Player #6",
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
    name: "Player #7",
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
    name: "Player #8",
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
const dummyPlayerState: IPlayerState = {
  uid: "dummy-1",
  actions: [],
  cards: [],
  stack: 0,
};

interface StepWithActions extends Step {
  afterClose?: { (): void };
}

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

function Onboarding(props: IOnboardingProps) {
  const [game, setGame] = useState(gameAbstraction(dummyPlayers));
  const [playerState, setPlayerState] = useState(dummyPlayerState);
  const gameRef = React.useRef(game);
  const [isTourOpen, setIsTourOpen] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  gameRef.current = game;

  const redirectURI = getUrlVars().get("redirectURI");

  const setOnboardingCookie = () => {
    jsCookie.set("PIP_HIDE_ONBOARDING", "1");
  }

  const steps: StepWithActions[] = [
    {
      target: "div.player.p1.seat",
      title: "Your Position",
      content:
        "Your position will always be on the bottom-center of the screen. Action moves clockwise.",
      afterClose: () => {
        onAdvanceHand(null, null);
      },
      event: "hover",
      disableBeacon: true,
    },
    {
      target: "div.player.p5.seat",
      title: "Dealer Button",
      content: "The dealer button shows at the bottom of the dealer's avatar.",
      afterClose: () => {
        onAdvanceHand(null, null);
      },
    },
    {
      target: "div.player.p3.seat",
      title: "Small Blind",
      content:
        "The small blind is the first active player after the dealer. In tournaments, blinds increase on intervals.",
      afterClose: () => {
        onAdvanceHand(null, null);
      },
    },
    {
      target: "div.player.p8.seat",
      title: "Big Blind",
      content:
        "The big blind is the second active player after the dealer. They are last to act when opening betting.",
      afterClose: () => {
        onAdvanceHand(null, null);
      },
    },
    {
      target: "div.player.p2.seat",
      title: "First to Act",
      content:
        "This player is first to act. The circle around the player shows their time remaining. If time elapses before the player acts, they will be checked or folded.",
      afterClose: () => {
        let index = 0;
        const interval = setInterval(() => {
          if (index++ === 4) {
            clearInterval(interval);
            return;
          }
          onAdvanceHand(
            {
              action: ActionDirective.Fold,
              total: 0,
              raise: 0,
              contribution: 0,
              uid: gameRef.current.hands[0].actingPlayerId,
              voluntary: false,
              allIn: false,
              conforming: false,
              timestamp: 0,
            },
            null
          );
        }, 10);
      },
    },
    {
      target: "div.options",
      title: "Your Action",
      content:
        "When it is your turn, your actions will show in the bottom right of the screen. You may typically call, raise or fold.",

      afterClose: () => {
        const directives = [
          ActionDirective.Call,
          ActionDirective.Fold,
          ActionDirective.Fold,
          ActionDirective.Check,
          ActionDirective.Check,
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index++ === directives.length) {
            clearInterval(interval);
            return;
          }
          onAdvanceHand(
            {
              action: directives[index - 1],
              total: 0,
              raise: 0,
              contribution: 0,
              uid: gameRef.current.hands[0].actingPlayerId,
              voluntary: false,
              allIn: false,
              conforming: false,
              timestamp: 0,
            },
            null
          );
        }, 1);
      },
    },
    {
      target: "div.potSize",
      title: "Pot Size",
      placement: "right",
      content:
        "The pot size will show above the cards. It represents the total amount of money in the pot.",

      afterClose: () => {},
    },
    {
      target: "div.flop",
      title: "The Flop",
      content:
        "After the flop, the first three common cards will be shown here. Another round of betting will ensue. Watch out for flush draws!",

      afterClose: () => {
        const directives = [
          ActionDirective.Check,
          ActionDirective.Check,
          ActionDirective.Check,
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index++ === directives.length) {
            clearInterval(interval);
            return;
          }
          onAdvanceHand(
            {
              action: directives[index - 1],
              total: 0,
              raise: 0,
              contribution: 0,
              uid: gameRef.current.hands[0].actingPlayerId,
              voluntary: false,
              allIn: false,
              conforming: false,
              timestamp: 0,
            },
            null
          );
        }, 1);
      },
    },
    {
      target: "div.turn",
      title: "The Turn",
      content:
        "After the turn, the fourth card will be shown here. Another round of betting will ensue. Double check if your draw hit...",

      afterClose: () => {
        const directives = [
          ActionDirective.Check,
          ActionDirective.Check,
          ActionDirective.Check,
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index++ === directives.length) {
            clearInterval(interval);
            return;
          }
          onAdvanceHand(
            {
              action: directives[index - 1],
              total: 0,
              raise: 0,
              contribution: 0,
              uid: gameRef.current.hands[0].actingPlayerId,
              voluntary: false,
              allIn: false,
              conforming: false,
              timestamp: 0,
            },
            null
          );
        }, 1);
      },
    },
    {
      target: "div.river",
      title: "The River",
      content:
        "Where dreams are made and crushed. The river card will be shown here. Another round of betting will ensue.",

      afterClose: () => {
        const directives = [
          ActionDirective.Check,
          ActionDirective.Check,
          ActionDirective.Check,
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index++ === directives.length) {
            clearInterval(interval);
            return;
          }
          onAdvanceHand(
            {
              action: directives[index - 1],
              total: 0,
              raise: 0,
              contribution: 0,
              uid: gameRef.current.hands[0].actingPlayerId,
              voluntary: false,
              allIn: false,
              conforming: false,
              timestamp: 0,
            },
            null
          );
        }, 1);
      },
    },
    {
      target: "div.payout.win",
      title: "The Winner(s)",
      content:
        "The winning hand will be highlighted and described. If you hover over the hand description, the cards making that hand will highlight.",
      placement: "right",

      afterClose: () => {
        const directives = [ActionDirective.Check];

        let index = 0;
        const interval = setInterval(() => {
          if (index++ === directives.length) {
            clearInterval(interval);
            return;
          }
          onAdvanceHand(
            {
              action: directives[index - 1],
              total: 0,
              raise: 0,
              contribution: 0,
              uid: gameRef.current.hands[0].actingPlayerId,
              voluntary: false,
              allIn: false,
              conforming: false,
              timestamp: 0,
            },
            null
          );
        }, 1);
      },
    },
    {
      target: "div.splash",
      title: "You're Ready",
      content:
        "That's all for now. You're well trained to start the action. Click next to jump into the game.",

      afterClose: () => {
        if (redirectURI) {
          setOnboardingCookie();
          document.location.assign(redirectURI);
        } else if (props.onComplete) {
          props.onComplete();
        } else if (window.parent) {
          window.parent.postMessage({ dismissOnboarding: true }, "*");
        }
      },
    },
  ];

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
      : dummyPlayerState;
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
    const result = advanceHand(gameRef.current, action);
    setGame(result.game);
    const updatedActiveHand = gameRef.current.hands.find(
      (h) => h.id === result.game.activeHandId
    );
    const activePlayerState = updatedActiveHand
      ? updatedActiveHand.playerStates.find(
        (ps) => ps.uid === result.actingPlayerId
      )
      : dummyPlayerState;
    setPlayerState({
      ...activePlayerState,
      actions: result.actions || [],
    });
    if (AUTO_ADVANCE_DIRECTIVES[result.directive]) {
      // setTimeout(() => {
      //   onAdvanceHand(null, null, result.game);
      // }, AUTO_ADVANCE_DIRECTIVES[result.directive]);
    }
  };

  return (
    <MockingProvider isMocking>
      <div className="tableContainer">
        <Table
          game={game}
          activeHand={activeHand}
          playerState={
            playerState && playerState.uid === "dummy-1" ? playerState : null
          }
          currentUserId="dummy-1"
          onAdvanceHand={onAdvanceHand}
          onTimeoutPlayer={onTimeoutPlayer}
          onSetAway={async (away: boolean) => {}}
        />
        <Button
          variant="contained"
          color="primary"
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            paddingLeft: "7rem",
            paddingRight: "7rem",
            zIndex: 10000,
          }}
          href={redirectURI}
          onClick={setOnboardingCookie}
          size="large"
        >
          Take Me to the Game!
        </Button>
      </div>
      <Joyride
        styles={{
          options: {
            zIndex: 10000,
            beaconSize: 60,
            primaryColor: "#ce5991",
            overlayColor: "rgba(0, 0, 0, 0.25)",
          },
        }}
        steps={steps}
        callback={(data) => {
          const { action, index, status, type } = data;

          if (type === EVENTS.TOUR_START) {
            setStepIndex(0);
            setIsTourOpen(true);
          } else if (type === EVENTS.STEP_AFTER) {
            // Update state to advance the tour
            const step = data.step as StepWithActions;
            if (step.afterClose) {
              step.afterClose();
            }
            setTimeout(() => {
              setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
            }, 250);
          } else if (type === EVENTS.TARGET_NOT_FOUND) {
            setStepIndex(index);

            // Update state to advance the tour
            // setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
          } else if (
            [STATUS.FINISHED as string, STATUS.SKIPPED as string].includes(
              status
            )
          ) {
            // Need to set our running state to false, so we can restart if we click start again.
            setIsTourOpen(false);
          }
        }}
        stepIndex={stepIndex}
        run={isTourOpen}
        debug
        continuous
        hideBackButton
        showProgress
        disableOverlayClose
        disableCloseOnEsc
        showSkipButton
      />
    </MockingProvider>
  );
}

export default Onboarding;
