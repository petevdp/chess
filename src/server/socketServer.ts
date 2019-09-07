import  IO from 'socket.io';
import { SocketClientMessage, SocketServerMessage, UserDetails } from '../common/types';
import { Observable } from 'rxjs';
import  HTTP from 'http';
import { SocketIoSharedSessionMiddleware } from 'express-socket.io-session';
import { DBQueries } from './db/queries';
import to from 'await-to-js';

export interface ClientConnectionInterface {
  clientMessage$: Observable<SocketClientMessage>;
  sendMessage: (SocketServerMessage) => void;
  isActive: boolean;
  user: UserDetails;
}
export class ClientConnection implements ClientConnectionInterface {
  clientMessage$: Observable<SocketClientMessage>;

  constructor(private socket: IO.Socket, public user: UserDetails) {
    this.clientMessage$ = new Observable(subscriber => {
      socket
        .on('message', msg => subscriber.next(msg))
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
    this.socket.send(message);
  }
}

export class SocketServer {
  clientConnections$: Observable<ClientConnection>;
  io: IO.Server;

  constructor(
    http: HTTP.Server,
    sharedSession: SocketIoSharedSessionMiddleware,
    queries: DBQueries
  ) {
    this.io = IO(http);

    this.io.use(sharedSession)

    this.io.use((socket, next) => {
      console.log('session: ', socket.handshake.session);
      next();
    });

    this.clientConnections$ = new Observable(subscriber => {
      this.io.on('connection', async (socket) => {
        const { userId } = socket.handshake.session;
        if (!userId) {
          console.log('no userid, disconnecting!');
          return socket.disconnect();
        }
        console.log('userid: ', userId);
        const [err, user] = await to(queries.getUserById(userId));
        if (err) {
          err.s
        }
        console.log('socket found user', user);
        console.log('new connection');
        subscriber.next(new ClientConnection(socket, user));
      });
    });
  }

  broadcast = options => {
    this.io.emit(options);
  }
}
