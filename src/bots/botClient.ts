import axios from 'axios';
import { Chess, ChessInstance } from 'chess.js';
import config from '../common/config';
import { UserDetails, SocketServerMessage, GameUpdate, CompleteGameInfo, GameMessage, EndReason, ClientPlayerAction } from '../common/types';
import { Observable, Subject } from 'rxjs';
import WebSocket from 'ws';
import { filter, map, scan, groupBy, take, mergeMap, pluck, takeUntil, tap } from 'rxjs/operators';
import { ChessEngine, randomMoveChoice } from './engines';
import { routeBy } from '../common/helpers';


const { API_ROUTE } = config;

const LOGIN_ROUTE = 'http://localhost:3000/api/login';
const SOCKET_ROUTE = 'http://localhost:3000';

const newClient = async (username: string) => {
  const res = await axios.put(
    LOGIN_ROUTE, { username, userType: 'bot' }
  );
  const socket = new WebSocket(SOCKET_ROUTE, {
    headers: {
      'cookie': res.headers['set-cookie'],
    }
  });
  return new GameClient(socket, res.data as UserDetails, new ChessEngine(randomMoveChoice))
}

(async () => {
  const client1 = newClient('billy');
  const client2 = newClient('bob');
})();
