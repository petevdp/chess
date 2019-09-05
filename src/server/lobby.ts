import  io from 'socket.io';
import { LobbyMember, LobbyMemberActions } from './lobbyMember';
import { ChallengeDetails, UserDetails, LobbyMemberDetails, Map, LobbyDetails, GameDetails, ChallengeResolution } from '../common/types';
import { Subject, Observable } from 'rxjs';
import { Game, GameActions } from './game';
import { LobbyCategory } from './lobbyCategory';
import { ClientConnection } from './socketServer';

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
        const { challengerId, receiverId, id } = challengeDetails;
        const resolutionSubject = new Subject<ChallengeResolution>();

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
        [receiver, challenger].forEach(mem => {
          const memberResolutionObservable = mem.resolveChallenge(
            challengeDetails,
            resolutionSubject.asObservable()
          );

          memberResolutionObservable.subscribe(resolutionSubject.next);
        });

        resolutionSubject.subscribe({
          next: isAccepted => {
            // complete after only one value
            resolutionSubject.complete();
            this.createGame([receiver, challenger]);
          }
        });
      }
    });
  }

  addLobbyMember = (client: ClientConnection) => {
    console.log('adding lobby member');
    const member = new LobbyMember(client);
    member.challengeObservable.subscribe({
      next: this.lobbyChallengeSubject.next
    });

    this.members.detailsObservable.subscribe({
      next: details => {
        console.log('updating details!', details);
        member.updateLobbyMemberDetails(details);
      }
    });

    this.games.detailsObservable.subscribe({
      next: member.updateGameDetails
    });

    this.members.addComponent(member);
  }

  private createGame(members: LobbyMemberActions[]) {
    const game = new Game(members.map(m => m.connection));
    this.games.addComponent(game);
  }
}
