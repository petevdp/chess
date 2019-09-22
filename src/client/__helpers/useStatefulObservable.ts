import { Observable, empty } from 'rxjs'
import { useObservable } from 'rxjs-hooks'
import { switchMap, tap, concatMap, mergeMap } from 'rxjs/operators'

export const useStatefulObservable = (
  observable: Observable<any> | null,
  defaultVal: any
) => {
  console.log('lmao')

  return useObservable((input$: Observable<any>) => input$.pipe(
    mergeMap((input) => input || empty())
  ), defaultVal, [observable])
}
