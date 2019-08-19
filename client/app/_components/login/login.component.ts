import { Component, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../_services/login.service';
import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    console.log('attempting login');
    const val = this.form.value;
    console.log(val.username);
    console.log(val.password);
    if (val.username && val.username) {
      this.authService.login(val.username, val.password)
        .subscribe(
          (out) => {
            console.log('out: ', out);
            console.log('User is logged in');
            this.router.navigateByUrl('/games');
          }
        );
    }
  }
}
