// dummy data for tsts

import { UserDetails, PlayerDetails, GameUpdateWithId, CompleteGameInfo, SocketClientMessage } from "./types"
import { Chess, Move } from "chess.js"
import { Subject, from } from "rxjs"

export const userDetails: UserDetails[] = [
  {
    id: 'u1',
    username: 'user1',
    type: 'bot'
  },
  {
    id: 'u2',
    username: 'user2',
    type: 'bot'
  }
]

export const playerDetails: PlayerDetails[] = [
  {
    user: userDetails[0],
    colour: 'w'
  },
  {
    user: userDetails[1],
    colour: 'b'
  }
]

const chess = new Chess()

export const moves: Move[] = [
  chess.move('a4') as Move,
  chess.move('a5') as Move
]

export const moveUpdates: GameUpdateWithId[] = [
  {
    type: 'move',
    move: moves[0],
    id: 'game1'
  },
  {
    type: 'move',
    move: moves[1],
    id: 'game1'
  }
]

export const games = [
  {
    id: 'game1',
    playerDetails,
    history: new Chess().pgn()
  }
]

const newClientMessage = (move: Move, gameId: string): SocketClientMessage => ({
  gameAction: {
    gameId,
    type: 'move',
    move
  }
})

/*
* Simulates a game as messages on the provided subjects.
*/
export function simulatePlayerActions (
  pgn: string,
  gameId: string,
  white$: Subject<SocketClientMessage>,
  black$: Subject<SocketClientMessage>
) {
  const chess = new Chess()
  chess.load_pgn(pgn)

  from(chess.history({ verbose: true })).subscribe(move => {
    const message = newClientMessage(move, gameId)
    move.color === 'w'
      ? white$.next(message)
      : black$.next(message)
  })
}

export const fullGame: CompleteGameInfo = {
  id: 'casualGame',
  playerDetails: playerDetails,
  pgn: ['[Event "Casual Game"]',
    '[Site "Berlin GER"]',
    '[Date "1852.??.??"]',
    '[EventDate "?"]',
    '[Round "?"]',
    '[Result "1-0"]',
    '[White "Adolf Anderssen"]',
    '[Black "Jean Dufresne"]',
    '[ECO "C52"]',
    '[WhiteElo "?"]',
    '[BlackElo "?"]',
    '[PlyCount "47"]',
    '',
    '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O',
    'd3 8.Qb3 Qf6 9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4',
    'Bb6 14.Nbd2 Bb7 15.Ne4 Qf5 16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6',
    'Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7 22.Bf5+ Ke8',
    '23.Bd7+ Kf8 24.Bxe7# 1-0'].join('\n')
}
