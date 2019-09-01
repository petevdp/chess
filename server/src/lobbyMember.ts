import { Socket } from 'socket.io';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { ChallengeDetails, User, LobbyMemberDetails, LobbyDetails, GameDetails, ChallengeResolution, ChallengeOutcome } from '../../APIInterfaces/types';
import { Game } from './game';
import { StateComponent } from './lobbyCategory';
import { lobbyServerSignals, lobbyClientSignals } from '../../APIInterfaces/socketSignals';
import { map, filter, takeUntil, tap, first } from 'rxjs/operators';
import { Player } from './player';
import { rejects } from 'assert';
import { ClientConnection } from './clientSocketConnetions';

export interface Challenge {
  isCancelled: Promise<boolean>;
  details: ChallengeDetails;
}

interface MemberState {
  currentGame: string | null;
}

export interface LobbyMemberActions {
  resolveChallenge: (
    challengeDetails: ChallengeDetails,
    resolutionObservable: Observable<ChallengeResolution>
  ) => Observable<ChallengeResolution>;

  joinGame: (game: Game) => void;

  updateLobbyDetails: (details: LobbyDetails) => void;
}
// TODO: switch from socket.io to bare ws + observables.
export class LobbyMember implements StateComponent<LobbyMemberDetails, LobbyMemberActions> {
  challengeObservable: Observable<ChallengeDetails>;
  detailsObservable: Observable<LobbyMemberDetails>;
  actions: LobbyMemberActions;

  private stateSubject: BehaviorSubject<MemberState>;

  constructor(
    private connection: ClientConnection
  ) {
    const { messageObservable } = connection;
    this.challengeObservable = messageObservable.pipe(
      filter(msg => !!msg.challenge),
      map(msg => msg.challenge)
    );

    this.stateSubject = new BehaviorSubject({ currentGame: null });

    this.detailsObservable = this.stateSubject.pipe(map((memberState: MemberState) => ({
      ...memberState,
      ...this.user,
    })));

    this.actions = {
      joinGame: this.joinGame,
      resolveChallenge: this.challenge,
      updateLobbyDetails: this.updateLobbyDetails,
    };
  }

  get user() {
    return this.connection.user;
  }

  get id() {
    return this.user.id;
  }

  joinGame = (game: Game) => {
    this.stateSubject.next({ currentGame: game.id });
    game.addPlayer(this.connection);
  }

  challenge = (challengeDetails: ChallengeDetails, resolutionObservable: Observable<ChallengeResolution>) => {
    const { id, challengerId } = challengeDetails;
    const { messageObservable, sendMessage } = this.connection;

    const isOwnChallenge = () => (
      challengeDetails.challengerId === this.id
    );

    // give resolutionSubject valid responses
    const memberResolutionObservable = messageObservable.pipe(
      // complete when resolutionSubject completes
      filter(msg => (
        !!msg.challengeResponse

        // is correct challenge
        && msg.challengeResponse.id === id
        && (
          // you can't accept your own challenge
          msg.challengeResponse.response
          && isOwnChallenge()
        )
      )),
      map((msg): ChallengeResolution => {
        const { response } = msg.challengeResponse;

        // client can't accept own challenge, so only option is cancelled
        let outcome: ChallengeOutcome;

        if (isOwnChallenge()) {
          outcome = 'cancelled';
        } else {
          outcome = response
            ? 'accepted'
            : 'declined';
        }

        return { id, outcome };
      }),
      first(),
    );

    // issue response request
    sendMessage({
      lobby: {
        requestChallengeResponse: challengeDetails,
      }
    });

    // respond to resolution
    resolutionObservable.subscribe({
      next: resolution => sendMessage({
        lobby: {
          resolveChallenge: resolution,
        }
      })
    });

    return memberResolutionObservable;
  }

  updateLobbyDetails = (lobbyDetails: LobbyDetails) => {
    this.connection.sendMessage({
      lobby: {
        updateLobbyDetails: lobbyDetails,
      }
    });
  }
}
