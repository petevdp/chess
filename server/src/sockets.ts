import * as SocketIO from 'socket.io';
import { Rooms } from './room';
import { UsersController } from './user';

function sockets(http: any) {
  const io = SocketIO(http);
  const roomsController = new Rooms(io.of('/rooms'));
  const usersController = new UsersController(io);
  // const gamesController = new GamesController(io.of('/games'))
};

export default sockets;
