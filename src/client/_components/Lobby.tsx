import React from 'react';
import { AuthService } from '../_services/auth.service';
import { LobbyService } from '../_services/lobby.service';
import { LobbyMemberDetails } from '../../common/types';

export interface LobbyProps {
  authService: AuthService;
  lobbyService: LobbyService;
}

export const Lobby: React.FC<LobbyProps> = ({ authService, lobbyService }) => {
  const memberDetails = lobbyService.useLobbyMemberDetails();

  return (
    <React.Fragment>
      {memberDetails.map(d => <Member key={d.id} {...d} />)}
    </React.Fragment>
  );
};

const Member: React.FC<LobbyMemberDetails> = (details) => (
  <span>{details}</span>
)
