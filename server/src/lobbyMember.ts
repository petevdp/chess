import { Room } from './room';
import { Socket } from 'socket.io';
import { Observable, Subscriber, Observer, Subject, BehaviorSubject } from 'rxjs';

import {
  HOST_ROOM,
  JOIN_ROOM,
  UPDATE_PLAYER_INDEX,
  CHALLENGE_PLAYER,
  CHALLENGED,
  MAKE_MOVE,
  MOVE_MADE,
} from 'APIInterfaces/socketSignals';

import { ClientChallenge, GameConfig, User, ClientMove, LobbymemberDetails, SocketMessages } from 'APIInterfaces/types';
import { ChallengeStatus, Challenge } from './challenge';

const { CHALLENGE_REQUEST: POST_CHALLENGE, CHALLENGE_RESPONSE, LOBBY_MEMBER_UPDATE } = SocketMessages;


export class LobbyMember {
  inGame: false;

  constructor(
    public user: User,
    public socket: Socket,
    private lobbyChallengeSubject: Subject<ClientChallenge>,
  ) {
    this.socket
      .on(POST_CHALLENGE, (clientChallenge: ClientChallenge) => {
      this.lobbyChallengeSubject.next(clientChallenge);
    });
  }

  get isChallengable {
    return this.inGame;
  }

  queryCancelChallenge(challenge: Challenge): void {
    const cancelChallengeChannel = `cancelChallenge/${challenge.id}`;
    this.socket.on(cancelChallengeChannel, () => {
      challenge.subject.next(ChallengeStatus.cancelled);
    });
    challenge.subject.subscribe({
      complete: () => {
        this.socket.removeAllListeners(cancelChallengeChannel);
        this.socket.emit(`challengeOutcome/${challenge.id}`, challenge.subject.getValue());
      }
    });
  }

  challenge(challenge: Challenge) {
    const challengeChannel = `challenge/${challenge.id}`;
    const { subject, ...clientChallenge } = challenge;
    this.socket.emit(challengeChannel,  clientChallenge);
    this.socket.on(CHALLENGE_RESPONSE, (isAccepted: boolean) => {
      const { accepted, declined } = ChallengeStatus;
      subject.next(isAccepted ? accepted : declined);
      subject.complete();
    });
    subject.subscribe({
      complete: () => {
        this.socket.removeAllListeners(challengeChannel);
        this.socket.emit(`challengeOutcome/${challenge.id}`, subject.getValue());
      }
    });
  }

  updatePlayerIndex = (playerIndex: LobbymemberDetails[]) => {
    this.socket.emit(LOBBY_MEMBER_UPDATE, playerIndex);
  }
}
