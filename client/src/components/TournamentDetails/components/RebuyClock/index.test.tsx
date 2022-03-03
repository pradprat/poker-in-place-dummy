/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { createTournament, finishHandOnTournamentTable } from "../../../../engine/__tests__/testHelpers";
import { ITournamentDetails } from "../../../../engine/types";

import RebuyClock from ".";

describe("RebuyClock component", () => {
  const TOURNAMENT_START = 1466424490000;
  const CURRENT_TIME = TOURNAMENT_START;

  let tournament: ITournamentDetails;

  let spyCurrentDate = jest.spyOn(Date.prototype, "getTime").mockReturnValue(CURRENT_TIME);
  let dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => CURRENT_TIME);

  beforeAll(() => {
    jest.useFakeTimers();

    tournament = {
      ...createTournament({ name: "Single Table", playerCount: 8, tableCount: 1 }),
      rebuysThroughRound: 3,
      startTime: TOURNAMENT_START
    };

    delete tournament.activeRoundId;

    tournament = finishHandOnTournamentTable({ tournament, tableIndex: 0, payoutPlayerIndex: 0 });
  });

  it("should render", async () => {
    await act(async () => {
      const { getByText } = render(<RebuyClock tournament={tournament} />);

      jest.advanceTimersByTime(250);

      await waitFor(() => {
        expect(getByText("Rebuy is available for:")).toBeTruthy();
      });
    });
  });

  it("should work with one round", async () => {
    await act(async () => {
      const testTournament = {
        ...tournament,
        rebuysThroughRound: 0,
        startTime: TOURNAMENT_START
      };
      const { getByText } = render(<RebuyClock tournament={testTournament} />);

      jest.advanceTimersByTime(250);

      await waitFor(() => {
        expect(getByText("Rebuy is available for:")).toBeTruthy();
      });
    });
  });

  it("on the tournament start rebuy clock should be set", async () => {
    await act(async () => {
      const { getByText } = render(<RebuyClock tournament={tournament} />);

      jest.advanceTimersByTime(250);

      await waitFor(() => {
        expect(getByText("16:00")).toBeTruthy();
      });
    });
  });

  it("rebuy clock should update on time change", async () => {
    await act(async () => {
      const NEW_TIME = CURRENT_TIME + tournament.roundInterval * 60 * 1000;
      spyCurrentDate = jest.spyOn(Date.prototype, "getTime").mockReturnValue(NEW_TIME);
      dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => NEW_TIME);

      const { getByText } = render(<RebuyClock tournament={tournament} />);

      jest.advanceTimersByTime(250);

      await waitFor(() => {
        expect(getByText("12:00")).toBeTruthy();
      });
    });
  });

  it("rebuy clock should not on pause change", async () => {
    await act(async () => {
      const PAUSE_START = CURRENT_TIME + tournament.roundInterval * 60 * 1000;
      const NEW_TIME = PAUSE_START + 1000;

      tournament.pauseStartTimestamp = PAUSE_START;

      spyCurrentDate = jest.spyOn(Date.prototype, "getTime").mockReturnValue(NEW_TIME);
      dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => NEW_TIME);

      const { getByText } = render(<RebuyClock tournament={tournament} />);

      jest.advanceTimersByTime(250);

      await waitFor(() => {
        expect(getByText("12:00")).toBeTruthy();
      });
    });
  });

  it("not render when time is elapsed", async () => {
    await act(async () => {
      const NEW_TIME = CURRENT_TIME + tournament.roundInterval * 60 * 1000 * (tournament.rebuysThroughRound + 1);

      tournament.pauseStartTimestamp = null;

      spyCurrentDate = jest.spyOn(Date.prototype, "getTime").mockReturnValue(NEW_TIME);
      dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => NEW_TIME);

      const { getByText } = render(<RebuyClock tournament={tournament} />);

      jest.advanceTimersByTime(250);

      await waitFor(() => {
        expect(getByText("Rebuy time ended")).toBeTruthy();
      });
    });
  });

  afterAll(() => {
    spyCurrentDate.mockRestore();
    dateNowSpy.mockRestore();
    jest.useRealTimers();
  });
});
