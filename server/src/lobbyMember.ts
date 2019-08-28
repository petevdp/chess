import { Socket } from 'socket.io';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { ClientChallenge, User, LobbyMemberDetails, SocketChannel } from '../../APIInterfaces/types';
import { Challenge } from './challenge';
import { Game } from './game';
import { LobbyStateValue } from './lobbyStateValue';
import { lobbyServerSignals, lobbyClientSignals } from '../../APIInterfaces/socketSignals';

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
      lobbyClientSignals.postChallenge(),
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
    this.socket.on(lobbyClientSignals.postChallengeResponse(id), () => {
      challenge.subject.next('cancelled');
    });
    subject.subscribe({
      complete: () => {
        this.socket.removeAllListeners(lobbyClientSignals.postChallengeResponse(id));
        this.socket.emit(
          lobbyServerSignals.resolveChallenge(id),
          subject.getValue());
      }
    });
  }

  challenge(challenge: Challenge) {
    const { subject, clientChallenge, id } = challenge;
    this.socket.emit(lobbyServerSignals.requestChallengeResponse(),  clientChallenge);
    this.socket.on(
      lobbyClientSignals.postChallengeResponse(id),
      (isAccepted: boolean) => {
        subject.next(isAccepted
          ? 'accepted'
          : 'declined');
        subject.complete();
      });

    subject.subscribe({
      complete: () => {
        this.socket.removeAllListeners(lobbyClientSignals.postChallengeResponse(id));
        this.socket.emit(
          lobbyServerSignals.resolveChallenge(id),
          subject.getValue()
        );
      }
    });
  }

  updateLobbyDetails = (lobbyDetails: LobbyMemberDetails[]) => {
    this.socket.emit(lobbyServerSignals.updateLobbyDetails(), lobbyDetails);
  }
}
