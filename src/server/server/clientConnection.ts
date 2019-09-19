import { Observable } from "rxjs";
import { SocketClientMessage, SocketServerMessage, UserDetails } from "../../common/types";
import WebSocket from 'ws';


export interface IClientConnection {
  clientMessage$: Observable<SocketClientMessage>;
  sendMessage: (socketServerMessage: SocketServerMessage) => void;
  isActive: boolean;
  user: UserDetails;
  complete: () => void;
}

export class ClientConnection implements IClientConnection {
  clientMessage$: Observable<SocketClientMessage>;

  constructor(private ws: WebSocket, public user: UserDetails) {
    this.clientMessage$ = new Observable(subscriber => {
      ws
        .on('message', msg => subscriber.next(msg))
        .on('message', () => console.log('new message'))
        .on('close', () => {
          console.log('I\'m disconnecting');
          subscriber.complete()
        });
    })
  }

  get isActive() {
    return this.ws.readyState === this.ws.OPEN;
  }

  sendMessage(message: SocketServerMessage) {
    if (!this.isActive) {
      return console.log('socket disconnected!');
    }
    this.ws.send(message);
  }
  complete() {
  }
}
