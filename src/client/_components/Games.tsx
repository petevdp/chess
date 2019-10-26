import React from 'react'
import { Switch, useLocation, Redirect } from "react-router-dom"
import queryString from 'querystring'

import { LobbyService } from "../_services/lobby.service"
import AllSmallGames from "./AllStreams"

interface GamesProps {
  lobbyService: LobbyService;
}

export interface GamesRouteQueryParams {
  page?: string;
}

function Games ({ lobbyService }: GamesProps) {
  const { search, pathname } = useLocation()

  if (pathname === '/lobby/games') {
    return <Redirect to="/lobby/games/?page=1" />
  }

  console.log('games')

  const { page } = queryString.parse(search.slice(1)) as GamesRouteQueryParams

  const pageNum = Number(page)
  console.log('pagenum: ', pageNum)

  if (pageNum) {
    return (
      <AllSmallGames
        lobbyService={lobbyService}
        pageNum={pageNum}
      />
    )
  }

  return <div>not found</div>
}

export default Games
