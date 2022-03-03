import { useEffect, useState } from "react";

import { IGame, ITournamentDetails, ITournamentPlayer, TournamentStatus } from "../../../engine/types";

interface IShouldShowFinishedDialogParams {
  currentPlayer?: ITournamentPlayer,
  table?: IGame,
  tournament?: ITournamentDetails
}

export default function useShouldShowFinishedDialog({ currentPlayer, tournament, table }: IShouldShowFinishedDialogParams): boolean {
  const [shouldShowFinishedDialog, setShouldShowFinishedDialog] = useState(false);

  useEffect(() => {
    const isTournamentEnded = tournament?.status === TournamentStatus.Ended;
    const isOnTable = table?.id;
    const showFinishedDialog = (currentPlayer?.bustedTimestamp || isTournamentEnded)
      && !shouldShowFinishedDialog
      && isOnTable;

    if (showFinishedDialog) {
      setShouldShowFinishedDialog(true);
    }
  }, [currentPlayer?.bustedTimestamp, tournament?.status, table?.id]);

  return shouldShowFinishedDialog;
}
