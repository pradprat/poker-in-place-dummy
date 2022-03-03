import { useEffect } from "react";

import { IPlayerState, IAction } from "../../../../../../../engine/types";
import { randomIntFromInterval, getRandomAction } from "../utils";

interface IUseAutomatedPlayerActionParams {
  playerState?: IPlayerState;
  tableId?: string;
  onAdvanceHand: { (action?: IAction, uid?: string, tableId?: string): Promise<void> };
  isAutomatedTable?: boolean;
}

const TIMEOUT_FROM = 1000;
const TIMEOUT_TO = 4000;

const useAutomatedPlayerAction = ({
  playerState, tableId, onAdvanceHand, isAutomatedTable
}: IUseAutomatedPlayerActionParams): void => {
  useEffect(() => {
    if (!isAutomatedTable) {
      return;
    }

    const timeout = setTimeout(() => {
      if (tableId && playerState) {
        onAdvanceHand(getRandomAction(playerState.actions), playerState.uid, tableId);
      }
    }, randomIntFromInterval(TIMEOUT_FROM, TIMEOUT_TO));

    return (): void => clearTimeout(timeout);
  }, [isAutomatedTable, playerState]);
}

export default useAutomatedPlayerAction;