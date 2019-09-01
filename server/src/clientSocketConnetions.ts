import * as IO from 'socket.io';
import * as uuidv4 from 'uuid/v4';
import { SocketClientMessage, SocketServerMessage } from '../../APIInterfaces/types';
import { Observable } from 'rxjs';

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

export default http => {
  const io = IO(http);

  const clientConnectionsObservable = new Observable(subscriber => {
    io.on('connection', socket => {
      subscriber.next(new ClientConnection(socket));
    });
  });


  return {
    clientConnectionsObservable,
    broadcast: (options => io.emit(options)),
  }
};
