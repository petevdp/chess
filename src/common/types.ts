import { Square } from './board';

export interface Details {
  id: string;
}
export interface ShortMove {
  from: Square;
  to: Square;
  playerId: string;
}

export interface UserDetails extends Details {
  username: string;
}

export interface UserDetailsPartial {
  username?: string;
  id?: string;
}

export interface SessionDetails extends UserDetails {
  idToken: string;
}

export type Colour = 'b' | 'w';

export type GameEndReason =
  'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'disconnected'
  | 'threefold repitition';


export interface EndState {
  winnerId: string | null;
  reason: GameEndReason;
}

export interface LobbyMemberDetails extends UserDetails {
  currentGame: string | null;
}
export interface GameUpdate {
  move?: ShortMove;
  end?: EndState;
  message?: string;
}

export interface ClientPlayerAction {
  move?: ShortMove;
  type: 'move' | 'resign' | 'disconnect' | 'offerDraw';
  playerId: string;
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
  history: unknown;
  startingPosition: unknown;
}
export interface UserLogin {
  username: string;
  password: string;
}
export interface ChallengeDetails {
  id: string;
  challengerId: string;
  receiverId: string;
}

export interface Map<T> {
  [id: string]: T;
}

export interface ClientLobbyState {
  members: Map<LobbyMemberDetails>;
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

export interface LobbyMessage {
  updateLobbyMemberDetails?: LobbyMemberDetails[];
  updateGameDetails?: GameDetails[];
  requestChallengeResponse?: ChallengeDetails;
  resolveChallenge?: ChallengeResolution;
  joinGame?: CompleteGameInfo;
}

export interface GameMessage {
  gameUpdate: GameUpdate;
  initGame: CompleteGameInfo;
}

export interface SocketServerMessage {
  game?: GameMessage;
  lobby?: LobbyMessage;
}
export interface SocketClientMessage {
  game?: ClientPlayerAction;
  challenge?: ChallengeDetails;
  challengeResponse?: ChallengeResponse;
}
