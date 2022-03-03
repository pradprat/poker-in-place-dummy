import { ITournamentDetails } from "../../../../engine/types";

export interface IChatRoomProps {
  tournament: ITournamentDetails;
  currentUserId: string;
  isOrganizer: boolean;
  allowEmbeddedVideo?: boolean;
  embedded?: boolean;
}