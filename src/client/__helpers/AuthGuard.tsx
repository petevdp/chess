import { AuthService, useCurrentUser } from '../_services/auth.service';
import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { userInfo } from 'os';
import { useObservable } from 'rxjs-hooks';
import { switchMap, filter } from 'rxjs/operators';
import { Observable, empty } from 'rxjs';
import { useStatefulObservable } from './useStatefulObservable';
import { UserDetails } from '../../common/types';

interface PrivateRouteProps extends RouteProps {
  GuardedComponent: React.ReactType;
  redirectRoute: string;
  currentUser: UserDetails | null;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  GuardedComponent, currentUser, redirectRoute, ...rest
}) => (
  <Route
    {...rest}
    render={props => {
      return currentUser
        ? <GuardedComponent {...props} />
        : <Redirect to={redirectRoute} />
    }}
  />
);
