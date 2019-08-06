import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login';
import { RoomIndexComponent } from './room-index';
import { LoginGuard } from 'server/login.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent},
  { path: 'games', component: RoomIndexComponent, canActivate: [LoginGuard] },
];

export const appRoutingModule = RouterModule.forRoot(routes);
