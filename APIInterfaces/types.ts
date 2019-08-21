import { ShortMove } from 'chess.js';

export interface ClientMove extends ShortMove {
  colour: string;
}


export interface GameConfig {
  colour: string;
}

export interface RoomDetails {
  roomId: string;
  hostUsername: string;
}

export interface User {
  username: string;
  userId: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface SessionDetails extends UserLogin {
  username: string;
  userId: string;
  expireTime: number;
}

export interface Challenge {
  challengerId: string;
  receiverId: string;
}
