import _ from 'lodash'
import { MoveMaker } from '../common/gameProviders'
import { ChessInstance, Move } from 'chess.js'
import { sleep } from '../common/helpers'
import { EngineOptions } from '../common/types'

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

export const engineNameMap = new Map<ChessEngineName, ChessEngine>([
  ['first', firstMoveEngine],
  ['random', randomMoveEngine]
])

type EngineOperator = (inputEngine: ChessEngine) => ChessEngine

type EngineOperatorName = 'delay' | 'randomDelay'

export const Operators = {
  delay: (delay: number): EngineOperator => {
    return engine => async (chess) => {
      await sleep(delay)
      return engine(chess)
    }
  },

  randomDelay: (upper: number, lower: number): EngineOperator => {
    return engine => async (chess) => {
      const delay = _.random(lower, upper)
      await sleep(delay)
      return engine(chess)
    }
  }
}

const pipeOperators = (operators: EngineOperator[]): EngineOperator => (engine: ChessEngine) => {
  return operators.reduce((engine, op) => (
    op(engine)
  ), engine)
}

export function constructEngine (
  name: ChessEngineName,
  options: EngineOptions
): ChessEngine | null {
  const engine = engineNameMap.get(name)
  if (!engine) {
    return null
  }
  const operators: EngineOperator[] = []
  const { delay } = options
  if (delay) {
    if (delay instanceof Array) {
      operators.push(Operators.randomDelay(...delay))
    } else {
      operators.push(Operators.delay(delay))
    }
  }
  return pipeOperators(operators)(engine)
}
