import { SocketClientMessage, SocketServerMessage, CompleteGameInfo, PlayerDetails, UserDetails, ClientPlayerAction } from "../../common/types"
import { Chess, ShortMove } from "chess.js"
import { BotClient } from "../botClient"
import { MoveMaker } from "../../common/gameProviders"
import { from } from "rxjs"

const user1: UserDetails = {
  id: 'u1',
  username: 'user1',
  type: 'bot'
}

const player1: PlayerDetails = {
  user: user1,
  colour: 'w'
}

const user2: UserDetails = {
  id: 'u2',
  username: 'user2',
  type: 'bot'
}

const player2: PlayerDetails = {
  user: user2,
  colour: 'b'
}

const game1: CompleteGameInfo = {
  id: 'game1',
  playerDetails: [
    player1, player2
  ],
  history: new Chess().pgn()
}

const joinGameMsg: SocketServerMessage = {
  game: {
    type: 'join',
    join: game1
  }
}

it('can respond to a game update', done => {
  const move: ShortMove = {
    from: 'e2',
    to: 'e4'
  }

  const gameUpdateMessage: SocketServerMessage = {
    game: {
      type: 'update',
      update: {
        id: game1.id,
        type: 'move',
        move
      }
    }
  }

  const message$ = from([joinGameMsg, gameUpdateMessage])
  const expectedMove: ShortMove = { from: 'e7', to: 'e5' }
  const expectedClientAction: ClientPlayerAction = {
    gameId: game1.id,
    type: 'move',
    playerId: 'u2',
    move: expectedMove
  }

  const engine: MoveMaker = async () => (expectedMove)
  const response = (msg: SocketClientMessage) => {
    expect(msg.gameAction).toEqual(expectedClientAction)
    done()
  }

  const client = new BotClient(
    user2,
    message$,
    response,
    engine
  )

  client.disconnect()
})
