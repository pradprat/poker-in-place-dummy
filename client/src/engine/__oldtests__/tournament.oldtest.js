import {
  getForcedAction,
  advanceHand,
  calculateHandWinners
} from "..";
import {
  rebalanceTables,
  rebalanceTablesPerformantly,
  advanceTournamentHand
} from "../tournament";
import {
  TournamentDirective
} from "../types";

const dummyTournament = {
  winners: [{
      percent: 0.8,
      rank: 0
    },
    {
      percent: 0.2,
      rank: 1
    },
  ],
  organizerCode: "nicholas123",
  startingStack: 1000,
  type: "tournament",
  prng: "mulberry32",
  buyIn: 20,
  hostedMedia: "mediasoup",
  rebuysThroughRound: -1,
  tables: [{
      increment: 1,
      type: "tournament",
      prng: "mulberry32",
      buyIn: 20,
      hostedMedia: "mediasoup",
      mediasoupHost: "n0.media.pokerinplace.app",
      organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
      stage: "active",
      name: "Tournament Table #1",
      timestamp: 1596733227050,
      id: "8H7zK3RSiNmQzGrvtXyP",
      currentBigBlind: 2000,
      players: {
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_20: {
          role: "player",
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 20",
          position: 0,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_20",
          email: "nick@pokerinplace.app",
          contributed: 20,
          stack: 0,
          active: false,
          removed: true,
          bustedTimestamp: 1596733267139,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_15: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 15",
          position: 6,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_15",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_4: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 4",
          position: 7,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_4",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_18: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 18",
          position: 1,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_18",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_17: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 17",
          position: 2,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_17",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_25: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 25",
          position: 3,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_24: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 24",
          position: 5,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 2000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 26",
          position: 4,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
      },
      activeHandId: null,
      tournamentDetails: {
        winners: [{
            percent: 0.8,
            rank: 0
          },
          {
            percent: 0.2,
            rank: 1
          },
        ],
        organizerCode: "nicholas123",
        startingStack: 1000,
        type: "tournament",
        prng: "mulberry32",
        buyIn: 20,
        hostedMedia: "mediasoup",
        rebuysThroughRound: -1,
        tables: [],
        payType: "up-front",
        organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
        name: "Video Poker Game",
        roundInterval: 4,
        paymentId: "free",
        paymentType: "free",
        tableIds: [
          "8H7zK3RSiNmQzGrvtXyP",
          "bvVMFOLpyW4yCx8flUW9",
          "tGRMT7nRxccmGRHvWYrw",
          "JEDLxovvDKznIirxi12o",
        ],
        activeRoundId: 1,
        rounds: [{
            bigBlind: 2000,
            roundIndex: 0,
            id: 0,
            timestamp: 1596733229388,
          },
          {
            bigBlind: 2000,
            roundIndex: 1,
            id: 1,
            timestamp: 1596733480591,
          },
          {
            bigBlind: 2000,
            roundIndex: 2,
            id: 2
          },
          {
            bigBlind: 2000,
            roundIndex: 3,
            id: 3
          },
          {
            bigBlind: 2000,
            roundIndex: 4,
            id: 4
          },
        ],
        pauseDuration: 0,
        players: {
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_1: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 1",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_1",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_29: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 29",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Nicholas Clark",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_20: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 20",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_20",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_19: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 19",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733305690,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_15: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 15",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_15",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_2: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 2",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_4: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 4",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_4",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_3: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 3",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_23: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 23",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_23",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_16: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 16",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_18: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 18",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_18",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_21: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 21",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_21",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 28",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_14: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 14",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_14",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_17: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 17",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_17",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_8: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 8",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_8",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_7: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 7",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_7",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_10: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 10",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_6: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 6",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_6",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_25: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 25",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_22: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 22",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_0: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 0",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_0",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_24: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 24",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 26",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_12: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 12",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_12",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_5: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 5",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_5",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_11: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 11",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_11",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_9: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 9",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 13",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_27: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 27",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_27",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
        },
        pauseReason: "table-balancing",
        pauseMessage: "Tables are rebalancing...",
        pauseEndTimestamp: 1596733540686,
        status: "paused",
      },
      hands: [],
    },
    {
      increment: 1,
      type: "tournament",
      prng: "mulberry32",
      buyIn: 20,
      hostedMedia: "mediasoup",
      mediasoupHost: "n0.media.pokerinplace.app",
      organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
      stage: "active",
      name: "Tournament Table #4",
      timestamp: 1596733227079,
      id: "JEDLxovvDKznIirxi12o",
      currentBigBlind: 2000,
      activeHandId: null,
      players: {
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_29: {
          role: "player",
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 29",
          position: 6,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
          email: "nick@pokerinplace.app",
          contributed: 20,
          stack: 0,
          active: false,
          removed: true,
          bustedTimestamp: 1596733267139,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_16: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 16",
          position: 2,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_14: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 14",
          position: 3,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_14",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_10: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 10",
          position: 4,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_5: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 5",
          position: 1,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_5",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 2000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_22: {
          role: "player",
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 22",
          position: 5,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
          email: "nick@pokerinplace.app",
          contributed: 20,
          stack: 0,
          active: false,
          bustedTimestamp: 1596733540656,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_12: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 12",
          position: 0,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_12",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 2000,
        },
      },
      tournamentDetails: {
        winners: [{
            percent: 0.8,
            rank: 0
          },
          {
            percent: 0.2,
            rank: 1
          },
        ],
        organizerCode: "nicholas123",
        startingStack: 1000,
        type: "tournament",
        prng: "mulberry32",
        buyIn: 20,
        hostedMedia: "mediasoup",
        rebuysThroughRound: -1,
        tables: [],
        payType: "up-front",
        organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
        name: "Video Poker Game",
        roundInterval: 4,
        paymentId: "free",
        paymentType: "free",
        tableIds: [
          "8H7zK3RSiNmQzGrvtXyP",
          "bvVMFOLpyW4yCx8flUW9",
          "tGRMT7nRxccmGRHvWYrw",
          "JEDLxovvDKznIirxi12o",
        ],
        activeRoundId: 1,
        rounds: [{
            bigBlind: 2000,
            roundIndex: 0,
            id: 0,
            timestamp: 1596733229388,
          },
          {
            bigBlind: 2000,
            roundIndex: 1,
            id: 1,
            timestamp: 1596733480591,
          },
          {
            bigBlind: 2000,
            roundIndex: 2,
            id: 2
          },
          {
            bigBlind: 2000,
            roundIndex: 3,
            id: 3
          },
          {
            bigBlind: 2000,
            roundIndex: 4,
            id: 4
          },
        ],
        pauseDuration: 0,
        players: {
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_1: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 1",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_1",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_29: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 29",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Nicholas Clark",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_20: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 20",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_20",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_19: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 19",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733305690,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_15: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 15",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_15",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_2: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 2",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_4: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 4",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_4",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_3: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 3",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_23: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 23",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_23",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_16: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 16",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_18: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 18",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_18",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_21: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 21",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_21",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 28",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_14: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 14",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_14",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_17: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 17",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_17",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_8: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 8",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_8",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_7: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 7",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_7",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_10: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 10",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_6: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 6",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_6",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_25: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 25",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_22: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 22",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_0: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 0",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_0",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_24: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 24",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 26",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_12: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 12",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_12",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_5: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 5",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_5",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_11: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 11",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_11",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_9: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 9",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 13",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_27: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 27",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_27",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
        },
        pauseReason: "table-balancing",
        pauseMessage: "Tables are rebalancing...",
        pauseEndTimestamp: 1596733540686,
        status: "paused",
      },
      hands: [],
    },
    {
      increment: 1,
      type: "tournament",
      prng: "mulberry32",
      buyIn: 20,
      hostedMedia: "mediasoup",
      mediasoupHost: "n0.media.pokerinplace.app",
      organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
      stage: "active",
      name: "Tournament Table #2",
      timestamp: 1596733227063,
      id: "bvVMFOLpyW4yCx8flUW9",
      currentBigBlind: 2000,
      activeHandId: null,
      players: {
        Pm2AMPmJtXaciNSBKSQiXx99a2r2: {
          role: "player",
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Nicholas Clark",
          position: 5,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
          email: "nick@pokerinplace.app",
          contributed: 20,
          stack: 0,
          active: false,
          removed: true,
          bustedTimestamp: 1596733267139,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_19: {
          role: "player",
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 19",
          position: 3,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
          email: "nick@pokerinplace.app",
          contributed: 20,
          stack: 0,
          active: false,
          removed: true,
          bustedTimestamp: 1596733305690,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_23: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 23",
          position: 4,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_23",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 2000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_21: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 21",
          position: 6,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_21",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_11: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 11",
          position: 1,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_11",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_9: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 9",
          position: 2,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 2000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_6: {
          role: "player",
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 6",
          position: 0,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_6",
          email: "nick@pokerinplace.app",
          contributed: 20,
          stack: 0,
          active: false,
          bustedTimestamp: 1596733510961,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_8: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 8",
          position: 7,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_8",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 2000,
        },
      },
      tournamentDetails: {
        winners: [{
            percent: 0.8,
            rank: 0
          },
          {
            percent: 0.2,
            rank: 1
          },
        ],
        organizerCode: "nicholas123",
        startingStack: 1000,
        type: "tournament",
        prng: "mulberry32",
        buyIn: 20,
        hostedMedia: "mediasoup",
        rebuysThroughRound: -1,
        tables: [],
        payType: "up-front",
        organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
        name: "Video Poker Game",
        roundInterval: 4,
        paymentId: "free",
        paymentType: "free",
        tableIds: [
          "8H7zK3RSiNmQzGrvtXyP",
          "bvVMFOLpyW4yCx8flUW9",
          "tGRMT7nRxccmGRHvWYrw",
          "JEDLxovvDKznIirxi12o",
        ],
        activeRoundId: 1,
        rounds: [{
            bigBlind: 2000,
            roundIndex: 0,
            id: 0,
            timestamp: 1596733229388,
          },
          {
            bigBlind: 2000,
            roundIndex: 1,
            id: 1,
            timestamp: 1596733480591,
          },
          {
            bigBlind: 2000,
            roundIndex: 2,
            id: 2
          },
          {
            bigBlind: 2000,
            roundIndex: 3,
            id: 3
          },
          {
            bigBlind: 2000,
            roundIndex: 4,
            id: 4
          },
        ],
        pauseDuration: 0,
        players: {
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_1: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 1",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_1",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_29: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 29",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Nicholas Clark",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_20: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 20",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_20",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_19: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 19",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733305690,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_15: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 15",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_15",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_2: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 2",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_4: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 4",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_4",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_3: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 3",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_23: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 23",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_23",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_16: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 16",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_18: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 18",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_18",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_21: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 21",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_21",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 28",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_14: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 14",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_14",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_17: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 17",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_17",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_8: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 8",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_8",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_7: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 7",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_7",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_10: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 10",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_6: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 6",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_6",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_25: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 25",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_22: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 22",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_0: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 0",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_0",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_24: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 24",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 26",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_12: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 12",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_12",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_5: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 5",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_5",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_11: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 11",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_11",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_9: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 9",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 13",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_27: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 27",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_27",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
        },
        pauseReason: "table-balancing",
        pauseMessage: "Tables are rebalancing...",
        pauseEndTimestamp: 1596733540686,
        status: "paused",
      },
      hands: [],
    },
    {
      increment: 1,
      type: "tournament",
      prng: "mulberry32",
      buyIn: 20,
      hostedMedia: "mediasoup",
      mediasoupHost: "n0.media.pokerinplace.app",
      organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
      stage: "active",
      name: "Tournament Table #3",
      timestamp: 1596733227072,
      id: "tGRMT7nRxccmGRHvWYrw",
      currentBigBlind: 2000,
      activeHandId: null,
      players: {
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_1: {
          role: "player",
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 1",
          position: 6,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_1",
          email: "nick@pokerinplace.app",
          contributed: 20,
          stack: 0,
          active: false,
          removed: true,
          bustedTimestamp: 1596733267139,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_2: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 2",
          position: 5,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_2",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_3: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 3",
          position: 7,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_0: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 0",
          position: 2,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_0",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 13",
          position: 4,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 2000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_27: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 27",
          position: 3,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_27",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 1000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
          role: "player",
          active: true,
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 28",
          position: 0,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
          email: "nick@pokerinplace.app",
          contributed: 20,
          bustedTimestamp: 9007199254740991,
          stack: 2000,
        },
        Pm2AMPmJtXaciNSBKSQiXx99a2r2_7: {
          role: "player",
          photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
          name: "Dummy Player 7",
          position: 1,
          id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_7",
          email: "nick@pokerinplace.app",
          contributed: 20,
          stack: 0,
          active: false,
          bustedTimestamp: 1596733514569,
        },
      },
      tournamentDetails: {
        winners: [{
            percent: 0.8,
            rank: 0
          },
          {
            percent: 0.2,
            rank: 1
          },
        ],
        organizerCode: "nicholas123",
        startingStack: 1000,
        type: "tournament",
        prng: "mulberry32",
        buyIn: 20,
        hostedMedia: "mediasoup",
        rebuysThroughRound: -1,
        tables: [],
        payType: "up-front",
        organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
        name: "Video Poker Game",
        roundInterval: 4,
        paymentId: "free",
        paymentType: "free",
        tableIds: [
          "8H7zK3RSiNmQzGrvtXyP",
          "bvVMFOLpyW4yCx8flUW9",
          "tGRMT7nRxccmGRHvWYrw",
          "JEDLxovvDKznIirxi12o",
        ],
        activeRoundId: 1,
        rounds: [{
            bigBlind: 2000,
            roundIndex: 0,
            id: 0,
            timestamp: 1596733229388,
          },
          {
            bigBlind: 2000,
            roundIndex: 1,
            id: 1,
            timestamp: 1596733480591,
          },
          {
            bigBlind: 2000,
            roundIndex: 2,
            id: 2
          },
          {
            bigBlind: 2000,
            roundIndex: 3,
            id: 3
          },
          {
            bigBlind: 2000,
            roundIndex: 4,
            id: 4
          },
        ],
        pauseDuration: 0,
        players: {
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_1: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 1",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_1",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_29: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 29",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Nicholas Clark",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_20: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 20",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_20",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733267139,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_19: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 19",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            removed: true,
            tableId: null,
            bustedTimestamp: 1596733305690,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_15: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 15",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_15",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_2: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 2",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_4: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 4",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_4",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_3: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 3",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_23: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 23",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_23",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_16: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 16",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_18: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 18",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_18",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_21: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 21",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_21",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 28",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_14: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 14",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_14",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_17: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 17",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_17",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_8: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 8",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_8",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_7: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 7",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_7",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_10: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 10",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_6: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 6",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_6",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_25: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 25",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_22: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 22",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_0: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 0",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_0",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_24: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 24",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 26",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "8H7zK3RSiNmQzGrvtXyP",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_12: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 12",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_12",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_5: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 5",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_5",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "JEDLxovvDKznIirxi12o",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_11: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 11",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_11",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_9: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 9",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "bvVMFOLpyW4yCx8flUW9",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 13",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_27: {
            role: "player",
            active: true,
            photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
            name: "Dummy Player 27",
            position: -1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_27",
            email: "nick@pokerinplace.app",
            contributed: 20,
            tableId: "tGRMT7nRxccmGRHvWYrw",
            bustedTimestamp: 9007199254740991,
            stack: 1000,
          },
        },
        pauseReason: "table-balancing",
        pauseMessage: "Tables are rebalancing...",
        pauseEndTimestamp: 1596733540686,
        status: "paused",
      },
      hands: [],
    },
  ],
  payType: "up-front",
  organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
  name: "Video Poker Game",
  roundInterval: 4,
  paymentId: "free",
  paymentType: "free",
  tableIds: [
    "8H7zK3RSiNmQzGrvtXyP",
    "bvVMFOLpyW4yCx8flUW9",
    "tGRMT7nRxccmGRHvWYrw",
    "JEDLxovvDKznIirxi12o",
  ],
  activeRoundId: 1,
  rounds: [{
      bigBlind: 2000,
      roundIndex: 0,
      id: 0,
      timestamp: 1596733229388
    },
    {
      bigBlind: 2000,
      roundIndex: 1,
      id: 1,
      timestamp: 1596733480591
    },
    {
      bigBlind: 2000,
      roundIndex: 2,
      id: 2
    },
    {
      bigBlind: 2000,
      roundIndex: 3,
      id: 3
    },
    {
      bigBlind: 2000,
      roundIndex: 4,
      id: 4
    },
  ],
  pauseDuration: 0,
  players: {
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_1: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 1",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_1",
      email: "nick@pokerinplace.app",
      contributed: 20,
      stack: 0,
      removed: true,
      tableId: null,
      bustedTimestamp: 1596733267139,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_29: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 29",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
      email: "nick@pokerinplace.app",
      contributed: 20,
      stack: 0,
      removed: true,
      tableId: null,
      bustedTimestamp: 1596733267139,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Nicholas Clark",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
      email: "nick@pokerinplace.app",
      contributed: 20,
      stack: 0,
      removed: true,
      tableId: null,
      bustedTimestamp: 1596733267139,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_20: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 20",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_20",
      email: "nick@pokerinplace.app",
      contributed: 20,
      stack: 0,
      removed: true,
      tableId: null,
      bustedTimestamp: 1596733267139,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_19: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 19",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
      email: "nick@pokerinplace.app",
      contributed: 20,
      stack: 0,
      removed: true,
      tableId: null,
      bustedTimestamp: 1596733305690,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_15: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 15",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_15",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "8H7zK3RSiNmQzGrvtXyP",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_2: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 2",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_2",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "tGRMT7nRxccmGRHvWYrw",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_4: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 4",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_4",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "8H7zK3RSiNmQzGrvtXyP",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_3: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 3",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "tGRMT7nRxccmGRHvWYrw",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_23: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 23",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_23",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "bvVMFOLpyW4yCx8flUW9",
      bustedTimestamp: 9007199254740991,
      stack: 2000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_16: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 16",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "JEDLxovvDKznIirxi12o",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_18: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 18",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_18",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "8H7zK3RSiNmQzGrvtXyP",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_21: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 21",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_21",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "bvVMFOLpyW4yCx8flUW9",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 28",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "tGRMT7nRxccmGRHvWYrw",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_14: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 14",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_14",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "JEDLxovvDKznIirxi12o",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_17: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 17",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_17",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "8H7zK3RSiNmQzGrvtXyP",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_8: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 8",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_8",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "bvVMFOLpyW4yCx8flUW9",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_7: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 7",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_7",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "tGRMT7nRxccmGRHvWYrw",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_10: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 10",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "JEDLxovvDKznIirxi12o",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_6: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 6",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_6",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "bvVMFOLpyW4yCx8flUW9",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_25: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 25",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "8H7zK3RSiNmQzGrvtXyP",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_22: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 22",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "JEDLxovvDKznIirxi12o",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_0: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 0",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_0",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "tGRMT7nRxccmGRHvWYrw",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_24: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 24",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "8H7zK3RSiNmQzGrvtXyP",
      bustedTimestamp: 9007199254740991,
      stack: 2000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 26",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "8H7zK3RSiNmQzGrvtXyP",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_12: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 12",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_12",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "JEDLxovvDKznIirxi12o",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_5: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 5",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_5",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "JEDLxovvDKznIirxi12o",
      bustedTimestamp: 9007199254740991,
      stack: 2000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_11: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 11",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_11",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "bvVMFOLpyW4yCx8flUW9",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_9: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 9",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "bvVMFOLpyW4yCx8flUW9",
      bustedTimestamp: 9007199254740991,
      stack: 2000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 13",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "tGRMT7nRxccmGRHvWYrw",
      bustedTimestamp: 9007199254740991,
      stack: 2000,
    },
    Pm2AMPmJtXaciNSBKSQiXx99a2r2_27: {
      role: "player",
      active: true,
      photoURL: "https://lh4.googleusercontent.com/-L-pJusDSu70/AAAAAAAAAAI/AAAAAAAAAAA/AAKWJJPvyrLFRor2oAtfUgWCxYpqhfEutw/photo.jpg",
      name: "Dummy Player 27",
      position: -1,
      id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_27",
      email: "nick@pokerinplace.app",
      contributed: 20,
      tableId: "tGRMT7nRxccmGRHvWYrw",
      bustedTimestamp: 9007199254740991,
      stack: 1000,
    },
  },
  pauseReason: "table-balancing",
  pauseMessage: "Tables are rebalancing...",
  pauseEndTimestamp: 1596733540686,
  status: "paused",
};

describe("Tournament rebalancing", () => {
  describe("Legacy rebalancing", () => {
    it("Should eliminate player 1", () => {
      const tournament = {
        status: "active",
        tables: [{
          id: "1",
          type: "tournament",
          players: {
            "1": {
              id: "1",
              active: true,
              removed: false,
              stack: 0
            },
            "2": {
              id: "2",
              active: true,
              removed: false,
              stack: 10
            },
            "3": {
              id: "3",
              active: true,
              removed: false,
              stack: 20
            },
            "4": {
              id: "4",
              active: true,
              removed: false,
              stack: 30
            },
          },
        }, ],
        rounds: [],
      };
      const result = rebalanceTables(tournament);
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "1",
          tableId: "1"
        },
      });
    });
    it("Should issue no directives", () => {
      const tournament = {
        status: "active",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 10
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 30
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 30
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 30
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTables(tournament);
      expect(result).toEqual([]);
    });
    it("Should want to eliminate player 1 and player 5 and rebalance, but will pause", () => {
      const tournament = {
        status: "active",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 0
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 0
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 30
              },
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 30
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 30
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTables(tournament);
      expect(result).toContainEqual({
        directive: TournamentDirective.RequestPause,
        data: {
          duration: 0,
          message: "Tables are rebalancing...",
          reason: "table-balancing",
        },
      });
    });
    it("Should eliminate player 1 and player 5 and rebalance", () => {
      const tournament = {
        status: "paused",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 0
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 0
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 30
              },
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 30
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 30
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTables(tournament);
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "1",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "5",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "7",
          tableId: "1",
          player: {
            id: "7",
            active: true,
            removed: false,
            stack: 30
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "7",
          tableId: "2"
        },
      });
    });
    it("Should eliminate players 1, 5, 7, 10 and consolidate tables", () => {
      const tournament = {
        status: "paused",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 0
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 0
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 0
              },
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 0
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 30
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTables(tournament);
      expect(result.length).toEqual(13);
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "1",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "5",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "7",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "10",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "2",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "2",
          tableId: "2",
          player: {
            id: "2",
            active: true,
            removed: false,
            stack: 10
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "3",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "3",
          tableId: "2",
          player: {
            id: "3",
            active: true,
            removed: false,
            stack: 20
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "4",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "4",
          tableId: "2",
          player: {
            id: "4",
            active: true,
            removed: false,
            stack: 30
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "6",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "6",
          tableId: "2",
          player: {
            id: "6",
            active: true,
            removed: false,
            stack: 30
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminateTable,
        data: {
          tableId: "1"
        },
      });
    });

    it("Should eliminate players 10, 11, 12, 13, 14, 15, 16 and consolidate tables", () => {
      const tournament = {
        status: "paused",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 10
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 10
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 30
              },
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 0
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 0
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 0
              },
              "13": {
                id: "13",
                active: true,
                removed: false,
                stack: 0
              },
              "14": {
                id: "14",
                active: true,
                removed: false,
                stack: 0
              },
              "15": {
                id: "15",
                active: true,
                removed: false,
                stack: 0
              },
              "16": {
                id: "16",
                active: true,
                removed: false,
                stack: 0
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTables(tournament);
      expect(result.length).toEqual(13);
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "10",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "11",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "12",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "13",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "14",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "15",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "16",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "1",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "1",
          tableId: "2",
          player: {
            id: "1",
            active: true,
            removed: false,
            stack: 10
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "2",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "2",
          tableId: "2",
          player: {
            id: "2",
            active: true,
            removed: false,
            stack: 10
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "3",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "3",
          tableId: "2",
          player: {
            id: "3",
            active: true,
            removed: false,
            stack: 20
          },
        },
      });
    });

    it("Should balance to tables evenly after lots of busts", () => {
      const tournament = dummyTournament;
      const result = rebalanceTables(tournament);
      console.dir(result);
      expect(result.length).toEqual(14);
    });
  });


  describe("Performant rebalancing", () => {
    it("Should eliminate player 1", () => {
      const tournament = {
        status: "active",
        tables: [{
          id: "1",
          type: "tournament",
          players: {
            "1": {
              id: "1",
              active: true,
              removed: false,
              stack: 0
            },
            "2": {
              id: "2",
              active: true,
              removed: false,
              stack: 10
            },
            "3": {
              id: "3",
              active: true,
              removed: false,
              stack: 20
            },
            "4": {
              id: "4",
              active: true,
              removed: false,
              stack: 30
            },
          },
        }, ],
        rounds: [],
      };
      const result = rebalanceTablesPerformantly(tournament);
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "1",
          tableId: "1"
        },
      });
    });
    it("Should issue no directives", () => {
      const tournament = {
        status: "active",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 10
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 30
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 30
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 30
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTablesPerformantly(tournament);
      expect(result).toEqual([]);
    });
    it("Should want to eliminate player 1 and player 5 and rebalance, but will NOT pause", () => {
      const tournament = {
        status: "active",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 0
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 0
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 30
              },
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 30
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 30
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTablesPerformantly(tournament);
      expect(result).not.toContainEqual({
        directive: TournamentDirective.RequestPause,
        data: {
          duration: 0,
          message: "Tables are rebalancing...",
          reason: "table-balancing",
        },
      });
    });
    it("Should eliminate player 1 and player 5 and rebalance", () => {
      const tournament = {
        status: "paused",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 0
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 0
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 30
              },
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 30
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 30
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTablesPerformantly(tournament);
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "1",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "5",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "7",
          tableId: "1",
          player: {
            id: "7",
            active: true,
            removed: false,
            stack: 30
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "7",
          tableId: "2"
        },
      });
    });
    it("Should eliminate players 1, 5, 7, 10 and consolidate tables", () => {
      const tournament = {
        status: "paused",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 0
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 0
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 0
              },
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 0
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 30
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTablesPerformantly(tournament);
      expect(result.length).toEqual(13);
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "1",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "5",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "7",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "10",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "2",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "2",
          tableId: "2",
          player: {
            id: "2",
            active: true,
            removed: false,
            stack: 10
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "3",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "3",
          tableId: "2",
          player: {
            id: "3",
            active: true,
            removed: false,
            stack: 20
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "4",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "4",
          tableId: "2",
          player: {
            id: "4",
            active: true,
            removed: false,
            stack: 30
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "6",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "6",
          tableId: "2",
          player: {
            id: "6",
            active: true,
            removed: false,
            stack: 30
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminateTable,
        data: {
          tableId: "1"
        },
      });
    });

    it("Should eliminate players 10, 11, 12, 13, 14, 15, 16 and consolidate tables", () => {
      const tournament = {
        status: "paused",
        tables: [{
            id: "1",
            type: "tournament",
            players: {
              "1": {
                id: "1",
                active: true,
                removed: false,
                stack: 10
              },
              "2": {
                id: "2",
                active: true,
                removed: false,
                stack: 10
              },
              "3": {
                id: "3",
                active: true,
                removed: false,
                stack: 20
              },
              "4": {
                id: "4",
                active: true,
                removed: false,
                stack: 30
              },
              "5": {
                id: "5",
                active: true,
                removed: false,
                stack: 10
              },
              "6": {
                id: "6",
                active: true,
                removed: false,
                stack: 30
              },
              "7": {
                id: "7",
                active: true,
                removed: false,
                stack: 30
              },
              "8": {
                id: "8",
                active: true,
                removed: false,
                stack: 30
              },
            },
          },
          {
            id: "2",
            type: "tournament",
            players: {
              "9": {
                id: "9",
                active: true,
                removed: false,
                stack: 30
              },
              "10": {
                id: "10",
                active: true,
                removed: false,
                stack: 0
              },
              "11": {
                id: "11",
                active: true,
                removed: false,
                stack: 0
              },
              "12": {
                id: "12",
                active: true,
                removed: false,
                stack: 0
              },
              "13": {
                id: "13",
                active: true,
                removed: false,
                stack: 0
              },
              "14": {
                id: "14",
                active: true,
                removed: false,
                stack: 0
              },
              "15": {
                id: "15",
                active: true,
                removed: false,
                stack: 0
              },
              "16": {
                id: "16",
                active: true,
                removed: false,
                stack: 0
              },
            },
          },
        ],
        rounds: [],
      };
      const result = rebalanceTablesPerformantly(tournament);
      expect(result.length).toEqual(13);
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "10",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "11",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "12",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "13",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "14",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "15",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.EliminatePlayer,
        data: {
          playerId: "16",
          tableId: "2"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "1",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "1",
          tableId: "2",
          player: {
            id: "1",
            active: true,
            removed: false,
            stack: 10
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "2",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "2",
          tableId: "2",
          player: {
            id: "2",
            active: true,
            removed: false,
            stack: 10
          },
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.RemovePlayer,
        data: {
          playerId: "3",
          tableId: "1"
        },
      });
      expect(result).toContainEqual({
        directive: TournamentDirective.AddPlayer,
        data: {
          playerId: "3",
          tableId: "2",
          player: {
            id: "3",
            active: true,
            removed: false,
            stack: 20
          },
        },
      });
    });

    it("Should balance to tables evenly after lots of busts", () => {
      const tournament = dummyTournament;
      const result = rebalanceTablesPerformantly(tournament);
      console.dir(result);
      expect(result.length).toEqual(14);
    });
  });

  describe("No balancing functions", () => {

    it("Should be able to check if small blind bigger than big", () => {
      const fakeHand = {
        dealerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
        smallBlindId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
        payoutsApplied: false,
        activeDeckId: "2020-08-06T18:12:37.895Z",
        bigBlind: 3000,
        payouts: [],
        cardsDealt: 14,
        activeRound: "pre-flop",
        bigBlindId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
        actingPlayerId: null,
        smallBlind: 1500,
        id: "1596737557895",
        playerIds: [
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
        ],
        rounds: [{
          cards: [],
          active: true,
          type: "pre-flop",
          firstToActOffset: 3,
          actions: [{
              allIn: false,
              conforming: false,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
              total: 1500,
              contribution: 1500,
              raise: 1500,
              action: "bet",
              voluntary: false,
              timestamp: 1596737557965,
            },
            {
              allIn: true,
              conforming: true,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
              total: 3000,
              contribution: 1000,
              raise: 1500,
              action: "raise",
              voluntary: false,
              timestamp: 1596737557965,
            },
            {
              allIn: false,
              conforming: false,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
              total: 0,
              contribution: 0,
              raise: 0,
              action: "fold",
              voluntary: true,
              timestamp: 1596737560867,
            },
            {
              allIn: false,
              conforming: false,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
              total: 0,
              contribution: 0,
              raise: 0,
              action: "fold",
              voluntary: true,
              timestamp: 1596737562870,
            },
            {
              allIn: false,
              conforming: false,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
              total: 0,
              contribution: 0,
              raise: 0,
              action: "fold",
              voluntary: true,
              timestamp: 1596737565867,
            },
            {
              allIn: false,
              conforming: false,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
              total: 0,
              contribution: 0,
              raise: 0,
              action: "fold",
              voluntary: true,
              timestamp: 1596737567879,
            },
            {
              allIn: false,
              conforming: false,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
              total: 0,
              contribution: 0,
              raise: 0,
              action: "fold",
              voluntary: true,
              timestamp: 1596737570938,
            },
            // {
            //   uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            //   action: "fold",
            //   total: 1500,
            //   raise: 0,
            //   contribution: 0,
            //   allIn: false,
            //   voluntary: true,
            //   conforming: false,
            //   timestamp: 1596737573819,
            // },
          ],
          timestamp: 1596737557965,
        }, ],
        playerStates: [{
            stack: 500,
            cards: ["9s", "6s"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            actions: [],
          },
          {
            stack: 2000,
            cards: ["Jc", "5d"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            actions: [{
                allIn: false,
                conforming: false,
                uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
                total: 1500,
                contribution: 0,
                raise: 0,
                action: "fold",
                voluntary: true,
                timestamp: 1596737572878,
              },
              {
                allIn: true,
                conforming: false,
                uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
                total: 2000,
                contribution: 500,
                raise: 0,
                action: "call",
                voluntary: true,
                timestamp: 1596737572878,
              },
            ],
          },
          {
            stack: 500,
            cards: ["5h", "Jd"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            actions: [],
          },
          {
            stack: 500,
            cards: ["4s", "6c"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            actions: [],
          },
          {
            stack: 1000,
            cards: ["3h", "7s"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            actions: [],
          },
          {
            stack: 500,
            cards: ["Th", "5s"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            actions: [],
          },
          {
            stack: 500,
            cards: ["4d", "2d"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            actions: [],
          },
        ],
      };
      const action = getForcedAction({
        activeHandId: fakeHand.id,
        hands: [fakeHand],
        players: {
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_10: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            position: 3,
            active: true,
            stack: 0,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            position: 1,
            active: true,
            stack: 2000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_16: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            position: 4,
            active: true,
            stack: 0,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_22: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            position: 6,
            active: true,
            stack: 0,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            position: 2,
            active: true,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            position: 5,
            active: true,
            stack: 0,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_29: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            position: 0,
            active: true,
            stack: 0,
          },
        },
      });
      console.log({
        action
      });
    });

    it("Should be able to check if small blind bigger than big", () => {
      const fakeHand = {
        dealerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
        smallBlindId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
        payoutsApplied: false,
        activeDeckId: "2020-08-06T18:12:37.895Z",
        bigBlind: 3000,
        payouts: [],
        cardsDealt: 14,
        activeRound: "pre-flop",
        bigBlindId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
        actingPlayerId: null,
        smallBlind: 1500,
        id: "1596737557895",
        playerIds: [
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
        ],
        rounds: [{
          cards: [],
          active: true,
          type: "pre-flop",
          firstToActOffset: 3,
          actions: [{
              allIn: false,
              conforming: false,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
              total: 5000,
              contribution: 5000,
              raise: 5000,
              action: "bet",
              voluntary: false,
              timestamp: 1596737557965,
            },
            {
              allIn: true,
              conforming: true,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
              total: 1000,
              contribution: 1000,
              raise: 5000,
              action: "raise",
              voluntary: false,
              timestamp: 1596737557965,
            },
            {
              allIn: false,
              conforming: false,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
              total: 0,
              contribution: 0,
              raise: 0,
              action: "fold",
              voluntary: true,
              timestamp: 1596737570938,
            },
            {
              allIn: false,
              conforming: true,
              uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
              total: 5000,
              contribution: 0,
              raise: 0,
              action: "check",
              voluntary: true,
              timestamp: 1596745721715,
            },
            // {
            //   allIn: false,
            //   conforming: false,
            //   uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            //   total: 1000,
            //   contribution: 0,
            //   raise: 0,
            //   action: "check",
            //   voluntary: true,
            //   timestamp: 1596745724427,
            // },
          ],
          timestamp: 1596737557965,
        }, ],
        playerStates: [{
            stack: 500,
            cards: ["9s", "6s"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            actions: [],
          },
          {
            stack: 5000,
            cards: ["Jc", "5d"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            actions: [{
                allIn: false,
                conforming: false,
                uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
                total: 1500,
                contribution: 0,
                raise: 0,
                action: "fold",
                voluntary: true,
                timestamp: 1596737572878,
              },
              {
                allIn: true,
                conforming: false,
                uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
                total: 2000,
                contribution: 500,
                raise: 0,
                action: "call",
                voluntary: true,
                timestamp: 1596737572878,
              },
              {
                allIn: false,
                conforming: false,
                uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
                total: 1500,
                contribution: 0,
                raise: 0,
                action: "fold",
                voluntary: true,
                timestamp: 1596737572878,
              },
            ],
          },
          {
            stack: 500,
            cards: ["5h", "Jd"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            actions: [],
          },
          {
            stack: 500,
            cards: ["4s", "6c"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            actions: [],
          },
          {
            stack: 1000,
            cards: ["3h", "7s"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            actions: [],
          },
          {
            stack: 500,
            cards: ["Th", "5s"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            actions: [],
          },
          {
            stack: 500,
            cards: ["4d", "2d"],
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            actions: [],
          },
        ],
      };
      const gameState = {
        activeHandId: fakeHand.id,
        hands: [fakeHand],
        players: {
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_10: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_10",
            position: 3,
            active: true,
            stack: 0,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            position: 1,
            active: true,
            stack: 5000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_16: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_16",
            position: 4,
            active: true,
            stack: 0,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_22: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_22",
            position: 6,
            active: true,
            stack: 0,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            position: 2,
            active: true,
            stack: 1000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            position: 5,
            active: true,
            stack: 0,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_29: {
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            uid: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_29",
            position: 0,
            active: true,
            stack: 0,
          },
        },
      };
      const action = getForcedAction(gameState);
      const result = advanceHand(gameState, {
        ...action,
        action: 'call'
      });
      console.log({
        result,
        action
      });
    });

    it('Handles payouts properly', () => {
      const hand = {
        "dealerId": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
        "smallBlindId": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
        // "payoutsApplied": true,
        "activeDeckId": "2020-08-07T03:48:06.588Z",
        "bigBlind": 20000,
        "cardsDealt": 10,
        "activeRound": "pre-flop",
        "bigBlindId": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
        "actingPlayerId": null,
        "smallBlind": 10000,
        "id": "1596772086588",
        "playerIds": [
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
          "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3"
        ],
        "rounds": [{
          "cards": [],
          "active": false,
          "type": "pre-flop",
          "firstToActOffset": 3,
          "actions": [{
              "allIn": false,
              "conforming": false,
              "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
              "total": 10000,
              "contribution": 10000,
              "raise": 10000,
              "action": "bet",
              "voluntary": false,
              "timestamp": 1596772086624
            },
            {
              "allIn": true,
              "conforming": true,
              "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
              "total": 5000,
              "contribution": 5000,
              "raise": 10000,
              "action": "raise",
              "voluntary": false,
              "timestamp": 1596772086624
            },
            {
              "allIn": false,
              "conforming": false,
              "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
              "total": 0,
              "contribution": 0,
              "raise": 0,
              "action": "fold",
              "voluntary": true,
              "timestamp": 1596772090999
            },
            {
              "allIn": false,
              "conforming": false,
              "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
              "total": 0,
              "contribution": 0,
              "raise": 0,
              "action": "fold",
              "voluntary": true,
              "timestamp": 1596772093092
            },
            {
              "allIn": false,
              "conforming": false,
              "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
              "total": 0,
              "contribution": 0,
              "raise": 0,
              "action": "fold",
              "voluntary": true,
              "timestamp": 1596772095999
            },
            {
              "allIn": false,
              "conforming": false,
              "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
              "total": 10000,
              "contribution": 0,
              "raise": 0,
              "action": "fold",
              "voluntary": true,
              "timestamp": 1596772098089
            }
          ],
          "timestamp": 1596772086624
        }],
        "playerStates": [{
            "stack": 1000,
            "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
            "cards": ["Td", "7s"],
            "actions": []
          },
          {
            "stack": 5000,
            "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
            "actions": [],
            "cards": ["9s", "4d"]
          },
          {
            "stack": 1000,
            "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
            "cards": ["5d", "6s"],
            "actions": []
          },
          {
            "stack": 11000,
            "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
            "cards": ["Tc", "6d"],
            "actions": []
          },
          {
            "stack": 1000,
            "uid": "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
            "cards": ["Qd", "9h"],
            "actions": []
          }
        ]
      };

      const gameState = {
        increment: 1,
        type: "tournament",
        prng: "mulberry32",
        buyIn: 20,
        hostedMedia: "mediasoup",
        mediasoupHost: "n0.media.pokerinplace.app",
        organizerId: "Pm2AMPmJtXaciNSBKSQiXx99a2r2",
        stage: "active",
        name: "Tournament Table #4",
        timestamp: 1596771575457,
        id: "DDvUZbYaqxxuPu8iNEmL",
        currentBigBlind: 20000,
        activeHandId: "1596772086588",
        players: {
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_9: {
            stack: 1000,
            role: "player",
            active: true,
            photoURL: "/avatars/17.jpg",
            name: "9",
            position: 5,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_9",
            email: "nick@pokerinplace.app",
            contributed: 20,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_19: {
            stack: 1000,
            role: "player",
            active: true,
            photoURL: "/avatars/3.jpg",
            name: "19",
            position: 6,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_19",
            email: "nick@pokerinplace.app",
            contributed: 20,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_25: {
            stack: 1000,
            role: "player",
            active: true,
            photoURL: "/avatars/23.jpg",
            name: "25",
            position: 4,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_25",
            email: "nick@pokerinplace.app",
            contributed: 20,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_7: {
            role: "player",
            photoURL: "/avatars/18.jpg",
            name: "7",
            position: 1,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_7",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            active: false,
            removed: true,
            bustedTimestamp: 1596771612805,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_21: {
            role: "player",
            photoURL: "/avatars/13.jpg",
            name: "21",
            position: 8,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_21",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            active: false,
            removed: true,
            bustedTimestamp: 1596771740893,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_28: {
            role: "player",
            photoURL: "/avatars/8.jpg",
            name: "28",
            position: 0,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_28",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            active: false,
            removed: true,
            bustedTimestamp: 1596771771479,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_26: {
            role: "player",
            photoURL: "/avatars/20.jpg",
            name: "26",
            position: 2,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_26",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            active: false,
            removed: true,
            bustedTimestamp: 1596771857920,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_8: {
            role: "player",
            photoURL: "/avatars/7.jpg",
            name: "8",
            position: 9,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_8",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            active: false,
            removed: true,
            bustedTimestamp: 1596771920938,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_13: {
            role: "player",
            photoURL: "/avatars/1.jpg",
            name: "13",
            position: 10,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_13",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            active: false,
            removed: true,
            bustedTimestamp: 1596771961484,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_2: {
            role: "player",
            photoURL: "/avatars/23.jpg",
            name: "2",
            position: 12,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_2",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            active: false,
            removed: true,
            bustedTimestamp: 1596772056019,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_6: {
            role: "player",
            photoURL: "/avatars/15.jpg",
            name: "6",
            position: 11,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_6",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 0,
            active: false,
            removed: true,
            bustedTimestamp: 1596772086558,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_24: {
            role: "player",
            active: true,
            photoURL: "/avatars/2.jpg",
            name: "24",
            position: 3,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_24",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 5000,
          },
          Pm2AMPmJtXaciNSBKSQiXx99a2r2_3: {
            role: "player",
            active: true,
            photoURL: "/avatars/20.jpg",
            name: "3",
            position: 7,
            id: "Pm2AMPmJtXaciNSBKSQiXx99a2r2_3",
            email: "nick@pokerinplace.app",
            contributed: 20,
            stack: 11000,
          },
        },
        hands: [hand],
      };

      const action = getForcedAction(gameState);
      const x = calculateHandWinners(gameState, hand);
      console.log(action, x);
    });
  });
});