import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClientConnection } from '../server/clientConnection'
import { LobbyMemberDetails, LobbyMemberDetailsUpdate, DisplayedGameMessage, LobbyMessage, EndState } from '../../common/types'
export interface MemberState {
  currentGame: string | null;
  gameHistory: string[];
  leftLobby: boolean;
}

export class LobbyMember {
  update$: Observable<LobbyMember|null>;

  private stateSubject: BehaviorSubject<MemberState>;

  constructor (
    public connection: ClientConnection
  ) {
    const { clientMessage$ } = connection

    // TODO persist gameHistory
    this.stateSubject = new BehaviorSubject({
      currentGame: null,
      leftLobby: false,
      gameHistory: []
    } as MemberState)

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

  async joinGame (gameId: string, endPromise: Promise<EndState>) {
    this.stateSubject.next({ ...this.state, currentGame: gameId })
    endPromise.then(() => {
      this.stateSubject.next({
        ...this.state,
        currentGame: null,
        gameHistory: [...this.state.gameHistory, gameId]
      })
    })
    return this.state.currentGame === gameId
  }

  get canJoinGame () {
    const { currentGame, leftLobby } = this.state
    return (!currentGame && !leftLobby)
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

  broadcastLobbyMemberDetailsUpdate (update: LobbyMemberDetailsUpdate[]) {
    this.sendMessageToClient({
      member: {
        memberDetailsUpdate: update
      }
    })
  }

  broadcastDisplayedGameMessage (message: DisplayedGameMessage) {
    this.sendMessageToClient({
      displayedGame: message
    })
  }
}
