// dummy data for tsts

import { UserDetails, PlayerDetails, GameUpdateWithId } from "./types"
import { Chess, Move } from "chess.js"

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
