import { OperatorFunction, Observable } from 'rxjs'
import { Details, GameUpdate } from './types'
import { filter, map, mergeAll, shareReplay, scan } from 'rxjs/operators'
import { Move, ChessInstance } from 'chess.js'

/*
* This function is required to make the chess.js library cross compatible.
* Not entirely sure why this is neccessary, probably a fixable tsconfig configuration issue
*/
export function getChessConstructor (): any {
  if (typeof module.exports === 'object') {
    return require('chess.js').Chess
  } else {
    return require('chess.js')
  }
}

const Chess = getChessConstructor()

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

export function sleep (ms: number) {
  return new Promise(resolve => setTimeout(() => (resolve()), ms))
}

export function getMoveHistoryFromPgn (pgn: string) {
  const chess: ChessInstance = new Chess()
  chess.load_pgn(pgn)
  return chess.history({ verbose: true })
}

export function replayMoveHistory (history: (Move|string)[]) {
  const chess: ChessInstance = new Chess()
  history.forEach(move => {
    const out = chess.move(move)
    if (!out) {
      throw new Error('invalid history')
    }
  })
  return chess
}

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
