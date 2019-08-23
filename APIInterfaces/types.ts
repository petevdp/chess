import { ShortMove } from 'chess.js';

export interface ClientMove extends ShortMove {
  colour: string;
}


export interface GameConfig {
}

export interface LobbymemberDetails extends User {
  inGame: null|string;
  username: string;
  userId: string;
}
export interface User {
  username: string;
  id: string;
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

export interface ClientChallenge {
  id: string;
  challengerId: string;
  receiverId: string;
}

export const SocketMessages = {
  CHALLENGE_REQUEST: 'CHALLENGE_REQUEST',
  CHALLENGE_RESPONSE: 'CHALLENGE_RESPONSE',
  LOBBY_MEMBER_UPDATE: 'LOBBY_MEMBER_UPDATE',
};
