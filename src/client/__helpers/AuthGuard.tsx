import { AuthService } from '../_services/auth.service';
import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { userInfo } from 'os';
import { useObservable } from 'rxjs-hooks';
import { switchMap, filter } from 'rxjs/operators';
import { Observable, empty } from 'rxjs';
import { useStatefulObservable } from './useStatefulObservable';

interface PrivateRouteProps extends RouteProps {
  guardedComponent: React.ReactType;
}

// outputs a route component which will redirect to redirectRoute if the user isn't authenticated
export const useAuthGuard = (
  authService: AuthService,
  redirectRoute: string
): React.FC<PrivateRouteProps> => {
  const currentUser = useStatefulObservable(authService && authService.currentUser$, null);

  return ({guardedComponent: Component, ...rest}) => (
    <Route
      {...rest}
      render={props => {
        return currentUser
          ? <Component {...props} />
          : <Redirect to={redirectRoute} />
      }}
    />
  )
};
