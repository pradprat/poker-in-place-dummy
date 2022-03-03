const TOURNAMENT_FINALIZE_DURATION = 10 * 60 * 1000;

export const getTournamentFinalizeTime = (): number =>
  new Date(new Date().getTime() + TOURNAMENT_FINALIZE_DURATION).getTime();
