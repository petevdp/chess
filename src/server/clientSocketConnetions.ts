import  IO from 'socket.io';
import  uuidv4 from 'uuid/v4';
import { SocketClientMessage, SocketServerMessage, UserDetails } from '../common/types';
import { Observable } from 'rxjs';
import  HTTP from 'http';
import { SocketIoSharedSessionMiddleware } from 'express-socket.io-session';
import { DBQueries } from './db/queries';

// TODO websocket user auth
export class ClientConnection {
  messageObservable: Observable<SocketClientMessage>;

  constructor(private socket: IO.Socket, public user: UserDetails) {
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

    this.clientConnectionsObservable = new Observable(subscriber => {
      this.io.on('connection', async (socket) => {
        const { userId } = socket.handshake.session;
        console.log('userid: ', userId);
        const { rows } = await queries.getUserById(userId);
        const user = rows[0] as UserDetails;
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
