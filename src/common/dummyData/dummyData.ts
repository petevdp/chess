// dummy data for tsts
import uuidv4 from 'uuid/v4'
import _ from 'lodash'

import { UserDetails, PlayerDetails, GameUpdateWithId, SocketClientMessage, SocketServerMessage, LobbyMemberDetailsUpdate, LobbyMemberDetails, GameMessage, DisplayedGameMessage, GameInfo } from "../types"

import { Move, ChessInstance } from "chess.js"
import { getChessConstructor } from "../helpers"

const Chess = getChessConstructor()

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
  },
  {
    id: 'u3',
    username: 'user3',
    type: 'bot'
  }
]

export const allMemberDetails: LobbyMemberDetails[] = [
  {
    ...userDetails[0],
    currentGame: null,
    leftLobby: false
  },
  {
    ...userDetails[1],
    currentGame: null,
    leftLobby: false
  },
  {
    ...userDetails[2],
    currentGame: null,
    leftLobby: false
  }
]

export const allPlayerDetails: PlayerDetails[] = [
  {
    user: userDetails[0],
    colour: 'w'
  },
  {
    user: userDetails[1],
    colour: 'b'
  }
]

const chess = new Chess() as ChessInstance

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

export const endUpdates: GameUpdateWithId[] = [
  {
    id: 'game1',
    type: 'end',
    end: {
      reason: 'checkmate',
      winnerId: userDetails[0].id
    }
  }
]

export const newClientMessage = (move: Move, gameId: string): SocketClientMessage => ({
  gameAction: {
    gameId,
    type: 'move',
    move
  }
})

export const allMemberDetailsUpdates: LobbyMemberDetailsUpdate[] = [
  [
    allMemberDetails[0].id,
    allMemberDetails[0]
  ]
]

export const allGameServerMessages: SocketServerMessage[] = [
]

export const gameUpdateMessage = {
  game: {
    type: 'update',
    update: moveUpdates[0]
  }
}

export const allMemberServerMessages: SocketServerMessage[] = [
  {
    lobby: {
      member: { memberDetailsUpdate: [allMemberDetailsUpdates[0]] }
    }
  }
]

export const allGameInfo: GameInfo[] = [
  {
    id: 'game1',
    playerDetails: allPlayerDetails.slice(0, 2) as [PlayerDetails, PlayerDetails],
    pgn: new Chess().pgn()
  },
  {
    id: 'casualGame',
    playerDetails: allPlayerDetails.slice(0, 2) as [PlayerDetails, PlayerDetails],
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
      '23.Bd7+ Kf8 24.Bxe7# 1-0'].join('\n'),
    end: {
      reason: 'checkmate',
      winnerId: allPlayerDetails[0].user.id
    }
  }
]

export function duplicateGameInfo (gameInfo: GameInfo): GameInfo {
  return {
    ...gameInfo,
    id: uuidv4(),
    end: gameInfo.end && { ...gameInfo.end }
  }
}

export const joinMessage: GameMessage = {
  type: 'join',
  join: allGameInfo[0]
}

export const displayedGameMessages: DisplayedGameMessage[] = [
  {
    type: 'add',
    add: [allGameInfo[0]]
  },
  {
    type: 'add',
    add: [allGameInfo[1]]
  }
]

export const endUpdateMessage: GameMessage = {
  type: 'update',
  update: endUpdates[0]
}

export function makeFakeGames (count: number, completed = false): GameInfo[] {
  return _.times(count).map((): GameInfo => ({
    ...allGameInfo[completed ? 1 : 0],
    id: uuidv4()
  }))
}
