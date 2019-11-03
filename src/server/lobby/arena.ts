import { Observable, merge, of, from, BehaviorSubject, OperatorFunction, Subscription, concat } from 'rxjs'
import { scan, map, filter, mergeMap, mapTo, publish } from 'rxjs/operators'
import { LobbyMember } from './lobbyMember'
import Game from '../game'
import { sleep } from '../../common/helpers'
import { MemberUpdate } from '.'
import { CompletedGameInfo } from '../../common/types'
import * as resolutionFormulas from './resolutionTime'
import { DBQueriesInterface } from '../db/queries'

interface UnmatchedState {
  potentialGames: Array<Promise<Game | false>>;
  allUnmatched: Map<string, LobbyMember>;
}

export type GameResolutionTimeFormula = (
  potentialMatch: [LobbyMember, LobbyMember],
  activeGames: Game[],
) => number

export class Arena {
  games$: Observable<Game>;
  activeGames$: BehaviorSubject<Game[]>
  private lobbyMemberSubscription: Subscription

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
            this.activeGames,
            resolutionFormula,
            this.dbQueries
          )
        ))
        allUnmatched.set(id, member)
        return acc
      }, { potentialGames: [], allUnmatched: new Map() } as UnmatchedState),
      mergeMap(({ potentialGames }) => merge(...potentialGames)),
      filter(game => !!game) as OperatorFunction<Game|false, Game>
    ))

    this.games$ = games$.pipe()

    const gameAdditionsAndCompletions: Observable<[string, (Game|null)]> = this.games$.pipe(
      mergeMap((game) => {
        return concat(
          of([game.id, game]),
          from(game.endPromise).pipe(mapTo<CompletedGameInfo, [string, null]>([game.id, null]))
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

    this.lobbyMemberSubscription = games$.connect()
  }

  complete () {
    this.lobbyMemberSubscription.unsubscribe()
    this.activeGames.forEach(g => g.end())
    this.activeGames$.complete()
  }

  get activeGames () {
    return this.activeGames$.value
  }

  private static async resolvePotentialGame (
    potentialGameMembers: [LobbyMember, LobbyMember],
    activeGames: Game[],
    gameTimeResolutionFormula: GameResolutionTimeFormula,
    dbQueries: DBQueriesInterface
  ) {
    await sleep(gameTimeResolutionFormula(potentialGameMembers, activeGames))

    if (!potentialGameMembers.every(m => m.canJoinGame)) {
      return false
    }

    return new Game([[potentialGameMembers[0], 'w'], [potentialGameMembers[1], 'b']], dbQueries)
  }
}
