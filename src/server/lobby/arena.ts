import { LobbyMember } from './lobbyMember'
import { Observable, merge, of, from, BehaviorSubject } from 'rxjs'
import { scan, map, filter, mergeMap, mapTo, share } from 'rxjs/operators'
import Game from '../game'
import { sleep } from '../../common/helpers'
import { MemberUpdate } from '.'
import { EndState } from '../../common/types'

interface UnmatchedState {
  potentialGames: Array<Promise<Game | false>>;
  allUnmatched: Map<string, LobbyMember>;
}

export class Arena {
  games$: Observable<Game>;
  activeGames$: BehaviorSubject<Game[]>
  // private unmatched$: Subject<MemberUpdate>
  // private lobbyMemberSubscription: Subscription

  constructor (lobbyMemberUpdate$: Observable<MemberUpdate>) {
    this.games$ = lobbyMemberUpdate$.pipe(
      scan((acc, [id, member]) => {
        const { allUnmatched } = acc
        acc.potentialGames = []

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
        console.log('finding game for ', member.details.username, member.state)

        acc.potentialGames = [...allUnmatched.values()].map(unmatched => (
          this.resolvePotentialGame([unmatched, member])
        ))
        allUnmatched.set(id, member)
        return acc
      }, { potentialGames: [], allUnmatched: new Map() } as UnmatchedState),
      mergeMap(({ potentialGames }) => merge(...potentialGames)),
      filter(game => !!game),
      map<false | Game, Game>(game => game as Game),
      share()
    )

    const gameAdditionsAndCompletions: Observable<[string, (Game|null)]> = this.games$.pipe(
      mergeMap((game) => {
        return merge(
          of([game.id, game]),
          from(game.endPromise).pipe(mapTo<EndState, [string, null]>([game.id, null]))
        ) as Observable<[string, (Game|null)]>
      })
    )
    this.activeGames$ = new BehaviorSubject([] as Game[])

    gameAdditionsAndCompletions.pipe(
      scan((acc, [id, game]) => {
        if (!game) {
          if (!acc.has(id)) {
            throw new Error('trying to delete game that doesn\'t exist')
          }

          acc.delete(id)
          return acc
        }
        acc.set(id, game)
        return acc
      }, new Map()),
      map(gameMap => [...gameMap.values()])
    ).subscribe(this.activeGames$)
  }

  complete () {
    // this.lobbyMemberSubscription.unsubscribe()
    // this.unmatched$.complete()
    this.activeGames$.complete()
  }

  get activeGames () {
    return this.activeGames$.value
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
