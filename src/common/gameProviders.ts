import { Observable, concat, EMPTY, from, BehaviorSubject } from 'rxjs'
import { ChessInstance, Move } from 'chess.js'
import { EndState, ClientAction, CompleteGameInfo, UserDetails, Colour, GameUpdate, GameDetails } from './types'
import { map, filter, concatMap, tap, share, takeWhile } from 'rxjs/operators'
import { routeBy, getChessConstructor } from './helpers'

const Chess = getChessConstructor()

export interface GameState {
  chess: ChessInstance;
  end?: EndState;
}

export interface GameStateWithDetails extends GameDetails{
  chess: ChessInstance;
  end?: EndState;
}

export class GameStream {
  gameStateWithDetails$: Observable<GameStateWithDetails>
  gameDetails: GameDetails
  private chess: ChessInstance
  private state$: BehaviorSubject<GameState>

  constructor (
    gameUpdate$: Observable<GameUpdate>,
    private gameInfo: CompleteGameInfo
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

    gameUpdate$.pipe(
      filter(u => u.type !== 'offerDraw'),
      map(update => {
        const { type } = update
        if (type === 'move') {
          const out = this.chess.move(update.move as Move)
          if (!out) {
            throw new Error(`invalid move sent to GameStream: ${update.move}`)
          }
          return this.state
        }
        if (type === 'end') {
          return {
            ...this.state,
            end: update.end
          }
        }
        throw new Error('move and end should be the only update types let through')
      })
    ).subscribe({
      next: state => {
        this.state$.next(state)
        if (state.end) {
          console.log('game over')
          this.state$.complete()
        }
      },
      complete: () => this.state$.complete()
    })

    this.gameStateWithDetails$ = this.state$.pipe(
      map(state => ({
        ...state,
        ...this.gameDetails
      }))
    )
  }

  get gameId () {
    return this.gameInfo.id
  }

  get state (): GameState {
    return this.state$.value
  }
}

// signature for function which can make moves for the client.
// Make sure this funciton doesn't modify the ChessInstance it's passed.
export type MoveMaker = (chess: ChessInstance) => Promise<Move>

export interface ClientActionProvider {
  getMove: MoveMaker;
}

export class GameClient {
  action$: Observable<ClientAction>
  endPromise: Promise<EndState>
  private colour: Colour
  private chess: ChessInstance

  constructor (
    public gameUpdate$: Observable<GameUpdate>,
    gameInfo: CompleteGameInfo,
    user: UserDetails,
    getMove: MoveMaker
  ) {
    this.chess = new Chess()
    this.chess.load_pgn(gameInfo.pgn)
    this.colour = this.getColour(user, gameInfo)

    // TODO implement actions other than moves

    this.action$ = this.makeClientActionObservable(
      gameUpdate$,
      getMove
    )

    this.endPromise = gameUpdate$.pipe(routeBy<EndState>('end'), tap(() => {
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

  private makeClientActionObservable (
    gameUpdate$: Observable<GameUpdate>,
    getMove: MoveMaker
  ): Observable<ClientAction> {
    const opponentMove$ = gameUpdate$.pipe(
      filter(update => (
        !!update.move
        && update.move.color !== this.colour
      )),
      map(({ move }) => move as Move)
    )

    const thisClientIsStarting = this.colour === this.chess.turn()
      && this.chess.moves().length > 0

    const moveIfStarting = thisClientIsStarting
      ? from(getMove(this.chess))
      : EMPTY

    moveIfStarting.subscribe(move => this.makeMoveIfValid(move))

    const moveToAction = map((move: Move): ClientAction => ({ type: 'move', move }))

    return concat(
      moveIfStarting.pipe(
        moveToAction
      ),
      opponentMove$.pipe(
        tap(move => this.makeMoveIfValid(move)),
        takeWhile(() => this.chess.moves().length > 0),
        concatMap(async (): Promise<ClientAction> => {
          const move = await getMove(this.chess)
          this.makeMoveIfValid(move)
          return { type: 'move', move }
        })
      )
    ).pipe(share())
  }

  private makeMoveIfValid (move: Move) {
    const out = this.chess.move(move)

    if (!out) {
      throw new Error(`
      invalid move: ${move.san} by ${move.color}
      ${this.chess.ascii()}`)
    }

    return this.chess
  }
}
