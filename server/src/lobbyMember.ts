import { Socket } from 'socket.io';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { ClientChallenge, User, LobbyMemberDetails, SocketChannel } from '../../APIInterfaces/types';
import { Challenge } from './challenge';
import { Game } from './game';
import { LobbyStateValue } from './lobbyStateValue';
import { serverSignals, clientSignals } from '../../APIInterfaces/socketSignals';

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
    this.socket.on(
      clientSignals.postChallenge(),
      (clientChallenge: ClientChallenge) => {
        lobbyChallengeSubject.next(clientChallenge);
      }
    );
  }

  get id() {
    return this.user.id;
  }

  get details() {
    return this.user;
  }

  cleanup() {
    this.stateSubject.complete();
    this.socket.disconnect();
  }


  queryCancelChallenge(challenge: Challenge): void {
    const { id, subject } = challenge;
    this.socket.on(clientSignals.postChallengeResponse(id), () => {
      challenge.subject.next('cancelled');
    });
    subject.subscribe({
      complete: () => {
        this.socket.removeAllListeners(clientSignals.postChallengeResponse(id));
        this.socket.emit(
          serverSignals.resolveChallenge(id),
          subject.getValue());
      }
    });
  }

  challenge(challenge: Challenge) {
    const { subject, clientChallenge, id } = challenge;
    this.socket.emit(serverSignals.requestChallengeResponse(),  clientChallenge);
    this.socket.on(
      clientSignals.postChallengeResponse(id),
      (isAccepted: boolean) => {
        subject.next(isAccepted
          ? 'accepted'
          : 'declined');
        subject.complete();
      });

    subject.subscribe({
      complete: () => {
        this.socket.removeAllListeners(clientSignals.postChallengeResponse(id));
        this.socket.emit(
          serverSignals.resolveChallenge(id),
          subject.getValue()
        );
      }
    });
  }

  updateLobbyDetails = (lobbyDetails: LobbyMemberDetails[]) => {
    this.socket.emit(serverSignals.updateLobbyDetails(), lobbyDetails);
  }
}
