import { Injectable } from '@angular/core';
import { environment } from 'client/environments/environment.prod';
import * as io from 'socket.io-client'
import { Subject, Observable, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket;
  constructor() { }

  connect(): Subject<any> {
    this.socket = io('http://localhost:3000');
    // tslint:disable-next-line: no-shadowed-variable
    const observable = new Observable((observer) => {
      this.socket.on('message', data => {
        console.log('received message!');
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    const observer = {
      next: (data: any) => {
        this.socket.emit('message', JSON.stringify(data));
        return;
      }
    }
    const subject = new Subject<any>();
    observable.subscribe(subject);
    subject.subscribe(observer);
    return subject;
  }
}
