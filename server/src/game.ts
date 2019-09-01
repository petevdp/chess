import * as _ from 'lodash';
import { Observable, Subject, merge } from 'rxjs';
import { filter, map, shareReplay, takeWhile } from 'rxjs/operators';
import { MoveDetails, Colour, GameDetails, User, PlayerDetails, ClientPlayerAction, GameState, GameStateType, GameEndReason, GameUpdate } from '../../APIInterfaces/types';
import { Server, Socket } from 'socket.io';
import { LobbyMember } from './lobbyMember';
// import {  } from '../../APIInterfaces/socketSignals';
import { StateComponent } from './lobbyCategory';
import * as Chess from 'chess.js';
import uuidv4 from 'uuid/v4';
import { Player, PlayerAction } from './player';

export interface GameActions {
  temp: () => void;
}
export class Game implements StateComponent<GameDetails, GameActions> {
  private players: Player[];
  id: string;

  // TODO make type for gamestate
  detailsObservable: Observable<GameDetails>;
  actions = { temp: () => { } } as GameActions;
  gameStateSubject: Subject<string>;
  gameUpdateObservable: Observable<GameUpdate>;
  unusedColours = _.shuffle(['b', 'w']) as Colour[];

  private chess: Chess;
  private gameDetails: GameDetails;

  constructor() {
    this.id = uuidv4();
  }

  addPlayer(user: User, socket: Socket) {
    if (this.players.length >= 2) {
      throw new Error('game full!');
      return;
    }
    const player = new Player(this.id, user, socket, this.unusedColours.pop());
    this.players.push(player);
    if (this.players.length === 2) {
      this.startGame();
    }
  }

  private startGame() {

    this.gameUpdateObservable = merge(
      ...this.players.map(p => p.playerActionObservable)
    ).pipe(
        filter(this.isValidPlayerAction),
        map(this.getGameUpdateFromAction),

        // take until and including an update ending the game is issued
        takeWhile(({end}) => !end, true)
      );

    const playerDetails = this.players.map(({details}) => details);

    this.players.forEach(player => {
      player.startGame({
        id: this.id,
        playerDetails,
      });

      this.gameUpdateObservable.subscribe(player.updateGame);
    });

    this.detailsObservable = this.gameUpdateObservable.pipe(
      map(({state}) => ({ id: this.id, playerDetails, state })),
      shareReplay(1)
    );
  }

  private findPlayerByColour(searchColour: Colour) {
    if (this.players.length !== 2) {
      throw new Error('not all players joined');
    }
    return this.players.find(({ colour }) => searchColour === colour);
  }

  private findOpponentByColour = (playerColour: Colour) => {
    const colours = ['w', 'b'] as Colour[];
    return this.findPlayerByColour(colours.find(c => c !== playerColour));
  }

  private isInvalidMove(move, colour) {
    return this.chess.turn() !== colour
    || !move
    || this.chess.moves({ square: move.from }).includes(move.to);
  }

  private isValidPlayerAction = ({ move, colour }: PlayerAction) => {
    return !(move && this.isInvalidMove(move, colour));
  }

  private getGameUpdateFromAction(playerAction: PlayerAction): GameState {
    const { move, colour } = playerAction;
    const actions = {
      move: () => {
        this.chess.move(playerAction.move);
        const state = this.chess.fen();
        if (this.chess.in_checkmate()) {
          return {
            end: {
              winnerId: this.findOpponentByColour(colour).id,
              reason: 'checkmate',
            },
            move,
            state,
          };
        }

        if (this.chess.in_stalemate()) {
          return {
            end: {
              winnerId: null,
              reason: 'stalemate',
            },
            move,
            state,
          };
        }

        if (this.chess.in_threefold_repitiion()) {
          return {
            end: {
              winnerId: null,
              reason: 'threefold repitiion',
            },
            move,
            state,
          };
        }

        if (this.chess.in_draw()) {
          return {
            end: {
              winnerId: null,
              reason: 'draw',
            },
            move,
            state,
          };
        }

        return {
          type: 'ongoing',
          move,
          state,
        };
      },

      resign: () => {
        return {
          end: {
            winnerId: this.findOpponentByColour(colour).id,
            reason: 'resigned',
          },
          state: this.chess.fen(),
        };
      },

      disconnect: () => {
        return {
          end: {
            winnerId: this.findOpponentByColour(colour).id,
            reason: 'disconnected',
          },
          state: this.chess.fen(),
        };
      },

      offerDraw: () => {
        return {
          message: 'offer draw',
          state: this.chess.fen(),
        };
      }
    };

    return  actions[playerAction.type]();
  }
}
