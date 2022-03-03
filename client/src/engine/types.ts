import firebase from "firebase";
export enum IPocketPosition {
  Top = "top",
  Bottom = "bottom",
  Left = "left",
  Right = "right",
  TopLeft = "top_left",
  TopRight = "top_right",
  BottomLeft = "bottom_left",
  BottomRight = "bottom_right",
}

export enum ShowCards {
  First = "First",
  Second = "Second",
  Both = "Both",
}

export interface IRebuy {
  amount: number;
  timestamp: number;
  type?: string;
  stack?: number;
  round?: number;
}

export enum PlayerRole {
  Player = "player",
  Organizer = "organizer",
  Featured = "featured",
  Observer = "observer",
}

export interface IPlayer {
  id: any;
  position: number | null;
  name: string;
  email: string;
  photoURL: string;
  stack: number;
  contributed: number;
  active: boolean;
  removed?: boolean;
  away?: boolean;
  rebuyDeclined?: boolean;
  willRemove?: boolean;
  rebuys: IRebuy[];
  paymentId?: string | null;
  paymentSessionId?: string | null;
  bustedTimestamp?: number;
  role?: PlayerRole;
}

export interface ITournamentPlayer extends IPlayer {
  tableId?: string;
  created?: number;
  code?: string;
  arrived?: boolean;
  welcomeMessageUrl?: string;
}
export interface ITournamentRegistration {
  secret: string;
  name: string;
  email: string;
  code: string;
  stack?: number;
  created: number;
  enrolled: boolean;
  joined: boolean;
  venmo?: string;
  paypal?: string;
  phone?: string;
  suggestedTableIdentifier?: string;
  image?: string;
  timestamp?: number;
}

export enum HandRound {
  PreDeal = "pre-deal",
  PreFlop = "pre-flop",
  Flop = "flop",
  Turn = "turn",
  River = "river",
}

export enum GameDirective {
  NextToAct = "next-to-act",
  NextRound = "next-round",
  NextHand = "next-hand",
  HandPayout = "hand-payout",
  ShortHandPayout = "short-hand-payout",
  RebuyOption = "rebuy-option",
  EliminatePlayer = "eliminate-player",
  End = "end",
}

export enum GameType {
  Cash = "cash",
  Tournament = "tournament",
  MultiTableTournament = "multi-table-tournament",
}

export enum GameMode {
  // Free = "free",
  Premium_4_60 = "premium-4-60",
  Premium_4_120 = "premium-4-120",
  Premium_4_180 = "premium-4-180",
  Premium_8_60 = "premium-8-60",
  Premium_8_120 = "premium-8-120",
  Premium_8_180 = "premium-8-180",
  Premium_8_1440 = "premium-8-1440",
  Premium_12_180 = "premium-12-180",
  // NoVideo_8_180 = "novideo-8-180",
  Multi_Table_Tournament = "multi-table-tournament",
  // Poker 501 customer
  Poker501_8_45 = "poker501-8-45",
  Poker501_8_180 = "poker501-8-180",
}

export enum GameStage {
  Initialized = "initialized",
  Waiting = "waiting",
  Active = "active",
  Paused = "paused",
  Ended = "ended",
}

export enum ActionDirective {
  Call = "call",
  Check = "check",
  Fold = "fold",
  Raise = "raise",
  AllIn = "all-in",
  Bet = "bet",
}

export enum PayType {
  UpFront = "up-front",
  PerPlayer = "per-player",
}

export interface IAction {
  uid: string;
  action: ActionDirective;
  total: number;
  raise: number;
  contribution: number;
  voluntary: boolean;
  allIn: boolean;
  conforming: boolean;
  timestamp?: number;
  forced?: boolean;
}

export interface IRound {
  type: HandRound;
  actions: IAction[];
  cards: string[];
  active: boolean;
  firstToActOffset: number;
  timestamp: number;
}

export interface IPlayerState {
  uid: string;
  actions: IAction[];
  cards: string[];
  stack: number;
}

export interface IPayout {
  uid: string;
  amount: number;
  total: number;
  cards: string[];
  handCards: string[];
  handDescription: string;
  soleWinner?: boolean;
}

export interface IShownCards {
  uid: string;
  cards: string[];
}

