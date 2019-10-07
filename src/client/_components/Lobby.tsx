import React, { useEffect, useState } from 'react'
import { AuthServiceInterface } from '../_services/auth.service'
import { LobbyService } from '../_services/lobby.service'
import { LobbyMemberDetails } from '../../common/types'
import { ListGroup } from 'react-bootstrap'
import AllSmallGamesDisplay from './AllStreams'
import { SocketServiceInterface } from '../_services/socket.service'

interface LobbyProps {
  lobbyService: LobbyService;
}

export function Lobby ({ lobbyService }: LobbyProps) {
  const allMemberDetails = lobbyService.useLobbyMemberDetailsArr()
  return (
    <div id="lobby-container">
      <ActiveMembersDisplayList {...{ allMemberDetails }}/>
      <AllSmallGamesDisplay {... { lobbyService }} />
    </div>
  )
}

interface ActiveMembersDisplayProps {
  allMemberDetails: LobbyMemberDetails[];
}

function ActiveMembersDisplayList (
  { allMemberDetails }: ActiveMembersDisplayProps
) {
  const displayList = allMemberDetails.map(memberDetails => (
    <MemberDisplay
      key={memberDetails.id}
      {...{ memberDetails }}
    />
  ))
  return (
    <div className="member-details-container">
      <ListGroup>
        {displayList}
      </ListGroup>
    </div>
  )
}

interface ActiveMemberDisplayProps {
  memberDetails: LobbyMemberDetails;
}

function MemberDisplay ({ memberDetails }: ActiveMemberDisplayProps) {
  const { username, currentGame } = memberDetails
  return (
    <ListGroup.Item className="memberDetails_member">
      { currentGame ? 'ingame' : 'searching' }
      <label className="member_classname">{username}</label>
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
  return <Lobby {...{ lobbyService }} />
}

export default LobbyServiceProvider
