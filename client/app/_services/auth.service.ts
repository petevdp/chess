import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserLogin, UserDetails } from 'APIInterfaces/types';
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
    return this.http.put<UserDetails>('api/login', {username, password}, options)
    .pipe(shareReplay(1));
  }
}
