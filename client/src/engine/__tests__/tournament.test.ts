import {
  pauseTournament, resumeTournament,
} from "../tournament";
import {
  ITournamentDetails, TournamentStatus,
} from "../types";

import { finishHandOnTournamentTable, createTournament } from "./testHelpers";

describe("Tournament", () => {
  describe("Pause & Resume", () => {
    const TOURNAMENT_START = new Date(1466424490000);
    const PAUSE_START = new Date(1466424500000);
    const PAUSE_RESUME = new Date(1466424600000);
    let tournament: ITournamentDetails;
    let spyCurrentDate = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => TOURNAMENT_START as unknown as string);

    beforeAll(() => {
      tournament = {
        ...createTournament({ name: "Single Table", playerCount: 8, tableCount: 1 }),
        enablePerformantRebalances: true,
      };

      delete tournament.activeRoundId;

      tournament = finishHandOnTournamentTable({ tournament, tableIndex: 0, payoutPlayerIndex: 0 })
    })

    it("Should have active round timestamp set", () => {
      expect(tournament.rounds[0].timestamp).toEqual(TOURNAMENT_START.getTime());
    });

    describe("pauseTournament", () => {
      it("Should immediately set tournament state to PauseRequested", () => {
        expect(tournament.pauseStartTimestamp).toBeUndefined();

        const { tournamentUpdates } = pauseTournament(tournament, "Tournament is paused");

        tournament = tournamentUpdates.tournament;

        expect(tournament.pauseStartTimestamp).toBeUndefined();
        expect(tournament.status).toEqual(TournamentStatus.PauseRequested);
      });

      it("Should set tournament state to Paused after all hands have been finished", () => {
        spyCurrentDate.mockRestore();
        spyCurrentDate = jest
          .spyOn(global, 'Date')
          .mockImplementation(() => PAUSE_START as unknown as string);

        tournament = finishHandOnTournamentTable({ tournament, tableIndex: 0, payoutPlayerIndex: 0 })

        expect(tournament.pauseStartTimestamp).toEqual(PAUSE_START.getTime());
        expect(tournament.status).toEqual(TournamentStatus.Paused);
      });
    });

    describe("resumeTournament", () => {
      it("Should have active round", () => {
        expect(tournament.activeRoundId).toEqual(0);
        expect(tournament.rounds[0].timestamp).toEqual(TOURNAMENT_START.getTime());
      });

      it("Should resume & update active round timestamp with ACTUAL pause duration taken into account", () => {
        expect(tournament.pauseDuration).toEqual(Number.MAX_SAFE_INTEGER);
        const actualPauseDuration = PAUSE_RESUME.getTime() - PAUSE_START.getTime();
        spyCurrentDate.mockRestore();
        spyCurrentDate = jest
          .spyOn(global, 'Date')
          .mockImplementation(() => PAUSE_RESUME as unknown as string);

        const { tournamentUpdates } = resumeTournament(tournament);

        tournament = tournamentUpdates.tournament;

        expect(tournament.rounds[0].timestamp).toEqual(TOURNAMENT_START.getTime() + actualPauseDuration);
        expect(tournament.pauseDuration).toEqual(0);
        expect(tournament.pauseStartTimestamp).toEqual(null);
        expect(tournament.status).toEqual(TournamentStatus.Active);
      });
    });

    afterAll(() => {
      spyCurrentDate.mockRestore();
    })
  })
});