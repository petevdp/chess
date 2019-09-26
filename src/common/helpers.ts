import { OperatorFunction, Observable } from 'rxjs'
import { Details, GameUpdate } from './types'
import { filter, map, mergeAll, shareReplay, scan } from 'rxjs/operators'
import { Move, ChessInstance } from 'chess.js'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Chess = require('chess.js')

export function routeBy<OUT> (routeProperty: string): OperatorFunction<any, OUT> {
  return (input$) => input$.pipe(
    filter((obj: any) => !!obj[routeProperty]),
    map(obj => obj[routeProperty])
  )
}
export interface HasDetailsObservable<D> {
  update$: Observable<D>;
}

export function allDetails<D extends Details> (obj$: Observable<HasDetailsObservable<D>>) {
  return obj$.pipe(
    map((obj) => obj.update$),
    mergeAll(),
    scan((map, details) => map.set(details.id, details), new Map<string, D>()),
    map(detailsMap => Object.values(detailsMap)),
    shareReplay(1)
  )
}

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export function getGameUpdatesFromMoveArr (moves: Move[]): GameUpdate[] {
  return moves.map(move => ({ type: 'end', move } as GameUpdate))
}

export function getGameUpdatesFromPgn (pgn: string): GameUpdate[] {
  const chess = new Chess() as ChessInstance
  const succ = chess.load_pgn(pgn)
  if (!succ) {
    throw new Error('unable to process pgn')
  }
  return getGameUpdatesFromMoveArr(chess.history({ verbose: true }))
}
