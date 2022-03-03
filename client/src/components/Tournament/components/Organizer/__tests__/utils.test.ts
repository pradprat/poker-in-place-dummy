
import { GameStage } from "../../../../../engine/types";
import { getFilteredTableIds, isTableActive } from "../utils";

import { generatePlayers, generateStandardTables, generateStandardTable } from "./testHelpers";

describe("utils.ts", () => {
  describe("getFilteredTableIds", () => {
    it("finds tables by query", () => {
      const tables = generateStandardTables();

      expect(getFilteredTableIds({ tables, query: "table-01" })).toEqual(new Set(["id-1"]))
    });

    it("may have empty result", () => {
      const tables = generateStandardTables();

      expect(getFilteredTableIds({ tables, query: "table-03" })).toEqual(new Set([]))
    });

    it("finds tables by player name", () => {
      const tables = generateStandardTables();

      expect(getFilteredTableIds({ tables, query: "Dummy Player" })).toEqual(new Set(["id-1", "id-2"]))
    });

    it("finds table by full player name", () => {
      const tables = [{
        id: "id-1",
        name: "table-01",
        stage: GameStage.Active,
        players: generatePlayers(4),
      }, {
        id: "id-2",
        name: "table-02",
        stage: GameStage.Active,
        players: generatePlayers(3),
      }];

      expect(getFilteredTableIds({ tables, query: "Dummy Player 3" })).toEqual(new Set(["id-1"]))
    });

    it("returns all tables with empty query", () => {
      const tables = generateStandardTables();

      expect(getFilteredTableIds({ tables, query: "" })).toEqual(new Set(["id-1", "id-2"]))
    });
  });

  describe("isTableActive", () => {
    it("returns true if GameStage is Active and there are players", () => {
      const table = generateStandardTable(1);

      expect(isTableActive(table, false)).toBeTruthy();
    });

    it("returns true if GameStage is Paused and there are players", () => {
      const table = generateStandardTable(1, GameStage.Paused);
      expect(isTableActive(table, false)).toBeTruthy();
    });

    it("returns false if GameStage is Ended and there are players", () => {
      const table = generateStandardTable(1, GameStage.Ended);

      expect(isTableActive(table, false)).toBeFalsy();
    });

    it("returns false if there are no players", () => {
      const table = {
        id: "id-1",
        name: "table-01",
        stage: GameStage.Paused,
        players: generatePlayers(3, true),
      }

      expect(isTableActive(table, true)).toBeFalsy();
    });

    it("returns true if tournament is ended and there are players", () => {
      const table = generateStandardTable(1, GameStage.Active);

      expect(isTableActive(table, true)).toBeTruthy();
    });
  });
});