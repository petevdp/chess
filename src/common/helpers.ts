import { OperatorFunction, Observable } from 'rxjs'
import { Details } from './types'
import { filter, map, mergeAll, shareReplay, scan } from 'rxjs/operators'

export function routeBy<OUT> (routeProperty: string): OperatorFunction<any, OUT> {
  return (input$) => input$.pipe(
    filter((obj: any) => !!obj[routeProperty]),
    map(obj => obj[routeProperty])
  )
}
export interface HasDetailsObservable<D> {
  update$: Observable<D>;
}

export function allDetails<D extends Details> (obj$: Observable<HasDetailsObservable<D>>) {
  return obj$.pipe(
    map((obj) => obj.update$),
    mergeAll(),
    scan((map, details) => map.set(details.id, details), new Map<string, D>()),
    map(detailsMap => Object.values(detailsMap)),
    shareReplay(1)
  )
}

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
