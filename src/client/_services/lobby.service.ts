import { LobbyMemberDetails, LobbyMessage, ChallengeDetails } from '../../common/types';
import { Observable, Subject } from 'rxjs';
import { SocketService } from './socket.service';
import { routeBy } from '../../common/helpers';
import { useObservable } from 'rxjs-hooks';

export class LobbyService {
  lobbyMemberDetails$: Observable<LobbyMemberDetails[]>;
  lobbyMessage$: Observable<LobbyMessage>;

  constructor(socketService: SocketService, private currentUserId: string) {
    const { serverMessage$: message$ } = socketService;
    this.lobbyMessage$ = message$.pipe(routeBy('lobby'));
    this.lobbyMemberDetails$ = this.lobbyMessage$.pipe(routeBy('updateLobbyMemberDetails'));
  }

  useLobbyMemberDetails() {
    return useObservable(() => this.lobbyMemberDetails$, []);
  }
}
