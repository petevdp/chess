import React from 'react'
import { LobbyService } from "../_services/lobby.service"
import { SmallGameDisplay } from './StreamedGame'

interface AllStreamsProps {
  lobbyService: LobbyService;
}

function AllSmallGames ({ lobbyService }: AllStreamsProps) {
  const gameStateArr = lobbyService.useStreamedGameStates()

  const streamedGames = gameStateArr.map(state => (
    <SmallGameDisplay
      key={state.id}
      id={state.id}
      gameState={state}
    />)
  )
  return (
    <section className="all-small-games">
      {streamedGames}
    </section>
  )
}

export default AllSmallGames
