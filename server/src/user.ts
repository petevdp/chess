import { Rooms, Room } from './room';
import { Socket } from 'socket.io';
export class User {
  private _username = 'pete';
  private room: Room;

  constructor(
    public socket: Socket,
    private rooms: Rooms
  ) {
    console.log('new user!');
    // get rooms for client
    this.rooms.broadcastRoomsDetails();

    this.socket.on('ready for game', () => {

    });

    this.socket.on('set username', (username: string) => {
      this.username = username;
    } );

    this.socket.on('host', () => {
      this.room = this.rooms.addRoom(this);
    });

    this.socket.on('join', (room_id: string) => {
      // TODO make it impossible to join a room if you're already hosting
      const room = this.rooms.joinRoom(this, room_id) as Room;
      if (!room) {
        throw new Error('joined room doesn\'t exist!');
      }
    });
  }

  get username() {
    if (!this._username) {
      throw new Error('username not set');
  }
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
      console.log('connection:')
      console.log(socket.handshake.headers);
      const user = new User(socket, rooms);
    });
  }
}
