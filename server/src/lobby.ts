import { Room } from './room';
import io, { Socket } from 'socket.io';
import { LobbyMember } from './lobbyMember';
import { ClientChallenge, User, SocketMessages } from 'APIInterfaces/types';
import * as http from 'http';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChallengeStatus, Challenge, LobbyChallengesObservable } from './challenge';
import { Game } from './game';

const { LOBBY_MEMBER_UPDATE } = SocketMessages;
export class SyncIndex<T> {
  constructor(
    private broadcastUpdates: (index: T[]) => void,
    private index: T[] = [] as T[]
  ) {
  }

  private sync() {
    this.broadcastUpdates(this.index);
  }

  find(cb: (val: T, index: number) => boolean) {
    return this.index.find(cb);
  }

  push(val: T) {
    this.index.push(val);
    this.sync();
  }

  remove(idx: number): T {
    return this.index.splice(idx, 1)[0];
    this.sync();
  }
}

export class Lobby {
  lobbyMemberIndex = new SyncIndex<LobbyMember>(
    this.broadcastLobbyMemberIndexUpdates,
  );

  gameIndex = new SyncIndex<Game>(
    this.broadcastGameIndexUpdates
  )
  private io: io.Server;
  public lobbyChallengeObserver: Observable<Challenge>;

  constructor(httpServer: http.Server) {
    this.io = io({
      httpServer
    });
    const lobbyClientChallengeSubject = new Subject<ClientChallenge>();

    this.io.on('connection', (socket: Socket) => {
      // TODO verify player and get userId, username, etc, and make sure there are no duplicate users
      const user = {
        id: 'placeholderID',
        username: 'placeholderusername',
      } as User;

      console.log('connection:');
      console.log(socket.handshake.headers);
      const player = new LobbyMember(
        user,
        socket,
        lobbyClientChallengeSubject
      );
      player.updateLobbyMemberIndex(this.lobbyMemberIndex);
    });

    this.lobbyChallengeObserver = lobbyClientChallengeSubject
      .pipe(map((clientChallenge) => ({
        ...clientChallenge,
        subject: new BehaviorSubject(ChallengeStatus.pending),
      })));

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
          this.gameIndex.push(new Game([challenger, receiver]));
        }
      });
    });
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
