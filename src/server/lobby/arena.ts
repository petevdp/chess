import { LobbyMember } from './lobbyMember'
import { Observable, merge, Subject } from 'rxjs'
import { scan, map, mergeAll, filter } from 'rxjs/operators'
import Game from '../game'
import { sleep } from '../../common/helpers'
import { MemberUpdate } from '.'

interface UnmatchedState {
  potentialGames: Array<Promise<Game | false>>;
  allUnmatched: Map<string, LobbyMember>;
}

export class Arena {
  games$: Observable<Game>;

  constructor (lobbyMember$: Observable<MemberUpdate>) {
    const unmatched$ = new Subject<MemberUpdate>()

    lobbyMember$.subscribe({
      next: update => {
        unmatched$.next(update)
      }
    })

    this.games$ = unmatched$.pipe(
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
