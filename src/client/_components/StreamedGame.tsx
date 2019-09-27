import React, { useEffect, useState } from 'react'
import Chessboard from 'chessboardjsx'
import GameStreamService from '../_services/gameStream.service'
import { allGameInfo } from '../../common/dummyData'
import { getGameUpdatesFromPgn } from '../../common/helpers'
import { Button } from 'react-bootstrap'
import { Subject } from 'rxjs'
import { GameUpdate } from '../../common/types'

interface StreamedGameProps {
  gameStreamService: GameStreamService;
}

export function StreamedGame (
  { gameStreamService }: StreamedGameProps
) {
  const position = gameStreamService.usePosition()

  return (
    <Chessboard
      position={position}
      width={320}
      transitionDuration={0}
      draggable={false}
    />
  )
}

function * emitMove () {
  const updates = getGameUpdatesFromPgn(allGameInfo.checkmateGame.pgn)
  for (const update of updates) {
    yield update
  }
}

const updates$ = new Subject<GameUpdate>()
const moveEmitter = emitMove()

function nextMoveOnClick () {
  updates$.next(moveEmitter.next().value as GameUpdate)
}

const info = allGameInfo.newGame

export function TestStreamedGame () {
  const [
    gameStreamService,
    updateService
  ] = useState<GameStreamService | null>(null)
  useEffect(() => {
    updateService(new GameStreamService(updates$, info))
  }, [])

  if (!gameStreamService) {
    return <div>gameStreamService uninitialized</div>
  }
  return (
    <React.Fragment>
      <StreamedGame
        gameStreamService={gameStreamService}
      />
      <Button onClick={nextMoveOnClick} > Play game</Button>
    </React.Fragment>
  )
}
