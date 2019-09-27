import { LobbyMember } from './lobbyMember'
import { Observable, merge, Subject, of, Subscription, from } from 'rxjs'
import { scan, map, mergeAll, filter, mergeMap, mapTo, tap } from 'rxjs/operators'
import Game from '../game'
import { sleep, filterNullMapEntries } from '../../common/helpers'
import { MemberUpdate } from '.'
import { EndState } from '../../common/types'

interface UnmatchedState {
  potentialGames: Array<Promise<Game | false>>;
  allUnmatched: Map<string, LobbyMember>;
}

export class Arena {
  games$: Observable<Game>;
  activeGamesMap$: Observable<Map<string, (Game | null)>>;
  private unmatched$: Subject<MemberUpdate>
  private lobbyMemberSubscription: Subscription

  constructor (lobbyMember$: Observable<MemberUpdate>) {
    this.unmatched$ = new Subject<MemberUpdate>()

    this.lobbyMemberSubscription = lobbyMember$.subscribe({
      next: update => {
        this.unmatched$.next(update)
      }
    })

    this.games$ = this.unmatched$.pipe(
      scan((acc, [id, member]) => {
        const { allUnmatched } = acc

        if (!member) {
          allUnmatched.delete(id)
          return acc
        }

        if (allUnmatched.has(id)) {
          if (member.state.currentGame || member.state.leftLobby) {
            allUnmatched.delete(id)
          }
          return acc
        }

        acc.potentialGames = [...allUnmatched.values()].map(unmatched => (
          this.resolvePotentialGame([unmatched, member])
        ))

        allUnmatched.set(id, member)
        return acc
      }, { potentialGames: [], allUnmatched: new Map() } as UnmatchedState),
      map(({ potentialGames }) => merge(...potentialGames)),
      mergeAll(),
      filter(game => !!game)
    ) as Observable<Game>

    const gameAdditionsAndCompletions: Observable<[string, (Game|null)]> = this.games$.pipe(
      mergeMap((game) => {
        return merge(
          of([game.id, game]),
          from(game.endPromise).pipe(mapTo<EndState, [string, null]>([game.id, null]))
        ) as Observable<[string, (Game|null)]>
      }),
      tap(() => console.log('after concat'))
    )

    this.activeGamesMap$ = gameAdditionsAndCompletions.pipe(
      scan((acc, [id, game]) => {
        // first filter map entries that are null, so entries that have
        // already been signaled to be deleted by the client are removed.
        acc = filterNullMapEntries(acc)
        if (!game) {
          if (!acc.has(id)) {
            throw new Error('trying to delete game that doesn\'t exist')
          }

          // This signals for this entry to be deleted on the client.
          acc.set(id, null)
          return acc
        }
        acc.set(id, game)
        return acc
      }, new Map())
    )
  }

  complete () {
    this.lobbyMemberSubscription.unsubscribe()
    this.unmatched$.complete()
  }

  private async resolvePotentialGame (members: LobbyMember[]) {
    const unSuccessfulResolution = await Promise.race([
      sleep(100),
      ...members.map(async (m) => {
        await m.resolveMatchedOrDisconnected()
        return true
      })
    ])
    return !unSuccessfulResolution && new Game([[members[0], 'w'], [members[1], 'b']])
  }
}
