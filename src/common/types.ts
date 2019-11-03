import { ChessInstance, Move } from 'chess.js'

import { ChessEngineName } from '../bots/engines'

export interface Details {
  id: string;
}

export type UserType = 'bot' | 'human';

export interface UserDetails extends Details {
  username: string;
  type: UserType;
}

export interface EngineOptions {
  delay?: number | [number, number];
}

export interface BotDetails extends UserDetails {
  engineName: ChessEngineName;
  engineOptions: EngineOptions;
}

export interface UserDetailsPartial {
  username?: string;
  id?: string;
}

export interface SessionDetails extends UserDetails {
  idToken: string;
}

export type Colour = 'b' | 'w';

export type DrawReason =
  'in_stalemate'
  | 'in_threefold_repetition'
  | '50_move_rule'
  | 'insufficient_material';

export const DRAW_REASONS: Array<keyof ChessInstance> = [
  'in_stalemate',
  'in_threefold_repetition',
  'insufficient_material'
]

export type EndReason =
  'checkmate'
  | 'stalemate'
  | 'resign'
  | 'clientDisconnect'
  | 'serverStoppedGame'
  | DrawReason;

export const END_REASONS: EndReason[] = [
  ...DRAW_REASONS as DrawReason[],
  'checkmate',
  'resign',
  'clientDisconnect',
  'serverStoppedGame'
]

export interface EndState {
  winnerId: string | null;
  reason: EndReason;
}

export type GameDisplayAddition = GameInfo

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface LobbyMemberDetails extends UserDetails {
  currentGame: string | null;
  leftLobby: boolean;
  elo: number;
  gameHistory: CompletedGameInfo[];
}

export type LobbyMemberDetailsUpdate = [string, LobbyMemberDetails|null]

export type ActionType = 'move' | 'resign' | 'disconnect' | 'offerDraw';

export type GameUpdateType = 'move' | 'end' | 'offerDraw';

export interface GameUpdate {
  type: GameUpdateType;
  move?: Move;
  end?: EndState;
}

export interface GameUpdateWithId extends GameUpdate {
  id: string;
}

export interface ClientAction {
  type: ActionType;
  move?: Move;
}

export interface GameSpecificMove extends Move {
  id: string;
}

export interface ClientPlayerAction extends ClientAction {
  gameId: string;
}

export interface AuthPayload {
  user: UserDetails;
  idToken: string;
  expiresIn: string;
}

export interface PlayerDetails {
  user: UserDetails;
  colour: Colour;
}
export interface GameIdentifiers {
  id: string;
  playerDetails: [PlayerDetails, PlayerDetails];
}

export interface GameInfo extends GameIdentifiers {
  pgn: string;
  end?: EndState;
}
export interface CompletedGameInfo extends GameIdentifiers {
  pgn: string;
  end: EndState;
}
export interface UserLogin {
  username: string;
  password: string;
  userType: UserType;
}
export interface ChallengeDetails {
  id: string;
  challengerId: string;
  receiverId: string;
}

export interface ClientLobbyState {
  members: Map<string, LobbyMemberDetails>;
}

export type SocketChannel = 'challenge' | 'lobby update';

export type ChallengeOutcome = 'accepted' | 'declined' | 'cancelled';

export interface ChallengeResolution {
  id: string;
  outcome: ChallengeOutcome;
}

export interface ChallengeResponse {
  challengeId: string;
  response: boolean;
}

export interface MemberMessage {
  memberDetailsUpdate: LobbyMemberDetailsUpdate[];
}

export interface DisplayedGameMessage {
  type: 'update' | 'add';
  add?: GameDisplayAddition[];
  update?: GameUpdateWithId;
}

export interface GameMessage {
  type: 'update' | 'join';
  update?: GameUpdateWithId;
  join?: GameInfo;
}

export interface LobbyMessage {
  member?: MemberMessage;
  displayedGame?: DisplayedGameMessage;
}

export interface SocketServerMessage {
  game?: GameMessage;
  lobby?: LobbyMessage;
}

export interface SocketClientMessage {
  gameAction?: ClientPlayerAction;
}
