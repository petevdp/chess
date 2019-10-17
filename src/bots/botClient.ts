import axios from 'axios'
import WebSocket from 'ws'
import yargs from 'yargs'
import {
  SocketServerMessage,
  SocketClientMessage,
  UserDetails,
  GameMessage,
  CompleteGameInfo,
  GameUpdateWithId,
  BotDetails
} from '../common/types'
import { Observable, BehaviorSubject } from 'rxjs'
import { MoveMaker, GameClient } from '../common/gameProviders'
import { routeBy } from '../common/helpers'
import { filter, takeWhile, share, map } from 'rxjs/operators'
import { constructEngine } from './engines'
import { SOCKET_URL, LOGIN_URL } from '../common/config'

function getSocketServerMessageObservable (socket: WebSocket) {
  return new Observable<SocketServerMessage>((subscriber) => {
    socket.on('message', (msg: string) => {
      const serverMessage = JSON.parse(msg) as SocketServerMessage
      subscriber.next(serverMessage)
    })

    socket.on('close', () => {
      subscriber.complete()
    })
  }).pipe(share())
}

function sendToServer (socket: WebSocket, message: SocketClientMessage): void {
  socket.send(JSON.stringify(message))
}

export class BotClient {
  private currentGame$ = new BehaviorSubject<GameClient | null>(null)

  constructor (
    public user: UserDetails,
    serverMessage$: Observable<SocketServerMessage>,
    sendMessageToServer: (msg: SocketClientMessage) => void,
    engine: MoveMaker
  ) {
    const gameClient$ = this.createGameClient$(user, serverMessage$, engine)

    gameClient$.subscribe((client) => {
      client.action$.subscribe({
        next: (action) => {
          sendMessageToServer({
            gameAction: {
              gameId: client.id,
              ...action
            }
          })
        },
        error: (err) => {
          console.log(`in botclient ${this.user.id}`)
          throw err
        }
      })
    })
  }

  createGameClient$ (
    user: UserDetails,
    serverMessage$: Observable<SocketServerMessage>,
    engine: MoveMaker
  ) {
    const gameMessage$ = serverMessage$.pipe(routeBy<GameMessage>('game'))

    return gameMessage$.pipe(
      routeBy<CompleteGameInfo>('join'),
      map(info => {
        const gameUpdate$ = gameMessage$.pipe(
          routeBy<GameUpdateWithId>('update'),
          filter(({ id }) => id === info.id),
          takeWhile((update) => update.type !== 'end', true)
        )
        return new GameClient(
          gameUpdate$,
          info,
          user,
          engine
        )
      })
    )
  }

  get currentGame () {
    return this.currentGame$.value
  }

  disconnect () {}
}

async function newBotClient (options: BotDetails) {
  const res = await axios.put(LOGIN_URL, {
    username: options.username,
    userType: 'bot'
  })

  const user = res.data as UserDetails
  const socket = new WebSocket(SOCKET_URL, {
    headers: {
      cookie: res.headers['set-cookie']
    }
  })

  const serverMessage$ = getSocketServerMessageObservable(socket)

  const engine = constructEngine(options.engineName, options.engineOptions)

  if (!engine) {
    throw new Error(`No engine with name ${options.engineName}`)
  }

  const client = new BotClient(
    user,
    serverMessage$,
    (msg) => sendToServer(socket, msg),
    engine
  )

  return client
}

if (require.main === module) {
  const argv = yargs.argv

  const options = JSON.parse(argv.json as string) as BotDetails
  newBotClient(options)
}

export default newBotClient
