import { Observable, BehaviorSubject, Subject } from 'rxjs'
import { ChessInstance, Move } from 'chess.js'
import { EndState, ClientAction, GameInfo, UserDetails, Colour, GameUpdate, GameIdentifiers, GameUpdateType } from './types'
import { map, filter, concatMap, shareReplay } from 'rxjs/operators'
import { routeBy, getChessConstructor } from './helpers'

const Chess = getChessConstructor()

export interface GameState {
  chess: ChessInstance;
  lastUpdateType?: GameUpdateType;
  end?: EndState;
}

export interface GameStateWithDetails extends GameIdentifiers{
  chess: ChessInstance;
  lastUpdateType?: GameUpdateType;
  end?: EndState;
}

export class GameStream {
  gameStateWithDetails$: Observable<GameStateWithDetails>
  gameDetails: GameIdentifiers
  state$: BehaviorSubject<GameState>
  endPromise: Promise<EndState>
  private chess: ChessInstance

  constructor (
    gameUpdate$: Observable<GameUpdate>,
    public gameInfo: GameInfo
  ) {
    this.chess = new Chess()
    this.chess.load_pgn(gameInfo.pgn)

    this.gameDetails = {
      id: gameInfo.id,
      playerDetails: gameInfo.playerDetails
    }

    this.state$ = new BehaviorSubject({
      chess: this.chess,
      end: undefined
    } as GameState)

    this.gameStateWithDetails$ = this.state$.pipe(
      map(state => ({
        ...state,
        ...this.gameDetails
      }))
    )
    this.endPromise = this.state$.pipe(
      routeBy<EndState>('end')
    ).toPromise()

    gameUpdate$.pipe(
      filter(u => u.type !== 'offerDraw'),
      map((update): GameState => {
        const { move, type } = update
        if (move) {
          const out = this.chess.move(update.move as Move)
          if (!out) {
            throw new Error(`invalid move sent to GameStream: ${move.san}`)
          }
          return {
            ...this.state,
            lastUpdateType: type
          }
        }
        if (type === 'end') {
          return {
            ...this.state,
            lastUpdateType: type,
            end: update.end
          }
        }
        throw new Error('move and end should be the only update types let through')
      })
    ).subscribe({
      next: state => {
        this.state$.next(state)
        if (state.end) {
          this.state$.complete()
        }
      },
      complete: () => {
        this.state$.complete()
      }
    })
  }

  get gameId () {
    return this.gameInfo.id
  }

  get state (): GameState {
    return this.state$.value
  }

  complete () {
    this.state$.complete()
  }
}

// signature for function which can make moves for the client.
// Make sure this function doesn't modify the ChessInstance it's passed.
export type MoveMaker = (chess: ChessInstance) => Promise<Move>

export class GameClient {
  readonly colour: Colour
  readonly action$: Observable<ClientAction>
  readonly userId: string
  readonly gameInfo: GameInfo
  private readonly _action$: Subject<ClientAction>

  constructor (
    gameStream: GameStream,
    public readonly user: UserDetails,
    makeMove: MoveMaker
  ) {
    this.userId = user.id
    this.gameInfo = gameStream.gameInfo
    this.colour = GameClient.getColour(user, gameStream.gameInfo)
    this._action$ = new Subject()
    GameClient.createClientAction$(gameStream, makeMove, this.colour).subscribe({
      next: action => this._action$.next(action),
      complete: () => this._action$.complete()
    })

    this.action$ = this._action$.asObservable()
  }

  private static getColour (user: UserDetails, gameInfo: GameInfo) {
    const player = gameInfo.playerDetails.find(p => p.user.id === user.id)
    if (!player) {
      throw new Error(`player matching ${user} not found`)
    }
    return player.colour
  }

  private static createClientAction$ (
    gameStream: GameStream,
    makeMove: MoveMaker,
    clientColour: Colour
  ) {
    const clientMove$: Observable<ClientAction> = gameStream.state$.pipe(
      filter(({ chess, lastUpdateType, end }) => {
        return !!(
          ['move', undefined].includes(lastUpdateType)
          && chess.moves().length > 0
          && end === undefined
          && chess.turn() === clientColour
          && !chess.game_over()
        )
      }),
      concatMap(async ({ chess }): Promise<ClientAction> => {
        const move = await makeMove(chess)
        return {
          type: 'move',
          move
        }
      }),
      // accounting for latency in listening for client actions
      shareReplay(10)
    )

    // TODO add draw responses
    return clientMove$
  }

  complete () {
    this._action$.complete()
  }
}
