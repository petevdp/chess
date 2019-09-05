import { Observable, empty } from "rxjs";
import { useObservable } from "rxjs-hooks";
import { switchMap, tap, concatMap, mergeMap } from "rxjs/operators";


export const useStatefulObservable = (
  observable: Observable<any> | null,
  defaultVal: any
) => {
  console.log('lmao');

  return useObservable((input$: Observable<any>) => input$.pipe(
    tap(v => console.log('before ', v)),
    mergeMap((input) => input ? input : empty()),
    tap(v => console.log('after ', v))
  ), defaultVal, [observable])
};
