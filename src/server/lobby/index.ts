import { Observable, Subject, BehaviorSubject } from 'rxjs'
import { scan, filter, tap, map } from 'rxjs/operators'

import { LobbyMember } from './lobbyMember'
import { LobbyMemberDetails, LobbyMemberDetailsUpdate } from '../../common/types'
import { ClientConnection } from '../server/clientConnection'
import { Arena } from './arena'

export type MemberUpdate = [string, LobbyMember|null]

export class Lobby {
  private arena: Arena;
  memberDetailsUpdates$: Observable<LobbyMemberDetailsUpdate>;

  memberDetailsMap$ = new BehaviorSubject<Map<string, LobbyMemberDetails>>(new Map());

  private memberUpdateSubject: Subject<MemberUpdate>;

  constructor () {
    this.memberUpdateSubject = new Subject()
    this.memberDetailsUpdates$ = this.memberUpdateSubject.pipe(
      map((update) => {
        const [id, member] = update
        if (!member) {
          return [id, null]
        }
        return [id, member.details]
      })
    )

    this.memberDetailsUpdates$.pipe(
      scan((detailsMap, [id, details]) => {
        if (!details) {
          detailsMap.delete(id)
          return detailsMap
        }
        detailsMap.set(id, details)
        return detailsMap
      }, new Map<string, LobbyMemberDetails>()),
      tap(details => console.log('num details: ', [...details.values()].length))
    ).subscribe({
      next: map => this.memberDetailsMap$.next(map),
      complete: () => this.memberDetailsMap$.complete()
    })

    this.arena = new Arena(this.memberUpdateSubject.pipe(
      filter(([, member]) => !member || member.userDetails.type === 'bot')
    ))
    this.arena.games$.subscribe(game => {
      console.log('new game: ', game.details)
    })
  }

  addLobbyMember (client: ClientConnection) {
    const member = new LobbyMember(client)

    member.update$.subscribe({
      next: update => this.memberUpdateSubject.next([member.id, update])
    })

    member.updateLobbyMemberDetails([...this.memberDetailsMap])

    this.memberDetailsUpdates$.subscribe(update => {
      member.updateLobbyMemberDetails([update])
    })
  }

  get memberDetailsMap () {
    return this.memberDetailsMap$.value
  }

  complete () {
    this.memberUpdateSubject.complete()
  }
}
