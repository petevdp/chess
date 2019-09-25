import { Observable, concat, EMPTY, from } from 'rxjs'
import { ChessInstance, Chess, Move } from 'chess.js'
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
      routeBy<Move>('move'),
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
        map(({ move }) => move as Move),
        filter(move => this.chess.turn() === move.color)
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
    opponentMove$: Observable<Move>,
    getMove: MoveMaker
  ) {
    const moveIfStarting = this.colour === this.chess.turn()
      ? from(getMove(this.chess))
      : EMPTY

    const respondToOpponentMove: Observable<Move> = opponentMove$.pipe(
      concatMap(async (opponentMove) => {
        console.log('opponent move')
        const chess = this.makeMoveIfValid(opponentMove)

        console.log('my move')
        const clientMove = await getMove(chess)
        this.makeMoveIfValid(clientMove)
        return clientMove
      })
    )

    moveIfStarting.subscribe(move => this.makeMoveIfValid(move))

    const moveToAction = map((move: Move): ClientAction => ({ type: 'move', move }))

    return concat(
      moveIfStarting.pipe(
        moveToAction,
        tap(move => console.log('made starting move: ', move))
      ),
      respondToOpponentMove.pipe(moveToAction)
    )
  }

  private makeMoveIfValid (move: Move) {
    const out = this.chess.move(move)
    console.log('turn: ', this.chess.turn())

    if (!out) {
      throw new Error(`invalid move: ${move.to}\n${this.chess.ascii()}`)
    }
    console.log('move made: ', move)
    console.log(this.chess.ascii())

    return this.chess
  }
}
