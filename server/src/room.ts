import * as uuidv4 from 'uuid/v4';
import { User } from './user';

export class Room {
  players: any[];
  uuid: string;
  constructor(private host: User) {
    this.players = [];
    console.log('hosted!');
    this.uuid = `room/${uuidv4()}`;
  }
  addPlayer(user: User) {
  }

  get details() {
    return {
      room_id: this.uuid,
      host_username: this.host.username,
    }
  }

  join = user => {
    const joinable = () => this.players.length < 2;

    if (!joinable()) {
      throw new Error('room is full!');
    }
    this.players.push(user);
    console.log('player joined game!');
  }

}

export class Rooms {
  rooms: Array<Room>;

  constructor(
    private io,
  ) {
    this.rooms = [];
  }

  get roomsDetails() {
    return this.rooms.map(room => room.details);
  }

  broadcastRoomsDetails() {
    console.log('broadcasting rooms!')
    this.io.emit('room update', this.roomsDetails);
  }

  deleteRoom(uuid) {
    const index = this.rooms.findIndex(room => room.uuid === uuid);
  }

  addRoom(host: User): Room {
    const room = new Room(host);
    this.rooms.push(room);
    this.broadcastRoomsDetails();
    return room;
  }
}
