import { Subject } from 'rxjs'
import ExpressSession from 'express-session'
import express from 'express'
import WebSocket from 'ws'
import Http from 'http'

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
    console.log('parsing session')

    sessionParser(request, {}, () => {
      const { session } = request
      console.log('session: ', session)

      if (!session.userId) {
        socket.destroy()
        console.log('no worky worky')
        return
      }
      console.log('session is parsed')

      // emit connection event with parsed session
      wss.handleUpgrade(request, socket, head, socket => {
        client$.next({ session, socket })
        wss.emit('connection', socket, request)
      })
    })
  })

  return client$.asObservable()
}
