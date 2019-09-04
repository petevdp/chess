import React from "react";
import "../App.scss";
import {
  BrowserRouter as Router,
  Route,
  Link,
  RouteComponentProps,
  Redirect,
} from 'react-router-dom';
import { Container } from 'react-bootstrap';

import { AuthService } from "../_services/auth.service";
import { LobbyService } from '../_services/lobby.service'
import { SocketService } from "../_services/socket.service";

import { Lobby } from "./Lobby";
import { Login } from "./Login";
import NavBar from "./Nav";
import { authGuard } from "../__helpers/AuthGuard";

const App: React.FC = () => {
  const authService = new AuthService();
  const socketService = new SocketService(authService);
  const lobbyService = new LobbyService(socketService);
  const PrivateRoute = authGuard(authService, '/login');

  return (
    <div className="App">
      <Router>
        <NavBar {...{ authService }}></NavBar>
        <Container>
          <Route
            path="/login"
            exact
            component={() => <Login authService={authService} />}
          />
          <PrivateRoute
            exact path="/lobby"
            guardedComponent={() => <Lobby {...{ authService, lobbyService }} />}
          />

          <Redirect to="login" path="/" />
        </Container>
      </Router>
    </div>
  );
};

export default App;
