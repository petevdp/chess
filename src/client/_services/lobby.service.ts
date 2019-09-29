import { MemberMessage, GameMessage, CompleteGameInfo, GameUpdateWithId, LobbyMemberDetails } from '../../common/types'
import { Observable, Subject, from } from 'rxjs'
import { SocketService } from './socket.service'
import { routeBy } from '../../common/helpers'
import { useObservable } from 'rxjs-hooks'
import { scan, shareReplay, filter, map, takeWhile, concatMap, mergeMap } from 'rxjs/operators'
import { GameStream, GameStateWithDetails } from '../../common/gameProviders'

type CompleteGameInfoUpdate = [string, (CompleteGameInfo|null)]
export class LobbyService {
  lobbyMemberDetailsMap$: Observable<Map<string, LobbyMemberDetails>>;
  streamedGameStateArr$: Observable<GameStateWithDetails[]>

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

    const gameDisplayUpdate$: Subject<CompleteGameInfoUpdate> = new Subject()

    gameMessage$.pipe(
      routeBy<CompleteGameInfo[]>('display'),
      concatMap(infoArr => from(infoArr)),
      map((info): CompleteGameInfoUpdate => [info.id, info])
    ).subscribe({
      next: update => gameDisplayUpdate$.next(update)
    })

    const gameUpdate$ = gameMessage$.pipe(
      routeBy<GameUpdateWithId>('update')
    )

    const currentlyDisplayed = new Map<string, CompleteGameInfo>()

    const gameStream$ = gameDisplayUpdate$.pipe(
      filter(([id]) => !currentlyDisplayed.has(id)),
      map<CompleteGameInfoUpdate, GameStream>(([, info]) => {
        if (!info) {
          throw new Error('nulls should be filtered out')
        }

        const gameSpecificUpdate$ = gameUpdate$.pipe(
          filter(({ id }) => id === info.id),
          takeWhile(u => u.type !== 'end', true)
        )

        gameSpecificUpdate$.subscribe({
          complete: () => currentlyDisplayed.delete(info.id)
        })

        console.log('new gameStream')
        return new GameStream(gameSpecificUpdate$, info)
      })
    )

    this.streamedGameStateArr$ = gameStream$.pipe(
      mergeMap(gameStream => gameStream.gameStateWithDetails$),
      scan((acc, gameState) => {
        acc = this.deleteStaleGameState(acc)
        acc.set(gameState.id, gameState)
        return acc
      }, new Map<string, GameStateWithDetails>()),
      map(gameStateMap => [...gameStateMap.values()])
    )
  }

  private deleteStaleGameState (gameStateMap: Map<string, GameStateWithDetails>) {
    [...gameStateMap].forEach(([id, gameState]) => {
      if (gameState.end) {
        gameStateMap.delete(id)
      }
    })
    return gameStateMap
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
