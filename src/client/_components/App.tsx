import React, { useEffect, useState } from "react"
import "../App.scss"
import {
  BrowserRouter as Router,
  Route,
  Redirect
} from "react-router-dom"
import { Container } from "react-bootstrap"

import { AuthServiceInterface, AuthService } from "../_services/auth.service"

import Lobby from "./Lobby"
import { Login } from "./Login"
import NavBar from "./Nav"
import { PrivateRoute } from "../__helpers/AuthGuard"
import { Game } from "./Game"
import { SocketServiceInterface, SocketService } from "../_services/socket.service"

interface UnconfirmedAppWideServices {
  authService: AuthServiceInterface | null;
}

export function useAppWideServices (servicesWithIO: ServicesWithIO) {
  const [services, setServices] = useState(
    { authService: null } as UnconfirmedAppWideServices
  )
  useEffect(() => {
    console.log('new authservice')
    const authService = new servicesWithIO.AuthServiceClass()
    setServices({ authService })
    console.log('auth service: ', authService)

    return () => {
      authService.complete()
    }
  }, [servicesWithIO])
  return services
}

export interface ServicesWithIO {
  AuthServiceClass: new () => AuthServiceInterface;
  SocketServiceClass: new () => SocketServiceInterface;
}

interface AppProps {
  servicesWithIO: ServicesWithIO;
}

export function App ({ servicesWithIO }: AppProps) {
  // this dependency injection is here to allow for
  // easy independent development of the frontend
  const { authService } = useAppWideServices(servicesWithIO)

  // initialize global services
  const authGuardRedirectRoute = "login"

  if (!authService) {
    return <div className="App">Loading</div>
  }

  const { SocketServiceClass } = servicesWithIO
  const renderLogin = () => <Login authService={authService} />
  const renderLobby = () => <Lobby
    authService={authService}
    SocketServiceClass={SocketServiceClass}
  />

  return (
    <div className="App">
      <Router>
        <Route path="/login" exact render={renderLogin} />
        <PrivateRoute
          exact
          path="/lobby"
          {...{ authService, redirectRoute: authGuardRedirectRoute }}
          GuardedComponent={renderLobby}
        />

        <PrivateRoute
          exact
          path="/game"
          {...{ authService, SocketServiceClass, redirectRoute: authGuardRedirectRoute }}
          GuardedComponent={Game}
        />
      </Router>
    </div>
  )
}

const defaultIOServices: ServicesWithIO = {
  SocketServiceClass: SocketService,
  AuthServiceClass: AuthService
}

function DefaultApp () {
  return <App servicesWithIO={defaultIOServices}/>
}

export default DefaultApp
