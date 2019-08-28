import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserLogin, User, AuthPayload } from 'APIInterfaces/types';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from 'client/environments/environment';
import { Observable } from 'rxjs';
import * as moment from 'moment';

import { SessionDetails } from 'APIInterfaces/types';

const options = {
  withCredentials: true,
};
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  currentUser: SessionDetails|null = null;
  constructor(private http: HttpClient) { }

  login(username: string, password: string ) {
    return this.http.put<AuthPayload>('api/login', {username, password}, options)
    .pipe(
      tap(res => this.setSession(res)),
      shareReplay(1)
    );
  }
  isLoggedIn() {
    return moment().isBefore(this.getExpiration());
  }

  logout() {
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
  }

  isLoggedOut() {
      return !this.isLoggedIn();
  }

  getExpiration() {
      const expiration = localStorage.getItem('expires_at');
      const expiresAt = JSON.parse(expiration);
      return moment(expiresAt);
  }

  private setSession(authResult) {
    const expiresAt = moment().add(authResult.expiresIn, 'hour');

    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', JSON.stringify(expiresAt.valueOf()) );
  }

}
