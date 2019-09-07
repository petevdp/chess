import React, { useEffect, useState } from 'react';
import { AuthService } from '../_services/auth.service';
import { LobbyService, useLobbyMemberDetails } from '../_services/lobby.service';
import { LobbyMemberDetails } from '../../common/types';
import { SocketService } from '../_services/socket.service';

interface LobbyProps {
  authService: AuthService|null;
  socketService: SocketService|null;
}

export const Lobby: React.FC<LobbyProps> = ({ socketService }) => {
  const memberDetails = useLobbyMemberDetails(socketService);
  const detailsComponent = memberDetails.length > 0
    ? <MemberDetails details={memberDetails} />
    : <span>loading</span>

  return (
    <React.Fragment>
      <div>hello lobby</div>
      {detailsComponent}
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
  <span>user: {details.username}</span>
);
