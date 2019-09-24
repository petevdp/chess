import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClientConnection, ClientConnectionInterface } from '../server/clientConnection'
import { LobbyMemberDetails, UserDetails } from '../../common/types'
import { HasDetailsObservable } from '../../common/helpers'
interface MemberState {
  currentGame: string | null;
  leftLobby: boolean;
}

export interface LobbyMemberInterface extends HasDetailsObservable<LobbyMemberDetails> {
  userDetails: UserDetails;
  details$: Observable<LobbyMemberDetails>;
  connection: ClientConnectionInterface;

  // updateGamePartial: (update: GameUpdate) => void;
  // loadGamePartials: (info: CompleteGameInfo[]) => void;
  // joinGame: (info: CompleteGameInfo) => Promise<boolean>;
  // spectateGame: (id: string) => Promise<boolean>
}

// TODO: switch from socket.io to bare ws + observables.
export class LobbyMember implements LobbyMemberInterface {
  details$: Observable<LobbyMemberDetails>;

  private stateSubject: BehaviorSubject<MemberState>;

  constructor (public connection: ClientConnection) {
    const { clientMessage$ } = connection

    this.stateSubject = new BehaviorSubject({ currentGame: null, leftLobby: false } as MemberState)

    this.details$ = this.stateSubject.pipe(map((memberState: MemberState) => ({
      ...memberState,
      ...this.userDetails
    })))

    clientMessage$.subscribe({
      complete: () => {
        this.stateSubject.next({ ...this.state, leftLobby: true })
      }
    })
  }

  resolveMatchedOrDisconnected () {
    return new Promise<void>(resolve => {
      if (this.state.currentGame) {
        return resolve()
      }
      this.stateSubject.subscribe({
        next: ({ currentGame, leftLobby }) => {
          if (currentGame || leftLobby) {
            resolve()
          }
        }
      })
    })
  }

  joinGame(gameId: string) {
    this.stateSubject.next({...this.state, currentGame: gameId})
  }


  get state () {
    return this.stateSubject.value
  }

  get userDetails () {
    return this.connection.user
  }

  get id () {
    return this.userDetails.id
  }

  updateLobbyMemberDetails = (update: Map<string, LobbyMemberDetails>) => {
    this.connection.sendMessage({
      member: {
        memberUpdate: [...update]
      }
    })
  }
}
