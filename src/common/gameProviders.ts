import {Observable, Subject} from 'rxjs'
import {ChessInstance, Move, Chess, ShortMove} from 'chess.js'
import {EndState, GameUpdate, Colour} from './types'
import {map, filter, startWith, concatMap} from 'rxjs/operators'
import {routeBy} from './helpers'

interface GameOptions {
  startingFEN?: string;
}

export class GameStream {
  move$: Observable<ChessInstance>
  end$: Observable<EndState>
  private chess: ChessInstance
  constructor (
    gameUpdate$: Observable<GameUpdate>,
    {startingFEN}: GameOptions = {}
  ) {
    this.chess = new Chess(startingFEN)
    this.move$ = gameUpdate$.pipe(
      routeBy<ShortMove>('move'),
      map((move) => {
        const out = this.chess.move(move)
        if (!out) {
          throw new Error('invalid move')
        }
        return this.chess
      }),
      startWith(this.chess)
    )

    this.end$ = gameUpdate$.pipe(routeBy<EndState>('end'))
  }
}

// signature for function which can make moves for the client.
// Make sure this funciton doesn't modify the ChessInstance it's passed.
export type MoveMaker = (chess: ChessInstance) => Promise<Move>

export class GameClient {
  private chess: ChessInstance

  // generalUpdate$ do not include moves. Completes on game end.
  generalUpdate$: Observable<GameUpdate>
  clientMove$: Observable<Move>
  endPromise: Promise<EndState>

  constructor (
    gameUpdate$: Observable<GameUpdate>,
    private colour: Colour,
    private getMoveFromPlayer: MoveMaker,
    {startingFEN}: GameOptions = {}
  ) {
    this.chess = new Chess(startingFEN)

    const moveResponse$ = this.makeClientMoveObservable(
      gameUpdate$,
      getMoveFromPlayer
    )

    const clientMoveSub = new Subject<Promise<Move>>()

    if (this.colour === this.chess.turn()) {
      const movePromise = this.getMoveFromPlayer(this.chess)
      clientMoveSub.next(movePromise)
    }

    moveResponse$.subscribe(clientMoveSub)

    this.clientMove$ = clientMoveSub.pipe(
      concatMap(async (movePromise) => {
        const move = await movePromise
        this.makeMoveIfValid(move)
        return move
      })
    )

    this.generalUpdate$ = this.makeGeneralUpdateObservable(gameUpdate$)
  }

  private makeClientMoveObservable (
    gameUpdate$: Observable<GameUpdate>,
    getMoveFromPlayer: MoveMaker
  ) {
    return gameUpdate$.pipe(
      routeBy<ShortMove>('move'),
      filter(() => this.chess.turn() !== this.colour),
      map(async (opponentMove) => {
        // TODO add error handling, currently will throw if invalid move
        this.makeMoveIfValid(opponentMove)
        const clientMove = await getMoveFromPlayer(this.chess)
        return clientMove
      })
    )
  }

  private makeGeneralUpdateObservable (gameUpdate$: Observable<GameUpdate>) {
    return gameUpdate$.pipe(
      // ignore moves
      filter(({type}) => type !== 'move')
    )
  }

  private makeMoveIfValid (move: ShortMove) {
    console.log('move: ', move)
    if (!this.chess.move(move)) {
      throw new Error('invalid move')
    }
    return true
  }

  makeMove (): void {}
  resign (): void {}
  offerDraw (): void {}
}
