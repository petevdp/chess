import { AuthService } from '../_services/auth.service';
import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { userInfo } from 'os';

interface PrivateRouteProps extends RouteProps {
  guardedComponent: React.ReactType;
}

// outputs a route component which will redirect to redirectRoute if the user isn't authenticated
export const authGuard = (
  authService: AuthService,
  redirectRoute: string
): React.FC<PrivateRouteProps> => (
  ({guardedComponent: Component, ...rest}) => (
    <Route
      {...rest}
      render={props => {
        return authService.isLoggedIn
          ? <Component {...props} />
          : <Redirect to={redirectRoute} />
      }}
    />
  )
);
