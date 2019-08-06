import { Component, OnInit } from '@angular/core';
import { SocketService } from '../socket.service';

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
    private socketService: SocketService
  ) { }
  ngOnInit(): void {
    this.board = ChessBoard('board', {
      position: 'start',
      draggable: true,
    })
  }

}
