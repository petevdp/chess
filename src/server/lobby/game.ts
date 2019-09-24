import _ from 'lodash'
import { Observable, merge, of, Subject } from 'rxjs'
import { filter, shareReplay, concatMap, takeWhile } from 'rxjs/operators'
import { Colour, GameDetails, GameUpdate, CompleteGameInfo, DRAW_REASONS, DrawReason, PlayerDetails } from '../../common/types'
import { Chess, ChessInstance, ShortMove } from 'chess.js'
import uuidv4 from 'uuid/v4'
import { Player, PlayerAction } from './player'
import { LobbyMember } from './lobbyMember'

class Game {
  private players: Player[];
  id: string;
  details: GameDetails

  // TODO make type for gamestate
  gameUpdate$: Observable<GameUpdate>;

  private requiredPlayerCount = 2;
  private gameController$ = new Subject<GameUpdate>()
  private chess: ChessInstance;

  constructor (
    gameMembers: LobbyMember[]
  ) {
    this.id = uuidv4()
    this.chess = new Chess()

    this.details = this.createGameDetails(gameMembers)

    if (gameMembers.length !== 2) {
      throw new Error(`wrong number of players! should be: ${this.requiredPlayerCount}`)
    }

    this.gameUpdate$ = merge(
      ...this.players.map(p => p.playerAction$),
      this.gameController$
    ).pipe(
      filter(this.validatePlayerAction),
      concatMap((action) => {
        const updates = this.getGameUpdatesFromPlayerAction(action)
        return of(...updates)
      }),
      takeWhile(update => update.type !== 'end', true),
      shareReplay(1)
    )

    this.players = this.createPlayers(gameMembers, this.completeGameInfo)
  }

  /**
   * Ends the game notifying all clients
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

  private createGameDetails (gameMembers: LobbyMember[]): GameDetails {
    const colours = _.shuffle(['b', 'w']) as Colour[]
    const userDetails = gameMembers.map(member => member.userDetails)
    const playerDetails: PlayerDetails[] = _.zip(userDetails, colours).map(([user, colour]) => ({
      user, colour
    }))

    return {
      playerDetails,
      id: this.id
    }
  }

  private createPlayers (
    gameMembers: LobbyMember[],
    completeGameInfo: CompleteGameInfo
  ) {
    return gameMembers.map(({ connection }) => (
      new Player(
        connection,
        completeGameInfo,
        this.gameUpdate$
      )
    ))
  }

  get completeGameInfo () {
    return {
      ...this.details,
      history: this.chess.pgn()
    }
  }

  private findOpponent = (playerId: string) => {
    return this.players.find(p => p.id !== playerId)
  }

  private validateMove (move: ShortMove, colour: Colour) {
    return this.chess.turn() !== colour &&
      this.chess.moves({ square: move.from }).includes(move.to)
  }

  private validatePlayerAction = ({ move, colour }: PlayerAction) => {
    // TODO add more sophisticated validation for other player actions
    return !move || !this.validateMove(move, colour)
  }

  /**
   * Input must be validated by validatePlayerAction first.
   *
   * Output is an array because we want to seperate game
   * endstates and the moves that ended them.
   */
  private getGameUpdatesFromPlayerAction (playerAction: PlayerAction): GameUpdate[] {
    const { type, playerId } = playerAction
    const updates = [] as GameUpdate[]
    const getOpponentId = () => this.findOpponent(playerId).id

    if (type === 'offerDraw') {
      updates.push({ type })
      return updates
    }

    if (type === 'resign') {
      updates.push({
        type: 'end',
        end: {
          winnerId: getOpponentId(),
          reason: 'resign'
        }
      })
      return updates
    }

    if (type === 'disconnect') {
      updates.push({
        type: 'end',
        end: {
          winnerId: getOpponentId(),
          reason: 'disconnect'
        }
      })
      return updates
    }

    // type === move
    const { move } = playerAction
    this.chess.move(move)

    updates.push({ type: 'move', move })

    if (!this.chess.game_over()) {
      return updates
    }
    const endUpdate = {
      type: 'end'
    } as GameUpdate

    if (this.chess.in_checkmate()) {
      endUpdate.end = {
        winnerId: playerId,
        reason: 'checkmate'
      }
      return [endUpdate]
    }

    // TODO add flagging and alternative rulesets
    const determineDrawType = (): DrawReason => {
      for (const reason in DRAW_REASONS) {
        if (this.chess[reason]()) {
          return reason as DrawReason
        }
      }
      throw new Error('no draw reason')
    }

    // must be draw
    endUpdate.end = {
      winnerId: null,
      reason: determineDrawType()
    }

    updates.push(endUpdate)
    return updates
  }
}

export default Game
