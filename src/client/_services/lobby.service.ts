import { MemberMessage, CompleteGameInfo, GameUpdateWithId, LobbyMemberDetails, LobbyMessage, DisplayedGameMessage } from '../../common/types'
import { Observable, from, BehaviorSubject } from 'rxjs'
import { SocketServiceInterface } from './socket.service'
import { routeBy } from '../../common/helpers'
import { useObservable } from 'rxjs-hooks'
import { scan, shareReplay, filter, map, takeWhile, concatMap, mergeMap } from 'rxjs/operators'
import { GameStream, GameStateWithDetails } from '../../common/gameProviders'

export class LobbyService {
  lobbyMemberDetailsMap$: Observable<Map<string, LobbyMemberDetails>>
  streamedGameStateArr$: BehaviorSubject<GameStateWithDetails[]>

  constructor (socketService: SocketServiceInterface) {
    const { serverMessage$: message$ } = socketService

    const lobbyMessage$: Observable<LobbyMessage> = message$.pipe(routeBy('lobby'))

    const memberMessage$: Observable<MemberMessage> = lobbyMessage$.pipe(routeBy('member'))
    const displayedGameMessage$ = lobbyMessage$.pipe(routeBy<DisplayedGameMessage>('displayedGame'))

    this.lobbyMemberDetailsMap$ = this.createLobbyMemberDetailsMap$(memberMessage$)
    this.streamedGameStateArr$ = this.createStreamedGameStateArr$(displayedGameMessage$)
  }

  private createLobbyMemberDetailsMap$ (memberMessage$: Observable<MemberMessage>) {
    return memberMessage$.pipe(
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
  }

  private createStreamedGameStateArr$ (
    displayedGameMessage$: Observable<DisplayedGameMessage>
  ): BehaviorSubject<GameStateWithDetails[]> {
    const displayedGameUpdate$ = displayedGameMessage$.pipe(
      routeBy<GameUpdateWithId>('update')
    )

    const displayedGameAddition$ = displayedGameMessage$.pipe(
      routeBy<CompleteGameInfo[]>('add')
    )

    const streamedGameStateArr$ = new BehaviorSubject([] as GameStateWithDetails[])

    const gameState$: Observable<GameStateWithDetails> = displayedGameAddition$.pipe(
      concatMap((additions) => from(additions)),
      filter(info => !streamedGameStateArr$.value
        .map(g => g.id)
        .includes(info.id)
      ),
      mergeMap((info: CompleteGameInfo) => {
        const gameUpdate$ = displayedGameUpdate$.pipe(
          filter(update => update.id === info.id),
          takeWhile(update => update.type !== 'end', true)
        )
        console.log(`new gamestream: ${info.id}`)
        const gameStream = new GameStream(gameUpdate$, info)
        return gameStream.gameStateWithDetails$
      })
    )

    gameState$.pipe(
      scan<GameStateWithDetails, Map<string, GameStateWithDetails>>((acc, state) => {
        acc = this.deleteStaleGameState(acc)
        acc.set(state.id, state)
        return acc
      }, new Map<string, GameStateWithDetails>()),
      map<Map<string, GameStateWithDetails>, GameStateWithDetails[]>(stateMap => [...stateMap.values()])
    ).subscribe({
      next: arr => streamedGameStateArr$.next(arr)
    })

    return streamedGameStateArr$
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
