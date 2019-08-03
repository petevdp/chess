import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { GameComponent } from './game/game.component';
import { ChessboardModule } from 'ng2-chessboard';

@NgModule({
  declarations: [
    AppComponent,
    NavBarComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ChessboardModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
