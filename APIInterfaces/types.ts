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

export interface EndState {
  winner: string|null;
  reason:
    'checkmate'
    | 'resigned'
    | 'disconnected'
    | 'cancelled'
    | 'threefold repitition';
}

export interface LobbyMemberDetails extends User {
  currentGame: string|null;
}
export interface GameState {
  type: 'start' | 'move' | 'end';
  new?: GameDetails;
  start?: any;
  move?: ShortMove;
  end?: EndState;
}

export interface ClientPlayerAction {
  move?: ShortMove;
  type: 'move' | 'resign' | 'disconnect';
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
  state: string;
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
