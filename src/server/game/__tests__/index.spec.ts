import { SocketClientMessage } from "../../../common/types"
import { getLobbyMemberConnectionPair } from "../../lobby/testHelpers"
import { EMPTY, Subject } from "rxjs"
import Game from ".."
import { userDetails, allgameInfo } from "../../../common/dummyData"
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

it('outputs a reason for the game ending when the game is over on the board', done => {
  const connSubject1 = new Subject<SocketClientMessage>()
  const connSubject2 = new Subject<SocketClientMessage>()

  const [, member1] = getLobbyMemberConnectionPair(connSubject1, userDetails[0])
  const [, member2] = getLobbyMemberConnectionPair(connSubject2, userDetails[1])

  const game = new Game([[member1, 'w'], [member2, 'b']])
  const gameInfo = allgameInfo.checkmateGame

  game.gameUpdate$.pipe(last()).subscribe(update => {
    expect(update.type === 'end')
    done()
  })

  simulatePlayerActions(gameInfo.pgn, gameInfo.id, connSubject1, connSubject2)
})
