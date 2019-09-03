import { BehaviorSubject } from 'rxjs';
import axios from 'axios';

import config from '../app.config';
import { UserLogin, SessionDetails, UserDetails } from '../../common/types';
import { useState } from 'react';
const { API_ROUTE } = config;

export class AuthService {
  private sessionStorageKey = 'session';
  private loginRoute = `${API_ROUTE}/login`;

  private currentUserSubject = new BehaviorSubject<UserDetails | null>(this.getExistingSession());

  constructor() {
  }

  useCurrentUser() {
    const [userDetails, setUserDetails] = useState(this.currentUserSubject.value);

    this.currentUserSubject.subscribe({
      next: setUserDetails,
    });

    return userDetails;
  }

  async login(userLogin: UserLogin) {
    const session = (await axios.put(this.loginRoute, userLogin)).data as SessionDetails;
    localStorage.setItem('session', JSON.stringify(session));
    console.log('session: ', session);

    const { idToken, ...user } = session;
    this.currentUserSubject.next(user);
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem(this.sessionStorageKey);
    this.currentUserSubject.next(null);
  }

  getExistingSession() {
    const session = localStorage.getItem(this.sessionStorageKey);
    if (!session) {
      return null;
    }
    return JSON.parse(session);
  }
}
