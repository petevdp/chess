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

import { AuthService, useCurrentUser } from "../_services/auth.service";
import { LobbyService } from '../_services/lobby.service'
import { SocketService } from "../_services/socket.service";

import { Lobby } from "./Lobby";
import { Login } from "./Login";
import NavBar from "./Nav";
import { PrivateRoute } from "../__helpers/AuthGuard";
import { UserDetails } from "../../common/types";

interface AppWideServices {
  authService: AuthService|null;
  socketService: SocketService|null;
}

const useAppWideServices = () => {
  const [services, setServices] = useState({authService: null, socketService: null} as AppWideServices);
  useEffect(() => {
    const authService = new AuthService();
    const socketService = new SocketService(authService);
    setServices({authService, socketService});
    return () => {
      socketService.complete();
      authService.complete();
    }
  }, []);
  return services;
}

const App: React.FC = () => {
  const services = useAppWideServices();
  const currentUser = useCurrentUser(services.authService);

  // initialize global services
  const { authService, socketService } = services;
  const authGuardRedirectRoute = 'login';

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
            {...{currentUser, redirectRoute: authGuardRedirectRoute}}
            GuardedComponent={() => <Lobby {...{ authService, socketService }} />}
          />

          <Redirect to="login" path="/" />
        </Container>
      </Router>
    </div>
  );
 };

export default App;
