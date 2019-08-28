import { Socket } from 'socket.io';

import { Observable, Subject } from 'rxjs';

import { MoveDetails, GameDetails, PlayerDetails, User, GameUpdate, ClientGameAction, } from '../../APIInterfaces/types';

import { gameClientSignals, gameServerSignals, lobbyServerSignals } from '../../APIInterfaces/socketSignals';

import { LobbyMember } from './lobbyMember';
import { promises } from 'fs';
import { takeUntil, filter } from 'rxjs/operators';

// has one game associated with it.
export class Player {

  socket: Socket;
  user: User;
  playerActionObservable: Observable<ClientGameAction>;
  ready: Promise<void>;

  constructor(
    lobbyMember: LobbyMember,
    private gameDetails: GameDetails,
    public colour: string,
    private gameObservable: Observable<GameUpdate>
  ) {

    this.socket = lobbyMember.socket;
    this.user = lobbyMember.user;

    this.playerActionObservable = new Observable(subscriber => {
      this.socket.on(gameClientSignals.takeAction(), subscriber.next);
    });

    // returns promise which asks the client if they're ready,
    // and resolving or rejecting depending on the response.
    this.gameObservable
      // don't send players own moves back to him
      .pipe(filter((gameUpdate: GameUpdate) => (
        !gameUpdate.move
        || gameUpdate.move.details.playerId !== this.playerId
      )))
      .subscribe(gameUpdate => {
      this.socket.emit(gameServerSignals.gameUpdate());
    });
  }

  get details(): PlayerDetails {
    return {
      user: this.user,
      colour: this.colour,
    };
  }

  get playerId() {
    return this.user.id;
  }
}
