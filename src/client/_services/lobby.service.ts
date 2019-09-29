import { MemberMessage, CompleteGameInfo, GameUpdateWithId, LobbyMemberDetails, LobbyMessage, DisplayedGameMessage } from '../../common/types'
import { Observable, from, BehaviorSubject } from 'rxjs'
import { SocketService } from './socket.service'
import { routeBy } from '../../common/helpers'
import { useObservable } from 'rxjs-hooks'
import { scan, shareReplay, filter, map, takeWhile, concatMap, mergeMap, tap } from 'rxjs/operators'
import { GameStream, GameStateWithDetails, GameState } from '../../common/gameProviders'

export class LobbyService {
  lobbyMemberDetailsMap$: Observable<Map<string, LobbyMemberDetails>>
  streamedGameStateArr$: BehaviorSubject<GameStateWithDetails[]>

  constructor (socketService: SocketService) {
    const { serverMessage$: message$ } = socketService
    const lobbyMessage$: Observable<LobbyMessage> = message$.pipe(routeBy('lobby'))
    const memberMessage$: Observable<MemberMessage> = lobbyMessage$.pipe(routeBy('member'))

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

    const displayedGameMessage$ = lobbyMessage$.pipe(routeBy<DisplayedGameMessage>('displayedGame'))

    const displayedGameUpdate$ = displayedGameMessage$.pipe(
      routeBy<GameUpdateWithId>('update')
    )

    const displayedGameAddition$ = displayedGameMessage$.pipe(
      routeBy<CompleteGameInfo[]>('add')
    )

    displayedGameAddition$.subscribe(add => console.log('addition: ', add.map(({ id }) => id)))

    const gameState$ = displayedGameAddition$.pipe(
      concatMap((additions) => from(additions)),
      filter(info => !this.streamedGameStateIdArr.includes(info.id)),
      mergeMap((info: CompleteGameInfo) => {
        const gameUpdate$ = displayedGameUpdate$.pipe(
          filter(update => update.id === info.id),
          tap((u) => console.log('update: ', u.type, u.end)),
          takeWhile(update => update.type !== 'end', true)
        )
        console.log('new gamestream')
        const gameStream = new GameStream(gameUpdate$, info)
        return gameStream.gameStateWithDetails$
      })
    )

    this.streamedGameStateArr$ = new BehaviorSubject([] as GameStateWithDetails[])

    gameState$.pipe(
      scan<GameStateWithDetails, Map<string, GameStateWithDetails>>((acc, state) => {
        acc = this.deleteStaleGameState(acc)
        acc.set(state.id, state)
        return acc
      }, new Map<string, GameStateWithDetails>()),
      map<Map<string, GameStateWithDetails>, GameStateWithDetails[]>(stateMap => [...stateMap.values()])
    ).subscribe({
      next: arr => this.streamedGameStateArr$.next(arr)
    })
  }

  private deleteStaleGameState (gameStateMap: Map<string, GameStateWithDetails>) {
    [...gameStateMap].forEach(([id, state]) => {
      if (state.end) {
        gameStateMap.delete(id)
      }
    })
    return gameStateMap
  }

  get streamedGameStateArr () {
    return this.streamedGameStateArr$.value
  }

  get streamedGameStateIdArr () {
    return this.streamedGameStateArr.map(state => state.id)
  }

  queueForGame = () => {
  }

  useStreamedGameStates = () => {
    return useObservable(() => this.streamedGameStateArr$, [])
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
