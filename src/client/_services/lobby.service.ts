import { MemberMessage, GameMessage, CompleteGameInfo, GameUpdateWithId, LobbyMemberDetails } from '../../common/types'
import { Observable } from 'rxjs'
import { SocketService } from './socket.service'
import { routeBy } from '../../common/helpers'
import { useObservable } from 'rxjs-hooks'
import { scan, shareReplay, filter, map, mergeMap, takeWhile, endWith, tap, startWith } from 'rxjs/operators'
import GameStreamService from './gameStream.service'

export type GameStreamServiceUpdate = [string, (GameStreamService|null)]

export class LobbyService {
  lobbyMemberDetailsMap$: Observable<Map<string, LobbyMemberDetails>>;
  gameStreamMap$: Observable<Map<string, GameStreamService>>

  constructor (socketService: SocketService) {
    const { serverMessage$: message$ } = socketService
    const memberMessage$: Observable<MemberMessage> = message$.pipe(routeBy('member'))

    this.lobbyMemberDetailsMap$ = memberMessage$.pipe(
      filter(msg => !!msg.memberDetailsUpdate),
      map(msg => msg.memberDetailsUpdate),
      scan((map, updates) => {
        updates.forEach(([id, details]) => {
          if (!details) {
            map.delete(id)
            return
          }
          map.set(id, details)
        })
        return map
      }, new Map<string, LobbyMemberDetails>()),
      shareReplay(1)
    )

    const gameMessage$ = message$.pipe(routeBy<GameMessage>('game'))

    const gameStream$ = gameMessage$.pipe(
      routeBy<CompleteGameInfo>('join'),
      tap(() => { console.log('join message') }),
      map(info => {
        const gameUpdate$ = gameMessage$.pipe(
          routeBy<GameUpdateWithId>('update'),
          filter(({ id }) => id === info.id),
          takeWhile((update) => update.type !== 'end', true)
        )

        return new GameStreamService(gameUpdate$, info)
      })
    )
    gameStream$.subscribe(gameStream => {
      console.log('stream', gameStream.gameId)
    })

    const gameStreamServiceUpdate: Observable<GameStreamServiceUpdate> = gameStream$.pipe(
      mergeMap(gameStream => {
        return gameStream.serviceUpdate$.pipe(
          startWith(gameStream),
          endWith(null)
        ).pipe(
          map<GameStreamService|null, GameStreamServiceUpdate>(gStreamOrNull => ([
            gameStream.gameId, gStreamOrNull
          ]))
        )
      })
    )

    this.gameStreamMap$ = gameStreamServiceUpdate.pipe(
      scan((map, update) => {
        const [id, service] = update
        if (!service) {
          map.delete(id)
          return map
        }
        console.log('adding service', service.gameId)

        map.set(id, service)
        return map
      }, new Map<string, GameStreamService>())
    )
  }

  queueForGame = () => {
  }

  useGameStreamServices (): GameStreamService[] {
    return useObservable(() => this.gameStreamMap$.pipe(
      map(newMap => ([...newMap.values()]))
    ), [])
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
