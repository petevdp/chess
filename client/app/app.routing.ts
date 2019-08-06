import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login';
import { RoomIndexComponent } from './room-index';
import { BoardComponent } from './board';
import { LoginGuard } from 'server/login.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent },
  { path: 'games', component: RoomIndexComponent },
  { path: 'play', component: BoardComponent }
];

export const appRoutingModule = RouterModule.forRoot(routes);
