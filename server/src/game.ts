import * as _ from 'lodash';
import { Observable, Subject, merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ClientMove, GameConfig } from 'APIInterfaces/types';
import { Server, Socket } from 'socket.io';
import { LobbyMember } from './lobbyMember';
import { MAKE_MOVE, GAME_START } from 'APIInterfaces/socketSignals';
import { LobbyStateValue } from './lobbyStateValue';
import uuidv4 from 'uuid/v4';

// outcomes: disconnect, win, lose, draw
export class Player {

  socket: Socket;
  opponentMoveObservable: Observable<ClientMove>;
  moveObservable: Observable<ClientMove>;

  constructor(
    lobbyMember: LobbyMember,
    private gameConfig: GameConfig,
    public colour: string,
    moveSubject: Subject<ClientMove>,
    ) {
      this.socket = lobbyMember.socket;

      this.socket.on(MAKE_MOVE, (clientMove: ClientMove) => {
        moveSubject.next(clientMove);
      });
      this.moveObservable = moveSubject.asObservable();
  }

  startGame() {
    this.socket.emit(GAME_START, {gameConfig: this.gameConfig, colour: this.colour});
  }
}
export class Game implements LobbyStateValue {
  gameStateObservable: Observable<any>;
  gameConfig: {};
  private players: Player[];
  id: string;

  constructor(
    private lobbyMembers: LobbyMember[]
  ) {
    this.id = uuidv4();
    if (this.lobbyMembers.length !== 2) {
      throw new Error('wrong number of players: ' + this.lobbyMembers.length);
    }
    const colours = ['black', 'white'];
    const moveSubjects = _.times(2)
      .map(this.generateMoveSubject) as Subject<ClientMove>[];


    this.players = _.zip(_.shuffle(colours), this.lobbyMembers, moveSubjects)
      .map(([colour, lobbyMember, moveSubject]) => (
        new Player(
          lobbyMember,
          { ...this.gameConfig },
          colour,
          moveSubject,
        )
      ));

    // allow players to see each others moves
    this.players[0].opponentMoveObservable = this.opponentMoveObservableFactory(this.players[1]);
    this.players[1].opponentMoveObservable = this.opponentMoveObservableFactory(this.players[0]);

    // TODO transform this into a holistic gamestate
    this.gameStateObservable = merge(...(this.players.map((player: Player) => player.moveObservable)))
      .pipe(filter(this.validateMove));

    this.startGame();
  }

  cleanup() {
    throw new Error('not implemented!');
  }

  private startGame() {
    this.players.forEach((player: Player) => player.startGame);
  }

  private generateMoveSubject() {
    return new Subject<ClientMove>();
  }

  private opponentMoveObservableFactory(opponent: Player) {
    return opponent.moveObservable.pipe(filter(this.validateMove));
  }

  private validateMove = (clientMove: ClientMove): boolean => {
    // TODO validate moves
    return true;
  }
}
