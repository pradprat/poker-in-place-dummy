import React, { memo } from "react";

import { GameTable } from "../../../../../../Game";
import { useAppState } from "../../../../../../twilio/state";
import { IPlayerState, TournamentStatus } from "../../../../../../engine/types";
import useWatchActiveTable from "../../../../../../hooks/useWatchActiveTable";
import SystemMessage from "../../../SystemMessage";
import useSystemMessage from "../../../../hooks/useSystemMessage";

import { ITableProps } from "./interface";
import useAutomatedPlayerAction from "./hooks/useAutomationPlayerAction";
import useWatchActiveHand from "./hooks/useWatchActiveHand";
import useWatchPlayerState from "./hooks/useWatchPlayerState";

import "./styles.css";

const Table = ({
  tournament, id, onAdvanceHand, isAutomatedTable
}: ITableProps): JSX.Element => {
  const { user, userDetails } = useAppState();
  const table = useWatchActiveTable(id);
  const activeHand = useWatchActiveHand(table);
  const playerState = isAutomatedTable ? useWatchPlayerState(table, activeHand) : {} as IPlayerState;
  const systemMessage = useSystemMessage({ tournament, table });

  const isHandEnd = !activeHand?.id || activeHand?.payouts?.length > 0;
  const shouldRenderSystemMessage = isHandEnd && systemMessage && tournament?.status !== TournamentStatus.Finalized;

  useAutomatedPlayerAction({ playerState, onAdvanceHand, tableId: table?.id, isAutomatedTable });

  if (!table) {
    return;
  }

  return (<>
    <GameTable
      className="game-table"
      table={{ ...table, tournamentDetails: tournament }}
      activeHand={activeHand}
      playerState={playerState}
      onAdvanceHand={onAdvanceHand}
      user={user}
      userDetails={userDetails}
      onRebuy={async (): Promise<void> => {}}
      onTimeoutPlayer={(): void => {}}
      onSetAway={async (): Promise<void> => {}}
      onShowCards={async (): Promise<void> => {}}
      hidePlayerActions
    />
    {shouldRenderSystemMessage && (
      <SystemMessage
        message={systemMessage}
      />
    )}
  </>);
};

export default memo(Table);
