import { Observable, Subject } from 'rxjs'
import { mergeAll, map, shareReplay, scan, filter } from 'rxjs/operators'

import { LobbyMember } from './lobbyMember'
import { LobbyMemberDetails } from '../../common/types'
import { ClientConnection } from '../server/clientConnection'
import { Arena } from './arena'

export class Lobby {
  private arena: Arena;
  private memberDetails$: Observable<Map<string, LobbyMemberDetails>>;

  private memberUpdateSubject: Subject<[string, LobbyMember|null]>;

  constructor () {
    this.memberUpdateSubject = new Subject()

    this.memberDetails$ = this.memberUpdateSubject.pipe(
      filter(([, member]) => !!member),
      map(([, member]) => member.details$),
      mergeAll(),
      scan((acc, details) => {
        if (details.leftLobby) {
          console.log('deleting ', details.username)
          acc.delete(details.id)
          return acc
        }
        acc.set(details.id, details)
        return acc
      }, new Map<string, LobbyMemberDetails>()),
      shareReplay(1)
    )

    this.arena = new Arena(this.memberUpdateSubject.asObservable())

    this.arena.games$.subscribe(game => {
      console.log('new game: ', game.gameDetails)
    })
  }

  addLobbyMember = (client: ClientConnection) => {
    console.log('adding lobby member')
    const member = new LobbyMember(client)

    this.memberDetails$.subscribe(details => {
      member.updateLobbyMemberDetails(details)
    })

    member.details$.subscribe({
      complete: () => {
        this.memberUpdateSubject.next([member.id, null])
      }
    })

    this.memberUpdateSubject.next([member.id, member])
  }
}
