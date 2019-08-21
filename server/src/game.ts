import {ChessInstance, Chess } from 'chess.js';
import { LobbyMember } from './player';
import { Room } from './room';
import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { ClientMove, GameConfig } from 'APIInterfaces/types';
import { Server } from 'socket.io';

class LobbyMember {

  private moveSubject: Subject<ClientMove>;
  public moveObservable: Observable<ClientMove>;

  constructor(
    private user: LobbyMember,
    private room: Room,
    public colour: string
  ) {
    console.log('new player!');
    this.user.socket.on('ready', () => {
      console.log('ready!');
      this.user.socket.emit('start game', { colour });
    });

    this.moveSubject = new Subject();
    this.user.socket.on('move', (move: ClientMove) => {
      this.moveSubject.next(move);
    });
    this.moveObservable = this.moveSubject.asObservable();

    this.user.socket.emit('init game');
  }


  // sends move to all players in room except sender
  broadcastMove(move: ClientMove) {
    this.user.socket.to(this.room.id).emit('move', move);
  }

  startGame() {
    console.log('starting game');
    console.log(this.user.socket.connected);
  }
}

export class Game {

  private game: ChessInstance = new Chess();
  private players: LobbyMember[];

  constructor(
    private room: Room,
  ) {
    const colors = _.shuffle(['white', 'black']);
    this.players = _.zip(room.players, colors).map(([user, colour]) => (
      new LobbyMember(user, this.room, colour)
    ));
    console.log('players: ', this.players.length);

    this.players.forEach((player: LobbyMember) => {
      player.moveObservable.subscribe((move: ClientMove) => {
        if (player.colour !== move.colour) {
          throw new Error('wrong color!');
        }
        if (this.game.move(move)) {
          player.broadcastMove(move);
        } else {
          throw new Error('invalid move!');
        }
      });
    });
    this.players.forEach(player => player.startGame());
  }
}
