import { MoveMaker } from '../common/gameProviders';
import { ChessInstance } from 'chess.js';

export type ChessEngine = MoveMaker

export async function firstMoveEngine(chess: ChessInstance) {
  return chess.moves({verbose: true})[0];
}
