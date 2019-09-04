import { ChallengeDetails, LobbyMemberDetails, LobbyMessage, GameDetails, ChallengeResolution, ChallengeResponse } from '../../common/types';
import { Observable, Subscription } from 'rxjs';
import { SocketService } from './socket.service';
import { useState } from 'react';
import { routeBy } from '../../common/helpers';

export class LobbyService {
  // challenge$: Observable<ChallengeDetails>;
  lobbyMemberDetails$: Observable<LobbyMemberDetails[]>;
  // gameDetails$: Observable<GameDetails>;
  lobbyMessage$: Observable<LobbyMessage>;
  subscriptions: Subscription;

  constructor(socketService: SocketService) {
    const { message$ } = socketService;
    this.lobbyMessage$ = message$.pipe(routeBy('lobby'));
    this.lobbyMemberDetails$ = this.lobbyMessage$.pipe(routeBy('updateLobbyMemberDetails'));
    this.subscriptions = new Subscription();
  }

  useLobbyMemberDetails() {
    const [members, setMembers] = useState([] as LobbyMemberDetails[]);
    this.subscriptions.add(this.lobbyMemberDetails$.subscribe(setMembers));
    return members;
  }
  complete() {
    this.subscriptions.unsubscribe();
  }
}
