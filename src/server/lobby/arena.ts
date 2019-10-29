import { Observable, merge, of, from, BehaviorSubject } from 'rxjs'
import { scan, map, filter, mergeMap, mapTo, share } from 'rxjs/operators'
import { LobbyMember } from './lobbyMember'
import Game from '../game'
import { sleep } from '../../common/helpers'
import { MemberUpdate } from '.'
import { EndState, Colour } from '../../common/types'
import * as resolutionFormulas from './gameResolution'
import { DBQueriesInterface } from '../db/queries'

interface UnmatchedState {
  potentialGames: Array<Promise<Game | false>>;
  allUnmatched: Map<string, LobbyMember>;
}

export type GameResolutionTimeFormula = (members: [LobbyMember, LobbyMember]) => number

export class Arena {
  games$: Observable<Game>;
  activeGames$: BehaviorSubject<Game[]>
  // private unmatched$: Subject<MemberUpdate>
  // private lobbyMemberSubscription: Subscription

  constructor (
    lobbyMemberUpdate$: Observable<MemberUpdate>,
    private dbQueries: DBQueriesInterface,
    resolutionFormula: GameResolutionTimeFormula = resolutionFormulas.fixedTime(0)
  ) {
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
          Arena.resolvePotentialGame(
            [unmatched, member],
            resolutionFormula,
            this.dbQueries
          )
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

  private static async resolvePotentialGame (
    members: [LobbyMember, LobbyMember],
    determineResolveTime: GameResolutionTimeFormula,
    dbQueries: DBQueriesInterface
  ) {
    const successfulResolution = await Promise.race([
      ...members.map(async (m) => {
        await m.resolveMatchedOrDisconnected()
        return false
      }),
      (async (): Promise<boolean> => {
        await sleep(determineResolveTime(members))
        return members.every(m => m.canJoinGame)
      })()
    ])
    const gameMembers: [LobbyMember, Colour][] = [[members[0], 'w'], [members[1], 'b']]

    return (
      successfulResolution
      && new Game(gameMembers, dbQueries)
    )
  }
}
