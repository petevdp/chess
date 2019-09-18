import { OperatorFunction, Observable, Subject } from "rxjs";
import { Details } from "./types";
import { filter, map, mergeAll, reduce, tap, shareReplay, finalize, scan, pluck } from "rxjs/operators";

export function routeBy<IN, OUT>(routeProperty: string): OperatorFunction<IN, OUT> {
  return input$ => input$.pipe(
    filter((msg: any) => !!msg[routeProperty]),
    map((msg: any) => msg[routeProperty])
  );
}
export interface HasDetails$<D> {
  details$: Observable<D>;
}

export function allDetails<D extends Details>(obj$: Observable<HasDetails$<D>>) {
  console.log('piping');
  return obj$.pipe(
    map((obj) => obj.details$),
    mergeAll(),
    scan((map, details) => map.set(details.id, details), new Map<string, D>()),
    map(detailsMap => Object.values(detailsMap)),
    shareReplay(1),
    finalize(() => console.log('we\'re here now')
    )
  )
}
