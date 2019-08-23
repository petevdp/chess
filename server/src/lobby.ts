import io, { Socket } from 'socket.io';
import { LobbyMember, MemberState } from './lobbyMember';
import { ClientChallenge, User, SocketChannel, LobbymemberDetails, Map } from 'APIInterfaces/types';
import * as http from 'http';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChallengeStatus, Challenge, LobbyChallengesObservable } from './challenge';
import { Game } from './game';
import { GAME_START } from 'APIInterfaces/socketSignals';
import { LobbyStateValue } from './lobbyStateValue';


interface LobbyState {
  members: Map<LobbyMember>;
  games: Map<Game>;
}

export class Lobby {

  private io: io.Server;

  // for changes to state that affect the lobby client interface
  stateSubject: BehaviorSubject<LobbyState>;

  lobbyChallengeObserver: Observable<Challenge>;
  private lobbyClientChallengeSubject: Subject<ClientChallenge>;

  constructor(httpServer: http.Server) {
    this.io = io({
      httpServer
    });

    this.initStateSubject();


    this.lobbyClientChallengeSubject = new Subject();
    this.io.on('connection', (socket: Socket) => {
      // TODO verify player and get userId, username, etc, and make sure there are no duplicate users
      const user = {
        id: 'placeholderID',
        username: 'placeholderusername',
      } as User;
      this.addMember(user, socket);
    });


    this.lobbyChallengeObserver = this.lobbyClientChallengeSubject
      .pipe(map((clientChallenge) => ({
        ...clientChallenge,
        subject: new BehaviorSubject(ChallengeStatus.pending),
      })));

    this.lobbyChallengeObserver.subscribe(this.handleChallenge);
  }

  private addMember(user: User, socket: Socket) {
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
  private initStateSubject(): void {
    this.stateSubject = new BehaviorSubject({
      members: {},
      games: {},
    });

    this.stateSubject.subscribe(state => {
      this.io.emit('lobby update' as SocketChannel, state);
    });
  }

  /**
   * Asks lobby members to resolve input challenge, and creates a game if it's accepted.
   */
  private handleChallenge = (challenge: Challenge): void => {
    const challenger = this.state.members[challenge.challengerId];
    const receiver = this.state.members[challenge.receiverId];

    receiver.challenge(challenge);
    challenger.queryCancelChallenge(challenge);

    challenge.subject.subscribe(outcome => {
      console.log('outcome: ', outcome);
    });
    const { accepted }  = ChallengeStatus;

    challenge.subject.subscribe(outcome => {
      if (outcome === accepted) {
        const game = new Game([challenger, receiver]);
        [receiver, challenger].forEach(member => {
          member.stateSubject.next({ currentGame: game });
        });
        this.addStateValue('game', game);
      }
    });
  }
}
