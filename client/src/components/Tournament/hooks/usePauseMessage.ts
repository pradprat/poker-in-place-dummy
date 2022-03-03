import { ITournamentDetails, TournamentStatus } from "../../../engine/types";

interface IUsePauseMessageParams {
  tournament: ITournamentDetails;
}

export default function usePauseMessage({ tournament }: IUsePauseMessageParams): string {
  if (tournament?.status === TournamentStatus.Initialized) {
    return "Tournament waiting to start...";
  }

  if (tournament?.status === TournamentStatus.Ended) {
    return "Tournament Complete";
  }

  return null;
}
