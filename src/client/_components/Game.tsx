import React from 'react'
import { Board } from './Board'

export interface GameProps {

}

export const Game: React.FC<GameProps> = (props) => {
  return <Board />
}
