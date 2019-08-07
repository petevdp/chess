import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../_services/socket.service';
import { GameService } from '../../_services/game.service';

declare const ChessBoard: any;

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  board: any;
  status: string = 'in check';

  constructor(
    private gameService: GameService
  ) { }
  ngOnInit(): void {
    this.board = ChessBoard('board', {
      position: 'start',
      draggable: true,
    })
  }

}
