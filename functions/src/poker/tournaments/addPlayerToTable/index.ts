import { checkCriticalActions, IFullTournamentUpdate, processActions } from "../../../engine/tournament";
import { IPlayer, ITournamentDetails, TournamentDirective } from "../../../engine/types";
import { acquireLockAndExecute } from "../../utils";
import { getTournament, processTournamentAction } from "../lib";

export const addPlayerToTable = async ({
  tournamentId, tableId, player
}: {
  tournamentId: string,
  tableId: string,
  player: IPlayer
}): Promise<any> => {
  const tournamentLockName = `tournament.${tournamentId}`;
  return acquireLockAndExecute(
    tournamentLockName,
    async () => {
      const { tournament, tables } = await getTournament(tournamentId, {
        includeTables: true,
        allowPartialTables: false,
        activeTableId: tableId,
      });

      return processTournamentAction(
        tournament,
        tables,
        tableId,
        player.id,
        async (tournament) => {
          return getTournamentUpdates({ tournament, tableId, player })
        },
        false,
        true
      );
    },
    "addPlayerToTable"
  );
};

const getTournamentUpdates = ({
  tournament, tableId, player,
}: {
  tournament: ITournamentDetails,
  tableId: string,
  player: IPlayer,
}): IFullTournamentUpdate => {
  const actions = [{
    directive: TournamentDirective.AddPlayer,
    data: {
      playerId: player.id,
      tableId: tableId,
      player,
    },
  }];

  const [updatedTournament, tableUpdates] = processActions(
    { ...tournament },
    actions
  );

  return {
    tournamentUpdates: {
      tournament: updatedTournament,
      hasCriticalActions: checkCriticalActions(
        actions,
        tournament.enablePerformantRebalances
      ),
      autoAdvanceGames: true,
      tableUpdates,
    },
  };
};
