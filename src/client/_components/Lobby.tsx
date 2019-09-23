import React, { useEffect, useState } from 'react'
import { AuthService } from '../_services/auth.service'
import { LobbyService } from '../_services/lobby.service'
import { LobbyMemberDetails } from '../../common/types'
import { SocketService } from '../_services/socket.service'
import { ListGroup, Button } from 'react-bootstrap'

interface LobbyProps {
  lobbyService: LobbyService;
}

function Lobby ({ lobbyService }: LobbyProps) {
  const allMemberDetails = lobbyService.useLobbyMemberDetailsArr()
  return (
    <React.Fragment>
      <Button onClick={lobbyService.queueForGame}>Queue for Game</Button>
      <ActiveMembersDisplayList {...{ allMemberDetails }}/>
    </React.Fragment>
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
    <ListGroup>
      {displayList}
    </ListGroup>
  )
}

interface ActiveMemberDisplayProps {
  memberDetails: LobbyMemberDetails;
}

function MemberDisplay ({ memberDetails }: ActiveMemberDisplayProps) {
  const { username } = memberDetails
  return (
    <ListGroup.Item className="memberDetails_member">
      searching
      <label className="member_classname">{username}</label>
    </ListGroup.Item>
  )
}

interface LobbyServiceProviderProps {
  authService: AuthService;
}

function LobbyServiceProvider ({ authService }: LobbyServiceProviderProps) {
  const [lobbyService, setLobbyService] = useState(null as LobbyService | null)
  const currentUser = authService.useCurrentUser()
  useEffect(() => {
    if (!currentUser) {
      return
    }
    console.log('service provider triggered')
    const socketService = new SocketService()
    const lobbyService = new LobbyService(socketService, currentUser.id)
    setLobbyService(lobbyService)
    return () => {
      // lobbyService depends on socketService
      socketService.complete()
    }
  }, [currentUser])
  if (!lobbyService) {
    return <span>loading</span>
  }
  return <Lobby {...{ lobbyService }} />
}

export { LobbyServiceProvider as Lobby }
