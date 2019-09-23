import { LobbyMemberDetails, MemberMessage } from '../../common/types'
import { Observable } from 'rxjs'
import { SocketService } from './socket.service'
import { routeBy } from '../../common/helpers'
import { useObservable } from 'rxjs-hooks'
import { scan, shareReplay, filter, map } from 'rxjs/operators'

export class LobbyService {
  lobbyMemberDetailsMap$: Observable<Map<string, LobbyMemberDetails>>;
  lobbyMessage$: Observable<MemberMessage>;

  constructor (socketService: SocketService) {
    const { serverMessage$: message$ } = socketService
    this.lobbyMessage$ = message$.pipe(routeBy('member')) as Observable<MemberMessage>
    this.lobbyMemberDetailsMap$ = this.lobbyMessage$.pipe(
      filter(msg => !!msg.memberUpdate),
      map(msg => msg.memberUpdate),
      scan((map, update) => {
        update.forEach(u => map.set(...u))
        return map
      }, new Map<string, LobbyMemberDetails>()),
      shareReplay(1)
    )
  }

  queueForGame = () => {
  }

  useLobbyMemberDetails () {
    return useObservable(() => this.lobbyMemberDetailsMap$, new Map())
  }

  useLobbyMemberDetailsArr () {
    return useObservable(() => this.lobbyMemberDetailsMap$.pipe(
      map(m => [...m.values()], [])
    ), [])
  }
}
