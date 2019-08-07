import { Chess, ShortMove, ChessInstance } from 'chess.js';
import { User } from './user';
import { Room } from './room';
import * as _ from 'lodash';
import { Observable, BehaviorSubject, Subject } from 'rxjs';

class Player {

  private moveSubject: Subject<ShortMove>;
  public moveObservable: Observable<ShortMove>;

  constructor(
    private user: User,
    private color: string
  ) {
    this.user.socket.emit('start game', { color: this.color });

    this.moveSubject = new Subject();
    this.user.socket.on('move', this.moveSubject.next);
    this.moveObservable = this.moveSubject.asObservable();
  }
}
export class Game {

  private game: ChessInstance = new Chess();
  private players: Player[];

  constructor(
    private room: Room
  ) {

    const colors = _.shuffle(['white', 'black']);
    this.players = _.zip(room.users, colors, (user, color) => (
      new Player(user, color)
    ));

    this.players.forEach(player => {
      player.moveObservable.subscribe((move: ShortMove) => {
        if this.game.moves()
      });
    });
  }
}
