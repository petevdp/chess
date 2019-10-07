import { SocketClientMessage } from "../../../common/types"
import { getLobbyMemberConnectionPair } from "../../lobby/testHelpers"
import { EMPTY, Subject, NEVER } from "rxjs"
import Game from ".."
import { userDetails, allGameInfo } from "../../../common/dummyData/dummyData"
import { last } from "rxjs/operators"
import { simulatePlayerActions } from "../testHelpers"

it('sends joinGame messages to connections on instantiation', () => {
  const [conn1, member1] = getLobbyMemberConnectionPair(EMPTY, userDetails[0])
  const [conn2, member2] = getLobbyMemberConnectionPair(EMPTY, userDetails[1])

  const game = new Game([[member1, 'w'], [member2, 'b']])

  expect(conn1.sendMessage.mock.calls[0][0].game.type).toEqual('join')
  expect(conn2.sendMessage.mock.calls[0][0].game.type).toEqual('join')

  game.end()
})

it('sets the lobbyMembers ingame state to the gameid', () => {
  const [, member1] = getLobbyMemberConnectionPair(EMPTY, userDetails[0])
  const [, member2] = getLobbyMemberConnectionPair(EMPTY, userDetails[1])

  const game = new Game([[member1, 'w'], [member2, 'b']])

  expect(member1.state.currentGame).toEqual(game.id)
})

describe('game end', () => {
  it('outputs a reason for the game ending when the game is over on the board', done => {
    const connSubject1 = new Subject<SocketClientMessage>()
    const connSubject2 = new Subject<SocketClientMessage>()

    const [, member1] = getLobbyMemberConnectionPair(connSubject1, userDetails[0])
    const [, member2] = getLobbyMemberConnectionPair(connSubject2, userDetails[1])

    const game = new Game([[member1, 'w'], [member2, 'b']])
    const gameInfo = allGameInfo[1]

    game.gameUpdate$.pipe(last()).subscribe(update => {
      expect(update.type === 'end')
      done()
    })

    simulatePlayerActions(gameInfo.pgn, gameInfo.id, connSubject1, connSubject2)
  })

  it('resolves endPromise with the endState', async (done) => {
    const [, member1] = getLobbyMemberConnectionPair(NEVER, userDetails[0])
    const [, member2] = getLobbyMemberConnectionPair(NEVER, userDetails[1])

    const game = new Game([[member1, 'w'], [member2, 'b']])
    game.end()
    await game.endPromise
    done()
  })
})
