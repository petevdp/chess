import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { ClientConnection } from './clientSocketConnetions';
import { PlayerDetails, ClientPlayerAction, Colour, GameUpdate, } from '../../common/types';
// has one game associated with it.
export interface PlayerAction extends ClientPlayerAction {
  colour: Colour;
}
export class Player {

  playerActionObservable: Observable<PlayerAction>;
  ready: Promise<void>;

  constructor(
    private connection: ClientConnection,
    public colour: Colour
  ) {

    this.playerActionObservable = connection.messageObservable.pipe(
      filter(msg => !!msg.game),
      map(({game}) => ({...game, colour, playerId: this.id}))
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
      game: gameUpdate,
    });
  }
}
