import IOClient from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketServerMessage, UserDetails, SocketClientMessage } from '../../common/types';

import { AuthService } from './auth.service';
import { useObservable } from 'rxjs-hooks';
import { first } from 'rxjs/operators';

export class SocketService {
  serverMessage$: Observable<SocketServerMessage>;
  private serverMessageSubject: BehaviorSubject<SocketServerMessage>;
  private socket = null as SocketIOClient.Socket | null;

  private clientMessageSubject

  constructor(authService: AuthService) {
    // not assigning socket till init
    console.log('socket update!');

    this.serverMessageSubject = new BehaviorSubject({});
    this.serverMessage$ = this.serverMessageSubject.asObservable();
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
      this.serverMessageSubject.next(msg);
      console.log('msg: ', msg);
    })
    .on('disconnect', () => {
      console.log('socket disconnected!');
      this.serverMessageSubject.complete();
    })
  }

  complete() {
    this.serverMessageSubject.complete();
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  sendMessageToServer = (msg: SocketClientMessage) => (this.socket && this.socket.send(msg))
}
