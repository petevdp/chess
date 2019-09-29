import React from 'react'
import { LobbyService } from "../_services/lobby.service"
import { StreamedGame } from './StreamedGame'

interface AllStreamsProps {
  lobbyService: LobbyService;
}

// type StreamedGameMap = Map<string, React.ComponentElement>

// function boardsReducer (
//   prevBoards: StreamedGameMap,
//   gameStateMap: Map<string, GameStateWithDetails>
// ): StreamedGameMap {
//   const allIds = new Set(...[
//     [...prevBoards.keys()],
//     [...gameStateMap.keys()]
//   ])

//   return [...allIds].reduce((boards, id) => {
//     if (prevBoards.has(id) && gameStateMap.has(id)) {
//       return boards
//     }
//     if (prevBoards.has(id) && !gameStateMap.has(id)) {
//       boards.delete(id)
//       return boards
//     }
//     if (!prevBoards.has(id) && gameStateMap.has(id)) {
//       const gameState = gameStateMap.get(id)
//       boards.set(id, <StreamedGame gameState={gameState} />)
//       return boards
//     }
//   }, prevBoards)
// }

function AllStreams ({ lobbyService }: AllStreamsProps) {
  const gameStateArr = lobbyService.useStreamedGameStates()

  const streamedGames = gameStateArr.map(state => (
    <StreamedGame
      key={state.id}
      gameState={state}
    />)
  )
  return (
    <React.Fragment>
      {streamedGames}
    </React.Fragment>
  )
}

export default AllStreams
