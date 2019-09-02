import  _ from 'lodash';
import { Observable, Subject, merge } from 'rxjs';
import { filter, map, shareReplay, takeWhile, startWith } from 'rxjs/operators';
import { Colour, GameDetails, GameUpdate } from '../../common/types';
import { StateComponent } from './lobbyCategory';
import  Chess from 'chess.js';
import uuidv4 from 'uuid/v4';
import { Player, PlayerAction } from './player';
import { ClientConnection } from './clientSocketConnetions';

export interface GameActions {
  temp: () => void;
}
export class Game implements StateComponent<GameDetails, GameActions> {
  private players: Player[];
  id: string;

  // TODO make type for gamestate
  detailsObservable: Observable<GameDetails>;
  actions = { temp: () => { } } as GameActions;
  gameUpdateObservable: Observable<GameUpdate>;

  requiredPlayerCount = 2;

  private chess: Chess;

  constructor(
    playerConnections: ClientConnection[]
  ) {
    this.id = uuidv4();

    const colours = _.shuffle(['b', 'w']) as Colour[];

    this.chess =  Chess();

    if (playerConnections.length !== 2) {
      throw new Error(`wrong number of players! should be: ${this.requiredPlayerCount}`);
    }

    this.players = _.zip(playerConnections, colours)
      .map(([connection, colour]) => new Player(connection, colour));

    const playerDetails = this.players.map(({details}) => details);
    const gameDetails = {
      id: this.id,
      playerDetails,
      state: this.chess.fen(),
    } as GameDetails;


    this.gameUpdateObservable = merge(
      ...this.players.map(p => p.playerActionObservable)
    ).pipe(
        filter(this.isValidPlayerAction),
        map(this.getGameUpdateFromAction),
        startWith({ start: gameDetails } as GameUpdate),

        // take until and including an update ending the game is issued
        takeWhile(({end}) => !end, true),
        shareReplay(1)
      );


    this.players.forEach(player => {
      this.gameUpdateObservable.subscribe(player.updateGame);
    });


    this.detailsObservable = this.gameUpdateObservable.pipe(
      map(({state}) => ({ ...gameDetails, state })),
      shareReplay(1)
    );
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

    return  actions[playerAction.type]();
  }
}