export interface IHand {
  id: string;
  activeDeckId: string;
  cardsDealt: number;
  smallBlind: number;
  bigBlind: number;
  activeRound: HandRound;
  rounds: IRound[];
  playerStates: Array<IPlayerState>;
  payouts: IPayout[];
  shownCards?: IShownCards[];
  payoutsApplied: boolean;
  dealerId: string;
  smallBlindId: string;
  bigBlindId: string;
  actingPlayerId: string | null;
  playerIds: string[];
  payoutsEndTimestamp?: number;
  __collections__?: any;
  [key: string]: any;
}

export interface IMessage {
  uid: string;
  username: string;
  type: string;
  message: string;
  timestamp: number;
  data: any;
}

export interface IWinnerPercent {
  rank: number;
  percent: number;
}

export interface IBlindRound {
  id: number;
  roundIndex: number;
  bigBlind: number;
  timestamp?: number;
}

export enum TournamentDirective {
  AssignTables = "assign-tables",
  BalanceTables = "balance-tables",
  RequestPause = "request-pause",
  AdvanceRound = "advance-round",
  Pause = "pause",
  ForceResume = "force-resume",
  Resume = "resume",
  EliminatePlayer = "eliminate-player",
  RemovePlayer = "remove-player",
  AddPlayer = "add-player",
  EliminateTable = "eliminate-table",
}

export interface ITournmanentPlayerAction {
  playerId: string;
  tableId: string;
  player?: IPlayer;
}

export interface ITournmanentTableAction {
  tableId: string;
}

export interface ITournmanentPauseAction {
  duration: number;
  message: string;
  reason: TournamentPauseReason;
  additionalParams?: { [key: string]: any };
}

export interface ITournamentRoundAction {
  blindRoundId: number;
}

export interface ITournamentRoundPauseAction extends ITournmanentPauseAction {
  blindRoundId: number;
}

export interface ITournamentAction {
  directive: TournamentDirective;
  data?:
  | ITournamentRoundAction
  | ITournamentRoundPauseAction
  | ITournmanentPlayerAction
  | ITournmanentTableAction
  | ITournmanentPauseAction;
}

export enum TournamentStatus {
  Initialized = "initialized",
  AssigningTables = "assigning-tables",
  Active = "active",
  PauseRequested = "pause-requested",
  Paused = "paused",
  Ended = "ended",
  Finalized = "finalized",
}

export enum TournamentPauseReason {
  TopUps = "top-ups",
  RoundAdvance = "round-advance",
  TableBalancing = "table-balancing",
  Administrative = "administrative",
  TournamentEnded = "tournament-ended",
}

export enum TournamentRegistrationMode {
  Open = "open",
  Code = "code",
}

export interface IGameSnapshot {
  id: string;
  activeHandId?: string;
  stage: GameStage;
  name: string;
}

export interface IRebuyOptions {
  stack25: {
    value: null | number;
    active: boolean;
    stack: null | number;
  };
  stack50: {
    value: null | number;
    active: boolean;
    stack: null | number;
  };
  stack100: {
    value: null | number;
    active: boolean;
    stack: null | number;
  };
}

export type BrandingType = {
  tableImageUrl?: string;
  registrationImageUrl?: string;
  leftTableImageUrl?: string;
  rightTableImageUrl?: string;
  tournamentImageUrl?: string;
  customTableLogos?: string[];
  playerListUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
  vimeoVideoUrl?: string;
  hasVimeoEnabled?: boolean;
  welcomeVideoUrl?: string;
  isWelcomeVideoLoaded?: boolean;
};

export interface ITournamentDetails {
  id?: string;
  name?: string;
  pauseDuration?: number;
  pauseEndTimestamp?: number;
  pauseStartTimestamp?: number;
  pauseMessage?: string;
  pauseReason?: TournamentPauseReason;

  upcomingRoundId?: number;
  activeRoundId?: number;
  rounds: IBlindRound[];
  roundInterval: number;
  startingStack: number;
  winners: IWinnerPercent[];
  rebuysThroughRound: number;

  pauseForRoundChange: number;
  pauseForTopUp: number;
  pauseForRebuy: number;

  topUpAmount: number;

