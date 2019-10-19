import React from 'react'
import { LobbyService } from "../_services/lobby.service"
import { SmallGameDisplay } from './StreamedGame'
import _ from 'lodash'
import { Route, Link } from 'react-router-dom'
import { DISPLAYED_GAMES_PER_PAGE } from '../../common/config'

interface AllStreamsProps {
  lobbyService: LobbyService;
}

function AllSmallGames ({ lobbyService }: AllStreamsProps) {
  const gameStateArr = lobbyService.useStreamedGameStates()

  const gamesPerPage = DISPLAYED_GAMES_PER_PAGE

  const numOfPages = Math.ceil(gameStateArr.length / gamesPerPage)

  const gamesPages = _.times(numOfPages).map(index => {
    const startingIdx = index * gamesPerPage
    const gamesForPage = gameStateArr.slice(startingIdx, startingIdx + gamesPerPage)

    const streamedGames = gamesForPage.map(state => (
      <SmallGameDisplay
        key={state.id}
        id={state.id}
        gameState={state}
      />
    ))

    return (
      <Route
        key={index + 1}
        path={`/lobby/${index + 1}`}
      >
        {streamedGames}
      </Route>
    )
  })

  const pageLinks = _.range(1, numOfPages + 1).map(num => {
    return (
      <Link
        key={num}
        to={`/lobby/${num}`}
      >
        {num}
      </Link>
    )
  })

  return (
    <section className="all-small-games">
      {pageLinks}
      {gamesPages}
      {pageLinks}
    </section>
  )
}

export default AllSmallGames
