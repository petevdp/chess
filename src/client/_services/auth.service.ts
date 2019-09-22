import { BehaviorSubject, Observable } from 'rxjs'
import axios from 'axios'
import to from 'await-to-js'

import config from '../app.config'
import { UserLogin, UserDetails } from '../../common/types'
import { useState, useEffect } from 'react'
import { tap } from 'rxjs/operators'
import { useObservable } from 'rxjs-hooks'
const { API_ROUTE } = config

export class AuthService {
  private loginRoute = `${API_ROUTE}/login`;
  private signupRoute = `${API_ROUTE}/signup`;

  currentUserSubject = new BehaviorSubject<UserDetails | null>(null);
  currentUser$: Observable<UserDetails | null>;

  constructor () {
    this.currentUser$ = this.currentUserSubject
    this.attemptAuthentication()
  }

  complete () {
    this.currentUserSubject.complete()
  }

  async attemptAuthentication () {
    const [err, response] = await to(axios.get<UserDetails>(`${API_ROUTE}/authenticate`))
    console.log('attempting auth')
    if (!response) {
      return
    }
    this.currentUserSubject.next(response.data as UserDetails)
  }

  async submitUserLoginDetails (userLogin: UserLogin, route: string) {
    const res = await axios.put(route, userLogin)
    return res.data
  }

  async login (userLogin: UserLogin) {
    console.log('logging in')
    const [err, res] = await to(axios.put(this.loginRoute, userLogin))
    if (err) {
      this.currentUserSubject.next(null)
      return false
    }
    const { data } = res
    this.currentUserSubject.next(data)
    return data
  }

  logout = async () => {
    const res = await axios.put(`${API_ROUTE}/logout`)
    this.currentUserSubject.next(null)
    return res.status === 200
  }

  useCurrentUser () {
    return useObservable(() => this.currentUser$)
  }
}

// export const useCurrentUser = (authService: AuthService|null) => {
//   const [currentUser, setCurrentUser] = useState(null as UserDetails | null)
//   useEffect(() => {
//     if (!authService) {
//       setCurrentUser(null);
//       return;
//     }
//     console.log('subscribing to currentuser');
//     const subscription = authService.currentUser$.subscribe(user => {
//       console.log('setting current user');
//       setCurrentUser(user);
//     });
//     return () => subscription.unsubscribe();
//   }, [authService])
//   return currentUser;
// }
