import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
import HttpServer from 'http'
import to from 'await-to-js'
import redis from 'redis'
import ExpressSessionFactory from 'express-session'
import RedisStoreFactory from 'connect-redis'
import ExpressWs from 'express-ws'

import { DBQueries } from '../db/queries'
import { SocketServer } from './socketServer'
import { ClientConnection } from './clientConnection'
import { Lobby } from '../lobby'

import { UserDetails } from '../../common/types'
import { SERVER_PORT, STARTING_BOTS } from '../../common/config'
import BotManager from './botManager'
import { BUILD_DIR } from '../constants'
import { api } from './api'

// loads .env file into process.env
dotenv.config({ path: path.resolve('../../.env') })

const RedisStore = RedisStoreFactory(ExpressSessionFactory)
const redisClient = redis.createClient()
const { SESSION_SECRET } = process.env

if (!SESSION_SECRET) {
  throw new Error('env variable SESSION_SECRET is undefined')
}

const session = ExpressSessionFactory({
  store: new RedisStore({ client: redisClient }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true
})

const app = express()

ExpressWs(app)

const http = HttpServer.createServer(app)

app.use(session)

// setup lobby and start server
const queries = new DBQueries()
const lobby = new Lobby()

app.use(express.static(BUILD_DIR))
app.use('/api', api(queries))

const socketServer = new SocketServer(http, session)
socketServer.rawConnection$.subscribe(async ({ socket, session }) => {
  const [err, user] = await to(queries.getUser({ id: session.userId }))
  if (err) {
    console.log(err.toString())
    return
  }
  const clientConnection = new ClientConnection(socket, user as UserDetails)
  lobby.addLobbyMember(clientConnection)
})

app.get('*', (_, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'))
})

http.listen(SERVER_PORT, () => {
  console.log(`Listening on ${SERVER_PORT}`)
  const botManager = new BotManager()
  STARTING_BOTS.forEach(details => botManager.addBot(details))
})
