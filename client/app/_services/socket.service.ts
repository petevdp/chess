import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable, ReplaySubject, Subject, BehaviorSubject } from 'rxjs';
import { LobbyDetails } from 'APIInterfaces/types';
import { AuthService } from './auth.service';
import { serverSignals } from 'APIInterfaces/socketSignals';


@Injectable({
  providedIn: 'root'
})
export class SocketService {
  lobbyDetailsObservable: Observable<LobbyDetails>;

  private socket = io('http://localhost:3000');
  private lobbyDetailsSubject = new BehaviorSubject<LobbyDetails>({
    members: [],
    games: [],
  });

  constructor(
    private authService: AuthService
  ) {
  }

  initLobbyDetailsObservable() {
    this.socket.on(serverSignals.updateLobbyDetails(), details => {
      this.lobbyDetailsSubject.next(details);
    });
    this.lobbyDetailsObservable = this.lobbyDetailsSubject.asObservable();
  }
 }
