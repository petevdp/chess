import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserDetails } from 'APIInterfaces/api';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'client/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(username: string, password: string ) {
    console.log('sending request!');
    return this.http.post<UserDetails>(environment.API_ROUTE + '/login', {username, password})
        // this is just the HTTP call,
        // we still need to handle the reception of the token
        .pipe(shareReplay(1));
  }
}
