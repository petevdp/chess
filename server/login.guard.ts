import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginService } from 'client/app/login.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  isLoggedIn: boolean;

  constructor(
    private loginService: LoginService,
    private router: Router,
  ) {
    this.loginService.currentUsername.subscribe(username => {
      this.isLoggedIn = !!username;
    });
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.isLoggedIn) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
