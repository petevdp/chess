import { Rooms, Room } from './room';
import { Socket } from 'socket.io';
export class User {
  private _username: string;
  private room: Room;

  constructor(
    private socket: Socket,
    private rooms: Rooms
  ) {
    // get rooms for client
    socket.emit('rooms');
    this.socket.on('set username', (username: string) => {
      this.username = username;
    } );

    this.socket.on('host', () => {
      this.room = this.rooms.addRoom(this);
    })

    this.socket.on('join', (room_id: string) => {

    })
  }

  get username() {
    return this._username;
  }

  set username(username) {
    console.log('setting username');
    this._username = username;
  }

}
export class UsersController {
  constructor(
    private parent_io: any
  ) {
    const io = parent_io.of('/users');
    const rooms = new Rooms(io);
    io.on('connection', (socket: Socket) => (
      new User(socket, rooms)
    ));
  }
}
