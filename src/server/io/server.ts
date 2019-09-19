import express from 'express';
import  path from 'path';
import  dotenv from 'dotenv';
import HttpServer from 'http';
import config from '../server.config';
import uuidv4 from 'uuid/v4';
import { DBQueries } from '../db/queries';


// middleware
import ExpressSessionFactory from 'express-session';
import sharedSession from 'express-socket.io-session';

import { api } from './api';
import { Lobby } from '../lobby';
import { SocketServer, ClientConnection } from './socketServer';


import ExpressWs from 'express-ws';

// loads .env file into process.env
dotenv.config({path: path.resolve('../.env')});

const session = ExpressSessionFactory({
  secret: 'my-secret',
  resave: false,
  saveUninitialized: true,
  genid: uuidv4,
});

const app = express();
const expressWs = ExpressWs(app);

const http = HttpServer.createServer(app);

app.use(session);

// setup lobby and start server
(async () => {
  const queries = new DBQueries();
  const lobby = new Lobby();


  app.use('/api', api(queries));

  const client$ = SocketServer(http, session);

  client$.subscribe(async ({socket, request}) => {
    const user = await queries.getUser(request.session.userId);
    lobby.addLobbyMember(new ClientConnection(socket, user));
  })

  http.listen(config.PORT, () => {
    console.log(`Listening on ${config.PORT}`);
  });
})().catch((reason) => {throw reason})
