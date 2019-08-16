import { Injectable } from '@angular/core';
import { Observable, Subject, pipe } from 'rxjs';

import { GameConfig } from 'APIInterfaces/game';
import { ChessInstance } from 'chess.js';
import * as Chess from 'chess.js';
import { SocketService } from './socket.service';

declare const ChessBoard: any;

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private game: ChessInstance = new Chess();
  private board: any;

  constructor(
    private socketService: SocketService
  ) {
    this.socketService.gameConfigObservable.subscribe((GameConfig: GameConfig) => {
      if (!GameConfig) {
        console.log('GameConfig sux');
        return;
      }
      console.log('initializing board');
      this.board = ChessBoard('board', {
        orientation: GameConfig.colour,
        draggable: true,
        position: 'start',
      });
    });
  }
};
