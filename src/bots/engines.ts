import _ from 'lodash'
import { MoveMaker } from '../common/gameProviders'
import { ChessInstance, Move } from 'chess.js'

export type ChessEngine = MoveMaker

export async function firstMoveEngine (chess: ChessInstance) {
  return chess.moves({ verbose: true })[0]
}

export async function randomMoveEngine (chess: ChessInstance) {
  const moves = chess.moves({ verbose: true })
  return _.sample(moves) as Move
}
