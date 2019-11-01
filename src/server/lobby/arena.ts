import { Observable, merge, of, from, BehaviorSubject, Subject, MonoTypeOperatorFunction, OperatorFunction, Subscription, concat } from 'rxjs'
import { scan, map, filter, mergeMap, mapTo, share, publish, concatMap, toArray, first } from 'rxjs/operators'
import { LobbyMember } from './lobbyMember'
import Game from '../game'
import { sleep } from '../../common/helpers'
import { MemberUpdate } from '.'
import { EndState, Colour, GameUpdate } from '../../common/types'
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
  private games$Subscription: Subscription
  // private unmatched$: Subject<MemberUpdate>
  // private lobbyMemberSubscription: Subscription

  constructor (
    lobbyMemberUpdate$: Observable<MemberUpdate>,
    private dbQueries: DBQueriesInterface,
    resolutionFormula: GameResolutionTimeFormula = resolutionFormulas.fixedTime(0)
  ) {
    const games$ = publish<Game>()(lobbyMemberUpdate$.pipe(
      scan((acc, [id, member]) => {
        const { allUnmatched } = acc
        acc.potentialGames = []

        if (!member) {
          allUnmatched.delete(id)
          return acc
        }
        if (member.state.currentGame || member.state.leftLobby) {
          if (allUnmatched.has(id)) {
            allUnmatched.delete(id)
          }
          return acc
        }
        console.log('finding game for ', member.details.username, member.state)

        acc.potentialGames = [...allUnmatched.values()].map(unmatchedMember => (
          Arena.resolvePotentialGame(
            [member, unmatchedMember],
            resolutionFormula,
            this.dbQueries
          )
        ))
        allUnmatched.set(id, member)
        return acc
      }, { potentialGames: [], allUnmatched: new Map() } as UnmatchedState),
      concatMap(({ potentialGames }) => concat(...potentialGames)),
      filter(game => !!game) as OperatorFunction<Game|false, Game>
    ))

    this.games$ = games$.pipe()

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

    this.games$.subscribe((game) => {
      console.log('new game!!!!', game.id)
    })
    this.games$Subscription = games$.connect()
  }

  complete () {
    // this.lobbyMemberSubscription.unsubscribe()
    // this.unmatched$.complete()
    this.games$Subscription.unsubscribe()
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
    console.log('resolving for ', members[0].userDetails.username)
    console.log('potential match: ', members[1].userDetails.username)

    await sleep(determineResolveTime(members))
    console.log('done schleep')

    if (!members.every(m => m.canJoinGame)) {
      return false
    }

    return new Game([[members[0], 'w'], [members[1], 'b']], dbQueries)
  }
}
