import { Socket } from 'socket.io';

import { Observable, Subject } from 'rxjs';

import { GameDetails, PlayerDetails, User, ClientPlayerAction, Colour, GameUpdate, } from '../../APIInterfaces/types';

import { gameClientSignals, gameServerSignals, lobbyServerSignals } from '../../APIInterfaces/socketSignals';

import { LobbyMember } from './lobbyMember';
import { promises } from 'fs';
import { takeUntil, filter, map } from 'rxjs/operators';
import { ClientConnection } from './clientSocketConnetions';

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

  get id(){
    return this.user.id;
  }

  get details(): PlayerDetails {
    return {
      user: this.user,
      colour: this.colour,
    };
  }

  startGame(gameDetails: GameDetails) {
  }

  updateGame(gameUpdate: GameUpdate) {
    this.connection.sendMessage({
      game: gameUpdate,
    });
  }
}
