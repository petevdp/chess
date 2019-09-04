import React, { useEffect, useState } from 'react';
import { AuthService } from '../_services/auth.service';
import { LobbyService } from '../_services/lobby.service';
import { LobbyMemberDetails } from '../../common/types';
import { SocketService } from '../_services/socket.service';

interface LobbyProps {
  authService: AuthService;
  socketService: SocketService;
}

export const Lobby: React.FC<LobbyProps> = ({ authService, socketService }) => {
  const [memberDetails, setMemberDetails] = useState([] as LobbyMemberDetails[]);
  useEffect(() => {
    const lobbyService = new LobbyService(socketService);
    lobbyService.lobbyMemberDetails$.subscribe(setMemberDetails);
    return () => lobbyService.complete();
  }, [socketService]);

  console.log('lobby!')
  return (
    <React.Fragment>
      <div>hello lobby</div>
      {
        memberDetails.length > 0
          ? <MemberDetails details={memberDetails} />
          : <span>loading</span>
      }
    </React.Fragment>
  );
};

interface MemberDetailsProps {
  details: LobbyMemberDetails[];
}

const MemberDetails: React.FC<MemberDetailsProps> = ({details}) => (
  <React.Fragment>
    {details.map(d => <Member key={d.id} {...d} />)}
  </React.Fragment>
);

const Member: React.FC<LobbyMemberDetails> = (details) => (
  <span>details: {details}</span>
);
