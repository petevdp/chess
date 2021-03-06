import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { GameStateWithDetails } from '../../common/gameProviders'
import { PlayerDetails, EndState } from '../../common/types'
import { ChessInstance, Move, ShortMove } from 'chess.js'
import { Chessground } from 'chessground'

const colours = {
  lightYellow: "rgba(255, 255, 0, 0.4)"
}

export interface SmallGameDisplayProps {
  gameState: GameStateWithDetails;
  id: string;
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

interface SmallGameInfoProps {
  gameState: GameStateWithDetails;
}

function SmallGameInfo ({ gameState }: SmallGameInfoProps) {
  const { playerDetails, end } = gameState
  const [white, black] = getSortedPlayerDetails(playerDetails)
  const currentStateDisplay = end
    ? <EndDisplay end={end} playerDetails={playerDetails} />
    : null

  return (
    <div className="small-game-info">
      <div className="player-info white-player-info">
        <i className="material-icons avatar">portrait</i>
        <span className="username">{white.user.username}</span>
        <span className="elo">{white.elo}</span>
      </div>
      {currentStateDisplay}
      <div className="player-info black-player-info">
        <span className="username">{black.user.username}</span>
        <span className="elo">{black.elo}</span>
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

function useBoard (chess: ChessInstance, id: string) {
  const [board, setBoard] = useState()
  useEffect(() => {
    const boardElement = document.getElementById(`board-${id}`)
    if (!boardElement) {
      console.log('no board element!')
      return
    }
    const lastMove = _.last(chess.history({ verbose: true }))
    const newBoard = Chessground(boardElement, {
      fen: chess.fen(),
      viewOnly: true,
      highlight: {
        lastMove: true,
        check: true
      },
      lastMove: lastMove && [lastMove.from, lastMove.to]
    })
    setBoard(newBoard)
    return () => newBoard.destroy()
  }, [])
  return board
}

export function SmallGameDisplay (
  { gameState, id }: SmallGameDisplayProps
) {
  const board = useBoard(gameState.chess, id)
  useEffect(() => {
    const { chess } = gameState
    if (chess.history().length === 0 || !board) {
      return () => {}
    }

    const moveObj = _.last(chess.history({ verbose: true })) as ShortMove
    board.move(moveObj.from, moveObj.to)
  }, [gameState])

  return (
    <div className="small-game-stream" >
      <SmallGameInfo gameState={gameState}/>
      <section className="blue merida">
        <div
          id={`board-${id}`}
          className="cg-wrap"
        >
        </div>
      </section>
    </div>
  )
}
