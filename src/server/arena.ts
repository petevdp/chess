import { LobbyMember } from "./lobbyMember";
import { Observable, BehaviorSubject, merge, Subject } from "rxjs";
import { scan, map, mergeAll, filter } from "rxjs/operators";
import { Game } from "./game";
import { sleep } from "../common/helpers";

interface UnmatchedState {
  potentialGames: Array<Promise<Game | false>>;
  allUnmatched: Map<string, LobbyMember>;
}

export class Arena {
  constructor(private lobbyMember$: Observable<LobbyMember>) {
    const unmatched$ = new Subject<[string, LobbyMember]>()
    lobbyMember$.subscribe({
      next: member => {
        unmatched$.next([member.id, member])
      }
    })
    const games$ = unmatched$.pipe(
      scan((acc, [id, member]) => {
        const { allUnmatched } = acc;
        if (!member) {
          allUnmatched.delete(id);
          return acc;
        }

        acc.potentialGames = [...allUnmatched.values()].map(unmatched => (
          this.resolvePotentialGame([unmatched, member])
        ));

        allUnmatched.set(id, member);
        return acc;
      }, { potentialGames: [], allUnmatched: new Map() } as UnmatchedState),
      map(({potentialGames}) => merge(potentialGames)),
      mergeAll(),
      filter(game => !!game),
    );
  }

  private async resolvePotentialGame(members: LobbyMember[]) {
    const successfulResolution = await Promise.race([
      sleep(100),
      ...members.map(async (m) => {
        await m.resolveMatchedOrDisconnected();
        return false;
      })
    ])
    return successfulResolution  && new Game(members);
  }
}
