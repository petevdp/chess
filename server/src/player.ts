import { Socket } from 'socket.io';

import { Observable, Subject } from 'rxjs';

import { MoveDetails, GameDetails, PlayerDetails, User, GameState, ClientPlayerAction, Colour, } from '../../APIInterfaces/types';

import { gameClientSignals, gameServerSignals, lobbyServerSignals } from '../../APIInterfaces/socketSignals';

import { LobbyMember } from './lobbyMember';
import { promises } from 'fs';
import { takeUntil, filter } from 'rxjs/operators';

// has one game associated with it.
export interface PlayerAction extends ClientPlayerAction {
  colour: Colour;
}
export class Player {

  playerActionObservable: Observable<PlayerAction>;
  ready: Promise<void>;

  constructor(
    gameId: string,
    public user: User,
    private socket: Socket,
    public colour: Colour
  ) {

    this.playerActionObservable = new Observable(subscriber => {
      this.socket.on(gameClientSignals.takeAction(), (clientAction: ClientPlayerAction) => {
        if (clientAction.type === 'resign') {
          subscriber.complete();
        }
        subscriber.next({
          ...clientAction,
          colour,
        });
      });
      this.socket.on('disconnect', () => {
        subscriber.next({ type: 'disconnect', colour });
        subscriber.complete();
      });
    });
  }

  get id(){
    return this.user.id;
  }

  startGame(gameDetails: GameDetails) {

  }
  updateGame(gameUpdate: GameState) {}
}
