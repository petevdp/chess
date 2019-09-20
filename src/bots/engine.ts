import { ChessInstance, Move, Chess } from "chess.js";
import { Observable, of } from "rxjs";
import { Colour } from "../common/types";
import { takeWhile, concatMap } from "rxjs/operators";


type ChooseMove = (chess: ChessInstance) => Promise<Move>;

// chessInstance should have available moves
export class ChessEngine {
  constructor (private chooseMove: ChooseMove) {}
  private makeMoveIfValid(
    move: Move,
    chess: ChessInstance,
  ) {
    if (!chess.move(move)) {
      throw new Error('invalid move!');
    }
  }

  playGame(fen: string, incomingMoves: Observable<Move>) {
    const chess = new Chess(fen);
    return incomingMoves.pipe(
      concatMap(async (incMove) => {
        this.makeMoveIfValid(incMove, chess);
        const chosen = await this.chooseMove(chess);
        if (chess.moves.length < 0) {
          return of(false)
        }
        this.makeMoveIfValid(chosen, chess);
        return chosen;
      }),
      takeWhile(move => !!move)
    );
  }
}
