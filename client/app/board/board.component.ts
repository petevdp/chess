import { Component, OnInit } from '@angular/core';
declare const ChessBoard: any;

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  board: any;

  constructor() { }
  ngOnInit(): void {
    this.board = ChessBoard('board', {
      position: 'start',
      draggable: true,
    })
  }

}
