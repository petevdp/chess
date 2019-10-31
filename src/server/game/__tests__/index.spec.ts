import { EMPTY, Subject, NEVER } from "rxjs"

import { SocketClientMessage } from "../../../common/types"
import { getLobbyMemberConnectionPair } from "../../lobby/testHelpers"
import Game from ".."
import DBQueries from '../../db/queries'
import { allUserDetails, allGameInfo } from "../../../common/dummyData/dummyData"
import { last } from "rxjs/operators"
import { simulatePlayerActions } from "../testHelpers"

jest.mock('../../db/queries')

it('sends joinGame messages to connections on instantiation', () => {
  const [conn1, member1] = getLobbyMemberConnectionPair(EMPTY, allUserDetails[0])
  const [conn2, member2] = getLobbyMemberConnectionPair(EMPTY, allUserDetails[1])

  const game = new Game([[member1, 'w'], [member2, 'b']], new DBQueries())

  expect(conn1.sendMessage.mock.calls[0][0].game.type).toEqual('join')
  expect(conn2.sendMessage.mock.calls[0][0].game.type).toEqual('join')

  game.end()
})

it('sets each gameMembers currentGame to the gameid', () => {
  const [, member1] = getLobbyMemberConnectionPair(EMPTY, allUserDetails[0])
  const [, member2] = getLobbyMemberConnectionPair(EMPTY, allUserDetails[1])

  const game = new Game([[member1, 'w'], [member2, 'b']], new DBQueries())

  expect(member1.state.currentGame).toEqual(game.id)
})

describe('update$', () => {
  // it('outputs game updates', () => {
  //   const connSubject1 = new Subject<SocketClientMessage>()
  //   const connSubject2 = new Subject<SocketClientMessage>()

  //   const [, member1] = getLobbyMemberConnectionPair(connSubject1, allUserDetails[0])
  //   const [, member2] = getLobbyMemberConnectionPair(connSubject2, allUserDetails[1])

  //   const game = new Game([[member1, 'w'], [member2, 'b']], new DBQueries())
  // })
})

describe('game end', () => {
  it('outputs a reason for the game ending when the game is over on the board', done => {
    const connSubject1 = new Subject<SocketClientMessage>()
    const connSubject2 = new Subject<SocketClientMessage>()

    const [, member1] = getLobbyMemberConnectionPair(connSubject1, allUserDetails[0])
    const [, member2] = getLobbyMemberConnectionPair(connSubject2, allUserDetails[1])

    const game = new Game([[member1, 'w'], [member2, 'b']], new DBQueries())
    const gameInfo = allGameInfo[1]

    game.gameUpdate$.pipe(last()).subscribe(update => {
      expect(update.type === 'end')
      expect(update).toHaveProperty('end')
      done()
    })

    simulatePlayerActions(gameInfo.pgn, gameInfo.id, connSubject1, connSubject2)
  })

  it('resolves endPromise with the endState', async (done) => {
    const [, member1] = getLobbyMemberConnectionPair(NEVER, allUserDetails[0])
    const [, member2] = getLobbyMemberConnectionPair(NEVER, allUserDetails[1])

    const game = new Game([[member1, 'w'], [member2, 'b']], new DBQueries())
    game.end()
    await game.endPromise
    done()
  })
})
