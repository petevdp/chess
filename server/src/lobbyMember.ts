import { Socket } from 'socket.io';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { ClientChallenge, User, LobbymemberDetails, SocketMessages } from 'APIInterfaces/types';
import { ChallengeStatus, Challenge } from './challenge';
import { Game } from './game';
import { LobbyStateValue } from './lobbyStateValue';

const { CHALLENGE_REQUEST, CHALLENGE_RESPONSE, LOBBY_MEMBER_UPDATE } = SocketMessages;

export interface MemberState {
  currentGame: Game|null;
}

export class LobbyMember implements LobbyStateValue {
  public stateSubject = new BehaviorSubject<MemberState>({ currentGame: null });

  constructor(
    public user: User,
    public socket: Socket,
    lobbyChallengeSubject: Subject<ClientChallenge>,
  ) {
    super(user.id);
    this.socket
      .on('challengeRequest', (clientChallenge: ClientChallenge) => {
      lobbyChallengeSubject.next(clientChallenge);
    });
  }

  get id() {
    return this.user.id;
  }

  get details() {
    return this.user;
  }

  cleanup() {
    throw new Error('what do');
  }


  queryCancelChallenge(challenge: Challenge): void {
    const cancelChallengeChannel = `cancelChallenge/${challenge.id}`;
    this.socket.on(cancelChallengeChannel, () => {
      challenge.subject.next(ChallengeStatus.cancelled);
    });
    challenge.subject.subscribe({
      complete: () => {
        this.socket.removeAllListeners(cancelChallengeChannel);
        this.socket.emit(`challengeResolution/${challenge.id}`, challenge.subject.getValue());
      }
    });
  }

  challenge(challenge: Challenge) {
    const challengeChannel = `challenge/${challenge.id}`;
    const { subject, ...clientChallenge } = challenge;
    this.socket.emit(challengeChannel,  clientChallenge);
    this.socket.on(`challengeResponse/${challenge.id}`, (isAccepted: boolean) => {
      const { accepted, declined } = ChallengeStatus;
      subject.next(isAccepted ? accepted : declined);
      subject.complete();
    });
    subject.subscribe({
      complete: () => {
        this.socket.removeAllListeners(challengeChannel);
        this.socket.emit(`challengeResolution/${challenge.id}`, subject.getValue());
      }
    });
  }

  updatePlayerIndex = (playerIndex: LobbymemberDetails[]) => {
    this.socket.emit('lobbyMemberUpdate', playerIndex);
  }
}
