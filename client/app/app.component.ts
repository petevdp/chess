import { Component } from '@angular/core';
import { GameService } from './game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chess';
  constructor(private game: GameService) {}

  ngOnInit() {
    this.game.messages.subscribe(msg => {
      console.log(msg);
    })
  }

  sendMessage() {
    this.game.sendMsg("TestMessage");
  }
}
