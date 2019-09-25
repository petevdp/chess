import { getLobbyMemberConnectionPair } from "./helpers"
import { EMPTY, from, Subject } from "rxjs"
import { userDetails } from '../../../common/dummyData'
import { Arena } from "../arena"
import { MemberUpdate } from ".."

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
