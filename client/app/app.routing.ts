import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login';
import { RoomIndexComponent } from './room-index';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent },
  { path: 'games', component: RoomIndexComponent},
];

export const appRoutingModule = RouterModule.forRoot(routes);
