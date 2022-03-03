import { ITournamentDetails, IAction } from "../../../../../../engine/types";

export interface ITableProps {
  tournament: ITournamentDetails;
  id: string;
  onAdvanceHand?: { (action?: IAction, uid?: string, tableId?: string): Promise<void> };
  isAutomatedTable?: boolean;
}