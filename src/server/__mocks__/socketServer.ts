import { Subject } from 'rxjs';

import { IClientConnection } from '../server/socketServer';
import { SocketClientMessage, UserDetails } from '../../common/types';

// explicit mock since we don't want to have to pass in a socket.
export class MockClientConnection implements IClientConnection {
  constructor(public user: UserDetails) { }
  sendMessage = jest.fn();
  clientMessage$ = new Subject<SocketClientMessage>();
  complete () {
    this.clientMessage$.complete();
  }
  isActive = true;
}
