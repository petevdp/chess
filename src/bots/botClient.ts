import axios from 'axios'
import config from '../common/config'
import WebSocket from 'ws'

const { API_ROUTE } = config

const LOGIN_ROUTE = 'http://localhost:3000/api/login'
const SOCKET_ROUTE = 'http://localhost:3000'

async function newClient (username: string) {
  const res = await axios.put(
    LOGIN_ROUTE, { username, userType: 'bot' }
  )
  const socket = new WebSocket(SOCKET_ROUTE, {
    headers: {
      cookie: res.headers['set-cookie']
    }
  })
  return socket
}

(async () => {
  newClient('billy')
  newClient('bob')
})()
