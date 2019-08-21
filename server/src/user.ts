import { Lobby, Room } from './room';
import { Socket } from 'socket.io';
import { HOST_ROOM, JOIN_ROOM, UPDATE_ROOM_INDEX } from 'APIInterfaces/socketSignals';
import { RoomDetails } from 'APIInterfaces/roomDetails';
export class User {

  constructor(
    private socket: Socket,
    private createRoom: (User) => Room,
    private joinRoom: (User, string) => Room
  ) {
    console.log('new user!');

    this.socket
      .on(HOST_ROOM, () => this.createRoom(this))
      .on(JOIN_ROOM, (room_id: string) => {
        this.joinRoom(this, room_id);
      })
      .on('disconnect', () => {
        console.log('socket disconnected!');
      });
  }

  updateRoomIndex = (roomsDetails: RoomDetails[]) => {
    this.socket.emit(UPDATE_ROOM_INDEX, roomsDetails);
  }
}
export class UsersController {
  constructor(private io: any) {
    const rooms = new Lobby(io);
  }
}
