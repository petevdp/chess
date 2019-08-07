import * as uuidv4 from 'uuid/v4';
import { User } from './user';
import { Server } from 'socket.io';
import { Game } from './game';

export class Room {
  users: User[] = [];
  uuid: string;
  constructor(host: User, private io: Server) {
    console.log('hosted!');
    this.uuid = `room/${uuidv4()}`;
    this.join(host);
    host.socket.emit('room create', this.uuid);
  }
  addPlayer(user: User) {
  }

  get host() {
    if (this.users.length < 0) {
      throw new Error('no host! room is empty!');
    }
    return this.users[0];
  }

  get details() {
    return {
      room_id: this.uuid,
      host_username: this.host.username,
    }
  }

  join(user) {
    const joinable = () => this.users.length < 2;

    if (!joinable()) {
      throw new Error('room is full!');
    }
    if (this.users.find(u => u === user)) {
      throw new Error('player already joined!');
    }
    this.users.push(user);

    user.socket.join(this.uuid);
    console.log('player joined game!');
    console.log('num users: ', this.users.length);

    if (this.users.length === 2) {
      this.startGame();
    }
  }

  private startGame(): void {
    const game = new Game(this);
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

  joinRoom(user: User, room_id: string): Room {
    const room = this.findRoom(room_id);
    room.join(user);
    return room;
  }

  addRoom(host: User): Room {
    const room = new Room(host, this.io);
    this.rooms.push(room);
    this.broadcastRoomsDetails();
    return room;
  }

  private findRoom(room_id): Room {
    return this.rooms.find(room => room.uuid === room_id);
  }
}
