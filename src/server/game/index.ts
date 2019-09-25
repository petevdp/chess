import { Observable, merge, Subject, from } from 'rxjs'
import { shareReplay, concatMap, takeWhile, tap } from 'rxjs/operators'
import {
  Colour,
  GameDetails,
  GameUpdate,
  CompleteGameInfo,
  PlayerDetails
} from '../../common/types'
import { Chess, ChessInstance } from 'chess.js'
import uuidv4 from 'uuid/v4'
import { Player } from './__tests__/player'
import { LobbyMember } from '../lobby/lobbyMember'
import { getGameUpdatesFromPlayerAction } from './rules'
import { playerDetails } from '../../common/dummyData'

class Game {
  private players: Player[]
  id: string
  details: GameDetails

  // TODO make type for gamestate
  gameUpdate$: Observable<GameUpdate>

  private requiredPlayerCount = 2
  private gameController$ = new Subject<GameUpdate>()
  private chess: ChessInstance

  constructor (gameMembers: [LobbyMember, Colour][]) {
    console.log('new game')

    this.id = uuidv4()
    this.chess = new Chess()

    this.details = this.createGameDetails(gameMembers)

    if (gameMembers.length !== 2) {
      throw new Error(
        `wrong number of players! should be: ${this.requiredPlayerCount}`
      )
    }
    this.setLobbyMemberJoinedGameState(this.id, gameMembers.map(m => m[0]))

    console.log('creating players')
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
        let updates: GameUpdate[]
        try {
          updates = getGameUpdatesFromPlayerAction(action, this.chess, playerDetails)
        } catch (error) {
          console.log('error: ', error)
          throw new Error('oh no')
        }

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
        tap(() => 'sending update'),
        takeWhile((update) => update.type !== 'end', true),
        shareReplay(1)
      )
      .subscribe(gameUpdateSubject)

    this.gameUpdate$ = gameUpdateSubject.asObservable()
  }

  /**
   * Ends the game, notifying all clients
   */
  end () {
    this.gameController$.next({
      type: 'end',
      end: {
        reason: 'serverStoppedGame',
        winnerId: null
      }
    })
  }

  private setLobbyMemberJoinedGameState (id: string, members: LobbyMember[]) {
    members.forEach((m) => m.joinGame(id))
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

  get completeGameInfo (): CompleteGameInfo {
    return {
      ...this.details,
      pgn: this.chess.pgn()
    }
  }
}

export default Game
