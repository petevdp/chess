import { ShortMove } from 'chess.js';

export interface ClientMove extends ShortMove {
  colour: string;
}

export interface GameConfig {
  colour: string;
}
