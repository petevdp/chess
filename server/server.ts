import express from 'express';
import  path from 'path';
import  dotenv from 'dotenv';
import  HttpServer from 'http';
import config from './server.config';

// middleware

import { api } from './api';
import { Lobby } from './lobby';
import { SocketServer } from './clientSocketConnetions';

// loads .env file into process.env
dotenv.config({path: path.resolve('../.env')});

const app = express();
const http = HttpServer.createServer(app);

const lobby = new Lobby();
const socketServer = new SocketServer(http);

socketServer.clientConnectionsObservable.subscribe({
  next: lobby.addLobbyMember
});

app.use('/api', api);

http.listen(config.PORT, () => {
  console.log(`Listening on ${config.PORT}`);
});
