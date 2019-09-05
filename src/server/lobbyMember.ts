import { BehaviorSubject, Observable } from 'rxjs';
import { StateComponent } from './lobbyCategory';
import { map, filter, first } from 'rxjs/operators';
import { ClientConnection, ClientConnectionInterface } from './socketServer';
import { GameDetails, LobbyMemberDetails, ChallengeResolution, ChallengeDetails, ChallengeOutcome } from '../common/types';

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
    resolutionObservable: Observable<ChallengeResolution>,
  ) => Observable<ChallengeResolution>;

  connection: ClientConnection;

  updateGameDetails: (details: GameDetails[]) => void;
  updateLobbymemberDetails: (details: LobbyMemberDetails[]) => void;
}
// TODO: switch from socket.io to bare ws + observables.
export class LobbyMember implements StateComponent<LobbyMemberDetails, LobbyMemberActions> {
  challengeObservable: Observable<ChallengeDetails>;
  details$: Observable<LobbyMemberDetails>;
  actions: LobbyMemberActions;

  private stateSubject: BehaviorSubject<MemberState>;

  constructor(
    private connection: ClientConnectionInterface
  ) {
    const { clientMessage$: messageObservable } = connection;
    this.challengeObservable = messageObservable.pipe(
      filter(msg => !!msg.challenge),
      map(msg => msg.challenge)
    );

    this.stateSubject = new BehaviorSubject({ currentGame: null });

    this.details$ = this.stateSubject.pipe(map((memberState: MemberState) => ({
      ...memberState,
      ...this.user,
    })));

    this.actions = {
      resolveChallenge: this.challenge,
      updateLobbymemberDetails: this.updateLobbyMemberDetails,
      updateGameDetails: this.updateGameDetails,
      connection: this.connection,
    } as LobbyMemberActions;
  }

  get user() {
    return this.connection.user;
  }

  get id() {
    return this.user.id;
  }

  challenge = (challengeDetails: ChallengeDetails, resolutionObservable: Observable<ChallengeResolution>) => {
    const { id } = challengeDetails;
    const { clientMessage$: messageObservable, sendMessage } = this.connection;

    const isOwnChallenge = () => (
      challengeDetails.challengerId === this.id
    );

    // give resolutionSubject valid responses
    const memberResolutionObservable = messageObservable.pipe(
      // complete when resolutionSubject completes
      filter(msg => (
        !!msg.challengeResponse

        // is correct challenge
        && msg.challengeResponse.challengeId === id
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

  updateLobbyMemberDetails = (details: LobbyMemberDetails[]) => {
    console.log('update details');
    this.connection.sendMessage({
      lobby: {
        updateLobbyMemberDetails: details
      }
    })
  }

  updateGameDetails = (details: GameDetails[]) => {
    this.connection.sendMessage({
      lobby: {
        updateGameDetails: details
      }
    })
  }
}
