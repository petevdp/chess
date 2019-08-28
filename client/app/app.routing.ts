import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './_components/login';
import { BoardComponent } from './_components/board';
import { LoginGuard } from 'client/app/login.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: LoginComponent },
  // { path: 'games', component: RoomIndexComponent },
  { path: 'play', component: BoardComponent }
];

export const AppRoutingModule = RouterModule.forRoot(routes);
