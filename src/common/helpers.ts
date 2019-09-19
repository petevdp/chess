import { OperatorFunction, Observable } from "rxjs";
import { Details } from "./types";
import { filter, map, mergeAll, shareReplay, finalize, scan } from "rxjs/operators";

export function routeBy<IN, OUT>(routeProperty: string): OperatorFunction<IN, OUT> {
  return (input$: Observable<IN>) => input$.pipe(
    filter((msg: any) => !!msg[routeProperty]),
    map((msg) => msg[routeProperty] as OUT)
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

export const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

