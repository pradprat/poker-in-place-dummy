import { ITournamentDetails } from "../../../../engine/types";
import getRankedPlayers from "../../../../utils/getRankedPlayers";

const getPlayerPosition = (tournament: ITournamentDetails, currentPlayerId: string): number => {
  const filteredPlayers = Object
    .values(tournament.players)
    .filter(({ bustedTimestamp, removed }) => bustedTimestamp || !removed);

  const playerIndexInRanks = getRankedPlayers({ players: filteredPlayers, tournament }).findIndex(({ id }) => id === currentPlayerId);

  return playerIndexInRanks > -1 ? playerIndexInRanks + 1 : null;
};

export default getPlayerPosition;