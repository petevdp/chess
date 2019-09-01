import * as _ from 'lodash';
import { Observable, Subject, merge } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { MoveDetails, Colour, GameDetails, User, PlayerDetails, ClientPlayerAction, GameState } from '../../APIInterfaces/types';
import { Server, Socket } from 'socket.io';
import { LobbyMember } from './lobbyMember';
// import {  } from '../../APIInterfaces/socketSignals';
import { StateComponent } from './lobbyStateValue';
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
  gameStateObservable: Observable<GameState>;
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
    const playerDetails = _.zip(
      _.shuffle(colours),
      this.players
    )
      .map(([colour, player]) => ({
        user: player.user,
        colour,
      })) as PlayerDetails[];

    this.chess = new Chess();


    const initialState = this.chess.fen();
    this.gameStateObservable = new Observable(subscriber => {
      this.players.forEach(player => {
        player.playerActionObservable.subscribe(subscriber.next);
      });
    }).pipe(
      filter(this.isInvalidAction),
      map(this.getGameStateFromAction)
    );


    this.players.forEach(player => {
      player.startGame({
        id: this.id,
        state: initialState,
        playerDetails,
      });
    });

    this.detailsObservable = this.gameStateSubject.pipe(
      map((state) => ({ id: this.id, playerDetails, state })),
      shareReplay(1)
    );

    this.gameStateSubject.next(this.chess.fen());
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
  };

  private isInvalidMove(move, colour) {
    return this.chess.turn() !== colour
    || !move
    || this.chess.moves({ square: move.from }).includes(move.to);
  }

  private isInvalidAction = ({ type, move, colour }: PlayerAction) => {
    return type === 'move' && this.isInvalidMove(move, colour);
  }

  private getGameStateFromAction(playerAction: PlayerAction): GameState {
    const actions = {
      move: () => {
        this.chess.move(playerAction.move);
        if (this.chess.in_checkmate()) {
          return {
            type: 'end',
            end: {
              winnerId: this.findOpponentByColour(playerAction.colour),
              reason: 'checkmate',
            },
            move: playerAction.move,
          };
        }

        if (this.chess.in_stalemate()) {
          return {
            type: 'end',
            end: {
              winnerId: null,
              reason: 'stalemate',
            },
            move: playerAction.move,
          };
        }

        if (this.chess.in_threefold_repitiion()) {
          return {
            type: 'end',
            end: {
              winnerId: null,
              reason: 'threefold repitiion',
            },
            move: playerAction.move,
          };
        }

        if (this.chess.in_draw()) {
          return {
            type: 'end',
            end: {
              winnerId: null,
              reason: 'draw',
            },
            move: playerAction.move,
          };
        }
      },

      resign: () => {
        return {
          type: 'end',
          end: {
            winnerId: this.findOpponentByColour(playerAction.colour),
            reason: 'resign',
          }
        };
      },

      disconnect: () => {
        return {
          type: 'end',
          end: {
            winnerId: this.findOpponentByColour(playerAction.colour),
            reason: 'disconnect',
          }
        };
      }
    };

    return actions[playerAction.type];
  }
}
