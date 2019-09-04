import React, { useEffect, useState } from "react";
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
import { useAuthGuard } from "../__helpers/AuthGuard";

interface AppWideServices {
  authService: AuthService;
  socketService: SocketService;
}

const App: React.FC = () => {
  const [services, setServices] = useState({} as AppWideServices);

  // initialize global services
  useEffect(() => {
    const authService = new AuthService();
    const socketService = new SocketService(authService);
    setServices({authService, socketService});
    return () => {
      socketService.complete();
      authService.complete();
    }
  }, []);
  const { authService, socketService } = services;
  const PrivateRoute = useAuthGuard(authService, '/login');

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
            guardedComponent={() => <Lobby {...{ authService, socketService }} />}
          />

          <Redirect to="login" path="/" />
        </Container>
      </Router>
    </div>
  );
 };

export default App;
