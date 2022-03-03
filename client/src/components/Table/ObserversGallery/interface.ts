import { ITournamentPlayer } from "../../../engine/types";

export interface IObserversGalleryProps {
  players: { [key: string]: ITournamentPlayer };
}