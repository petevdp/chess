import  io from 'socket.io';
import { Observable, Subject } from 'rxjs';
import { mergeAll, reduce, map, tap, shareReplay, scan, pluck } from 'rxjs/operators';

import { Game, GameActions } from './game';
import { LobbyMember } from './lobbyMember';
import { ChallengeDetails, UserDetails, LobbyMemberDetails, Map, LobbyDetails, GameDetails, ChallengeResolution } from '../common/types';
import { ClientConnection } from './socketServer';
import { allDetails, StateUpdate, updateMap } from '../common/helpers';

export class Lobby {
  detailsObservable: Observable<LobbyDetails>;
  private allMembers$: Observable<Map<LobbyMember>>;
  private memberDetails$: Observable<LobbyMemberDetails[]>;
  private gameDetails$: Observable<GameDetails[]>;
  private lobbyChallengeSubject: Subject<ChallengeDetails>;

  private members = {} as Map<LobbyMember>;

  private memberUpdateSubject: Subject<StateUpdate<LobbyMember>>;
  private gameSubject: Subject<Game>;

  constructor() {
    this.memberUpdateSubject = new Subject();
    this.gameSubject = new Subject<Game>();
    this.lobbyChallengeSubject = new Subject();

    this.memberUpdateSubject.subscribe(member => {
      console.log('we got one bois');
    })

    this.allMembers$ = this.memberUpdateSubject.pipe(
      scan((acc, val) => updateMap<LobbyMember>(acc, val), {} as Map<LobbyMember>),
      tap(members => {
        console.log('tap dat');
        this.members = members;
      })
    )
    console.log('Im so confused');
    this.memberDetails$ = allDetails(
      this.memberUpdateSubject.pipe(pluck('value'))
    );

    this.gameDetails$ = allDetails(this.gameSubject);

    // resolve incoming challenges
    this.lobbyChallengeSubject.subscribe({
      next: (challengeDetails) => {
        const { challengerId, receiverId, id } = challengeDetails;
        const resolutionSubject = new Subject<ChallengeResolution>();

        const receiver = this.members[receiverId];
        if (!receiver) {
          throw new Error('receiver does not exist!');
        }
        const challenger = this.members[challengerId];
        if (!challenger) {
          throw new Error('challenger does not exist!');
        }

        resolutionSubject.subscribe({
          next: isAccepted => {
            // complete after only one value
            resolutionSubject.complete();
            this.createGame([receiver, challenger]);
          }
        });

        // ask involved members to resolve the challenge.
        // The receiver can accept or decline, and the challenger can cancel.
        [receiver, challenger].forEach(mem => {
          const memberResolutionObservable = mem.challenge(
            challengeDetails,
            resolutionSubject.asObservable()
          );

          memberResolutionObservable.subscribe(resolution => (
            resolutionSubject.next(resolution)
          ));
        });

      }
    });
  }

  addLobbyMember = (client: ClientConnection) => {
    console.log('adding lobby member');
    const member = new LobbyMember(client);
    member.challenge$.subscribe({
      next: challenge => this.lobbyChallengeSubject.next(challenge),
    });

    this.memberDetails$.subscribe(details => {
      member.updateLobbyMemberDetails(details);
    });

    member.details$.subscribe({
      complete: () => {
        this.memberUpdateSubject.next({id: member.id, value: null});
      }
    })

    this.memberUpdateSubject.next({id: member.id, value: member});
  }

  private createGame(members: LobbyMember[]) {
    const game = new Game(members.map(m => m.connection));
    this.gameSubject.next(game);
  }
}
