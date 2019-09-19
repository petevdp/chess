import IO, { Socket } from 'socket.io';
import { SocketClientMessage, SocketServerMessage, UserDetails } from '../../common/types';
import { Observable, Subject } from 'rxjs';
import HTTP from 'http';
import { SocketIoSharedSessionMiddleware } from 'express-socket.io-session';
import { DBQueries } from '../db/queries';
import express from 'express';
import { Lobby } from '../lobby';
import WebSocket from 'ws';
import Http from 'http';


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

interface RawConnection {
  socket: WebSocket;
  session: any;
}

export const SocketServer = (httpServer: Http.Server, sessionParser: express.RequestHandler) => {
  const wss = new WebSocket.Server({ noServer: true });

  const client$ = new Subject<RawConnection>();
  httpServer.on('upgrade', (request, socket, head) => {
    console.log('parsing session');

    sessionParser(request, {}, () => {
      const { session, sessionId } = request;
      if (!sessionId) {
        socket.destroy();
      }
      console.log('session is parsed');

      // emit connection event with parsed session
      wss.handleUpgrade(_, socket, head, socket => {
        client$.next({ session, socket });
        wss.emit('connection', socket, request);
      });

    })
  });

  return client$.asObservable();
}
