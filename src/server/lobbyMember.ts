import { BehaviorSubject, Observable } from 'rxjs';
import { map, filter, first } from 'rxjs/operators';
import { ClientConnection, IClientConnection } from './socketServer';
import { GameDetails, LobbyMemberDetails, ChallengeDetails, ChallengeOutcome, UserDetails, CompleteGameInfo, GameUpdate } from '../common/types';
import { HasDetails$ } from '../common/helpers';
interface MemberState {
  currentGame: string | null;
  leftLobby: boolean;
}

export interface ILobbyMember extends HasDetails$<LobbyMemberDetails> {
  userDetails: UserDetails;
  details$: Observable<LobbyMemberDetails>;
  connection: IClientConnection;

  // updateGamePartial: (update: GameUpdate) => void;
  // loadGamePartials: (info: CompleteGameInfo[]) => void;
  // joinGame: (info: CompleteGameInfo) => Promise<boolean>;
  // spectateGame: (id: string) => Promise<boolean>
}

// TODO: switch from socket.io to bare ws + observables.
export class LobbyMember implements ILobbyMember {
  details$: Observable<LobbyMemberDetails>;

  private stateSubject: BehaviorSubject<MemberState>;

  constructor(public connection: IClientConnection) {
    const { clientMessage$ } = connection;

    this.stateSubject = new BehaviorSubject({ currentGame: null, leftLobby: false });

    this.details$ = this.stateSubject.pipe(map((memberState: MemberState) => ({
      ...memberState,
      ...this.userDetails,
    })));

    clientMessage$.subscribe({
      complete: () => {
        this.stateSubject.next({...this.state, leftLobby: true})
      }
    })
  }

  resolveMatchedOrDisconnected(){
    return new Promise<void>(resolve => {
      if (this.state.currentGame) {
        return resolve();
      }
      this.stateSubject.subscribe({
        next: ({currentGame, leftLobby}) => {
          if (currentGame || leftLobby) {
            resolve();
          }
        }
      })
    })
  }

  private get state(){
    return this.stateSubject.value;
  }

  get userDetails() {
    return this.connection.user;
  }

  get id() {
    return this.userDetails.id;
  }

  updateLobbyMemberDetails = (update: Map<string, LobbyMemberDetails>) => {
    console.log('update details ', update);
    this.connection.sendMessage({
      member: {
        memberUpdate: [...update],
      }
    });
  }
}
