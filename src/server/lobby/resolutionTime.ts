import _ from 'lodash'

import { LobbyMember } from "./lobbyMember"
import { GameResolutionTimeFormula } from "./arena"
import Game from '../game'
import { CompletedGameInfo } from '../../common/types'

export function fixedTime (time: number) {
  return () => time
}

export function asymptote (exponent: number): GameResolutionTimeFormula {
  return (
    potentialMatch: [LobbyMember, LobbyMember],
    activeGames: Game[]
  ): number => {
    const enumeratedhistories = potentialMatch.map(m => (
      m.state.gameHistory
        .reverse()
        .map((info, index): [CompletedGameInfo, number] => [info, index]))
    )

    const gamesPlayed = _.intersectionBy(...enumeratedhistories, ([info]) => info.id)
    if (gamesPlayed.length === 0) return 0

    const lastGame = _.minBy(gamesPlayed, ([, index]) => index)
    if (!lastGame) {
      throw new Error('since games played isn\'t empty, this must have a min')
    }
    const [, index] = lastGame
    return Math.floor((activeGames.length + 1) / (index ** exponent)) * 1000
  }
}
