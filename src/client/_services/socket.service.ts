import IOClient from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LobbyMessage, LobbyDetails, GameUpdate, SocketServerMessage, SessionDetails } from '../../common/types';

import config from '../app.config';
import { ConfigAPI } from '@babel/core';
import { useState } from 'react';
import { routeBy } from '../../common/helpers';
import { AuthService } from './auth.service';

export class SocketService {
  message$: BehaviorSubject<SocketServerMessage>;
  private socket: SocketIOClient.Socket|undefined;
  // gameUpdate$: Observable<GameUpdate>;

  constructor(authService: AuthService) {
    this.message$ = new BehaviorSubject({});
    authService.currentSession$.subscribe(session => {
      session && this.initSocket(session.idToken);
    });
  }

  initSocket(token: string) {
    this.socket = IOClient('http://localhost:3000', {
      query: { token },
    });
    this.socket.on('message', this.message$.next);
  }

  complete() {
    this.message$.complete();
    this.socket && this.socket.disconnect();
  }
}
