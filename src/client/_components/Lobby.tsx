import React, { useEffect, useState, SyntheticEvent } from 'react';
import { AuthService } from '../_services/auth.service';
import { LobbyService } from '../_services/lobby.service';
import { LobbyMemberDetails } from '../../common/types';
import { SocketService } from '../_services/socket.service';
import { ListGroup, Button } from 'react-bootstrap';

interface LobbyProps {
  lobbyService: LobbyService;
}

const Lobby: React.FC<LobbyProps> = ({ lobbyService }) => {
  const memberDetails = lobbyService.useLobbyMemberDetails();
  return (
    <React.Fragment>
      <div>hello lobby</div>
      {memberDetails ? <ActiveMembersDisplay allMemberDetails={memberDetails} /> : 'empty'}
    </React.Fragment>
  );
};

interface ActiveMembersDisplayProps {
  allMemberDetails: LobbyMemberDetails[];
  onChallenge: (receiverId: string) => void;
}

const ActiveMembersDisplay: React.FC<ActiveMembersDisplayProps> = ({
  allMemberDetails, onChallenge
}) => (
  <ListGroup>
    {allMemberDetails.map(d => <MemberDisplay key={d.id} {...d, onChallenge}/>)}
  </ListGroup>
);

interface ActiveMemberDisplayProps {
  memberDetails: LobbyMemberDetails;
  onChallenge: (receiverId: string) => void;
}

const MemberDisplay: React.FC<ActiveMemberDisplayProps> = ({
  memberDetails, onChallenge
}) => {
  const onClickChallenge = () => onChallenge(id);
  const { username, id } = memberDetails;
  return (
    <ListGroup.Item className="memberDetails_member">
      <label className="member_classname">{username}</label>
      <Button onClick={onClickChallenge} >Challenge</Button>
    </ListGroup.Item>
  );
 };

interface LobbyServiceProviderProps {
  authService: AuthService;
}


const LobbyServiceProvider: React.FC<LobbyServiceProviderProps> = ({ authService }) => {
  const [lobbyService, setLobbyService] = useState(null as LobbyService | null);
  useEffect(() => {
    console.log('service provider triggered')
    const socketService = new SocketService(authService);
    const lobbyService = new LobbyService(socketService);
    setLobbyService(lobbyService)
    return () => {
      socketService.complete();
    }
  }, [authService]);
  if (!lobbyService) {
    return <span>loading</span>;
  }
  return <Lobby {...{lobbyService}}/>
}

export { LobbyServiceProvider as Lobby };
