import { Component, OnInit, Input } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoginService } from '../../_services/login.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {

  currentUsername: string;
  constructor(private loginService: LoginService) { }

  ngOnInit() {
    this.loginService.currentUsername.subscribe(username => {
      this.currentUsername = username;
    })
  }

}
