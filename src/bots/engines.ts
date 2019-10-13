import _ from 'lodash'
import { MoveMaker } from '../common/gameProviders'
import { ChessInstance, Move } from 'chess.js'

export type ChessEngine = MoveMaker
export type ChessEngineName =
  'first'
  | 'random'

export async function firstMoveEngine (chess: ChessInstance) {
  return chess.moves({ verbose: true })[0]
}

export async function randomMoveEngine (chess: ChessInstance) {
  const moves = chess.moves({ verbose: true })
  return _.sample(moves) as Move
}

export const engineNameMapping = new Map<ChessEngineName, ChessEngine>([
  ['first', firstMoveEngine],
  ['random', randomMoveEngine]
])
