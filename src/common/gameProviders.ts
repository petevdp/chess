import { Observable } from "rxjs";
import { ChessInstance, Move, Chess, ShortMove } from "chess.js";
import { EndState, GameUpdate, ClientPlayerAction, Colour } from './types';
import { scan, map, tap } from "rxjs/operators";
import { routeBy } from "./helpers";

interface GameClientOptions {
  startingFEN?: string;
}

export class GameStream {
   move$: Observable<ChessInstance>;
   end$: Observable<EndState>;
   private chess: ChessInstance;
  constructor(
    gameUpdate$: Observable<GameUpdate>,
    { startingFEN }: GameClientOptions = {}
  ) {
    this.chess = new Chess(startingFEN);
    this.move$ = gameUpdate$.pipe(
      routeBy<ShortMove>('move'),
      map(move => {
        const out = this.chess.move(move);
        if (!out) {
          throw new Error('invalid move');
        }
        return this.chess;
      })
    );

    this.end$ = gameUpdate$.pipe(
      routeBy<EndState>('end')
    );
  }
}

export class GameClient extends GameStream {
  // opponentMove$: Observable<ChessInstance>;

  constructor(
    gameUpdate$: Observable<GameUpdate>,
    startingFEN: string,
    private sendClientPlayerAction: (action: ClientPlayerAction) => void,
    colour: Colour
  ) {
    super(gameUpdate$, {startingFEN});
  }

  makeMove(move: Move): void {}
  resign(): void {}
  offerDraw(): void {}
}
