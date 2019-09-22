import { LobbyMember } from './lobbyMember'
import { Observable, BehaviorSubject, merge, Subject } from 'rxjs'
import { scan, map, mergeAll, filter } from 'rxjs/operators'
import { Game } from './game'
import { sleep } from '../../common/helpers'

interface UnmatchedState {
  potentialGames: Array<Promise<Game | false>>;
  allUnmatched: Map<string, LobbyMember>;
}

export class Arena {
  games$: Observable<Game>;

  constructor (lobbyMember$: Observable<[string, LobbyMember|null]>) {
    const unmatched$ = new Subject<[string, LobbyMember|null]>()

    lobbyMember$.subscribe({
      next: update => {
        console.log('member update')
        unmatched$.next(update)
      }
    })

    this.games$ = unmatched$.pipe(
      scan((acc, [id, member]) => {
        console.log('member: ', member.userDetails)

        const { allUnmatched } = acc

        if (!member) {
          allUnmatched.delete(id)
          return acc
        }

        acc.potentialGames = [...allUnmatched.values()].map(unmatched => (
          this.resolvePotentialGame([unmatched, member])
        ))

        allUnmatched.set(id, member)
        console.log('unmatched: ', allUnmatched)
        return acc
      }, { potentialGames: [], allUnmatched: new Map() } as UnmatchedState),
      map(({ potentialGames }) => merge(...potentialGames)),
      mergeAll(),
      filter(game => !!game)
    ) as Observable<Game>
  }

  private async resolvePotentialGame (members: LobbyMember[]) {
    const successfulResolution = await Promise.race([
      sleep(100),
      ...members.map(async (m) => {
        await m.resolveMatchedOrDisconnected()
        console.log('already in game!')
        return false
      })
    ])
    console.log('succ: ', successfulResolution)
    return !successfulResolution && new Game(members)
  }
}
