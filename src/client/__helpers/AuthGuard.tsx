import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
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
