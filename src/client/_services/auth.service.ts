import { BehaviorSubject, Observable } from 'rxjs'
import axios from 'axios'
import to from 'await-to-js'

import { UserLogin, UserDetails } from '../../common/types'
import { useObservable } from 'rxjs-hooks'
import { AUTH_PATH, LOGIN_PATH, LOGOUT_PATH } from '../../common/config'

export class AuthService {
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
    const [, response] = await to(axios.get<UserDetails>(AUTH_PATH))
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
    const [err, res] = await to(axios.put(LOGIN_PATH, userLogin))
    if (err) {
      this.currentUserSubject.next(null)
      return false
    }
    const { data } = res
    this.currentUserSubject.next(data)
    return data
  }

  logout = async () => {
    const res = await axios.put(LOGOUT_PATH)
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
