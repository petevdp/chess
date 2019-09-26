import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
import HttpServer from 'http'
import to from 'await-to-js'

import { DBQueries } from '../db/queries'
import { SocketServer } from './socketServer'
import { ClientConnection } from './clientConnection'
import { Lobby } from '../lobby'

// middleware
import ExpressSessionFactory from 'express-session'
import { api } from './api'

import ExpressWs from 'express-ws'
import { UserDetails } from '../../common/types'
import { SERVER_PORT } from '../../common/config'

// loads .env file into process.env
dotenv.config({ path: path.resolve('../.env') })

const session = ExpressSessionFactory({
  secret: 'my-secret',
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

app.use('/api', api(queries))

const client$ = SocketServer(http, session)

client$.subscribe(async ({ socket, session }) => {
  const [err, user] = await to(queries.getUser({ id: session.userId }))
  if (err) {
    console.log(err.toString())
    return
  }
  const clientConnection = new ClientConnection(socket, user as UserDetails)
  lobby.addLobbyMember(clientConnection)
})

http.listen(SERVER_PORT, () => {
  console.log(`Listening on ${SERVER_PORT}`)
})
