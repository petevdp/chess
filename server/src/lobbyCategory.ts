import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Map } from '../../APIInterfaces/types';
import { merge, reduce, takeUntil, tap, map, shareReplay } from 'rxjs/operators';

export interface StateComponent<D, A> {
  id: string;

  // state relevant to client
  detailsObservable: Observable<D>;

  // methods accessable by lobby based on id
  actions: A;
}

interface StateUpdate<D> {
  id: string;
  value: D | null;
}

export class LobbyCategory<D, A> {

  // complete state of details
  detailsObservable: Observable<Map<D>>;

  // snapshot of current components
  componentActions = {} as Map<A>;

  private componentsUpdateSubject: Subject<StateUpdate<StateComponent<D, A>>>;

  constructor() {
    const detailsUpdateSubject = new Subject<StateUpdate<D>>();
    this.componentsUpdateSubject = new Subject<StateUpdate<StateComponent<D, A>>>();

    // helper method to reduce updates into key/value store
    const addToState = (state: Map<any>, { id, value }: StateUpdate<any>) => {
      if (!value) {
        const { [id]: toDelete, ...rest } = state;
        return rest;
      }
      return { ...state, [id]: value };
    };

    this.componentsUpdateSubject.pipe(
      tap(({id, value}) => {
        if (!value) {
          return;
        }
        value.detailsObservable.subscribe({
          // forward details to correct observable
          next: (details) => detailsUpdateSubject.next({id, value: details}),
          // if completed, remove those details from current state
          complete: () => detailsUpdateSubject.next({id, value: null})
        });
      }),

      // map to actions, turn into map, and set as componentActions
      map(({id, value}) => ({id, value: value.actions})),
      reduce(addToState),
      tap(components => this.componentActions = components)
    );

    this.detailsObservable = detailsUpdateSubject.pipe(
      tap(({ id, value }) => {
        if (!value) {

          // delete from component actions if details are no longer being provided
          this.componentActions = addToState(this.componentActions, {id, value: null});
          return;
        }
      }),
        reduce(addToState),
        shareReplay(1)
    );
  }

  addComponent(component: StateComponent<D, A>) {
    this.componentsUpdateSubject.next({id: component.id, value: component});
  }
}
