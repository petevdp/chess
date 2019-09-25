import { SocketClientMessage } from "../../../common/types"
import { getLobbyMemberConnectionPair } from "./helpers"
import { EMPTY, from, Subject } from "rxjs"
import _ from 'lodash'
import Game from "../game"
import { fullGame, userDetails } from "../../../common/dummyData"
import { Chess, Move } from "chess.js"
import { last } from "rxjs/operators"

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

  game.gameUpdate$.pipe(last()).subscribe(update => {
    console.log('reason', update.end && update.end.reason)

    expect(update.type === 'end')
    done()
  })

  const newClientMessage = (move: Move): SocketClientMessage => ({
    gameAction: {
      gameId: game.id,
      type: 'move',
      move
    }
  })

  const chess = new Chess()
  chess.load_pgn(fullGame.pgn)

  from(chess.history({ verbose: true })).subscribe(move => {
    const message = newClientMessage(move)
    move.color === 'w'
      ? connSubject1.next(message)
      : connSubject2.next(message)
  })
})
