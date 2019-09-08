import IOClient from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketServerMessage, UserDetails } from '../../common/types';

import { AuthService } from './auth.service';
import { useObservable } from 'rxjs-hooks';
import { first } from 'rxjs/operators';

export class SocketService {
  message$: Observable<SocketServerMessage>;
  private messageSubject: BehaviorSubject<SocketServerMessage>;
  private socket = null as SocketIOClient.Socket | null;
  // gameUpdate$: Observable<GameUpdate>;

  constructor(authService: AuthService) {
    // not assigning socket till init
    console.log('socket update!');

    this.messageSubject = new BehaviorSubject({});
    this.message$ = this.messageSubject.asObservable();
    authService.currentUser$.subscribe(user => {
    if (this.socket) {
      this.socket.disconnect();
    }
    if (user) {
      this.initSocket(user);
    }
  });
  }

  initSocket(user: UserDetails) {
    this.socket = IOClient('http://localhost:3000');
    this.socket.on('message', (msg: SocketServerMessage) => {
      this.messageSubject.next(msg);
      console.log('msg: ', msg);
    })
    .on('disconnect', () => {
      console.log('socket disconnected!');
      this.messageSubject.complete();
    })
  }

  complete() {
    this.messageSubject.complete();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
