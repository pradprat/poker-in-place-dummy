import { getMockReq, getMockRes } from "@jest-mock/express";

import { resetTournament } from "../resetTournament";
import tournament from "../__mocks__/tournament.single-table";
import { GetTournamentFunction, IServerTournamentDetails } from "../lib";
import { FirebaseTypedDoc } from "../../utils";
import { IServerGame } from '../../lib';
import * as lib from '../lib';
import * as utils from '../../utils';
import { TournamentStatus } from "../../../engine/types";

const { res } = getMockRes();

describe("resetTournament", () => {
  const tournamentUpdateMockFn = jest.fn();
  const tableUpdateMockFn = jest.fn();

  const mockTournament = {
    data() {
      return tournament;
    },
    update: tournamentUpdateMockFn,
  } as unknown as FirebaseTypedDoc<IServerTournamentDetails>;

  const mockTables = {
    docs: tournament.tables.map(table => ({
      data() {
        return table;
      },
      update: tableUpdateMockFn,
    })) as unknown as FirebaseTypedDoc<IServerGame>[]
  };

  const getTournament: GetTournamentFunction = () => {
    return Promise.resolve({
      tournament: mockTournament,
      tables: mockTables
    })
  }

  beforeAll(() => {
    jest.spyOn(lib, "lockTournamentAndRun").mockImplementation(async (a, b, lambda) => await lambda());
    jest.spyOn(lib, "handleSnapshotTournament").mockImplementation(() => Promise.resolve());
    jest.spyOn(utils, "acquireLockAndExecute").mockImplementation(async (a, lambda) => await lambda());
  });

  it("pauses tournament, kills hands and unpauses tournament", async () => {
    const req = getMockReq({
      body: JSON.stringify({ tournamentId: 'mockTournamentId' }),
    });

    await resetTournament(req, res, { getTournament });

    expect(tournamentUpdateMockFn.mock.calls.length).toBe(2);
    expect(tournamentUpdateMockFn.mock.calls[0][0]).toEqual({ status: TournamentStatus.Paused });

    expect(tableUpdateMockFn.mock.calls.length).toBe(tournament.tables.length);
    expect(tableUpdateMockFn.mock.calls[0][0]).toEqual({ activeHandId: null });

    expect(tournamentUpdateMockFn.mock.calls[1][0]).toEqual({ status: TournamentStatus.Active });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        reset: true,
      }),
    )
  });
});