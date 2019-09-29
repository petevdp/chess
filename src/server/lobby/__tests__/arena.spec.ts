import { getLobbyMemberConnectionPair } from "../testHelpers"
import { EMPTY, from, Subject, NEVER, Subscription } from "rxjs"
import { userDetails } from '../../../common/dummyData'
import { Arena } from "../arena"
import { MemberUpdate } from ".."
import { first, skip, mergeMap, toArray } from "rxjs/operators"
import { MockClientConnection } from "../../server/__mocks__/clientConnection"
import { LobbyMember } from "../lobbyMember"

it('creates a new game when two members join the arena', done => {
  const [, member1] = getLobbyMemberConnectionPair(EMPTY, userDetails[0])
  const [, member2] = getLobbyMemberConnectionPair(EMPTY, userDetails[1])

  const update$ = new Subject<MemberUpdate>()

  const arena = new Arena(update$)

  arena.games$.subscribe(() => {
    done()
  })
  const updates: MemberUpdate[] = [member1, member2].map(m => [m.id, m])

  from(updates).subscribe(update$)

  update$.complete()
})

describe('games creation and emmision', () => {
  let conn1: MockClientConnection
  let conn2: MockClientConnection

  let member1: LobbyMember
  let member2: LobbyMember

  let memberUpdate$: Subject<MemberUpdate>
  let arena: Arena

  beforeEach(() => {
    [conn1, member1] = getLobbyMemberConnectionPair(NEVER, userDetails[0]);
    [conn2, member2] = getLobbyMemberConnectionPair(NEVER, userDetails[1])

    memberUpdate$ = new Subject<MemberUpdate>()

    arena = new Arena(memberUpdate$)
  })

  afterEach(() => {
    conn1.clean()
    conn2.clean()
    memberUpdate$.complete()
    arena.complete()
  })

  describe('games$', () => {
    it('emits new games', (done) => {
      arena.games$.subscribe(() => {
        done()
      })

      memberUpdate$.next([member1.id, member1])
      memberUpdate$.next([member2.id, member2])
    })

    it('emits new games only once', done => {
      arena.games$.pipe(
        toArray()
      ).subscribe(arr => {
        expect(new Set(arr).size).toEqual(1)
        done()
      })

      memberUpdate$.next([member1.id, member1])
      memberUpdate$.next([member2.id, member2])
      memberUpdate$.complete()
    })
  })

  describe('activeGames$', () => {
    it('includes new games that haven\'t ended yet', () => {
      arena.activeGames$.pipe(skip(1)).subscribe(arr => {
        expect(arr).toHaveLength(1)
      })

      memberUpdate$.next([member1.id, member1])
      memberUpdate$.next([member2.id, member2])
    })

    it('does not included ended games', done => {
      arena.activeGames$.pipe(skip(2)).subscribe(games => {
        expect(games).toHaveLength(0)
        done()
      })

      arena.games$.pipe(first()).subscribe(game => {
        game.end()
      })

      memberUpdate$.next([member1.id, member1])
      memberUpdate$.next([member2.id, member2])
    })
  })
})

describe('complete', () => {
  it('completes games$ and activeGames$', () => {
    const arena = new Arena(NEVER)
    const gamesSub = arena.games$.subscribe()
    const activeGamesSub = arena.activeGames$.subscribe()
    arena.complete()
    expect(gamesSub.closed).toBeTruthy()
    expect(activeGamesSub.closed).toBeTruthy()
  })
})
