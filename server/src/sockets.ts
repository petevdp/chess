import * as SocketIO from 'socket.io';
import { UsersController } from './user';

function sockets(http: any) {
  const io = SocketIO(http);
  const usersController = new UsersController(io);
  // const gamesController = new GamesController(io.of('/games'))
};

export default sockets;
