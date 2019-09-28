import { Observable, Subject, BehaviorSubject } from 'rxjs'
import { scan, filter, tap, map, startWith } from 'rxjs/operators'

import { LobbyMember } from './lobbyMember'
import { LobbyMemberDetails, LobbyMemberDetailsUpdate, GameMessage, CompleteGameInfo } from '../../common/types'
import { ClientConnection } from '../server/clientConnection'
import { Arena } from './arena'

export type MemberUpdate = [string, LobbyMember|null]

export class Lobby {
  private arena: Arena;
  memberDetailsUpdates$: Observable<LobbyMemberDetailsUpdate>;
  memberDetailsMap$: BehaviorSubject<Map<string, LobbyMemberDetails>>;
  activeGameMessage$: Observable<GameMessage>

  private memberUpdate$: Subject<MemberUpdate>;

  constructor () {
    this.memberUpdate$ = new Subject()
    this.memberDetailsMap$ = new BehaviorSubject(new Map())

    this.memberDetailsUpdates$ = this.memberUpdate$.pipe(
      map((update): LobbyMemberDetailsUpdate => {
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

    this.arena = new Arena(this.memberUpdate$.pipe(
      filter(([, member]) => !member || member.userDetails.type === 'bot')
    ))

    this.activeGameMessage$ = this.arena.activeGames$.pipe(
      map((gamesMap): GameMessage => {
        return {
          type: 'display',
          display: gamesMap.map(g => g.completeGameInfo)
        }
      })
    )
  }

  addLobbyMember (client: ClientConnection) {
    const member = new LobbyMember(client, this.activeGameInfoArr)

    member.update$.subscribe({
      next: update => this.memberUpdate$.next([member.id, update])
    })

    member.broadcastLobbyMemberDetails([...this.memberDetailsMap])

    this.memberDetailsUpdates$.subscribe(update => {
      member.broadcastLobbyMemberDetails([update])
    })

    this.activeGameMessage$.subscribe(msg => {
      member.broadcastActiveGameMessage(msg)
    })
  }

  get activeGameInfoArr (): CompleteGameInfo[] {
    return this.arena.activeGames.map(g => g.completeGameInfo)
  }

  get memberDetailsMap () {
    return this.memberDetailsMap$.value
  }

  complete () {
    this.memberUpdate$.complete()
  }
}
