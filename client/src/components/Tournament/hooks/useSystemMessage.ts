import { IGame, ITournamentDetails, TournamentPauseReason } from "../../../engine/types";

interface IUseSystemMessageParams {
  tournament: ITournamentDetails;
  table?: IGame;
}

export default function useSystemMessage({ tournament, table }: IUseSystemMessageParams): string {
  if (tournament?.pauseReason && tournament.pauseReason !== TournamentPauseReason.TournamentEnded) {
    return tournament.pauseMessage || "Paused";
  }

  if (table?.pauseMessage) {
    return table.pauseMessage;
  }

  return null;
}
