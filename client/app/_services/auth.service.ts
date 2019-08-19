import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserLogin } from 'APIInterfaces/types';
import { shareReplay } from 'rxjs/operators';
import { environment } from 'client/environments/environment';
import { Observable } from 'rxjs';

import { SessionDetails } from 'APIInterfaces/types';

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
    return this.http.put<SessionDetails>('api/login', {username, password}, options)
    .pipe(shareReplay(1));
  }
}
