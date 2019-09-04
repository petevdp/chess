import { BehaviorSubject, Subscription, Observable } from 'rxjs';
import axios from 'axios';

import config from '../app.config';
import { UserLogin, SessionDetails, UserDetails } from '../../common/types';
import { useState, useEffect } from 'react';
const { API_ROUTE } = config;

export class AuthService {
  private sessionStorageKey = 'session';
  private loginRoute = `${API_ROUTE}/login`;

  private currentSessionSubject = new BehaviorSubject<SessionDetails | null>(this.getExistingSession());
  currentSession$: Observable<SessionDetails | null>;

  constructor() {
    this.currentSession$ = this.currentSessionSubject.asObservable();
  }

  get isLoggedIn() {
    return !!this.currentSessionSubject.value
  }

  get token() {
    return this.currentSessionSubject.value && this.currentSessionSubject.value.idToken
  }

  async login(userLogin: UserLogin) {
    const session = (await axios.put(this.loginRoute, userLogin)).data as SessionDetails;
    localStorage.setItem('session', JSON.stringify(session));
    console.log('session: ', session);

    this.currentSessionSubject.next(session);
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem(this.sessionStorageKey);
    this.currentSessionSubject.next(null);
  }


  private getExistingSession() {
    const session = localStorage.getItem(this.sessionStorageKey);
    if (!session) {
      return null;
    }
    return JSON.parse(session);
  }
}
