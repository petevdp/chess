import { Observable, concat, EMPTY, from } from 'rxjs'
import { ChessInstance, Move, Chess, ShortMove } from 'chess.js'
import { EndState, GameUpdate, Colour, ClientAction } from './types'
import { map, filter, startWith, concatMap, tap } from 'rxjs/operators'
import { routeBy } from './helpers'

interface GameOptions {
  startingFEN?: string;
}

export class GameStream {
  move$: Observable<ChessInstance>
  end$: Observable<EndState>
  private chess: ChessInstance
  constructor (
    gameUpdate$: Observable<GameUpdate>,
    { startingFEN }: GameOptions = {}
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

export interface ClientActionProvider {
  getMove: MoveMaker;
}
export class GameClient {
  private chess: ChessInstance

  action$: Observable<ClientAction>
  endPromise: Promise<EndState>;

  constructor (
    public gameUpdate$: Observable<GameUpdate>,
    private colour: Colour,
    getMove: MoveMaker,
    { startingFEN }: GameOptions = {}
  ) {
    this.chess = new Chess(startingFEN)

    // TODO implement actions other than moves
    this.action$ = this.makeClientMoveObservable(
      gameUpdate$.pipe(
        filter(update => update.type === 'move'),
        map(({ move }) => move as ShortMove)
      ),
      getMove
    )

    this.endPromise = gameUpdate$.pipe(routeBy<EndState>('end'), tap(() => {
      console.log('ending')
    })).toPromise()
  }

  complete () { }

  private makeClientMoveObservable (
    opponentMove$: Observable<ShortMove>,
    getMove: MoveMaker
  ) {
    const moveIfStarting = this.colour === this.chess.turn()
      ? from(getMove(this.chess))
      : EMPTY

    const respondToOpponentMove: Observable<Move> = opponentMove$.pipe(
      concatMap(async (opponentMove) => {
        console.log('opponent move')
        const chess = this.makeMoveIfValid(opponentMove)
        const clientMove = await getMove(chess)
        this.makeMoveIfValid(clientMove)
        return clientMove
      })
    )

    const moveToAction = map((move: Move): ClientAction => ({ type: 'move', move }))

    return concat(
      moveIfStarting.pipe(moveToAction),
      respondToOpponentMove.pipe(moveToAction)
    )
  }

  private makeMoveIfValid (move: ShortMove) {
    if (!this.chess.move(move)) {
      throw new Error('invalid move')
    }
    return this.chess
  }
}
