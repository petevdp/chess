import { Subject } from 'rxjs';
import express from 'express';
import WebSocket from 'ws';
import Http from 'http';

interface RawConnection {
  socket: WebSocket;
  session: any;
}

export const SocketServer = (
  httpServer: Http.Server,
  sessionParser: express.RequestHandler
) => {
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
