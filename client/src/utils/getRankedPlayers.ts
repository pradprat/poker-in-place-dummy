import { IPlayer, ITournamentDetails, ITournamentPlayer } from "../engine/types";

interface IGetRankedPlayersParams {
  players: IPlayer[] | ITournamentPlayer[];
  tournament?: ITournamentDetails;
}

const getRankedPlayers = ({ players, tournament }: IGetRankedPlayersParams): IPlayer[] => Object.values(players)
  .sort((p1, p2) => {
    if (p2.stack !== p1.stack) {
      return p2.stack - p1.stack;
    }
    return tournament
      ? (p2.bustedTimestamp || Number.MAX_SAFE_INTEGER) - (p1.bustedTimestamp || Number.MAX_SAFE_INTEGER)
      : 0;
  });

export default getRankedPlayers;