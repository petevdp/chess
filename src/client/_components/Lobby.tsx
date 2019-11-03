import React, { useEffect, useState } from 'react'
import { AuthServiceInterface } from '../_services/auth.service'
import { LobbyService } from '../_services/lobby.service'
import { LobbyMemberDetails } from '../../common/types'
import { ListGroup } from 'react-bootstrap'
import { Route, Switch, Redirect } from 'react-router-dom'
import NavBar from './Nav'
import { SocketServiceInterface } from '../_services/socket.service'
import Games from './Games'

interface LobbyProps {
  lobbyService: LobbyService;
  authService: AuthServiceInterface;
}

export function Lobby ({ lobbyService, authService }: LobbyProps) {
  const allMemberDetails = lobbyService.useLobbyMemberDetailsArr()
  return (
    <React.Fragment>
      <NavBar {...{ authService }} />
      <div id="lobby-container">
        <div id="lobby-content-container">
          <Switch>
            <Route path="/lobby/games">
              <Games lobbyService={lobbyService}/>
            </Route>
            <Redirect exact from="/lobby" to="/lobby/games" />
          </Switch>
        </div>
        <LobbyMemberSidebar {...{ allMemberDetails }}/>
      </div>
    </React.Fragment>
  )
}

interface LobbyMemberSidebarProps {
  allMemberDetails: LobbyMemberDetails[];
}

function LobbyMemberSidebar (
  { allMemberDetails }: LobbyMemberSidebarProps
) {
  const displayList = allMemberDetails.map(memberDetails => (
    <MemberDisplay
      key={memberDetails.id}
      {...{ memberDetails }}
    />
  ))

  return (
    <div id="lobby-member-sidebar">
      <ListGroup variant="flush">
        {displayList}
      </ListGroup>
    </div>
  )
}

interface ActiveMemberDisplayProps {
  memberDetails: LobbyMemberDetails;
}

function MemberDisplay ({ memberDetails }: ActiveMemberDisplayProps) {
  const { username, currentGame, elo } = memberDetails
  return (
    <ListGroup.Item className="member-display">
      <i className="material-icons avatar">portrait</i>
      <label className="username">{username}</label>
      <span className="elo">
        {elo}
      </span>
      <span className="status">
        { currentGame ? 'ingame' : 'searching for game' }
      </span>
    </ListGroup.Item>
  )
}

interface LobbyServiceProviderProps {
  authService: AuthServiceInterface;
  SocketServiceClass: new () => SocketServiceInterface;
}

function LobbyServiceProvider ({ authService, SocketServiceClass }: LobbyServiceProviderProps) {
  const [lobbyService, setLobbyService] = useState(null as LobbyService | null)
  const currentUser = authService.useCurrentUser()
  useEffect(() => {
    if (!currentUser) {
      return
    }
    const socketService = new SocketServiceClass()
    const lobbyService = new LobbyService(socketService)
    setLobbyService(lobbyService)
    return () => {
      // lobbyService depends on socketService
      socketService.complete()
    }
  }, [currentUser, SocketServiceClass])
  if (!lobbyService) {
    return <span>loading</span>
  }
  return <Lobby {...{ lobbyService, authService }} />
}

export default LobbyServiceProvider
