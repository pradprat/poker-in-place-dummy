import { ITournamentDetails, ITournamentRegistration,ITournamentPlayer, IGame } from '../../../engine/types';
import { AuthenticatedRequest } from '../../lib';
import { FirebaseTypedDoc } from '../../utils';
import { GetTournamentFunction } from '../lib';

export interface IAssignPlayerToClosedTournamentParams {
  inputCode: string,
  tournamentId: string,
  tournamentDoc: FirebaseTypedDoc<ITournamentDetails>,
  tableDocs: {
    docs: FirebaseTypedDoc<IGame>[];
  },
  request: AuthenticatedRequest,
  getTournament: GetTournamentFunction
}

export interface IAssignPlayerToClosedTournamentResponse {
  error?: string;
}

export interface IProcessPlayerCodeParams {
  inputCode?: string,
  tournamentId: string,
  tournamentData: ITournamentDetails,
  request: AuthenticatedRequest,
}

export interface IProcessPlayerCodeResponse {
  error?: string,
  userWithCode?: ITournamentPlayer,
  isObserver?: boolean;
  registrationsWithCode?: FirebaseTypedDoc<ITournamentRegistration>[]
}

export interface IAssignPlayerToTournamentParams {
  isObserver: boolean,
  tournamentData: ITournamentDetails,
  tournamentDoc: FirebaseTypedDoc<ITournamentDetails>,
  request: AuthenticatedRequest,
  userWithCode: ITournamentPlayer,
}

export interface IAssignCurrentPlayerToTableParams {
  tournamentId: string,
  userId: string,
  tableDocs: {
    docs: FirebaseTypedDoc<IGame>[];
  },
  player: ITournamentPlayer
}

export interface IAssignNewPlayerToTableParams {
  player: ITournamentPlayer,
  tournamentId: string,
  tournamentData: ITournamentDetails,
  tableDocs: {
    docs: FirebaseTypedDoc<IGame>[];
  },
}

export interface IGetPlayersCountParams {
  tournamentData: ITournamentDetails,
  tableDocs: {
    docs: FirebaseTypedDoc<IGame>[];
  },
}