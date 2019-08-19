import { ShortMove } from 'chess.js';

export interface ClientMove extends ShortMove {
  colour: string;
}

export interface GameConfig {
  colour: string;
}

export interface RoomDetails {
  room_id: string;
  host_username: string;
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
