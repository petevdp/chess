import { Socket } from 'socket.io';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { ChallengeDetails, User, LobbyMemberDetails, LobbyDetails, GameDetails } from '../../APIInterfaces/types';
import { Game } from './game';
import { StateComponent, LobbyState } from './lobbyStateValue';
import { lobbyServerSignals, lobbyClientSignals } from '../../APIInterfaces/socketSignals';
import { map } from 'rxjs/operators';
import { Player } from './player';
import { rejects } from 'assert';

export interface Challenge {
  isCancelled: Promise<boolean>;
  details: ChallengeDetails;
}

interface MemberState {
  currentGame: string|null;
}

export class LobbyMember implements LobbyState<LobbyMemberDetails> {
  challengeObservable: Observable<ChallengeDetails>;
  detailsStateComponent: StateComponent<LobbyMemberDetails>;

  private stateSubject: BehaviorSubject<MemberState>;

  constructor(
    private user: User,
    private socket: Socket,
  ) {
    this.challengeObservable = new Observable(subscriber => {
      this.socket.on(
        lobbyClientSignals.postChallenge(),
        subscriber.next
      );
      this.socket.on('disconnect', subscriber.complete);
    });

    this.stateSubject = new BehaviorSubject({currentGame: null});

    this.detailsStateComponent = {
      id: this.id,
      detailsObservable: this.stateSubject.pipe(map((memberState: MemberState) => ({
        ...memberState,
        ...user,
      }))),
    } as StateComponent<LobbyMemberDetails>;
  }

  get id() {
    return this.user.id;
  }

  joinGame(gameDetails: GameDetails) {
    // new Player()
  }

  challenge(challengeDetails: ChallengeDetails, resolutionSubject: Subject<boolean>) {
    const { id, challengerId } = challengeDetails;

    // issue response request
    this.socket.emit(lobbyServerSignals.requestChallengeResponse(), challengeDetails);

    // listen for responses
    this.socket.on(lobbyClientSignals.postChallengeResponse(id), (isAccepted: boolean) => {

      // you can't confirm your own challenge
      if (challengerId === this.id && isAccepted) {
        console.log('client attempted to accept own challenge');
        return;
      }
      resolutionSubject.next(isAccepted);
    });

    // respond to resolution
    resolutionSubject.subscribe({
      next: isAccepted => {
        this.socket.emit(lobbyServerSignals.resolveChallenge(id), isAccepted);
      },
      complete: () => {
        this.socket.removeAllListeners(lobbyClientSignals.postChallengeResponse(id));
      }
    });
  }

  updateLobbyDetails = (lobbyDetails: LobbyDetails) => {
    this.socket.emit(lobbyServerSignals.updateLobbyDetails(), lobbyDetails);
  }
}
