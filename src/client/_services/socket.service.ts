import IOClient from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { SocketServerMessage } from '../../common/types';

import { AuthService } from './auth.service';

export class SocketService {
  message$: BehaviorSubject<SocketServerMessage>;
  private socket: SocketIOClient.Socket|undefined;
  // gameUpdate$: Observable<GameUpdate>;

  constructor(authService: AuthService) {
    this.message$ = new BehaviorSubject({});
    authService.currentUser$.subscribe(user => {
      user && this.initSocket();
    });
  }

  initSocket() {
    this.socket = IOClient('http://localhost:3000');
    this.socket.on('message', this.message$.next);
  }

  complete() {
    this.message$.complete();
    this.socket && this.socket.disconnect();
  }
}
