import IOClient from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocketServerMessage, UserDetails } from '../../common/types';

import { AuthService } from './auth.service';

export class SocketService {
  message$: Observable<SocketServerMessage>;
  private messageSubject: BehaviorSubject<SocketServerMessage>;
  private socket: SocketIOClient.Socket | null;
  // gameUpdate$: Observable<GameUpdate>;

  constructor(authService: AuthService) {
    // not assigning socket till init
    this.socket = null;
    this.messageSubject = new BehaviorSubject({});
    this.message$ = this.messageSubject.asObservable();
    authService.currentUser$.subscribe(user => (
      user && this.initSocket(user)
    ));
  }

  initSocket(user: UserDetails) {
    console.log('user at init', user);
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
