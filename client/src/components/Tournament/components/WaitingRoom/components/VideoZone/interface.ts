import { ITournamentDetails } from "../../../../../../engine/types";

export interface IVideoZoneProps {
  tournament: ITournamentDetails;
  isOrganizer: boolean;
  shouldPauseVideo: boolean;
}