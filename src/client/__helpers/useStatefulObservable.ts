import { Observable, empty } from "rxjs";
import { useObservable } from "rxjs-hooks";
import { switchMap } from "rxjs/operators";


export const useStatefulObservable = (observable: Observable<any> | null, defaultVal: any) => {
  return useObservable((input$: Observable<any>) => input$.pipe(
    switchMap((input) => input ? input : empty())
  ), defaultVal, [observable])
};
