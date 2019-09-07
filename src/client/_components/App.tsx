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

interface UnconfirmedAppWideServices {
  authService: AuthService|null;
  socketService: SocketService|null;
}

interface AppWideServices {
  authService: AuthService;
  socketService: SocketService;
}



const useAppWideServices = () => {
  const [services, setServices] = useState({authService: null, socketService: null} as UnconfirmedAppWideServices);
  useEffect(() => {
    const authService = new AuthService();
    const socketService = new SocketService(authService);
    setServices({authService, socketService});
    return () => {
      console.log('ded');
      socketService.complete();
      authService.complete();
    }
  }, []);
  return services;
}

const App: React.FC = () => {
  const services = useAppWideServices();
  const currentUser = useCurrentUser(services.authService);

  console.log('current user: ', currentUser);
  // initialize global services
  const authGuardRedirectRoute = 'login';

  const { authService, socketService } = services as AppWideServices;

  if (!authService || !socketService) {
    return (
      <div className="App">
        Loading
      </div>
    );
  }


  const renderLogin = () => <Login authService={authService} />;
  const renderLobby = () => <Lobby {...{ authService, socketService }} />;

  return (
    <div className="App">
      <Router>
        <NavBar {...{ authService }} />
        <Container>
          <Route
            path="/login"
            exact
            render={renderLogin}
          />
          <PrivateRoute
            exact path="/lobby"
            {...{currentUser, redirectRoute: authGuardRedirectRoute}}
            GuardedComponent={renderLobby}
          />

          <Redirect to="login" path="/" />
        </Container>
      </Router>
    </div>
  );
 };

export default App;
