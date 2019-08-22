import { Room } from './room';
import io, { Socket } from 'socket.io';
import { LobbyMember } from './lobbyMember';
import { Challenge, User } from 'APIInterfaces/types';
import * as http from 'http';
import { Subject } from 'rxjs';

export class Lobby {
  playerIndex = [] as LobbyMember[];
  roomIndex = [] as Room[];
  private io: io.Server;
  private lobbyChallengeSubject: Subject<Challenge>;

  constructor(httpServer: http.Server) {
    this.io = io({
      httpServer
    });
    this.lobbyChallengeSubject = new Subject<Challenge>();

    this.io.on('connection', (socket: Socket) => {
      // TODO verify player and get userId, username, etc, and make sure there are no duplicate users
      const user = {
        id: 'placeholderID',
        username: 'placeholderusername',
      } as User;

      console.log('connection:');
      console.log(socket.handshake.headers);
      const player = new LobbyMember(
        user,
        socket,
        this.lobbyChallengeSubject
      );
      player.updatePlayerIndex(this.playerIndex);
    });
    this.lobbyChallengeSubject.subscribe({
      next: (challenge: Challenge) => {
        const receiver = this.findPlayer(challenge.receiverId);
        receiver.challenge(challenge).subscribe({
          next: (isAccepted: boolean) => {
            if (!isAccepted) {
              return;
            }
            const challenger = this.findPlayer(challenge.challengerId);
            this.createRoom([receiver, challenger]);
          }
        });
      }
    });
  }

  private challengePlayer = (challenge: Challenge, challenger: LobbyMember) => {

    const receiver = this.findPlayer(challenge.receiverId);
    if (!receiver) {
      throw new Error('receiver doesn\'t exist');
    }
    receiver.challenge(challenge).subscribe((isAccepted: boolean) => {
      if (isAccepted) {
        this.createRoom([challenger, receiver]);
      } else {
        challenger.challengeDeclined();
      }
    });
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

  joinRoom = (user: LobbyMember, room_id: string): Room => {
    const room = this.findRoom(room_id);
    room.join(user);
    return room;
  }

  createRoom = (players: LobbyMember[]): Room => {
    const room = new Room(players);
    this.roomIndex.push(room);
    return room;
  }

  /**
   * @param  {string} userId
   * @returns LobbyMember
   * j
   * Finds lobbyMember via userId
   * -1 if not found
   */
  private findPlayer(userId: string): LobbyMember {
    return this.playerIndex.find(player => player.user.id === userId);
  }

  private findRoom(room_id): Room {
    return this.roomIndex.find(room => room.id === room_id);
  }
}
