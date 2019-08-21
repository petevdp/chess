import { Room } from './room';
import { Socket } from 'socket.io';
import { HOST_ROOM, JOIN_ROOM, UPDATE_PLAYER_INDEX, CHALLENGE_PLAYER, CHALLENGED, MAKE_MOVE, MOVE_MADE, ACCEPT_CHALLENGE } from 'APIInterfaces/socketSignals';
import { IPlayerDetails as PlayerDetails, Challenge, GameConfig, User, ClientMove } from 'APIInterfaces/types';
import { Observable } from 'rxjs';

export class Player {

  roomId: string;
  makeMove: any;

  constructor(
    public user: User,
    private socket: Socket,
    private challengePlayer: (string) => Void
  ) {
    console.log('new user!');
    this.socket
      .on(CHALLENGE_PLAYER, (receiverId) => {
        this.challengePlayer({
          challengerId: this.userId,
          receiverId,
        });
      })
      .on(MAKE_MOVE, (clientMove: ClientMove) => {
        // move needs to be validated by server first
        const emitMove = (move: ClientMove) =>  {
          this.socket.to(this.roomId).emit(MOVE_MADE, move);
        }
        this.makeMove(emitMove, clientMove);
      })
      .on('disconnect', () => {
        console.log('socket disconnected!');
      });
  }

  challenge(challenge): Observable<boolean> {
    this.socket.emit(CHALLENGED,  challenge);
    return new Observable(subscriber => {
      this.socket.on(ACCEPT_CHALLENGE, (isAccepted: boolean) => {
        subscriber.next(isAccepted);
        subscriber.unsubscribe();
      });
    })
  }

  updatePlayerIndex = (playerIndex: PlayerDetails[]) => {
    this.socket.emit(UPDATE_PLAYER_INDEX, playerIndex);
  }

  joinRoom(room: Room) {
    if (room) {
      throw new Error('already in room!');
    }
    this.roomId = room.id;
    room.addPlayer(this);
  }
}
