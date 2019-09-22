import React from 'react'
import Chessboard from 'chessboardjsx'

export interface BoardProps {
}

export const Board: React.FC<BoardProps> = (props) => {
  return <div>board, <Chessboard /></div>
}
