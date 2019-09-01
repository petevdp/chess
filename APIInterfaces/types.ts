import { ShortMove } from 'chess.js';
import { ExecFileOptionsWithOtherEncoding } from 'child_process';
import { Square } from './board';

export interface ShortMove {
  from: Square;
  to: Square;
  playerId: string;
}


export interface User {
  username: string;
  id: string;
}

export type Colour = 'b' | 'w';

export type GameEndReason =
  'checkmate'
  | 'stalemate'
  | 'resigned'
  | 'disconnected'
  | 'threefold repitition';


export interface EndState {
  winnerId: string|null;
  reason: GameEndReason;
}

export interface LobbyMemberDetails extends User {
  currentGame: string|null;
}
export interface GameUpdate {
  move?: ShortMove;
  end?: EndState;
  message?: 'offer draw';
  state: string;
}

export interface ClientPlayerAction {
  move?: ShortMove;
  type: 'move' | 'resign' | 'disconnect'| 'offerDraw';
  playerId: string;
}



export interface AuthPayload {
  user: User;
  idToken: string;
  expiresIn: string;
}

export interface PlayerDetails {
  user: User;
  colour: Colour;
}
export interface GameDetails {
  id: string;
  playerDetails: PlayerDetails[];
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

export interface LobbyDetails {
  members: LobbyMemberDetails[];
  games: GameDetails[];
}

export type SocketChannel = 'challenge' | 'lobby update';


export type ChallengeOutcome = 'accepted' | 'declined' | 'cancelled';

export interface ChallengeResolution {
  id: string;
  outcome: ChallengeOutcome;
}

export interface ChallengeResponse {
  id: string;
  response: boolean;
}

export interface SocketServerMessage {
  game?: GameUpdate;
  lobby?: {
    updateLobbyDetails?: LobbyDetails;
    requestChallengeResponse?: ChallengeDetails;
    resolveChallenge?: ChallengeResolution;
    joinGame?: GameDetails;
  };
}
export interface SocketClientMessage {
  game?: ClientPlayerAction;
  challenge?: ChallengeDetails;
  challengeResponse?: ChallengeResponse;
}
