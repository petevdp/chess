import * as IO from 'socket.io';
import * as uuidv4 from 'uuid/v4';
import { SocketClientMessage, SocketServerMessage } from '../../APIInterfaces/types';
import { Observable } from 'rxjs';
import * as HTTP from 'http';

// TODO websocket user auth
export class ClientConnection {
  messageObservable: Observable<SocketClientMessage>;
  user = {
    id: uuidv4(),
    username: 'placeholder',
  };

  constructor(private socket: IO.Socket) {
    this.messageObservable = new Observable(subscriber => {
      socket
        .on('message', subscriber.next)
        .on('disconnect', () => subscriber.complete());
    });
  }

  get isActive() {
    return this.socket.connected;
  }

  sendMessage(message: SocketServerMessage) {
    if (this.socket.disconnected) {
      throw new Error('socket is disconnected!');
    }
    this.socket.send('message', message);
  }
}

export class SocketServer {
  clientConnectionsObservable: Observable<ClientConnection>;
  io: IO.Server;

  constructor(http: HTTP.Server) {
    this.io = IO(http);

    this.clientConnectionsObservable = new Observable(subscriber => {
      this.io.on('connection', socket => {
        subscriber.next(new ClientConnection(socket));
      });
    });
  }

  broadcast = options => {
    this.io.emit(options);
  }
}
