import { Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'

import {
  ClientPlayerAction,
  Colour,
  GameUpdate,
  CompleteGameInfo,
  UserDetails
} from '../../common/types'
import { ClientConnection } from '../server/clientConnection'
// has one game associated with it.
export interface PlayerAction extends ClientPlayerAction {
  colour: Colour;
  playerId: string;
}
export class Player {
  playerAction$: Observable<PlayerAction>
  colour: Colour

  constructor (
    private connection: ClientConnection,
    completeGameInfo: CompleteGameInfo,
    gameUpdate$: Observable<GameUpdate>
  ) {
    this.colour = this.getColour(completeGameInfo, connection.user)

    this.playerAction$ = connection.clientMessage$.pipe(
      filter(msg => !!msg.gameAction),
      map(({ gameAction }) => {
        return {
          ...gameAction,
          colour: this.colour,
          playerId: this.id
        } as PlayerAction
      })
    )

    gameUpdate$.subscribe({
      next: update => connection.sendMessage({
        game: {
          type: 'update',
          update: { ...update, id: completeGameInfo.id }
        }
      })
    })

    connection.sendMessage({
      game: {
        type: 'join',
        join: completeGameInfo
      }
    })
  }

  private getColour (completeGameInfo: CompleteGameInfo, user: UserDetails) {
    const { playerDetails } = completeGameInfo
    const player = playerDetails.find(p => p.user.id === user.id)
    if (!player) {
      throw new Error('can\'t find player!')
    }
    return player.colour
  }

  get user () {
    return this.connection.user
  }

  get id () {
    return this.user.id
  }
}
