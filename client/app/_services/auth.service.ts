import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserDetails } from 'APIInterfaces/api';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'client/environments/environment';
import { Observable } from 'rxjs';

const options = {
  withCredentials: true,
};
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }


  login(username: string, password: string ) {
    console.log('sending request!');
    // return this.http.put<UserDetails>(environment.API_ROUTE + '/login', {username, password}, options)
    return new Observable<any>(subscriber => {
      fetch(environment.API_ROUTE + '/login', {
        method: 'PUT',
        mode: 'cors',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Cache: 'no-cache'
        },
        // redirect: 'manual',
        body: JSON.stringify({username, password})
      })
        .then(response => {
          console.log('response: ' , response);
          subscriber.next();
        });
    })
    .pipe(shareReplay(1));
        // this is just the HTTP call,
        // we still need to handle the reception of the token
  }
}
