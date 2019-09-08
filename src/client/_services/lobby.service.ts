import { LobbyMemberDetails, LobbyMessage } from '../../common/types';
import { Observable } from 'rxjs';
import { SocketService } from './socket.service';
import { routeBy } from '../../common/helpers';
import { useObservable } from 'rxjs-hooks';

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

  useLobbyMemberDetails() {
    return useObservable(() => this.lobbyMemberDetails$);
  }
}
