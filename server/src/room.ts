import * as uuidv4 from 'uuid/v4';
import { LobbyMember, LobbyMember } from './lobbyMember';
import { Server, Socket } from 'socket.io';
import { Game } from './game';
import { ClientMove } from 'APIInterfaces/types';


export class Room {
  id: string;
  game: Game;
  players: LobbyMember[];

  constructor(
    lobbyMembers: LobbyMember[]
  ) {
    players = lobbyMembers.map(member => new )
    this.startGame();
  }

  addPlayer(player: LobbyMember) {
    if (this.players.length > 2) {
      throw new Error('too many players');
    }
    this.players.push(player);
    if (this.players.length === 2) {
      this.startGame();
    }
  }

  makeMove = (emitMove: (ClientMove) => void, move: ClientMove) => {
    // TODO validate gamestate with new move
    if (false) {
      throw new Error('illegal move!');
    }
    // TODO add move to gamestate

    emitMove(move);
  }

  private startGame(): void {
    // TODO implement game logic
    // this.game = new Game();
  }
}