  tableIds_dep?: IGameSnapshot[];
  tableIdentifiers?: { [key: string]: IGameSnapshot };
  tables?: IGame[];
  players: { [key: string]: ITournamentPlayer };
  status: TournamentStatus;
  organizerId?: string;
  buyIn: number;
  paymentId?: string;
  paymentSessionId?: string;

  branding?: BrandingType;

  type: GameType;
  mode?: GameMode;
  registrationMode?: TournamentRegistrationMode;
  registrationsCount?: number;

  startTime?: number;
  finalizeTime?: number;
  startPauseMessage?: string;

  externalVideoConferencingLink?: string;

  // Timings
  startTimerInSeconds?: number;
  rebuyTimeInSeconds?: number;
  roundBreakFinalRebuyTimeInSeconds?: number;
  eliminationHangTimeInSeconds?: number;
  timeoutInSeconds?: number;
  lateRegistrationTimeInMinutes?: number;
  minTableSizeBeforeRebalance?: number;

  rebuyOptions?: IRebuyOptions;

  // API server hosting
  apiServerHost?: string;

  // Overflow rooms
  enableOverflowRooms?: boolean;
  allowGuestsInOverflowRooms?: boolean;
  overflowRoomUrl?: string;

  // Better rebalances
  enablePerformantRebalances?: boolean;
  enablePlayerWelcomeVideos?: boolean;
  enableAutomation?: boolean;
}

export interface IGameStats {
  id: string;
  activeHandId?: string;
  stage: GameStage;
  name: string;
  handCount: number;
  handDuration: number;
  handAmount: number;
  winners: { [key: string]: { amount: number; count: number } };
}

export interface IBranding {
  tableImageUrl?: string;
  registrationImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
}

export interface IGameFeatures {
  autoFlipEnabled?: boolean;
  removeOnLeave?: boolean;
  allowNonOrganizerStart?: boolean;
  startWithVideoEnabled?: boolean;
  hideCopyLink?: boolean;
  restartOnEnd?: boolean;
  disableRebuys?: boolean;
  hideDonateDialog?: boolean;
}
export interface IGame {
  id: string;
  tournamentId?: string;
  hands: IHand[];
  activeHandId?: string;
  buyIn: number;
  startingBigBlind: number;
  currentBigBlind: number;
  increment: number;
  blindDoublingInterval: number;
  players: { [key: string]: IPlayer };
  stage: GameStage;
  type: GameType;
  name: string;
  mode: GameMode;
  payType?: PayType;
  paymentId?: string;
  paymentSessionId?: string;
  timestamp?: number;
  organizerId?: string;
  // TODO - remove this
  tournamentDetails?: ITournamentDetails;
  prng?: string;
  branding?: IBranding;
  features?: IGameFeatures;
  apiServerHost?: string;
  // For pausing
  pauseMessage?: string;
}

export interface IUserDetails {
  customerId?: string;
  subscription?: string;
  subscriptionType?: SubscriptionType;
  product?: string;
  venmoHandle?: string;
  paypalHandle?: string;
  phone?: string;
  email?: string;
  features?: { [key: string]: any; MULTI_TABLE?: boolean, AUTOMATION_TESTING?: boolean };
  tournamentTableImageUrl?: string;
}

export enum SubscriptionType {
  Unlimited = "unlimited",
  Weekly = "weekly",
}

export type IJwtUser = {
  name: undefined;
  uid: string;
  email: string;
  picture: string;
};

export type ILoggedInUser =
  | firebase.User
  | {
    displayName: undefined;
    photoURL: undefined;
    passcode?: string;
    email?: string;
    uid: string;
    getIdToken: (forceRefresh?: boolean) => Promise<string>;
  };

export type HandSnapshotCallback = { (hand: IHand): void };
export interface IHandWatcher {
  onSnapshot: { (callback: HandSnapshotCallback): { (): void } };
}

export type PlayerStateSnapshotCallback = { (playerState: IPlayerState): void };
export interface IPlayerStateWatcher {
  onSnapshot: { (callback: PlayerStateSnapshotCallback): { (): void } };
}

export type IWatchPlayerState = {
  (
    tableId: string,
    activeHandId: string,
    playerId: string
  ): IPlayerStateWatcher;
};
export type IWatchHand = {
  (tableId: string, activeHandId: string): IHandWatcher;
};

export interface ICode {
  redeemedBy?: string;
  redeemedAt?: string;
}
