import * as SocketIO from 'socket.io';
import { RoomsController } from './rooms';
import { UsersFactory } from './user';

function sockets(http: any) {
  const io = SocketIO(http);
  const roomsController = new RoomsController(io.of('/rooms'));
  const usersController = new UsersFactory(io);
  // const gamesController = new GamesController(io.of('/games'))
};

export default sockets;
