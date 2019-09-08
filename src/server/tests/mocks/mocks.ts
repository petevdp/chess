import { IClientConnection } from '../../socketServer'
import { UserDetails, SocketClientMessage, SocketServerMessage } from '../../../common/types';
import { Subject, Observable } from 'rxjs';

export class MockClientConnection implements IClientConnection {
  clientMessageSubject = new Subject<SocketClientMessage>();
  serverMessageSubject = new Subject<SocketServerMessage>();
  clientMessage$: Observable<SocketClientMessage>;
  serverMessage$: Observable<SocketServerMessage>;
  isActive: true;

  constructor(public user: UserDetails) {
    this.clientMessage$ = this.clientMessageSubject.asObservable();
    this.serverMessage$ = this.serverMessageSubject.asObservable();
  }

  sendMessage(message: SocketServerMessage) {
    this.serverMessageSubject.next(message)
  }

  complete() {
    this.clientMessageSubject.complete();
    this.serverMessageSubject.complete();
  }
}
