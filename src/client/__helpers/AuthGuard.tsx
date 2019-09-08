import React from 'react';
import { Route, Redirect, RouteProps, RouteComponentProps } from 'react-router-dom';
import { UserDetails } from '../../common/types';
import { AuthService } from '../_services/auth.service';

interface PrivateRouteProps extends RouteProps {
  GuardedComponent: React.ReactType;
  redirectRoute: string;
  authService: AuthService
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  GuardedComponent, authService, redirectRoute, ...rest
}) => {
  const currentUser = authService.useCurrentUser();
  const guarded = (props: RouteComponentProps) => currentUser
          ? <GuardedComponent {...props} />
          : <Redirect to={redirectRoute} />;
  return (
    <Route
      {...rest}
      render={guarded}
    />
  );
};
