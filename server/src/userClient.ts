import { Socket } from 'socket.io';
import { Observable, Subscriber } from 'rxjs';
import { ClientChallenge, SocketMessages } from 'APIInterfaces/types';
import { CHALLENGE_RESPONSE } from 'APIInterfaces/socketSignals';
import { filter } from 'rxjs/operators';

const { POST_CHALLENGE: CHALLENGE_REQUEST } = SocketMessages;

export default class UserClient {
  challengeRequestObservable: Observable<ClientChallenge>;
  challengeResponseObservable: Observable<boolean>;

  constructor(
    private socket: Socket,
    isIngame: () => boolean,
    canChallenge: () => boolean,
    isBeingChallenged: () => boolean
  ) {

    // listens for requests for challenges to user
    this.challengeRequestObservable = new Observable<ClientChallenge>(subscriber => {
      this.socket.on(CHALLENGE_REQUEST, (clientChallenge: ClientChallenge) => {
        subscriber.next(clientChallenge);
      });
    }).pipe(filter(canChallenge));

    this.challengeResponseObservable = new Observable<boolean>(subscriber => {
      this.socket.on(CHALLENGE_RESPONSE, (isAccepted: boolean) => {
        subscriber.next(isAccepted);
      });
    }).pipe(filter(isBeingChallenged));
  }
}

export default class FakeLobbyMember {
  userClient: UserClient;
  private _isInGame = false;
  private _isBeingChallenged = false;

  constructor(
    private user: User,
    socket: Socket
  ) {
    this.userClient = new UserClient(
      socket,
      this.isIngame,
      this.canChallenge,
      this.isBeingChallenged
    );

    this.userClient.challengeRequestObservable.subscribe({
      next: (clientChallenge) => {
      }
    })
  }

  isIngame = () => this._isInGame;

  canChallenge = () => !this._isInGame;

  isBeingChallenged = () => this._isBeingChallenged;
}
