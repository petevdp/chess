import { OperatorFunction, Observable } from "rxjs";
import { Details } from "./types";
import { filter, map, mergeAll, shareReplay, finalize, scan, pluck } from "rxjs/operators";
import { any } from "prop-types";

export function routeBy<OUT>(routeProperty: string): OperatorFunction<any, OUT> {
  return (input$) => input$.pipe(
    filter((obj: any) => !!obj[routeProperty]),
    map(obj => obj[routeProperty])
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

