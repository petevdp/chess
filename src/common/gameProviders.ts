import { Observable, concat, EMPTY, from, merge, BehaviorSubject } from 'rxjs'
import { ChessInstance, Move } from 'chess.js'
import { EndState, GameUpdateWithId, ClientAction, CompleteGameInfo, UserDetails, Colour, GameUpdate, GameDetails, PlayerDetails } from './types'
import { map, filter, startWith, concatMap, tap, mapTo } from 'rxjs/operators'
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
  gameStateWithDetails$: Observable<GameState>
  gameDetails: GameDetails
  private chess: ChessInstance
  private state$: BehaviorSubject<GameState>

  constructor (
    gameUpdate$: Observable<GameUpdate>,
    private gameInfo: CompleteGameInfo
  ) {
    console.log('pgn: ', gameInfo.pgn)

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
            throw new Error('invalid move sent to GameStream')
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
    public gameUpdate$: Observable<GameUpdateWithId>,
    gameInfo: CompleteGameInfo,
    user: UserDetails,
    getMove: MoveMaker
  ) {
    this.chess = new Chess()
    this.chess.load_pgn(gameInfo.pgn)

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
    const starting = this.colour === this.chess.turn()
      && this.chess.moves().length > 0

    const moveIfStarting = starting
      ? from(getMove(this.chess))
      : EMPTY

    const respondToOpponentMove: Observable<Move> = opponentMove$.pipe(
      concatMap(async (opponentMove) => {
        const chess = this.makeMoveIfValid(opponentMove)

        const clientMove = await getMove(chess)
        this.makeMoveIfValid(clientMove)
        return clientMove
      })
    )

    moveIfStarting.subscribe(move => this.makeMoveIfValid(move))

    const moveToAction = map((move: Move): ClientAction => ({ type: 'move', move }))

    return concat(
      moveIfStarting.pipe(
        moveToAction
      ),
      respondToOpponentMove.pipe(moveToAction)
    )
  }

  private makeMoveIfValid (move: Move) {
    const out = this.chess.move(move)

    if (!out) {
      throw new Error(`invalid move: ${move}\n${this.chess.ascii()}`)
    }

    return this.chess
  }
}
