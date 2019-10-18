import { Observable, merge, Subject, from } from 'rxjs'
import { concatMap, takeWhile, first, tap } from 'rxjs/operators'
import {
  Colour,
  GameDetails,
  GameUpdate,
  CompleteGameInfo,
  PlayerDetails,
  EndState
} from '../../common/types'
import { Chess, ChessInstance } from 'chess.js'
import uuidv4 from 'uuid/v4'
import { Player } from './player'
import { LobbyMember } from '../lobby/lobbyMember'
import { getGameUpdatesFromPlayerAction } from './rules'
import { allPlayerDetails } from '../../common/dummyData/dummyData'
import { routeBy } from '../../common/helpers'

class Game {
  private players: Player[]
  id: string
  details: GameDetails

  // TODO make type for gamestate
  gameUpdate$: Observable<GameUpdate>
  endPromise: Promise<EndState>

  private requiredPlayerCount = 2
  private gameController$ = new Subject<GameUpdate>()
  private chess: ChessInstance

  constructor (gameMembers: [LobbyMember, Colour][]) {
    this.id = uuidv4()
    this.chess = new Chess()

    this.details = this.createGameDetails(gameMembers)

    if (gameMembers.length !== 2) {
      throw new Error(
        `wrong number of players! should be: ${this.requiredPlayerCount}`
      )
    }

    const gameUpdateSubject = new Subject<GameUpdate>()

    this.players = this.createPlayers(
      gameMembers,
      this.completeGameInfo,
      gameUpdateSubject
    )

    const playerUpdates = merge(
      ...this.players.map((p) => p.playerAction$)
    ).pipe(
      concatMap((action) => {
        const updates = getGameUpdatesFromPlayerAction(action, this.chess, allPlayerDetails)

        // Make move if action turned out to be a move.
        // Moves will only turn up in the first index.
        if (updates[0].move) {
          this.chess.move(updates[0].move)
        }

        return from(updates)
      })
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

    console.log('new game between ', this.playersDisplay)
    console.log('game id: ', this.id)
  }

  private get playersDisplay () {
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

  get completeGameInfo (): CompleteGameInfo {
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

  private createGameDetails (gameMembers: [LobbyMember, Colour][]): GameDetails {
    const playerDetails: PlayerDetails[] = gameMembers.map(([member, colour]) => ({
      user: member.userDetails,
      colour
    }))

    return {
      playerDetails,
      id: this.id
    }
  }

  private createPlayers (
    gameMembers: [LobbyMember, Colour][],
    completeGameInfo: CompleteGameInfo,
    gameUpdate$: Observable<GameUpdate>
  ) {
    return gameMembers.map(
      ([{ connection }, colour]) => new Player(connection, completeGameInfo, gameUpdate$, colour)
    )
  }
}

export default Game
