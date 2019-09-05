import { BehaviorSubject, Observable, Subscription } from 'rxjs';
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
    return new Promise<UserDetails|false>((resolve, reject) => {
      axios.put(this.loginRoute, userLogin)
        .then(({data}) => {
          resolve(data)
          this.currentUserSubject.next(data);
          console.log('data: ', data);
        })
        .catch(error => {
          console.log('errod: ', error)
          resolve(error);
        });
      ;
    });
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
    const subscription = authService.currentUser$.subscribe(setCurrentUser);
    return () => subscription.unsubscribe();
  }, [authService])
  console.log('curruser', currentUser);
  return currentUser;
}
