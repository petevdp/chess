import { Observable, concat, EMPTY, from } from 'rxjs'
import { ChessInstance, Chess, ShortMove } from 'chess.js'
import { EndState, GameUpdateWithId, ClientAction, CompleteGameInfo, UserDetails, Colour } from './types'
import { map, filter, startWith, concatMap, tap } from 'rxjs/operators'
import { routeBy } from './helpers'

export class GameStream {
  move$: Observable<ChessInstance>
  end$: Observable<EndState>
  private chess: ChessInstance
  constructor (
    gameUpdate$: Observable<GameUpdateWithId>,
    gameInfo: CompleteGameInfo
  ) {
    this.chess = new Chess()
    this.chess.load_pgn(gameInfo.history)

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
export type MoveMaker = (chess: ChessInstance) => Promise<ShortMove>

export interface ClientActionProvider {
  getMove: MoveMaker;
}
export class GameClient {
  private chess: ChessInstance

  action$: Observable<ClientAction>
  endPromise: Promise<EndState>
  private colour: Colour

  constructor (
    public gameUpdate$: Observable<GameUpdateWithId>,
    gameInfo: CompleteGameInfo,
    user: UserDetails,
    getMove: MoveMaker
  ) {
    this.chess = new Chess()
    this.chess.load(gameInfo.history)
    this.colour = this.getColour(user, gameInfo)

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

  private getColour (user: UserDetails, gameInfo: CompleteGameInfo) {
    const player = gameInfo.playerDetails.find(p => p.user.id === user.id)
    if (!player) {
      throw new Error(`player matching ${user} not found`)
    }
    return player.colour
  }

  private makeClientMoveObservable (
    opponentMove$: Observable<ShortMove>,
    getMove: MoveMaker
  ) {
    const moveIfStarting = this.colour === this.chess.turn()
      ? from(getMove(this.chess))
      : EMPTY

    const respondToOpponentMove: Observable<ShortMove> = opponentMove$.pipe(
      concatMap(async (opponentMove) => {
        const chess = this.makeMoveIfValid(opponentMove)
        const clientMove = await getMove(chess)
        console.log('made move: ', chess.ascii())
        this.makeMoveIfValid(clientMove)
        return clientMove
      })
    )

    const moveToAction = map((move: ShortMove): ClientAction => ({ type: 'move', move }))

    return concat(
      moveIfStarting.pipe(moveToAction),
      respondToOpponentMove.pipe(moveToAction)
    )
  }

  private makeMoveIfValid (move: ShortMove) {
    const out = this.chess.move(move)
    if (!out) {
      throw new Error('invalid move')
    }
    return this.chess
  }
}
