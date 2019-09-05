import { ChallengeDetails, LobbyMemberDetails, LobbyMessage, GameDetails, ChallengeResolution, ChallengeResponse } from '../../common/types';
import { Observable, Subscription } from 'rxjs';
import { SocketService } from './socket.service';
import { useState, useEffect } from 'react';
import { routeBy } from '../../common/helpers';

export class LobbyService {
  // challenge$: Observable<ChallengeDetails>;
  lobbyMemberDetails$: Observable<LobbyMemberDetails[]>;
  // gameDetails$: Observable<GameDetails>;
  lobbyMessage$: Observable<LobbyMessage>;

  constructor(socketService: SocketService) {
    const { message$ } = socketService;
    this.lobbyMessage$ = message$.pipe(routeBy('lobby'));
    this.lobbyMemberDetails$ = this.lobbyMessage$.pipe(routeBy('updateLobbyMemberDetails'));
  }
}

export const useLobbyMemberDetails = (socketService: SocketService|null) => {
  const [members, setMembers] = useState([] as LobbyMemberDetails[]);
  useEffect(() => {
    if (!socketService) {
      return;
    }
    const lobbyService = new LobbyService(socketService);
    const subscription = lobbyService.lobbyMemberDetails$.subscribe(setMembers);
    return () => subscription.unsubscribe();
  }, [socketService])
  return members;
}
