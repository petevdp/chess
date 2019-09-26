import { GameStream } from "../../common/gameProviders"
import { useObservable } from "rxjs-hooks"
import { Observable } from "rxjs"
import { CompleteGameInfo, GameUpdate } from "../../common/types"
import { map } from "rxjs/operators"

export default class GameStreamService {
  private position$: Observable<string | undefined>;
  private gameStream: GameStream

  constructor (
    gameUpdate$: Observable<GameUpdate>,
    gameInfo: CompleteGameInfo
  ) {
    this.gameStream = new GameStream(gameUpdate$, gameInfo)

    this.position$ = this.gameStream.move$.pipe(
      map(chess => chess.fen())
    )
  }

  usePosition () {
    return useObservable(() => this.position$, undefined)
  }
}
