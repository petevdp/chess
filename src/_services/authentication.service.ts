import { BehaviorSubject } from 'rxjs';
import axios from 'axios';

import config from '../app.config';
import { UserLogin, SessionDetails, UserDetails } from '../../common/types';

const currentUserSubject = new BehaviorSubject<UserDetails|null>(getExistingSession());

const { HOST, PORT, API_ROUTE } = config;

const loginRoute = `http://${HOST}:${PORT}${API_ROUTE}/login`;

export async function login(userLogin: UserLogin) {
  const session = (await axios.post(loginRoute, userLogin)).data as SessionDetails;
  localStorage.setItem('session', JSON.stringify(session));
  const { idToken, ...user} = session;
  currentUserSubject.next(user);
}

export function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('session');
    currentUserSubject.next(null);
}

function getExistingSession(): SessionDetails|null {
  const session = localStorage.getItem('session');
  if (!session) {
    return null;
  }
  return JSON.parse(session);
}

export function currentUserValue () { return currentUserSubject.value }

