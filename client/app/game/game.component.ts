import { Component, OnInit } from '@angular/core';
declare const ChessBoard: any;

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  board: any;

  constructor() { }
  ngOnInit(): void {
    this.board = ChessBoard('board', {
      position: 'start',
      draggable: true,
    })
  }

}
