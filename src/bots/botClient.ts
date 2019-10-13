import axios from 'axios'
import WebSocket from 'ws'
import yargs from 'yargs'
import {
  SocketServerMessage,
  SocketClientMessage,
  UserDetails,
  GameMessage,
  CompleteGameInfo,
  GameUpdateWithId
} from '../common/types'
import { Observable, BehaviorSubject } from 'rxjs'
import { MoveMaker, GameClient } from '../common/gameProviders'
import { routeBy, sleep } from '../common/helpers'
import { filter, takeWhile } from 'rxjs/operators'
import { randomMoveEngine, ChessEngineName, engineNameMapping } from './engines'
import { SOCKET_URL, LOGIN_URL } from '../common/config'
import { ChessInstance } from 'chess.js'

function getSocketServerMessageObservable (socket: WebSocket) {
  return new Observable<SocketServerMessage>((subscriber) => {
    socket.on('message', (msg: string) => {
      const serverMessage = JSON.parse(msg) as SocketServerMessage
      subscriber.next(serverMessage)
    })

    socket.on('close', () => {
      subscriber.complete()
    })
  })
}

function sendToServer (socket: WebSocket, message: SocketClientMessage): void {
  socket.send(JSON.stringify(message))
}

export class BotClient {
  private currentGame$ = new BehaviorSubject<GameClient | null>(null)

  constructor (
    user: UserDetails,
    serverMessage$: Observable<SocketServerMessage>,
    sendMessageToServer: (msg: SocketClientMessage) => void,
    engine: MoveMaker
  ) {
    const gameMessage$ = serverMessage$.pipe(routeBy<GameMessage>('game'))

    gameMessage$.pipe(routeBy<CompleteGameInfo>('join')).subscribe({
      next: (info) => {
        const gameUpdate$ = gameMessage$.pipe(
          routeBy<GameUpdateWithId>('update'),
          filter(({ id }) => id === info.id),
          takeWhile((update) => update.type !== 'end', true)
        )
        const gameClient = new GameClient(
          gameUpdate$,
          info,
          user,
          engine
        )

        gameClient.action$.subscribe({
          next: (action) => {
            sendMessageToServer({
              gameAction: {
                gameId: info.id,
                ...action
              }
            })
          }
        })
      }
    })
  }

  get currentGame () {
    return this.currentGame$.value
  }

  disconnect () {}
}

export interface BotClientCLIOptions {
  user: UserDetails;
  engineName: ChessEngineName;
}

export async function newClient (options: BotClientCLIOptions) {
  const username = options.user.username

  const res = await axios.put(LOGIN_URL, { username, userType: 'bot' })
  const user = res.data as UserDetails
  const socket = new WebSocket(SOCKET_URL, {
    headers: {
      cookie: res.headers['set-cookie']
    }
  })

  const serverMessage$ = getSocketServerMessageObservable(socket)

  const engine = engineNameMapping.get(options.engineName)
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

// const delayedRandomMoveEngine = (delay: number) => async (chess: ChessInstance) => {
//   await sleep(delay)
//   return randomMoveEngine(chess)
// }

if (require.main === module) {
  console.log('new botclient')
  const argv = yargs.argv

  const options = JSON.parse(argv.json as string)
  newClient(options)
}
