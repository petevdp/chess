import { Subject } from 'rxjs'
import express from 'express'
import WebSocket from 'ws'
import Http from 'http'
import { Response } from 'express-serve-static-core'

interface RawConnection {
  socket: WebSocket;
  session: any;
}

export const SocketServer = (
  httpServer: Http.Server,
  sessionParser: express.RequestHandler
) => {
  const wss = new WebSocket.Server({ noServer: true })

  const client$ = new Subject<RawConnection>()
  httpServer.on('upgrade', (request, socket, head) => {
    sessionParser(request, {} as Response, () => {
      const { session } = request

      if (!session.userId) {
        socket.destroy()
        return
      }

      // emit connection event with parsed session
      wss.handleUpgrade(request, socket, head, socket => {
        client$.next({ session, socket })
        wss.emit('connection', socket, request)
      })
    })
  })

  return client$.asObservable()
}
