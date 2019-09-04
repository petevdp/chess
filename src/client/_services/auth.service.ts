import { BehaviorSubject, Observable } from 'rxjs';
import axios from 'axios';

import config from '../app.config';
import { UserLogin, SessionDetails, UserDetails } from '../../common/types';
import { useState, useEffect } from 'react';
import { useObservable } from 'rxjs-hooks';
const { API_ROUTE } = config;

export class AuthService {
  private loginRoute = `${API_ROUTE}/login`;

  currentUserSubject = new BehaviorSubject<UserDetails | null>(null);
  currentUser$: Observable<UserDetails | null>;

  constructor() {
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  complete() {
    this.currentUserSubject.complete();
  }

  async login(userLogin: UserLogin) {
    const res = await axios.put(this.loginRoute, userLogin);
    const user = res.status === 200
    ? res.data
    : null as UserDetails | null;

    this.currentUserSubject.next(user);
    return user
  }

  async logout() {
    const res = await axios.put(`${API_ROUTE}/logout`)
    return res.status === 200;
  }

  useCurrentUser() {
    return useObservable(() => this.currentUser$, null);
  }
}
