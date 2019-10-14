import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClientConnection, ClientConnectionInterface } from '../server/clientConnection'
import { LobbyMemberDetails, UserDetails, LobbyMemberDetailsUpdate, DisplayedGameMessage, LobbyMessage, EndState } from '../../common/types'
export interface MemberState {
  currentGame: string | null;
  leftLobby: boolean;
}

export interface LobbyMemberInterface {
  details: LobbyMemberDetails;
  update$: Observable<LobbyMember|null>;
  connection: ClientConnectionInterface;
  userDetails: UserDetails;

  // updateGamePartial: (update: GameUpdate) => void;
  // loadGamePartials: (info: CompleteGameInfo[]) => void;
  // joinGame: (info: CompleteGameInfo) => Promise<boolean>;
  // spectateGame: (id: string) => Promise<boolean>
}

export class LobbyMember implements LobbyMemberInterface {
  update$: Observable<LobbyMember|null>;

  private stateSubject: BehaviorSubject<MemberState>;

  constructor (
    public connection: ClientConnection
  ) {
    const { clientMessage$ } = connection

    this.stateSubject = new BehaviorSubject({ currentGame: null, leftLobby: false } as MemberState)

    this.update$ = this.stateSubject.pipe(map(state => {
      if (state.leftLobby) {
        return null
      }
      return this
    }))

    clientMessage$.subscribe({
      complete: () => {
        this.stateSubject.next({ ...this.state, leftLobby: true })
        this.stateSubject.complete()
      }
    })
  }

  resolveMatchedOrDisconnected () {
    return new Promise<boolean>(resolve => {
      if (this.state.currentGame) {
        return resolve(true)
      }
      this.stateSubject.subscribe({
        next: ({ currentGame, leftLobby }) => {
          if (currentGame || leftLobby) {
            resolve(true)
          }
        }
      })
    })
  }

  async joinGame (gameId: string, endPromise: Promise<EndState>) {
    this.stateSubject.next({ ...this.state, currentGame: gameId })
    await endPromise
    this.stateSubject.next({ ...this.state, currentGame: null })
  }

  get state () {
    return this.stateSubject.value
  }

  get userDetails () {
    return this.connection.user
  }

  get details (): LobbyMemberDetails {
    return {
      ...this.state,
      ...this.userDetails
    }
  }

  get id () {
    return this.userDetails.id
  }

  private sendMessageToClient (message: LobbyMessage) {
    this.connection.sendMessage({
      lobby: message
    })
  }

  broadcastLobbyMemberDetails = (update: LobbyMemberDetailsUpdate[]) => {
    this.sendMessageToClient({
      member: {
        memberDetailsUpdate: update
      }
    })
  }

  // should be used to keep the lobby displayed games up to date, not to join games
  broadcastDisplayedGameMessage (message: DisplayedGameMessage) {
    this.sendMessageToClient({
      displayedGame: message
    })
  }
}
