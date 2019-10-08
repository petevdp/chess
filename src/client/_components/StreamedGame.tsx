import React, { } from 'react'
import Chessboard from 'chessboardjsx'
import { GameStateWithDetails } from '../../common/gameProviders'
import { PlayerDetails, EndState } from '../../common/types'
import { ChessInstance, Move } from 'chess.js'

const colours = {
  lightYellow: "rgba(255, 255, 0, 0.4)"
}

export interface SmallGameDisplayProps {
  gameState: GameStateWithDetails;
}

function getSortedPlayerDetails (playerDetails: PlayerDetails[]) {
  return playerDetails.sort((a) => a.colour === 'w' ? -1 : 1)
}

interface WinnerDisplayProps {
  end: EndState;
  playerDetails: PlayerDetails[];
}

function EndDisplay ({ end, playerDetails }: WinnerDisplayProps) {
  const winner = end.winnerId
    && playerDetails.find(player => player.user.id === end.winnerId)

  return (
    <React.Fragment>
      <div>Game Over: {end.reason}</div>
      {winner && <div>Winner: {winner.user.username} </div>}
    </React.Fragment>
  )
}

function SmallGameInfo ({ gameState }: SmallGameDisplayProps) {
  const { playerDetails, end } = gameState
  const [white, black] = getSortedPlayerDetails(playerDetails)
  const currentStateDisplay = end
    ? <EndDisplay end={end} playerDetails={playerDetails} />
    : <div>turn: {gameState.chess.turn()}</div>

  return (
    <div className="small-game-info">
      <div className="player-info white-player-info">
        <i className="material-icons avatar">portrait</i>
        <span className="username">{white.user.username}</span>
        <span className="elo">1001</span>
      </div>
      {currentStateDisplay}
      <div className="player-info black-player-info">
        <span className="username">{black.user.username}</span>
        <span className="elo">4200</span>
        <i className="material-icons avatar">portrait</i>
      </div>
    </div>
  )
}

function lastMoveSquareStyling (history: Move[]) {
  const [lastMove] = history.reverse()
  return {
    ...(history.length && {
      [lastMove.from]: {
        backgroundColor: colours.lightYellow
      }
    }),
    ...(history.length && {
      [lastMove.to]: {
        backgroundColor: colours.lightYellow
      }
    })
  }
};

export function getSquareStyling (chess: ChessInstance) {
  const history = chess.history({ verbose: true })
  const styles = {
    ...lastMoveSquareStyling(history)
  }
  return styles
}

export function SmallGameDisplay (
  { gameState }: SmallGameDisplayProps
) {
  const { chess } = gameState
  const position = chess.fen()
  const squareStyles = getSquareStyling(chess)
  return (
    <div className="small-game-stream" >
      <Chessboard
        position={position}
        width={320}
        transitionDuration={0}
        draggable={false}
        squareStyles={squareStyles}
      />
      <SmallGameInfo gameState={gameState}/>
    </div>
  )
}
