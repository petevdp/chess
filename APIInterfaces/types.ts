import { ShortMove } from 'chess.js';

export interface ClientMove extends ShortMove {
  colour: string;
}


export interface GameConfig {
}

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

export interface GameDetails {
  player1Id: string;
  player2Id: string;
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
