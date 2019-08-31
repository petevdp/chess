import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Map } from '../../APIInterfaces/types';
import { merge, reduce, takeUntil, tap } from 'rxjs/operators';

export interface StateComponent<D> {
  id: string;
  detailsObservable: Subject<D>;
  cleanup: () => void;
}

export interface LobbyState<D> {
  detailsStateComponent: StateComponent<D>;
}

interface StateUpdate<D> {
  id: string;
  value: D | null;
}

export class LobbyCategoryDetails<D> {

  // detailSubjects: Map<BehaviorSubject<Details>>;
  detailsObservable: Observable<Map<D>>;
  componentObservable: Observable<Map<StateComponent<D>>>;
  components = {} as Map<StateComponent<D>>;

  private detailsUpdateSubject: Subject<StateUpdate<D>>;
  private componentsUpdateSubject: Subject<StateUpdate<StateComponent<D>>>;

  constructor() {
    this.detailsUpdateSubject = new Subject<StateUpdate<D>>();
    this.componentsUpdateSubject = new Subject<StateUpdate<StateComponent<D>>>();

    const addToState = (state: Map<any>, { id, value }) => {
      if (!value) {
        const { [id]: toDelete, ...rest } = state;
        return rest;
      }
      return { ...state, [id]: value };
    };

    this.detailsObservable = this.detailsUpdateSubject.pipe(
        reduce(addToState)
    );

    this.componentObservable = this.componentsUpdateSubject.pipe(
      tap(({ id, value }) => {
        if (!value) {
          this.components[id].detailsObservable.complete();
        }
        value.detailsObservable.subscribe({
          next: (details) => this.detailsUpdateSubject.next
        });
      }),
      reduce(addToState),
    );
  }

  addComponent(component: StateComponent<D>) {
    this.componentsUpdateSubject.next({id: component.id, value: component});
  }

  deleteComponent(id) {
    this.componentsUpdateSubject.next({id, value: null});
  }
}

