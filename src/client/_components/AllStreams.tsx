import React from 'react'
import queryString from 'querystring'
import { LobbyService } from "../_services/lobby.service"
import { SmallGameDisplay } from './StreamedGame'
import _ from 'lodash'
import { Route, Link, useLocation, useParams, match } from 'react-router-dom'
import { DISPLAYED_GAMES_PER_PAGE } from '../../common/config'
import { RouteChildrenProps, RouteProps, Redirect } from 'react-router'

export interface GamesRouteParams {
  pageNum?: string;
}

interface AllStreamsProps {
  lobbyService: LobbyService;
  pageNum: number;
}

function AllSmallGames ({ lobbyService, pageNum }: AllStreamsProps) {
  const gameStateArr = lobbyService.useStreamedGameStates()
  console.log('gamestatArr: ', gameStateArr)

  if (!_.inRange(pageNum - 1, 0, gameStateArr.length)) {
    console.log(`${pageNum} is out of range`)

    return <Redirect to="/lobby/games/?page=1" />
  }

  const gamesPerPage = DISPLAYED_GAMES_PER_PAGE

  const numOfPages = Math.ceil(gameStateArr.length / gamesPerPage)

  const startingIdx = (pageNum - 1) * gamesPerPage

  const gameStatesForPage = gameStateArr.slice(startingIdx, startingIdx + gamesPerPage)

  const gameDisplays = gameStatesForPage.map(game => (
    <SmallGameDisplay
      key={game.id}
      id={game.id}
      gameState={game}
    />
  ))

  const pageLinks = _.range(1, numOfPages + 1).map(num => (
    <Link
      key={num}
      to={`/lobby/games/?page=${num}`}
    >
      {num}
    </Link>
  ))

  return (
    <section className="all-small-games">
      {pageLinks}
      {gameDisplays}
      {pageLinks}
    </section>
  )
}

export default AllSmallGames
