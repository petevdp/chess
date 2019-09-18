import React, { useEffect, useState, SyntheticEvent } from 'react';
import { AuthService } from '../_services/auth.service';
import { LobbyMemberService } from '../_services/lobbyMember.service';
import { LobbyMemberDetails } from '../../common/types';
import { SocketService } from '../_services/socket.service';
import { ListGroup, Button } from 'react-bootstrap';

interface LobbyProps {
  lobbyService: LobbyMemberService;
}

const Lobby: React.FC<LobbyProps> = ({ lobbyService }) => {
  const allMemberDetails = lobbyService.useLobbyMemberDetailsArr();
  return (
    <React.Fragment>
      <div>hello lobby</div>
      <ActiveMembersDisplayList {...{allMemberDetails}}/>
    </React.Fragment>
  );
};

interface ActiveMembersDisplayProps {
  allMemberDetails: LobbyMemberDetails[];
}

const ActiveMembersDisplayList: React.FC<ActiveMembersDisplayProps> = ({
  allMemberDetails
}) => {
  const displayList = allMemberDetails.map(memberDetails => (
    <ActiveMemberDisplay
      key={memberDetails.id}
      {...{memberDetails}}
    />
  ));
  return (
    <ListGroup>
      {displayList}
    </ListGroup>
  );
};

interface ActiveMemberDisplayProps {
  memberDetails: LobbyMemberDetails;
}

const ActiveMemberDisplay: React.FC<ActiveMemberDisplayProps> = ({
  memberDetails
}) => {
  const { username, id } = memberDetails;
  return (
    <ListGroup.Item className="memberDetails_member">
      <label className="member_classname">{username}</label>
    </ListGroup.Item>
  );
};

interface LobbyServiceProviderProps {
  authService: AuthService;
}


const LobbyServiceProvider: React.FC<LobbyServiceProviderProps> = ({ authService }) => {
  const [lobbyService, setLobbyService] = useState(null as LobbyMemberService | null);
  const currentUser = authService.useCurrentUser();
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    console.log('service provider triggered')
    const socketService = new SocketService();
    const lobbyService = new LobbyMemberService(socketService, currentUser.id);
    setLobbyService(lobbyService)
    return () => {

      // lobbyService depends on socketService
      socketService.complete();
    }
  }, [currentUser]);
  if (!lobbyService) {
    return <span>loading</span>;
  }
  return <Lobby {...{ lobbyService }} />
}

export { LobbyServiceProvider as Lobby };
