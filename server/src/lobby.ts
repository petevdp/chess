import * as io from 'socket.io';
import { LobbyMember, MemberState } from './lobbyMember';
import { ChallengeDetails, User, LobbyMemberDetails, Map, LobbyDetails } from '../../APIInterfaces/types';
import * as http from 'http';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Challenge } from './lobbyMember';
import { Game } from './game';
import { lobbyServerSignals, lobbyClientSignals } from '../../APIInterfaces/socketSignals';
import { LobbyStateValue } from './lobbyStateValue';


interface LobbyState {
  members: Map<LobbyMember>;
  games: Map<Game>;
}

export class Lobby {

  private io: io.Server;

  // for changes to state that affect the lobby client interface
  stateSubject: BehaviorSubject<LobbyState>;
  lobbyDetailsObservable: Observable<LobbyDetails>;

  lobbyChallengeObservable: Observable<Challenge>;
  private lobbyClientChallengeSubject: Subject<ChallengeDetails>;

  constructor(httpServer: http.Server) {
    this.io = io(httpServer);

    this.initState();


    this.lobbyClientChallengeSubject = new Subject();
    this.io.on('connection', (socket: io.Socket) => {
      // TODO verify player and get userId, username, etc, and make sure there are no duplicate users
      const user = {
        id: 'placeholderID',
        username: 'placeholderusername',
      } as User;
      this.addMember(user, socket);
    });

    this.lobbyClientChallengeSubject.subscribe(this.handleChallenge);
  }

  private addMember(user: User, socket: io.Socket) {
    const member = new LobbyMember(
      user,
      socket,
      this.lobbyClientChallengeSubject
    );

    this.addStateValue('member', member);

    socket.on('disconnect', () => {
      this.deleteStateValue('member', member.id);
    });
  }

  close() {
    return new Promise((resolve) => {
      this.lobbyClientChallengeSubject.complete();
      this.stateSubject.complete();
      this.io.close(() => resolve());
    });
  }

  deleteStateValue(category, id: string) {
    const {
      [id]: removed,
      ...challengableMembers
    } = this.state[category];

    this.setState({
      ...this.state,
      [category]: challengableMembers,
    });
  }
  /**
   * adds a new value to the lobby state in the given category
   */
  addStateValue(category: 'game' | 'member', value: LobbyStateValue): void {
    const state = this.state;
    this.setState({
      [category]: {
        ...value[category],
        [value.id]: state,
      }
    });
  }

  get state(): LobbyState {
    return this.stateSubject.getValue();
  }
  /**
   * ghetto react
   */
  private setState(newState) {
    this.stateSubject.next({
      ...this.state,
      ...newState,
    });
  }
  /**
   * initialize state subject, and emit stream to client
   */
  private initState(): void {
    this.stateSubject = new BehaviorSubject({
      members: {},
      games: {},
    });


    const getCategoryDetails = (category: any) => (
      Object.values(category).map((obj: any) => obj.getDetails())
    );

    const lobbyStateToDetails = (state: LobbyState) => {
      return {
        members: getCategoryDetails(state.members),
        games: getCategoryDetails(state.games),
      };
    };

    // send state details to client
    this.lobbyDetailsObservable = this.stateSubject
      .pipe(
        map(lobbyStateToDetails),
        shareReplay(1)
      );

    this.lobbyChallengeObservable.subscribe({
        next: (details) => {
          this.io.emit(lobbyServerSignals.updateLobbyDetails(), details);
        }
      });
  }

  /**
   * Asks lobby members to resolve input challenge, and creates a game if it's accepted.
   */
  private handleChallenge = async (challenge: Challenge): void => {
    const { details, isCancelled } = challenge;
    const challenger = this.state.members[details.challengerId];
    const receiver = this.state.members[details.receiverId];

    const outcome = await Promise.race([
      receiver.challenge(details),
      isCancelled
    ]);
    if (outcome) {
      this.addStateValue('game', new Game([receiver, challenger]));
      return;
    }
    console.log('cancelled');
  }
}
