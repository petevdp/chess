import express from 'express';
import  path from 'path';
import  dotenv from 'dotenv';
import  HttpServer from 'http';

// middleware

import { api } from './api';
import { Lobby } from './lobby';
import { SocketServer } from './clientSocketConnetions';

// loads .env file into process.env
dotenv.config({path: path.resolve('../.env')});

const app = express();
const http = HttpServer.createServer(app);
const { PORT } = process.env;

const lobby = new Lobby();
const socketServer = new SocketServer(http);

socketServer.clientConnectionsObservable.subscribe({
  next: lobby.addLobbyMember
});

app.use('/api', api);

http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
