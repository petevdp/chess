import { Observable, Subject, BehaviorSubject } from 'rxjs'
import {
  scan,
  filter,
  map,
  mergeMap,
  startWith,
  tap,
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
  private arena: Arena
  memberDetailsUpdates$: Observable<LobbyMemberDetailsUpdate>
  memberDetailsMap$: BehaviorSubject<Map<string, LobbyMemberDetails>>
  displayedGameMessage$: Observable<DisplayedGameMessage>

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

    this.memberUpdate$.subscribe(update => {
      console.log('lobby member update: ', update[0], update[1] && update[1].state)
    })

    this.arena.games$.subscribe((game) => {
      console.log('new game from lobby: ', game.id)
    })

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
        console.log('hooking up new game: ', game.id)

        return updateMessage$.pipe(
          startWith({
            type: 'add',
            add: [game.completeGameInfo]
          } as DisplayedGameMessage),
          tap(() => console.log('updateMessage'))
        )
      }),
      share()
    )
  }

  addLobbyMember (client: ClientConnection) {
    const member = new LobbyMember(client)

    member.update$
      .pipe(
        tap<LobbyMember | null>(
          (member) =>
            member
            && console.log(
              `member update: id: ${member.id}, state: ${member.state}`
            )
        )
      )
      .subscribe({
        next: (update) => this.memberUpdate$.next([member.id, update])
      })

    member.broadcastLobbyMemberDetails([...this.memberDetailsMap])

    console.log('initial displayed games: ', this.displayedGameInfoArr)

    this.memberDetailsUpdates$.subscribe({
      next: (update) => {
        member.broadcastLobbyMemberDetails([update])
      },
      complete: () => console.log('memberdetailsupdates completed')
    })

    this.displayedGameMessage$.subscribe((msg) => {
      if (member.userDetails.username === 'pete') {
        console.log('updating displayed game: ', msg)
      }
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
