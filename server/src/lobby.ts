import { Room } from './room';
import io, { Socket } from 'socket.io';
import { LobbyMember, MemberState } from './lobbyMember';
import { ClientChallenge, User, SocketMessages, LobbymemberDetails } from 'APIInterfaces/types';
import * as http from 'http';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChallengeStatus, Challenge, LobbyChallengesObservable } from './challenge';
import { Game } from './game';
import { GAME_START } from 'APIInterfaces/socketSignals';
import { LobbyStateValue } from './lobbyStateValue';

const { LOBBY_MEMBER_UPDATE } = SocketMessages;
// -> lobby member change -> new lobby member state

interface Map<T> {
  [id: string]: T;
}

interface LobbyState {
  members: Map<LobbyMember>;
  games: Map<Game>;
}

export class Lobby {

  private io: io.Server;


  stateSubject: BehaviorSubject<LobbyState>;

  lobbyChallengeObserver: Observable<Challenge>;

  constructor(httpServer: http.Server) {
    this.io = io({
      httpServer
    });
    const lobbyClientChallengeSubject = new Subject<ClientChallenge>();
    this.stateSubject = new BehaviorSubject({
      members: {},
      games: {},
    });

    this.io.on('connection', (socket: Socket) => {
      // TODO verify player and get userId, username, etc, and make sure there are no duplicate users
      const user = {
        id: 'placeholderID',
        username: 'placeholderusername',
      } as User;

      console.log('connection:');
      console.log(socket.handshake.headers);
      const member = new LobbyMember(
        user,
        socket,
        lobbyClientChallengeSubject
      );

      this.addStateValue('member', member);

      socket.on('disconnect', () => {
        this.deleteStateValue('member', member.id);
      });
    });


    this.lobbyChallengeObserver = lobbyClientChallengeSubject
      .pipe(map((clientChallenge) => ({
        ...clientChallenge,
        subject: new BehaviorSubject(ChallengeStatus.pending),
      })));

    // resolve challenges into games
    this.lobbyChallengeObserver.subscribe((challenge) => {
      const receiver = this.findLobbymember(challenge.receiverId);
      const challenger = this.findLobbymember(challenge.challengerId);

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

  addStateValue(category: 'game' | 'member', value: LobbyStateValue): void {
    const state = this.state;
    this.setState({
      ...state,
      [category]: {
        ...value[category],
        [value.id]: state,
      }
    });
  }

  get state(): LobbyState {
    return this.stateSubject.getValue();
  }

  // ghetto react
  setState(newState: LobbyState) {
    this.stateSubject.next(newState);
  }

  broadcastLobbyMemberIndexUpdates(members: LobbyMember[]) {
    this.io.emit(LOBBY_MEMBER_UPDATE, members.map());
  }


  /**
   * @param  {string} userId
   * @returns LobbyMember
   * j
   * Finds lobbyMember via userId
   * -1 if not found
   */
  private findLobbymember(userId: string): LobbyMember {
    return this.lobbyMemberIndex.find(player => player.user.id === userId);
  }
}
