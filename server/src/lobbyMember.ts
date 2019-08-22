import { Room } from './room';
import { Socket } from 'socket.io';
import { Observable, Subscriber, Observer, Subject } from 'rxjs';

import {
  HOST_ROOM,
  JOIN_ROOM,
  UPDATE_PLAYER_INDEX,
  CHALLENGE_PLAYER,
  CHALLENGED,
  MAKE_MOVE,
  MOVE_MADE,
  ACCEPT_CHALLENGE
} from 'APIInterfaces/socketSignals';

import { Challenge, GameConfig, User, ClientMove, LobbymemberDetails } from 'APIInterfaces/types';

export class LobbyMember {
  challengeObservable: Observable<Challenge>;
  challengeObserver: Observer<Challenge>;

  constructor(
    public user: User,
    public socket: Socket,
    private lobbyChallengeSubject: Subject<Challenge>
  ) {
    this.socket.on(CHALLENGE_PLAYER, (challenge: Challenge) => {
      // todo make
      this.lobbyChallengeSubject.next(challenge);
    });
  }

  challenge(challenge): Observable<boolean> {
    this.socket.emit(CHALLENGED,  challenge);
    return new Observable(subscriber => {
      this.socket.on(ACCEPT_CHALLENGE, (isAccepted: boolean) => {
        subscriber.next(isAccepted);
        subscriber.unsubscribe();
      });
    });
  }

  updatePlayerIndex = (playerIndex: LobbymemberDetails[]) => {
    this.socket.emit(UPDATE_PLAYER_INDEX, playerIndex);
  }

}
export class old {

  roomId: string;
  makeMove: any;

  constructor(
    public user: User,
    private socket: Socket,
    private challengePlayer: (Challenge, Player) => void
  ) {
    console.log('new user!');
    this.socket
      .on(CHALLENGE_PLAYER, (receiverId) => {
        this.challengePlayer({
          challengerId: this.user.id,
          receiverId,
        }, this);
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
    });
  }

  challengeDeclined() {
    // TODO notify client
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
