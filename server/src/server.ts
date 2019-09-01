import * as express from 'express';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as HttpServer from 'http';
import * as io from 'socket.io';

// middleware

import { api } from './api';
import { Lobby } from './lobby';
import { lobbyServerSignals } from '../../APIInterfaces/socketSignals';

// loads .env file into process.env
dotenv.config({path: path.resolve('../.env')});

const app = express();
const http = HttpServer.createServer(app);
const { PORT } = process.env;

const lobby = new Lobby();

const socketServer = io(http);

socketServer.on('connection', socket => {
  const user = {
    username: 'jimothy',
    id: 'ayy lmao',
  }
  lobby.addLobbyMember(user, socket);
});

lobby.detailsObservable.subscribe({
  next: details => {
    socketServer.emit(lobbyServerSignals.updateLobbyDetails(), details);
  }
});


app.use('/api', api);

http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
