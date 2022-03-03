import {
  IAction,
  ITournamentDetails,
} from "../../../../../../engine/types";
import { ITableInfo } from "../../interface";

export interface IDebugTournamentProps {
  tournament: ITournamentDetails;
  tables: ITableInfo[];
  onAdvanceHand: { (action: IAction | null, uid: string): Promise<void> };
}
