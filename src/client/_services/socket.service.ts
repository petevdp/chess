import IOClient from 'socket.io-client';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LobbyMessage, LobbyDetails, GameUpdate } from '../../common/types';

import config from '../app.config';
import { ConfigAPI } from '@babel/core';
import { useState } from 'react';
import { routeMessage } from '../../common/helpers';

export class SocketService {
  $ message$: Observable<LobbyMessage>;
  private socket: SocketIOClient.Socket;
  lobbyMessage$: Observable<LobbyMessage>;
  gameUpdate$: Observable<GameUpdate>;
  constructor() {
    this.socket = IOClient.connect(`http://${HOST}:3001`);
    this.message$ = new Observable(subscriber => {
      this.socket.on('message', subscriber.next);
    });

    this.lobbyMessage$ = this.message$.pipe(
      routeMessage('lobby')
    )

    this.gameUpdate$ = this.message$.pipe(
      routeMessage('game')
    );
  }
}
