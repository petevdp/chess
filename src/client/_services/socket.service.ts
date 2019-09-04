import IOClient from 'socket.io-client';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LobbyMessage, LobbyDetails, GameUpdate } from '../../common/types';

import config from '../app.config';
import { ConfigAPI } from '@babel/core';
import { useState } from 'react';
import { routeBy } from '../../common/helpers';
import { AuthService } from './auth.service';

export class SocketService {
  message$: Observable<LobbyMessage>;
  private socket: SocketIOClient.Socket;
  lobbyMessage$: Observable<LobbyMessage>;
  gameUpdate$: Observable<GameUpdate>;
  constructor(authService: AuthService) {
    this.socket = IOClient({
      query: { token: authService.token },
    });

    this.message$ = new Observable(subscriber => {
      this.socket.on('message', subscriber.next);
      console.log('new message!')
    });

    this.lobbyMessage$ = this.message$.pipe(
      routeBy('lobby')
    )

    this.gameUpdate$ = this.message$.pipe(
      routeBy('game')
    );
  }
}
