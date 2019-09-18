import  io from 'socket.io';
import { Observable, Subject } from 'rxjs';
import { mergeAll, reduce, map, tap, shareReplay, scan, pluck, filter } from 'rxjs/operators';

import { Game, GameActions, IGame } from './game';
import { LobbyMember, ILobbyMember } from './lobbyMember';
import { ChallengeDetails, UserDetails, LobbyMemberDetails, GameDetails, ChallengeResolution } from '../common/types';
import { ClientConnection, IClientConnection } from './socketServer';
import { allDetails, StateUpdate, updateMap } from '../common/helpers';

export interface ILobby {
  addLobbyMember: (connection: IClientConnection) => void;
  game$: Observable<IGame>;
  member$: Observable<ILobbyMember>;
}

export class Lobby {
  private members$: Observable<Map<string, LobbyMember>>;
  private memberDetails$: Observable<Map<string, LobbyMemberDetails>>;
  private gameDetails$: Observable<GameDetails[]>;
  private lobbyChallengeSubject: Subject<ChallengeDetails>;

  private members = {} as Map<string, LobbyMember>;
  private memberUpdateSubject: Subject<[string, LobbyMember|null]>;

  private gameSubject: Subject<Game>;

  constructor() {
    this.memberUpdateSubject = new Subject();
    this.gameSubject = new Subject<Game>();
    this.lobbyChallengeSubject = new Subject();

    this.members$ = new Observable


    this.memberDetails$ = this.memberUpdateSubject.pipe(
      filter(([id, member]) => !!member),
      map(([id, member]) => member.details$),
      mergeAll(),
      scan((acc, details) => {
        if (!details.leftLobby) {
          console.log('deleting ', details.username);
          acc.delete(details.id)
          return acc;
        }
        acc.set(details.id, details);
        return acc;
      }, new Map<string, LobbyMemberDetails>()),
      shareReplay(1)
    )

  }

  addLobbyMember = (client: ClientConnection) => {
    console.log('adding lobby member');
    const member = new LobbyMember(client);

    this.memberDetails$.subscribe(details => {
      member.updateLobbyMemberDetails(details);
    });

    member.details$.subscribe({
      complete: () => {
        this.memberUpdateSubject.next();
      }
    })

    this.memberUpdateSubject.next({id: member.id, value: member});
  }

  private createGame(members: LobbyMember[]) {
    const game = new Game(members.map(m => m.clientConnection));
    this.gameSubject.next(game);
  }
}
