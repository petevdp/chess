import React, { ReactNode } from 'react'
import { Link, Route } from 'react-router-dom'
import { Nav, Button, Navbar } from 'react-bootstrap'
import { AuthServiceInterface } from '../_services/auth.service'
import { UserDetails } from '../../common/types'

interface InjectNavBarProps {
  children: {
    base: ReactNode[];
    lobby: ReactNode[];
    login: ReactNode[];
  };
}

export function InjectNavBar ({ children }: InjectNavBarProps) {
  const { base, lobby, login } = children
  return (
    <Navbar
      bg="light"
      expand="lg"
    >
      { base }
      <Route path="/lobby" exact>
        {lobby}
      </Route>
      <Route path="/login" exact>
        {login}
      </Route>
    </Navbar>
  )
}

interface MyNavBarProps {
  authService: AuthServiceInterface;
}

function MyNavBar ({ authService }: MyNavBarProps) {
  const currentUser = authService.useCurrentUser()
  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
    >
      <Nav>
        <Nav.Link key="lobby" as={Link} to="/lobby">
        Lobby
        </Nav.Link>
      </Nav>
      <span className="user-status-display">
        {currentUser ? <LoggedInDisplay {...{ authService, currentUser }} /> : <LoggedOutDisplay /> }
      </span>
    </Navbar>
  )
}

const LoggedOutDisplay: React.FC = () => (
  <Nav.Item key="login" as={Link} to="/login">
        Log In
  </Nav.Item>
)

interface LoggedInDisplayProps {
  authService: AuthServiceInterface;
  currentUser: UserDetails;
}

function LoggedInDisplay ({ authService, currentUser }: LoggedInDisplayProps) {
  return (
    <Nav.Item key="logout">
      <span className="login-message">
        Logged in as {currentUser.username}
      </span>
      <Button
        onClick={authService.logout}
        variant="outline-light"
      >Log out</Button>
    </Nav.Item>
  )
}

export default MyNavBar
