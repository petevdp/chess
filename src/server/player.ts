import { Observable } from 'rxjs';
import { filter, map, first } from 'rxjs/operators';

import { ClientConnection as IClientConnection, ClientConnection } from './socketServer';
import {
  PlayerDetails,
  ClientPlayerAction,
  Colour,
  GameUpdate,
  CompleteGameInfo,
} from '../common/types';
// has one game associated with it.
export interface PlayerAction extends ClientPlayerAction {
  colour: Colour;
}
export class Player {

  playerActionObservable: Observable<PlayerAction>;
  ready: Promise<void>;

  constructor(
    private connection: ClientConnection,
    public colour: Colour,
    completeGameInfo$: Observable<CompleteGameInfo>
  ) {

    this.playerActionObservable = connection.clientMessage$.pipe(
      filter(msg => !!msg.makeMove),
      map(({makeMove}) => ({...makeMove, colour: this.colour}))
    );

    completeGameInfo$.pipe(
      filter(info => !!info),
      first()
    ).subscribe({
      next: info => {
        if (!info) {
          return;
        }
        this.connection.sendMessage({
          game: {
            loadGame: info,
          }
        })
      }
    })
  }

  get user() {
    return this.connection.user;
  }

  get id() {
    return this.user.id;
  }

  get details(): PlayerDetails {
    return {
      user: this.user,
      colour: this.colour,
    };
  }

  updateGame(gameUpdate: GameUpdate) {
    this.connection.sendMessage({
      game: { gameUpdate },
    });
  }
}
