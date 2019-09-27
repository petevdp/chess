import { getLobbyMemberConnectionPair } from "../testHelpers"
import { EMPTY, from, Subject, NEVER } from "rxjs"
import { userDetails } from '../../../common/dummyData'
import { Arena } from "../arena"
import { MemberUpdate } from ".."
import { first, skip } from "rxjs/operators"
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

describe('activeGamesmap', () => {
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

  it('adds a game to the map when a new game is emitted', (done) => {
    arena.activeGamesMap$.pipe(first()).subscribe((gamesMap) => {
      expect(gamesMap.size).toEqual(1)
      done()
    })

    memberUpdate$.next([member1.id, member1])
    memberUpdate$.next([member2.id, member2])
  })

  it('ended games are set to null', done => {
    arena.activeGamesMap$.pipe(skip(1)).subscribe(gamesMap => {
      expect(gamesMap.values().next().value).toBeNull()
      done()
    })

    arena.games$.pipe(first()).subscribe(game => {
      game.end()
    })

    memberUpdate$.next([member1.id, member1])
    memberUpdate$.next([member2.id, member2])
  })
})
