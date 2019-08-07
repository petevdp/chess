import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './_components/login';
import { RoomIndexComponent } from './_components/room-index/index';
import { BoardComponent } from './_components/board';
import { LoginGuard } from 'client/app/login.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent },
  { path: 'games', component: RoomIndexComponent },
  { path: 'play', component: BoardComponent }
];

export const appRoutingModule = RouterModule.forRoot(routes);
