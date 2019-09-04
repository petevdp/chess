import  IO from 'socket.io';
import  uuidv4 from 'uuid/v4';
import { SocketClientMessage, SocketServerMessage } from '../../common/types';
import { Observable } from 'rxjs';
import  HTTP from 'http';

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

    this.io.use((socket, next) => {
      console.log(socket.handshake.query);
      next();
    });

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
