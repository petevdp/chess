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

export interface UserDetails {
  username: string;
  password: string;
}
