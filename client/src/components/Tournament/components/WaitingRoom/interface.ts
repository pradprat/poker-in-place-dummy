import { ITournamentDetails } from "../../../../engine/types";

export interface IWaitingRoomProps {
  tournament: ITournamentDetails;
  currentUserId: string;
  onActionClicked?: { (): void };
  actionMessage: string;
  waitingMessage?: string;
  showCopyLink?: boolean;
  isOrganizer?: boolean;
  timestamp?: number;
  onSelectTable: { (tableId: string, isActive: boolean): Promise<void> };
  isWelcomeMessageDialogOpened?: boolean;
  shouldRenderActionBtn?: boolean;
}