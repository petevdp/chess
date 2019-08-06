import { Rooms, Room } from './room';
import { Socket } from 'socket.io';
export class User {
  private _username: string = null;
  private room: Room;

  constructor(
    private socket: Socket,
    private rooms: Rooms
  ) {
    console.log('new user!')
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
  constructor(private io: any) {
    const rooms = new Rooms(io);
    io.on('connection', (socket: Socket) => {
      const user = new User(socket, rooms);
    });
  }
}
