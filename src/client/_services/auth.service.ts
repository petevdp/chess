import { BehaviorSubject, Observable } from 'rxjs';
import axios from 'axios';

import config from '../app.config';
import { UserLogin, UserDetails } from '../../common/types';
import { useState, useEffect } from 'react';
import { tap } from 'rxjs/operators';
const { API_ROUTE } = config;

export class AuthService {
  private loginRoute = `${API_ROUTE}/login`;

  currentUserSubject = new BehaviorSubject<UserDetails | null>(null);
  currentUser$: Observable<UserDetails | null>;

  constructor() {
    this.currentUser$ = this.currentUserSubject.pipe(tap(v => console.log('u: ', v)));
  }

  complete() {
    this.currentUserSubject.complete();
  }

  async login(userLogin: UserLogin) {
    const { data } = await axios.put(this.loginRoute, userLogin);
    this.currentUserSubject.next(data);
    console.log('data: ', data);
    return data;
  }

  async logout() {
    const res = await axios.put(`${API_ROUTE}/logout`)
    this.currentUserSubject.next(null);
    return res.status === 200;
  }
}

export const useCurrentUser = (authService: AuthService|null) => {
  const [currentUser, setCurrentUser] = useState(null as UserDetails | null)
  useEffect(() => {
    if (!authService) {
      setCurrentUser(null);
      return;
    }
    console.log('subscribing to currentuser');
    const subscription = authService.currentUser$.subscribe(user => {
      console.log('setting current user');
      setCurrentUser(user);
    });
    return () => subscription.unsubscribe();
  }, [authService])
  return currentUser;
}
