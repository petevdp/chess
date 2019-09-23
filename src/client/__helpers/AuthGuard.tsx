import React from 'react'
import { Route, Redirect, RouteProps, RouteComponentProps } from 'react-router-dom'
import { AuthService } from '../_services/auth.service'

interface PrivateRouteProps extends RouteProps {
  GuardedComponent: React.ReactType;
  redirectRoute: string;
  authService: AuthService;
}

export function PrivateRoute ({
  GuardedComponent, authService, redirectRoute, ...rest
}: PrivateRouteProps) {
  const currentUser = authService.useCurrentUser()
  const guarded = (props: RouteComponentProps) => currentUser
    ? <GuardedComponent {...props} />
    : <Redirect to={redirectRoute} />
  return (
    <Route
      {...rest}
      render={guarded}
    />
  )
}
