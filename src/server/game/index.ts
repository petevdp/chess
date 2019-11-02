import { Observable, merge, Subject, from } from 'rxjs'
import { concatMap, takeWhile, first, tap, shareReplay } from 'rxjs/operators'
import {
  Colour,
  GameIdentifiers,
  GameUpdate,
  GameInfo,
  EndState,
  CompletedGameInfo,
  PlayerDetails
} from '../../common/types'
import { Chess, ChessInstance } from 'chess.js'
import uuidv4 from 'uuid/v4'
import { Player } from './player'
import { LobbyMember } from '../lobby/lobbyMember'
import { getGameUpdatesFromPlayerAction } from './rules'
import { routeBy } from '../../common/helpers'
import { DBQueriesInterface } from '../db/queries'

class Game {
  private players: Player[]
  id: string
  details: GameIdentifiers

  // TODO make type for gamestate
  gameUpdate$: Observable<GameUpdate>
  endPromise: Promise<EndState>

  private requiredPlayerCount = 2
  private gameController$ = new Subject<GameUpdate>()
  private chess: ChessInstance

  constructor (
    gameMembers: [LobbyMember, Colour][],
    dbQueries: DBQueriesInterface,
    startFEN: string|null = null
  ) {
    this.id = uuidv4()
    this.chess = new Chess()
    if (startFEN) {
      this.chess.load(startFEN)
    }

    this.details = this.createGameDetails(gameMembers)

    if (gameMembers.length !== 2) {
      throw new Error(
        `wrong number of players! should be: ${this.requiredPlayerCount}`
      )
    }

    const gameUpdateSubject = new Subject<GameUpdate>()

    this.players = this.createPlayers(
      gameMembers,
      this.info,
      gameUpdateSubject
    )

    const playerUpdates = merge(
      ...this.players.map((p) => p.playerAction$)
    ).pipe(
      concatMap((action) => {
        const updates = getGameUpdatesFromPlayerAction(
          action,
          this.chess,
          this.details.playerDetails
        )

        // Make move if action turned out to be a move.
        // Moves will only turn up in the first index.
        if (updates[0].move) {
          this.chess.move(updates[0].move)
        }

        return from(updates)
      }),
      shareReplay(10)
    )

    merge(playerUpdates, this.gameController$)
      .pipe(
        takeWhile((update) => update.type !== 'end', true)
      )
      .subscribe(gameUpdateSubject)

    this.gameUpdate$ = gameUpdateSubject
    this.endPromise = this.gameUpdate$.pipe(
      routeBy<EndState>('end'),
      first(),
      tap((end) => {
        console.log('')
        console.log(` Game ended between ${this.playersDisplay} `)
        console.log(`result: `, end)
        console.log(this.chess.ascii())
      })
    ).toPromise()

    this.setLobbyMemberJoinedGameState(
      this.id,
      gameMembers.map(m => m[0]),
      this.endPromise
    )

    this.endPromise.then((end) => {
      // persist finished game to database
      dbQueries.addCompletedGame({ ...this.info, end } as CompletedGameInfo)
    })

    console.log('new game between ', this.playersDisplay)
    console.log('game id: ', this.id)
  }

  get playersDisplay () {
    return this.players.map(p => `${p.user.username}(${p.colour})`)
  }

  /**
   * Ends the game, notifying all clients
   */
  end () {
    console.log('force ending game ', this.id)

    this.gameController$.next({
      type: 'end',
      end: {
        reason: 'serverStoppedGame',
        winnerId: null
      }
    })
  }

  get info (): GameInfo {
    return {
      ...this.details,
      pgn: this.chess.pgn()
    }
  }

  private setLobbyMemberJoinedGameState (
    id: string,
    members: LobbyMember[],
    endPromise: Promise<EndState>
  ) {
    members.forEach((m) => m.joinGame(id, endPromise))
  }

  private createGameDetails (gameMembers: [LobbyMember, Colour][]): GameIdentifiers {
    const allPlayerDetails: PlayerDetails[] = gameMembers.map(([member, colour]) => ({
      user: member.userDetails,
      colour
    }))

    return {
      playerDetails: allPlayerDetails as [PlayerDetails, PlayerDetails],
      id: this.id
    }
  }

  private createPlayers (
    gameMembers: [LobbyMember, Colour][],
    completeGameInfo: GameInfo,
    gameUpdate$: Observable<GameUpdate>
  ) {
    return gameMembers.map(
      ([{ connection }, colour]) => new Player(connection, completeGameInfo, gameUpdate$, colour)
    )
  }
}

export default Game
