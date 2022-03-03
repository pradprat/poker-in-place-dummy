import React, { memo } from "react";

import Table from "../Table";

import { IDebugTournamentProps } from "./interface";

import "./styles.css";

const DebugTournament = ({
  tournament, tables, onAdvanceHand,
}: IDebugTournamentProps): JSX.Element => (
  <div className="debug-tournament">
    <div className="debug-tournament__tables">
      {tables.map(({ id }) => (
        <div key={id} className="debug-tournament__table">
          <Table
            isAutomatedTable
            id={id}
            tournament={tournament}
            onAdvanceHand={onAdvanceHand}
          />
        </div>
      ))}
    </div>
  </div>
)

export default memo(DebugTournament);
