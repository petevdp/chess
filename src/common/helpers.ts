import { OperatorFunction, ObservableLike, Observable, Operator } from "rxjs";
import { LobbyMessage } from "./types";
import { filter, map } from "rxjs/operators";

export function routeBy<IN, OUT>(routeProperty: string): OperatorFunction<IN, OUT> {
  return input$ => input$.pipe(
    filter((msg: any) => !!msg[routeProperty]),
    map((msg: any) => msg[routeProperty])
  );
}
