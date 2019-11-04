import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClientConnection } from '../server/clientConnection'
import { LobbyMemberDetails, LobbyMemberDetailsUpdate, DisplayedGameMessage, LobbyMessage, CompletedGameInfo } from '../../common/types'
import { CalculateRatings, GameOutcome } from './elo'
export interface MemberState {
  currentGame: string | null;
  gameHistory: CompletedGameInfo[];
  leftLobby: boolean;
  elo: number;
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
      gameHistory: [],
      elo: 1500
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

  async playGame (
    gameId: string,
    endPromise: Promise<CompletedGameInfo>,
    calculateRating: CalculateRatings | null = null
  ) {
    this.stateSubject.next({ ...this.state, currentGame: gameId })
    endPromise.then((gameInfo) => {
      // TODO implement elo system
      const { winnerId } = gameInfo.end
      console.log('info: ', gameInfo)

      let outcome: GameOutcome
      if (winnerId === this.id) {
        outcome = 'win'
      } else if (!winnerId) {
        outcome = 'draw'
      } else {
        outcome = 'loss'
      }
      const [player, opponent] = gameInfo.playerDetails.sort((a) => (
        a.user.id === this.id ? -1 : 1
      ))

      this.stateSubject.next({
        ...this.state,
        currentGame: null,
        elo: calculateRating
          ? calculateRating(player.elo, opponent.elo, outcome)
          : this.state.elo,
        gameHistory: [...this.state.gameHistory, gameInfo]
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
