import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../_services/socket.service';
import { GameService } from '../../_services/game.service';
import { GameConfig } from 'APIInterfaces/types';


declare const ChessBoard: any;
@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit, OnDestroy {
  board: any;
  status = 'in check';

  constructor(
    private socketService: SocketService,
  ) {
    console.log('const board');
  }
  ngOnInit(): void {
    console.log('init board');
    this.socketService.socket.emit('ready');
    this.socketService.socket.on('start game', (gameConfig: GameConfig) => {
      this.board = ChessBoard({
        orientation: gameConfig.colour,
      });
    });
  }

  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    console.log('ded');
  }
}
