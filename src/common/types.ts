import { ChessInstance, Move } from 'chess.js'

export interface Details {
  id: string;
}

export type UserType = 'bot' | 'human';
export interface UserDetails extends Details {
  username: string;
  type: UserType;
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

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface LobbyMemberDetails extends UserDetails {
  currentGame: string | null;
  leftLobby: boolean;
}

export type ActionType = 'move' | 'resign' | 'disconnect' | 'offerDraw';

export interface GameUpdate {
  type: 'move' | 'end' | 'offerDraw';
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
  move?: Move;
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
export interface GameDetails {
  id: string;
  playerDetails: PlayerDetails[];
}

export interface CompleteGameInfo extends GameDetails {
  history: string;
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
  memberUpdate: Array<[string, LobbyMemberDetails]>;
}

export interface GameMessage {
  type: 'update' | 'join';
  update?: GameUpdateWithId;
  // loadGamePartial?: CompleteGameInfo | CompleteGameInfo[];
  join?: CompleteGameInfo;
}

export interface SocketServerMessage {
  game?: GameMessage;
  member?: MemberMessage;
}

export interface SocketClientMessage {
  gameAction?: ClientPlayerAction;
}
