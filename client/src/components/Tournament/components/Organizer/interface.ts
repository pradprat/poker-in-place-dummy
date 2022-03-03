import { TwilioError } from "twilio-video";

import {
  IAction,
  ITournamentDetails,
  ILoggedInUser,
  GameStage,
  IPlayer,
} from "../../../../engine/types";

export interface ITableInfo {
  id: string;
  name: string;
  stage: GameStage;
  players: Record<string, IPlayer>;
}

export interface ITournamentProps {
  tournament?: ITournamentDetails;
  tables?: ITableInfo[];
  activeTableId?: string;
  user: ILoggedInUser;
  setError: { (error: TwilioError): void };
  onAdvanceHand: { (action: IAction | null, uid: string): Promise<void> };
  onStart: { (): Promise<void> };
  onSelectTable: { (tableId: string, isActive: boolean): Promise<void> };
}
