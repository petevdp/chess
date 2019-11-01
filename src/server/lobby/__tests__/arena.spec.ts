import { getLobbyMemberConnectionPair } from "../testHelpers"
import { Subject, NEVER, EMPTY } from "rxjs"
import { allUserDetails } from '../../../common/dummyData/dummyData'
import { Arena } from "../arena"
import { MemberUpdate } from ".."
import { first, skip, toArray } from "rxjs/operators"
import { MockClientConnection } from "../../server/__mocks__/clientConnection"
import { LobbyMember } from "../lobbyMember"
import DBQueries from '../../db/queries'

jest.mock('../../db/queries')

const memberToMemberUpdate = (member: LobbyMember): MemberUpdate => ([member.id, member])

describe('games creation and emmision', () => {
  let conn1: MockClientConnection
  let conn2: MockClientConnection

  let member1: LobbyMember
  let member2: LobbyMember
  let member3: LobbyMember

  let memberUpdate$: Subject<MemberUpdate>
  let arena: Arena

  beforeEach(() => {
    [conn1, member1] = getLobbyMemberConnectionPair(NEVER, allUserDetails[0]);
    [conn2, member2] = getLobbyMemberConnectionPair(NEVER, allUserDetails[1]);
    [, member3] = getLobbyMemberConnectionPair(NEVER, allUserDetails[2])

    memberUpdate$ = new Subject<MemberUpdate>()

    arena = new Arena(memberUpdate$, new DBQueries())
  })

  afterEach(() => {
    conn1.clean()
    conn2.clean()
    memberUpdate$.complete()
    arena.complete()
  })

  describe('games$', () => {
    it('does not attemt to put unavailable members into games', (done) => {
      arena.games$.subscribe({
        next: () => { throw new Error('should not emit new game, one member is unavailable') },
        complete: () => done()
      })
      member1.joinGame('id', NEVER.toPromise())
      memberUpdate$.next([member1.id, member1])
      memberUpdate$.next([member2.id, member2])
      memberUpdate$.complete()
    })

    it.only('does not attempt to match up a member that was just matched', done => {
      arena.games$.pipe(skip(1)).subscribe({
        next: () => {
          throw new Error('should only emit one game, the other two matched up')
        },
        complete: () => done()
      })

      memberUpdate$.next(memberToMemberUpdate(member1))
      memberUpdate$.next(memberToMemberUpdate(member2))
      memberUpdate$.next(memberToMemberUpdate(member3))
      memberUpdate$.complete()
    })

    it('emits new games when two members join the arena', (done) => {
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
        console.log('arr: ', arr)

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
  it('completes activeGames$', () => {
    const arena = new Arena(NEVER, new DBQueries())
    const activeGamesSub = arena.activeGames$.subscribe()
    arena.complete()
    expect(activeGamesSub.closed).toBeTruthy()
  })
})
