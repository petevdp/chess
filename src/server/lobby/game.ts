import _ from 'lodash'
import errors from 'errors'
import { Observable, merge, BehaviorSubject, of } from 'rxjs'
import { filter, shareReplay, concatMap } from 'rxjs/operators'
import { Colour, GameDetails, GameUpdate, CompleteGameInfo, DRAW_REASONS, ShortMove } from '../../common/types'
import { Chess, ChessInstance } from 'chess.js'
import uuidv4 from 'uuid/v4'
import { Player, PlayerAction } from './player'
import { ClientConnection, IClientConnection } from '../server/clientConnection'
import { HasDetails$ } from '../../common/helpers'
import { LobbyMember } from './lobbyMember'

export class Game implements HasDetails$<GameDetails> {
  private players: Player[];
  id: string;

  // TODO make type for gamestate
  gameDetails: GameDetails;
  gameUpdate$: Observable<GameUpdate>;
  completeGameInfo$: BehaviorSubject<CompleteGameInfo | null>;

  requiredPlayerCount = 2;

  private chess: ChessInstance;

  constructor (
    gameMembers: LobbyMember[]
  ) {
    this.id = uuidv4()
    this.chess = new Chess()

    const colours = _.shuffle(['b', 'w']) as Colour[]

    if (gameMembers.length !== 2) {
      throw new Error(`wrong number of players! should be: ${this.requiredPlayerCount}`)
    }

    this.completeGameInfo$ = new BehaviorSubject(null)

    this.players = _.zip(gameMembers, colours)
      .map(([member, colour]) => new Player(
        member.connection,
        colour,
        this.completeGameInfo$.asObservable()
      ))

    this.gameUpdate$ = merge(
      ...this.players.map(p => p.playerActionObservable)
    ).pipe(
      filter(this.validatePlayerAction),
      concatMap((action) => {
        const updates = this.getGameUpdatesFromPlayerAction(action)
        return of(...updates)
      }),
      // take until and including an update ending the game.
      // takeWhile(({ end }) => !end, true),
      shareReplay(1)
    )

    this.gameDetails = {
      playerDetails: this.players.map(({ details }) => details),
      id: this.id
    } as GameDetails

    this.completeGameInfo$.next({
      ...this.completeGameInfo,
      history: this.chess.history(),
      state: this.chess.fen()
    })

    this.gameUpdate$.subscribe(update => {
      this.players.forEach(p => p.updateGame(update))
      this.completeGameInfo$.next({
        ...this.completeGameInfo,
        history: this.chess.history(),
        state: this.chess.fen()
      })
    })
  }

  get completeGameInfo () {
    return this.completeGameInfo$.getValue() ||
      {
        ...this.gameDetails,
        history: this.chess.history(),
        state: this.chess.fen()
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

    const determineDrawType = () => {
      for (const reason in DRAW_REASONS) {
        if (this.chess[reason]()) {
          return reason
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
