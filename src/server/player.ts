import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { ClientConnection as IClientConnection } from './socketServer';
import {
  PlayerDetails,
  ClientPlayerAction,
  Colour,
  GameUpdate,
} from '../common/types';
// has one game associated with it.
export interface PlayerAction extends ClientPlayerAction {
  colour: Colour;
}
export class Player {

  playerActionObservable: Observable<PlayerAction>;
  ready: Promise<void>;

  constructor(
    private connection: IClientConnection,
    public colour: Colour
  ) {

    this.playerActionObservable = connection.clientMessage$.pipe(
      filter(msg => !!msg.makeMove),
      map(({makeMove}) => ({...makeMove, colour: this.colour}))
    );
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
