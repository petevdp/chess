import axios from 'axios';
import config from '../common/config';
import { UserDetails, SocketServerMessage } from '../common/types';
import { Observable } from 'rxjs';
import WebSocket from 'ws';


const { API_ROUTE } = config;

const LOGIN_ROUTE = 'http://localhost:3000/api/login';
const SOCKET_ROUTE = 'http://localhost:3000';


export class BotClient {
  private serverMessage$: Observable<SocketServerMessage>;

  constructor(private socket: WebSocket, private user: UserDetails) {
    this.serverMessage$ = new Observable(subscriber => {
      this.socket.on('message', (msg: SocketServerMessage) => {
        subscriber.next(msg)
      })
    })

    this.serverMessage$.subscribe(msg => {
      console.log('msg: ', msg);
    });
  }
}

const newClient = async (username: string) => {
  const res = await axios.put(
    LOGIN_ROUTE, { username, userType: 'bot' }
  );
  const socket = new WebSocket(SOCKET_ROUTE, {
    origin: 'http://localhost:3000',
    headers: {
      'cookie': res.headers['set-cookie'],
    }
  });
  return new BotClient(socket, res.data as UserDetails)
}

(async () => {
  const client1 = newClient('billy');
  const client2 = newClient('bob');
})();
