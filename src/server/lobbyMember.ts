import { BehaviorSubject, Observable } from 'rxjs';
import { map, filter, first } from 'rxjs/operators';
import { ClientConnection, ClientConnectionInterface } from './socketServer';
import { GameDetails, LobbyMemberDetails, ChallengeResolution, ChallengeDetails, ChallengeOutcome } from '../common/types';
import { HasDetails$ } from '../common/helpers';

export interface Challenge {
  isCancelled: Promise<boolean>;
  details: ChallengeDetails;
}

interface MemberState {
  currentGame: string | null;
}

// TODO: switch from socket.io to bare ws + observables.
export class LobbyMember implements HasDetails$<LobbyMemberDetails> {
  challenge$: Observable<ChallengeDetails>;
  details$: Observable<LobbyMemberDetails>;

  private stateSubject: BehaviorSubject<MemberState>;

  constructor(
    public connection: ClientConnection
  ) {
    const { clientMessage$: messageObservable } = connection;
    this.challenge$ = messageObservable.pipe(
      filter(msg => !!msg.challenge),
      map(msg => msg.challenge)
    );

    this.stateSubject = new BehaviorSubject({ currentGame: null });

    this.details$ = this.stateSubject.pipe(map((memberState: MemberState) => ({
      ...memberState,
      ...this.user,
    })));
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
    console.log('update details ', details);
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
