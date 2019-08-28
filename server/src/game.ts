import * as _ from 'lodash';
import { Observable, Subject, merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ClientMove, GameConfig, Colour, GameDetails } from '../../APIInterfaces/types';
import { Server, Socket } from 'socket.io';
import { LobbyMember } from './lobbyMember';
// import {  } from '../../APIInterfaces/socketSignals';
import { LobbyStateValue } from './lobbyStateValue';
import * as Chess from 'chess.js';
import uuidv4 from 'uuid/v4';
import { Player } from './player';

export class Game implements LobbyStateValue {
  gameConfig: GameDetails;
  private players: Player[];
  id: string;
  private chess = new Chess();

  constructor(
    private lobbyMembers: LobbyMember[]
  ) {
    this.id = uuidv4();

    if (this.lobbyMembers.length !== 2) {
      throw new Error('wrong number of players: ' + this.lobbyMembers.length);
    }
    const colours = ['b', 'w'] as Colour[];
    const moveSubjects = _.times(2)
      .map(this.generateMoveSubject) as Subject<ClientMove>[];


    this.players = _.zip(_.shuffle(colours), this.lobbyMembers, moveSubjects)
      .map(([colour, lobbyMember, moveSubject]) => (
        new Player(
          lobbyMember,
          this.gameDetails,
          colour,
          moveSubject,
        )
      ));

    // allow players to see each others moves
    this.players[0].opponentMoveObservable = this.opponentMoveObservableFactory(this.players[1]);
    this.players[1].opponentMoveObservable = this.opponentMoveObservableFactory(this.players[0]);

    // TODO transform this into a holistic gamestate

    this.startGameWhenPlayersReady();
  }

  cleanup() {
    throw new Error('not implemented!');
  }

  gameDetails = () => {
    return {
      id: this.id,
      players: this.players.map(p => p.details),
    };
  }

  private async startGameWhenPlayersReady() {
    // Wait for all payers to be ready, then start game.
    const allReady = Promise.all(this.players.map((player: Player) => player.ready))
      .then(() => this.players.forEach(player => player.startGame))
      // TODO add recovery for ready up failure.
      .catch(() => console.log('game failed!'));
    return allReady;
  }

  private generateMoveSubject() {
    return new Subject<ClientMove>();
  }

  private opponentMoveObservableFactory(opponent: Player) {
    return opponent.moveObservable.pipe(filter(this.validateMove));
  }

  private validateMove = (clientMove: ClientMove): boolean => {
    const { colour, ...move } = clientMove;
    if ( this.chess.turn() !== colour
      && this.chess.move(move)
    ) {
      console.log('invalid move: ', clientMove);
      return null;
    }
    return true;
  }
}
