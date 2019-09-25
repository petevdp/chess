import { Observable, Subject } from 'rxjs'
import { scan } from 'rxjs/operators'

import { LobbyMember } from './lobbyMember'
import { LobbyMemberDetails } from '../../common/types'
import { ClientConnection } from '../server/clientConnection'
import { Arena } from './arena'

export type MemberUpdate = [string, LobbyMember|null]
export class Lobby {
  private arena: Arena;
  private memberDetails$: Observable<Map<string, LobbyMemberDetails>>;

  private memberUpdateSubject: Subject<MemberUpdate>;

  constructor () {
    this.memberUpdateSubject = new Subject()

    this.memberDetails$ = this.memberUpdateSubject.pipe(
      scan((detailsMap, [id, member]) => {
        if (!member) {
          detailsMap.delete(id)
          return detailsMap
        }
        detailsMap.set(id, member.details)
        return detailsMap
      }, new Map<string, LobbyMemberDetails>())
    )

    this.arena = new Arena(this.memberUpdateSubject.asObservable())

    this.arena.games$.subscribe(game => {
      console.log('new game: ', game.details)
    })
  }

  addLobbyMember = (client: ClientConnection) => {
    console.log('adding lobby member')
    const member = new LobbyMember(client)

    this.memberDetails$.subscribe(details => {
      member.updateLobbyMemberDetails(details)
    })

    member.update$.subscribe({
      next: update => this.memberUpdateSubject.next([update.id, update])
    })
  }
}
