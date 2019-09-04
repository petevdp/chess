import { ChallengeDetails, LobbyMemberDetails, LobbyMessage, GameDetails, ChallengeResolution, ChallengeResponse } from '../../common/types';
import { Observable } from 'rxjs';
import { SocketService } from './socket.service';
import { useState } from 'react';
import { routeBy } from '../../common/helpers';

export class LobbyService {
  // challenge$: Observable<ChallengeDetails>;
  lobbyMemberDetails$: Observable<LobbyMemberDetails[]>;
  // gameDetails$: Observable<GameDetails>;

  constructor(socketService: SocketService) {
    const { message$: lobbyMessageObservable } = socketService;
    this.lobbyMemberDetails$ = lobbyMessageObservable.pipe(
      routeBy<LobbyMessage, LobbyMemberDetails[]>('updateLobbyMemberDetails')
    );
  }

  useLobbyMemberDetails() {
    const [members, setMembers] = useState([] as LobbyMemberDetails[]);
    this.lobbyMemberDetails$.subscribe(setMembers)
    return members;
  }
}
