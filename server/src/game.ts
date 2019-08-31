import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MoveDetails, Colour, GameDetails } from '../../APIInterfaces/types';
import { Server, Socket } from 'socket.io';
import { LobbyMember } from './lobbyMember';
// import {  } from '../../APIInterfaces/socketSignals';
import { StateComponent } from './lobbyStateValue';
import * as Chess from 'chess.js';
import uuidv4 from 'uuid/v4';
import { Player } from './player';

export class Game implements StateComponent<GameStatus> {
  private players: Player[];
  id: string;
  private chess = new Chess();
  private gameDetails: GameDetails;

  constructor(
    private lobbyMembers: LobbyMember[]
  ) {

    this.id = uuidv4();
    const colours = ['b', 'w'] as Colour[];
    this.playerDetails = _.zip(lobbyMembers, _.shuffle(colours))
      .map(([member, colour]) => ({
        user: member.user,
        colour,
      }));

    this.gameDetails = {
      id: this.id,
      players: lobbyMembers.map((member) => ({}))
    }

    if (this.lobbyMembers.length !== 2) {
      throw new Error('wrong number of players: ' + this.lobbyMembers.length);
    }

    this.players = _.zip(_.shuffle(colours), this.lobbyMembers, moveSubjects)
      .map(([colour, lobbyMember, moveSubject]) => (
        new Player(
          lobbyMember,
          this.gameDetails,
          colour,
          moveSubject,
        )
      ));


    this.startGameWhenPlayersReady();
  }


  cleanup() {
    throw new Error('not implemented!');
  }

  getDetails = () => {
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

  private validateMove = (clientMove: MoveDetails): boolean => {
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
