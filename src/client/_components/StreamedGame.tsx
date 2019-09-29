import React, { } from 'react'
import Chessboard from 'chessboardjsx'
import { GameStateWithDetails } from '../../common/gameProviders'

export interface StreamedGameProps {
  gameState: GameStateWithDetails;
}

export function StreamedGame (
  { gameState }: StreamedGameProps
) {
  const position = gameState.chess.fen()
  return (
    <Chessboard
      position={position}
      width={320}
      transitionDuration={0}
      draggable={false}
    />
  )
}
