import  IO, { Socket } from 'socket.io';
import { SocketClientMessage, SocketServerMessage, UserDetails } from '../common/types';
import { Observable } from 'rxjs';
import  HTTP from 'http';
import { SocketIoSharedSessionMiddleware } from 'express-socket.io-session';
import { DBQueries } from './db/queries';

export interface IClientConnection {
  clientMessage$: Observable<SocketClientMessage>;
  sendMessage: (socketServerMessage: SocketServerMessage) => void;
  isActive: boolean;
  user: UserDetails;
  complete: () => void;
}

export class ClientConnection implements IClientConnection {
  clientMessage$: Observable<SocketClientMessage>;

  constructor(private socket: IO.Socket, public user: UserDetails) {
    this.clientMessage$ = new Observable(subscriber => {
      socket
        .on('message', msg => subscriber.next(msg))
        .on('message', () => console.log('new message'))
        .on('disconnect', () => {
          console.log('I\'m disconnecting');
          subscriber.complete()
        });
    })
  }

  get isActive() {
    return this.socket.connected;
  }

  sendMessage(message: SocketServerMessage) {
    if (this.socket.disconnected) {
      return console.log('socket disconnected!');
    }
    this.socket.send(message);
  }
  complete(){
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
      next();
    });

    this.clientConnections$ = new Observable(subscriber => {
      this.io.on('connection', async (socket) => {
        const { userId } = socket.handshake.session;
        if (!userId) {
          return socket.disconnect();
        }

        const user = await queries.getUser({id: userId});
        subscriber.next(new ClientConnection(socket, user));
      });
    });
  }

  broadcast = options => {
    this.io.emit(options);
  }
}
