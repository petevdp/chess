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

import { Lobby } from "./Lobby";
import { Login } from "./Login";
import NavBar from "./Nav";
import { PrivateRoute } from "../__helpers/AuthGuard";
import { UserDetails } from "../../common/types";
import { Game } from "./Game";

interface UnconfirmedAppWideServices {
  authService: AuthService|null;
}

interface AppWideServices {
  authService: AuthService;
}



const useAppWideServices = () => {
  const [services, setServices] = useState({authService: null } as UnconfirmedAppWideServices);
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
  const { authService } = useAppWideServices();

  // initialize global services
  const authGuardRedirectRoute = 'login';

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
          <PrivateRoute
            exact path="/game"
            {...{authService, redirectRoute: authGuardRedirectRoute}}
            GuardedComponent={Game}
          />
        </Container>
      </Router>
    </div>
  );
 };

export default App;

