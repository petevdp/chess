import { Room } from './room';
import io, { Socket } from 'socket.io';
import { Player } from './player';
import { Challenge, User } from 'APIInterfaces/types';
import * as http from 'http';

export class Lobby {
  playerIndex = [] as Player[];
  roomIndex = [] as Room[];
  private io: io.Server;

  constructor(httpServer: http.Server) {
    this.io = io({
      httpServer
    });

    this.io.on('connection', (socket: Socket) => {
      // TODO verify player and get userId, username, etc, and make sure there are no duplicate users
      const user = {
        userId: 'placeholderID',
        username: 'placeholderusername',
      } as User;

      console.log('connection:');
      console.log(socket.handshake.headers);
      const player = new Player(
        user,
        socket,
        this.challengePlayer
      );
      player.updatePlayerIndex(this.roomsDetails);
    });
  }

  private challengePlayer = (challenge: Challenge, challenger): Room => {

    const receiver = this.findPlayer(challenge.receiverId);
    if (!receiver) {
      throw new Error('receiver doesn\'t exist');
    }
    receiver.challenge(challenge).subscribe((isAccepted: boolean) => {
      this.createRoom([challenger, receiver])
    });
  }

  private findPlayer(userId) {
    return this.playerIndex.find(player => player.user.userId === userId);
  }

  get roomsDetails() {
    return this.rooms.map(room => room.details);
  }

  broadcastRoomsDetails() {
    console.log('broadcasting rooms!')
    this.io.emit('room update', this.roomsDetails);
  }

  deleteRoom(uuid) {
    const index = this.rooms.findIndex(room => room.id === uuid);
  }

  joinRoom = (user: Player, room_id: string): Room => {
    const room = this.findRoom(room_id);
    room.join(user);
    return room;
  }

  createRoom = (host: Player): Room => {
    const room = new Room(host, this.io);
    this.rooms.push(room);
    this.broadcastRoomsDetails();
    return room;
  }

  private findRoom(room_id): Room {
    return this.rooms.find(room => room.id === room_id);
  }
}
