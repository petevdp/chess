import express from 'express';
import  path from 'path';
import  dotenv from 'dotenv';
import  HttpServer from 'http';
import config from './server.config';
import uuidv4 from 'uuid/v4';
import { DBQueries } from './db/queries';


// middleware
import ExpressSessionFactory from 'express-session';
import sharedSession from 'express-socket.io-session';
const session = ExpressSessionFactory({
  secret: 'my-secret',
  resave: true,
  saveUninitialized: true,
  genid: uuidv4,
});

import api from './api';
import { Lobby } from './lobby';
import { SocketServer } from './clientSocketConnetions';


// loads .env file into process.env
dotenv.config({path: path.resolve('../.env')});

const app = express();
const http = HttpServer.createServer(app);


app.use(session);


const lobby = new Lobby();
const socketServer = new SocketServer(http, sharedSession(session));

socketServer.clientConnectionsObservable.subscribe({
  next: lobby.addLobbyMember
});

(async () => {
  const queries = new DBQueries();

  app.use('/api', api(queries));

  http.listen(config.PORT, () => {
    console.log(`Listening on ${config.PORT}`);
  });
})().catch((reason) => {throw reason})
