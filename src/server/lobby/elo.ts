export type GameOutcome = 'win' | 'loss' | 'draw'

export type CalculateRatings = (
  playerRating: number,
  opponentRating: number,
  outcome: GameOutcome
) => number

const pointOutcomeMap = {
  win: 1,
  loss: 0,
  draw: 0.5
}

// https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details
export function ELOFormula (k: number): CalculateRatings {
  return (playerRating, opponentRating, outcome) => {
    const expectedPoints = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400))
    const points = pointOutcomeMap[outcome]
    return Math.round(playerRating + k * (points - expectedPoints))
  }
}
