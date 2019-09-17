import { OperatorFunction, Observable, Subject } from "rxjs";
import { Details } from "./types";
import { filter, map, mergeAll, reduce, tap, shareReplay, finalize, scan, pluck } from "rxjs/operators";

export function routeBy<IN, OUT>(routeProperty: string): OperatorFunction<IN, OUT> {
  return input$ => input$.pipe(
    filter((msg: any) => !!msg[routeProperty]),
    map((msg: any) => msg[routeProperty])
  );
}


export function updateMap<V>(state: Map<string, V>, { id, value }: StateUpdate<V>) {
  if (!value) {
    const { [id]: toDelete, ...rest } = state;
    return rest;
  }
  return { ...state, [id]: value } as Map<string, V>;
};


export interface StateUpdate<D> {
  id: string;
  value: D | null;
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
