import { GameStream } from "../../common/gameProviders"
import { useObservable } from "rxjs-hooks"
import { Observable } from "rxjs"
import { CompleteGameInfo, GameUpdate } from "../../common/types"
import { map, mapTo } from "rxjs/operators"

export default class GameStreamService extends GameStream {
  private position$: Observable<string | undefined>;
  public serviceUpdate$: Observable<GameStreamService>;

  constructor (
    gameUpdate$: Observable<GameUpdate>,
    gameInfo: CompleteGameInfo
  ) {
    super(gameUpdate$, gameInfo)

    this.position$ = this.move$.pipe(
      map(chess => chess.fen())
    )

    this.serviceUpdate$ = this.update$.pipe(mapTo(this))
  }

  usePosition () {
    return useObservable(() => this.position$, undefined)
  }
}
