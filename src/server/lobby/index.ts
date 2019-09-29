import { Observable, Subject, BehaviorSubject, concat, of } from 'rxjs'
import { scan, filter, map, mergeMap } from 'rxjs/operators'

import { LobbyMember } from './lobbyMember'
import { LobbyMemberDetails, LobbyMemberDetailsUpdate, CompleteGameInfo, GameUpdate, DisplayedGameMessage } from '../../common/types'
import { ClientConnection } from '../server/clientConnection'
import { Arena } from './arena'

export type MemberUpdate = [string, LobbyMember|null]

export class Lobby {
  private arena: Arena;
  memberDetailsUpdates$: Observable<LobbyMemberDetailsUpdate>;
  memberDetailsMap$: BehaviorSubject<Map<string, LobbyMemberDetails>>;
  displayedGameMessage$: Observable<DisplayedGameMessage>

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
      }, new Map<string, LobbyMemberDetails>())
    ).subscribe({
      next: map => this.memberDetailsMap$.next(map),
      complete: () => this.memberDetailsMap$.complete()
    })

    this.arena = new Arena(this.memberUpdate$.pipe(
      filter(([, member]) => !member || member.userDetails.type === 'bot')
    ))

    // TODO constrict which games are displayed
    this.displayedGameMessage$ = this.arena.games$.pipe(
      mergeMap(game => {
        return concat(
          of({ type: 'add', add: [game.completeGameInfo] } as DisplayedGameMessage),
          game.gameUpdate$.pipe(
            map<GameUpdate, DisplayedGameMessage>(update => ({
              type: 'update',
              update: {
                ...update,
                id: game.id
              }
            }))
          )
        )
      })
    )
  }

  addLobbyMember (client: ClientConnection) {
    const member = new LobbyMember(client)

    member.update$.subscribe({
      next: update => this.memberUpdate$.next([member.id, update])
    })

    member.broadcastLobbyMemberDetails([...this.memberDetailsMap])

    console.log('initial displayed games: ', this.displayedGameInfoArr)
    // member.broadcastDisplayedGameMessage({
    //   type: 'add',
    //   add: this.displayedGameInfoArr
    // })

    this.memberDetailsUpdates$.subscribe(update => {
      member.broadcastLobbyMemberDetails([update])
    })

    this.displayedGameMessage$.subscribe(msg => {
      if (member.userDetails.username === 'pete') {
        console.log('updating displayed game: ', msg)
      }
      member.broadcastDisplayedGameMessage(msg)
    })
  }

  get displayedGameInfoArr (): CompleteGameInfo[] {
    return this.arena.activeGames.map(g => g.completeGameInfo)
  }

  get memberDetailsMap () {
    return this.memberDetailsMap$.value
  }

  complete () {
    this.memberUpdate$.complete()
    this.arena.complete()
  }
}
