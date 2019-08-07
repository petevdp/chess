import { Injectable } from '@angular/core';
import { Observable, Subject, pipe } from 'rxjs';

import { GameStartState } from 'APIInterfaces/game';
import { Chess } from 'chess.js';
import { SocketService } from './socket.service';
import { start } from 'repl';

@Injectable({
  providedIn: 'root'
})
export class GameService {};
