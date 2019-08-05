import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private currentUserSubject: BehaviorSubject<string>;
  public currentUsername: Observable<string>;
  constructor() {
    this.currentUserSubject = new BehaviorSubject<string>(null);
    this.currentUsername = this.currentUserSubject.asObservable();
  }

  login(username: string) {
    this.currentUserSubject.next(username);
  }

  logout() {
    this.currentUserSubject.next(null);
  }
}
