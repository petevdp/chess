import { Observable, Subject, BehaviorSubject } from 'rxjs'
import {
  scan,
  filter,
  map,
  mergeMap,
  startWith,
  share
} from 'rxjs/operators'

import { LobbyMember } from './lobbyMember'
import {
  LobbyMemberDetails,
  LobbyMemberDetailsUpdate,
  CompleteGameInfo,
  GameUpdate,
  DisplayedGameMessage
} from '../../common/types'
import { ClientConnection } from '../server/clientConnection'
import { Arena } from './arena'

export type MemberUpdate = [string, LobbyMember | null]

export class Lobby {
  memberDetailsUpdates$: Observable<LobbyMemberDetailsUpdate>
  memberDetailsMap$: BehaviorSubject<Map<string, LobbyMemberDetails>>
  displayedGameMessage$: Observable<DisplayedGameMessage>

  private arena: Arena
  private memberUpdate$: Subject<MemberUpdate>

  constructor () {
    this.memberUpdate$ = new Subject()
    this.memberDetailsMap$ = new BehaviorSubject(new Map())

    this.memberDetailsUpdates$ = this.memberUpdate$.pipe(
      map(
        (update): LobbyMemberDetailsUpdate => {
          const [id, member] = update
          if (!member) {
            return [id, null]
          }
          return [id, member.details]
        }
      )
    )

    this.memberDetailsUpdates$
      .pipe(
        scan((detailsMap, [id, details]) => {
          if (!details) {
            detailsMap.delete(id)
            return detailsMap
          }
          detailsMap.set(id, details)
          return detailsMap
        }, new Map<string, LobbyMemberDetails>())
      )
      .subscribe({
        next: (map) => this.memberDetailsMap$.next(map),
        complete: () => this.memberDetailsMap$.complete()
      })

    this.arena = new Arena(
      this.memberUpdate$.pipe(
        filter(([, member]) => !member || member.userDetails.type === 'bot')
      )
    )

    // TODO constrict which games are displayed
    this.displayedGameMessage$ = this.arena.games$.pipe(
      mergeMap((game) => {
        const updateMessage$ = game.gameUpdate$.pipe(
          map<GameUpdate, DisplayedGameMessage>((update) => ({
            type: 'update',
            update: {
              ...update,
              id: game.id
            }
          }))
        )

        return updateMessage$.pipe(
          startWith({
            type: 'add',
            add: [game.completeGameInfo]
          } as DisplayedGameMessage)
        )
      }),
      share()
    )
  }

  addLobbyMember (client: ClientConnection) {
    const member = new LobbyMember(client)

    member.update$
      .subscribe({
        next: (update) => this.memberUpdate$.next([member.id, update])
      })

    member.broadcastLobbyMemberDetailsUpdate([...this.memberDetailsMap])

    this.memberDetailsUpdates$.subscribe({
      next: (update) => {
        member.broadcastLobbyMemberDetailsUpdate([update])
      }
    })

    this.displayedGameMessage$.pipe(
      startWith({
        type: 'add',
        add: this.displayedGameInfoArr
      } as DisplayedGameMessage)
    ).subscribe((msg) => {
      member.broadcastDisplayedGameMessage(msg)
    })
  }

  get displayedGameInfoArr (): CompleteGameInfo[] {
    return this.arena.activeGames.map((g) => g.completeGameInfo)
  }

  get memberDetailsMap () {
    return this.memberDetailsMap$.value
  }

  complete () {
    this.memberUpdate$.complete()
    this.memberDetailsMap$.complete()
    this.arena.complete()
  }
}
