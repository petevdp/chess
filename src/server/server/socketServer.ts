import { Subject, Observable } from 'rxjs'
import express from 'express'
import WebSocket from 'ws'
import Http from 'http'
import { Response } from 'express-serve-static-core'

interface RawConnection {
  socket: WebSocket;
  session: any;
}

export class SocketServer {
  rawConnection$ = new Subject<RawConnection>()
  listening: Promise<void>

  constructor (
    httpServer: Http.Server,
    sessionParser: express.RequestHandler
  ) {
    this.listening = new Promise((resolve) => {
      const wss = new WebSocket.Server({ noServer: true }, () => {
        resolve()
      })

      httpServer.on('upgrade', (request, socket, head) => {
      // handle session authentication
        sessionParser(request, {} as Response, () => {
          const { session } = request

          if (!session.userId) {
            socket.destroy()
            return
          }

          // emit connection event with parsed session
          wss.handleUpgrade(request, socket, head, socket => {
            this.rawConnection$.next({ session, socket })
            wss.emit('connection', socket, request)
          })
        })
      })
    })
  }
}
