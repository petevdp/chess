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
import { PrivateRoute } from "../__helpers/AuthGuard";
import { UserDetails } from "../../common/types";

interface UnconfirmedAppWideServices {
  authService: AuthService|null;
}

interface AppWideServices {
  authService: AuthService;
}



const useAppWideServices = () => {
  const [services, setServices] = useState({authService: null, socketService: null} as UnconfirmedAppWideServices);
  useEffect(() => {
    const authService = new AuthService();
    setServices({authService});
    return () => {
      console.log('ded');
      authService.complete();
    }
  }, []);
  return services;
}

const App: React.FC = () => {
  const services = useAppWideServices();

  // initialize global services
  const authGuardRedirectRoute = 'login';

  const { authService } = services as AppWideServices;

  if (!authService) {
    return (
      <div className="App">
        Loading
      </div>
    );
  }


  const renderLogin = () => <Login authService={authService} />;
  const renderLobby = () => <Lobby {...{ authService }} />;

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
            {...{authService, redirectRoute: authGuardRedirectRoute}}
            GuardedComponent={renderLobby}
          />

          <Redirect to="login" path="/" />
        </Container>
      </Router>
    </div>
  );
 };

export default App;
