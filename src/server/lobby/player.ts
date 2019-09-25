import { Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'

import {
  ClientPlayerAction,
  Colour,
  GameUpdate,
  CompleteGameInfo
} from '../../common/types'
import { ClientConnection } from '../server/clientConnection'
// has one game associated with it.
export interface PlayerAction extends ClientPlayerAction {
  colour: Colour;
  playerId: string;
}
export class Player {
  playerAction$: Observable<PlayerAction>

  constructor (
    private connection: ClientConnection,
    completeGameInfo: CompleteGameInfo,
    gameUpdate$: Observable<GameUpdate>,
    public colour: Colour
  ) {
    console.log('new player!')

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

  get user () {
    return this.connection.user
  }

  get id () {
    return this.user.id
  }
}
