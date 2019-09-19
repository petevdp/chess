import _ from 'lodash';
import { Observable, merge, BehaviorSubject } from 'rxjs';
import { filter, map, shareReplay, takeWhile, startWith, mapTo } from 'rxjs/operators';
import { Colour, GameDetails, GameUpdate, CompleteGameInfo } from '../common/types';
import { Chess } from 'chess.js';
import uuidv4 from 'uuid/v4';
import { Player, PlayerAction } from './player';
import { ClientConnection, IClientConnection } from './socketServer';
import { HasDetails$ } from '../common/helpers';
import { LobbyMember } from './lobbyMember';

export class Game implements HasDetails$<GameDetails> {
  private players: Player[];
  id: string;

  // TODO make type for gamestate
  gameDetails: GameDetails;
  gameUpdate$: Observable<GameUpdate>;
  completeGameInfo$: BehaviorSubject<CompleteGameInfo | null>;

  requiredPlayerCount = 2;

  private chess: Chess;

  constructor(
    gameMembers: LobbyMember[],
  ) {
    this.id = uuidv4();
    this.chess = new Chess();

    const colours = _.shuffle(['b', 'w']) as Colour[];

    if (gameMembers.length !== 2) {
      throw new Error(`wrong number of players! should be: ${this.requiredPlayerCount}`);
    }

    this.completeGameInfo$ = new BehaviorSubject(null);

    this.players = _.zip(gameMembers, colours)
      .map(([member, colour]) => new Player(
        member.connection,
        colour,
        this.completeGameInfo$.asObservable()
      ));

    this.gameUpdate$ = merge(
      ...this.players.map(p => p.playerActionObservable)
    ).pipe(
      filter(this.isValidPlayerAction),
      map(this.getGameUpdateFromAction),
      // take until and including an update ending the game.
      // takeWhile(({ end }) => !end, true),
      shareReplay(1)
    );


    this.gameDetails = {
      playerDetails: this.players.map(({ details }) => details),
      id: this.id,
    } as GameDetails

    this.completeGameInfo$.next({
      ...this.completeGameInfo,
      history: this.chess.history(),
      state: this.chess.fen(),
    });

    this.gameUpdate$.subscribe(update => {
      this.players.forEach(p => p.updateGame(update));
      console.log('complete: ', this.completeGameInfo);
      this.completeGameInfo$.next({
        ...this.completeGameInfo,
        history: this.chess.history(),
        state: this.chess.fen(),
      })
    });

  }

  get completeGameInfo() {
    return this.completeGameInfo$.getValue()
    || {
      ...this.gameDetails,
      history: this.chess.history(),
      state: this.chess.fen(),
    }
  }


  private findOpponent = (playerId: string) => {
    return this.players.find(p => p.id !== playerId);
  }

  private isInvalidMove(move, colour) {
    return this.chess.turn() !== colour
      || !move
      || this.chess.moves({ square: move.from }).includes(move.to);
  }

  private isValidPlayerAction = ({ move, colour }: PlayerAction) => {
    return !(move && this.isInvalidMove(move, colour));
  }

  private getGameUpdateFromAction(playerAction: PlayerAction): GameUpdate {
    const { move, playerId } = playerAction;
    const actions = {
      move: () => {
        this.chess.move(playerAction.move);
        const state = this.chess.fen() as string;
        if (this.chess.in_checkmate()) {
          return {
            end: {
              winnerId: this.findOpponent(playerId).id,
              reason: 'checkmate',
            },
            move,
            state,
          } as GameUpdate;
        }

        if (this.chess.in_stalemate()) {
          return {
            end: {
              winnerId: null,
              reason: 'stalemate',
            },
            move,
            state,
          } as GameUpdate;
        }

        if (this.chess.in_threefold_repitiion()) {
          return {
            end: {
              winnerId: null,
              reason: 'threefold repitition',
            },
            move,
            state,
          } as GameUpdate;
        }

        if (this.chess.in_draw()) {
          return {
            end: {
              winnerId: null,
              reason: 'draw',
            },
            move,
            state,
          } as GameUpdate;
        }

        return {
          type: 'ongoing',
          move,
          state,
        } as GameUpdate;
      },

      resign: () => {
        return {
          end: {
            winnerId: this.findOpponent(playerId).id,
            reason: 'resigned',
          },
          state: this.chess.fen() as string,
        } as GameUpdate;
      },

      disconnect: () => {
        return {
          end: {
            winnerId: this.findOpponent(playerId).id,
            reason: 'disconnected',
          },
          state: this.chess.fen() as string,
        } as GameUpdate;
      },

      offerDraw: () => {
        return {
          message: 'offer draw',
          state: this.chess.fen() as string,
        } as GameUpdate;
      }
    };

    return actions[playerAction.type]();
  }
}
