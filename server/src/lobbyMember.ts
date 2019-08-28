import { Socket } from 'socket.io';
import { Subject, BehaviorSubject } from 'rxjs';
import { ChallengeDetails, User, LobbyMemberDetails } from '../../APIInterfaces/types';
import { Game } from './game';
import { LobbyStateValue } from './lobbyStateValue';
import { lobbyServerSignals, lobbyClientSignals } from '../../APIInterfaces/socketSignals';

export interface MemberState {
  currentGame: Game|null;
}

export interface Challenge {
  isCancelled: Promise<boolean>;
  details: ChallengeDetails;
}

export class LobbyMember implements LobbyStateValue<LobbyMemberDetails> {
  public stateSubject = new BehaviorSubject<MemberState>({ currentGame: null });

  constructor(
    public user: User,
    public socket: Socket,
    lobbyChallengeSubject: Subject<ChallengeDetails>,
  ) {
    this.socket.on(
      lobbyClientSignals.postChallenge(),
      (clientChallenge: ChallengeDetails) => {
        lobbyChallengeSubject.next(clientChallenge);
      }
    );
  }

  get id() {
    return this.user.id;
  }

  getCurrentGameId = (): string|null => (
    this.stateSubject.getValue().currentGame.id
  )

  getDetails() {
    return {
      ...this.user,
      currentGameId: this.getCurrentGameId(),
    };
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

  challenge(challengeDetails: ChallengeDetails) {
    const response = new Promise((resolve) => {
      this.socket.emit(lobbyServerSignals.requestChallengeResponse(), challengeDetails);
      this.socket.on(
        lobbyClientSignals.postChallengeResponse(challengeDetails.id),
        resolve
      );
    });
    response.finally(() => {
      this.socket.removeAllListeners(lobbyClientSignals.postChallengeResponse(challengeDetails.id));
    });
  }

  updateLobbyDetails = (lobbyDetails: LobbyMemberDetails[]) => {
    this.socket.emit(lobbyServerSignals.updateLobbyDetails(), lobbyDetails);
  }
}
