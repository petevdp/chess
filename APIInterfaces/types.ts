import { ShortMove } from 'chess.js';
import { ExecFileOptionsWithOtherEncoding } from 'child_process';

export interface MoveDetails extends ShortMove {
  playerId: string;
}


export interface User {
  username: string;
  id: string;
}

export type Colour = 'b' | 'w';

export interface EndState {
  winner: string|null;
  reason: 'checkmate' | 'resigned' | 'disconnected' | 'cancelled';
}

export interface LobbyMemberDetails extends User {
  currentGame: string|null;
}
export interface GameUpdate {
  type: 'new' | 'start' | 'move' | 'end';
  new?: GameDetails;
  start?: any;
  move?: ShortMove;
  end?: EndState;
}

export interface ClientGameAction {
  move?: ShortMove;
  action: 'move' | 'resign' | 'cancel';
}
export interface AuthPayload {
  user: User;
  idToken: string;
  expiresIn: string;
}

export interface PlayerDetails {
  user: User;
  colour: string;
}
export interface GameDetails {
  id: string;
  players: PlayerDetails[];
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
