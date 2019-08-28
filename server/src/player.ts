import { Socket } from 'socket.io';

import { Observable, Subject } from 'rxjs';

import { ClientMove, GameConfig, GameDetails, PlayerDetails, User } from '../../APIInterfaces/types';

import { gameClientSignals, gameServerSignals } from '../../APIInterfaces/socketSignals';

import { LobbyMember } from './lobbyMember';
import { promises } from 'fs';

// has one game associated with it.
export class Player {

  socket: Socket;
  user: User;
  opponentMoveObservable: Observable<ClientMove>;
  moveObservable: Observable<ClientMove>;
  ready: Promise<void>;

  constructor(
    lobbyMember: LobbyMember,
    private gameDetails: () => GameDetails,
    public colour: string,
    moveSubject: Subject<ClientMove>,
  ) {
    this.socket = lobbyMember.socket;
    this.user = lobbyMember.user;


    this.socket.on(gameClientSignals.newMove(), (clientMove: ClientMove) => {
      moveSubject.next(clientMove);
    });
    this.moveObservable = moveSubject.asObservable();

    // returns promise which asks the client if they're ready,
    // and resolving or rejecting depending on the response.
    this.ready = new Promise<void>((resolve, reject) => {
      this.socket.emit(gameClientSignals.joinGame(), this.gameDetails());
      this.socket.on(gameClientSignals.ready(), isReady => {
        if (isReady) {
          resolve();
        } else {
          reject('player not ready');
        }
        this.socket.removeAllListeners(gameClientSignals.ready());
      });
    });

  }

  startGame() {
    this.socket.emit(gameServerSignals.start(), {
      gameConfig: this.gameDetails,
      colour: this.colour
    });
  }

  get details(): PlayerDetails {
    return {
      user: this.user,
      colour: this.colour,
    };
  }
}
