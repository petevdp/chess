import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClientConnection, ClientConnectionInterface } from '../server/clientConnection'
import { LobbyMemberDetails, UserDetails, LobbyMemberDetailsUpdate, CompleteGameInfo, GameUpdateWithId, GameMessage } from '../../common/types'
interface MemberState {
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
    public connection: ClientConnection,
    activeGames: CompleteGameInfo[]
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
    connection.sendMessage({
      game: {
        type: 'display',
        display: activeGames
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

  joinGame (gameId: string) {
    this.stateSubject.next({ ...this.state, currentGame: gameId })
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

  broadcastLobbyMemberDetails = (update: LobbyMemberDetailsUpdate[]) => {
    console.log('received update: ', update)

    this.connection.sendMessage({
      member: {
        memberDetailsUpdate: update
      }
    })
  }

  // should be used to keep the lobby displayed games up to date, not to join games
  broadcastActiveGameMessages (message: GameMessage) {
    if (message.type === 'join') {
      throw new Error('don\'t join games from lobbyMembers update channel')
    }
    this.connection.sendMessage({
      game: message
    })
  }
}
