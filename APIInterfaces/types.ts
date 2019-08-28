import { ShortMove } from 'chess.js';
import { ExecFileOptionsWithOtherEncoding } from 'child_process';

export interface ClientMove extends ShortMove {
  colour: string;
}


export type Colour = 'b' | 'w';

export interface User {
  username: string;
  id: string;
}

export interface AuthPayload {
  user: User;
  idToken: string;
  expiresIn: string;
}

export interface LobbyMemberDetails extends User {
  inGame: null|string;
  username: string;
  id: string;
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
export interface ClientChallenge {
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
