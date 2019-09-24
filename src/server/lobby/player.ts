import { Observable } from 'rxjs'
import { filter, map, publish } from 'rxjs/operators'

import { ClientConnection } from '../server/clientConnection'

import {
  PlayerDetails,
  ClientPlayerAction,
  Colour,
  GameUpdate,
  CompleteGameInfo
} from '../../common/types'
// has one game associated with it.
export interface PlayerAction extends ClientPlayerAction {
  colour: Colour;
}
export class Player {
  playerAction$: Observable<PlayerAction>
  ready: Promise<void>
  colour: Colour

  constructor (
    private connection: ClientConnection,
    completeGameInfo: CompleteGameInfo,
    gameUpdate$: Observable<GameUpdate>
  ) {
    this.colour = completeGameInfo.playerDetails.find(p => p.user.id === this.user.id).colour

    this.playerAction$ = connection.clientMessage$.pipe(
      filter(msg => !!msg.gameAction),
      map(({ gameAction }) => ({ ...gameAction, colour: this.colour }))
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
