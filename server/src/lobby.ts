import * as io from 'socket.io';
import { LobbyMember, LobbyMemberActions } from './lobbyMember';
import { ChallengeDetails, User, LobbyMemberDetails, Map, LobbyDetails, GameDetails } from '../../APIInterfaces/types';
import { Subject, Observable } from 'rxjs';
import { Game, GameActions } from './game';
import { LobbyCategory } from './lobbyStateValue';

export class Lobby {
    detailsObservable: Observable<LobbyDetails>;
    private members: LobbyCategory<LobbyMemberDetails, LobbyMemberActions>;
    private games: LobbyCategory<GameDetails, GameActions>;
    private lobbyChallengeSubject: Subject<ChallengeDetails>;

  constructor() {
    this.members = new LobbyCategory<LobbyMemberDetails, LobbyMemberActions>();
    this.games = new LobbyCategory<GameDetails, GameActions>();
    this.lobbyChallengeSubject = new Subject();

    // resolve incoming challenges
    this.lobbyChallengeSubject.subscribe({
      next: (challengeDetails) => {
        const {challengerId, receiverId, id} = challengeDetails;
        const resolutionSubject = new Subject<boolean>();

        const receiver = this.members.componentActions[receiverId];
        if (!receiver) {
          throw new Error('receiver does not exist!');
        }
        const challenger = this.members.componentActions[challengerId];
        if (!challenger) {
          throw new Error('challenger does not exist!');
        }

        // ask involved members to resolve the challenge.
        // The receiver can accept or decline, and the challenger can cancel.
        receiver.resolveChallenge(challengeDetails, resolutionSubject);
        challenger.resolveChallenge(challengeDetails, resolutionSubject);

        // Resolution is handled by the members.
        resolutionSubject.subscribe({
          next: isAccepted => {
            // complete after only one value
            resolutionSubject.complete();
            const game = new Game();

            receiver.joinGame(game);
            challenger.joinGame(game);
            this.games.addComponent(game);
          }
        });
      }
    });
  }

  addLobbyMember(user: User, socket: io.Socket) {
    const member = new LobbyMember(user, socket);
    this.members.addStateComponent(member);
    member.challengeObservable.subscribe({
      next: this.lobbyChallengeSubject.next
    });
  }

  private resolveChallenge = (challengeDetails: ChallengeDetails) => {
  }
}
