import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app.routing';

import { AppComponent } from './_components/app/app.component';
import { NavBarComponent } from './_components/nav-bar/nav-bar.component';
import { BoardComponent } from './_components/board/board.component';
import { RoomIndexComponent } from './_components/room-index/room-index.component';
import { LoginComponent } from './_components/login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    AppComponent,
    NavBarComponent,
    BoardComponent,
    RoomIndexComponent,
    LoginComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
