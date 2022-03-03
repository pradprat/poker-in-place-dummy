import express from "express";
import { TournamentStatus } from '../../engine/types';

import { AuthenticatedRequest } from '../lib';
import { acquireLockAndExecute, cache, FirebaseTypedDoc } from '../utils';
import { GetTournamentFunction, IServerGame, lockTournamentAndRun, handleSnapshotTournament } from './lib';

const killActiveHands = async (
  { tournamentId, tables }: { tournamentId: string, tables: FirebaseTypedDoc<IServerGame>[] }
): Promise<void> => {
  for (const table of tables) {
    const tableLockName = `tournament.${tournamentId}.table.${table.id}`;
    await acquireLockAndExecute(
      tableLockName,
      async () => {
        await table.update({ activeHandId: null });
      },
      "reset"
    );
  }
}

export async function resetTournament(
  request: AuthenticatedRequest,
  response: express.Response,
  { getTournament }: { getTournament: GetTournamentFunction }
) {
  const { tournamentId } = JSON.parse(request.body);
  await handleSnapshotTournament(
    tournamentId,
    "Resetting tournament",
    getTournament
  );
  await lockTournamentAndRun(tournamentId, null, async () => {
    // 1. Pause the tournament
    // 2. Kill active hands
    // 3. Restart the tournament
    cache.flush();
    const { tournament, tables } = await getTournament(tournamentId, {
      includeTables: true,
    });
    const tournamentData = tournament.data();

    if (![TournamentStatus.Active, TournamentStatus.PauseRequested, TournamentStatus.Paused].includes(tournamentData.status)) {
      return response.json({ error: "Tournament not active" });
    }

    await tournament.update({ status: TournamentStatus.Paused });
    await killActiveHands({ tournamentId, tables: tables.docs });
    await tournament.update({ status: TournamentStatus.Active });

    cache.flush();

    return response.json({
      reset: true,
    });
  });
}