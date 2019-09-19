import IO, { Socket } from 'socket.io';
import { SocketClientMessage, SocketServerMessage, UserDetails } from '../common/types';
import { Observable } from 'rxjs';
import HTTP from 'http';
import { SocketIoSharedSessionMiddleware } from 'express-socket.io-session';
import { DBQueries } from './db/queries';
import express from 'express';
import { Lobby } from './lobby';
import WebSocket from 'ws';


export interface IClientConnection {
  clientMessage$: Observable<SocketClientMessage>;
  sendMessage: (socketServerMessage: SocketServerMessage) => void;
  isActive: boolean;
  user: UserDetails;
  complete: () => void;
}

export class ClientConnection implements IClientConnection {
  clientMessage$: Observable<SocketClientMessage>;

  constructor(private ws: WebSocket, public user: UserDetails) {
    this.clientMessage$ = new Observable(subscriber => {
      ws
        .on('message', msg => subscriber.next(msg))
        .on('message', () => console.log('new message'))
        .on('close', () => {
          console.log('I\'m disconnecting');
          subscriber.complete()
        });
    })
  }

  get isActive() {
    return this.ws.readyState === this.ws.OPEN;
  }

  sendMessage(message: SocketServerMessage) {
    if (!this.isActive) {
      return console.log('socket disconnected!');
    }
    this.ws.send(message);
  }
  complete() {
  }
}

export const SocketRoute = (queries: DBQueries, lobby: Lobby) => {
  const router = express.Router()

  router.ws('/', (ws, req) => {
    if (!req.sessionID) {
      console.log('no session');
      ws.close();
      return;
    }

    const { userId } = req.session;
    queries.getUser({ id: userId })
      .then(user => {
        const connection = new ClientConnection(ws, user)
        lobby.addLobbyMember(connection);
      });
  })

  return router;
}
