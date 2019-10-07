import React, { } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Button, Navbar } from 'react-bootstrap'
import { AuthServiceInterface } from '../_services/auth.service'
import { UserDetails } from '../../common/types'

interface MyNavBarProps {
  authService: AuthServiceInterface;
}

function MyNavBar ({ authService }: MyNavBarProps) {
  const currentUser = authService.useCurrentUser()
  return (
    <Navbar
      bg="light"
      expand="lg"
    >
      <Nav.Item key="lobby" as={Link} to="lobby">
        Lobby
      </Nav.Item>
      <span className="user-status-display">
        {currentUser ? <LoggedInDisplay {...{ authService, currentUser }} /> : <LoggedOutDisplay /> }
      </span>
    </Navbar>
  )
}

const LoggedOutDisplay: React.FC = () => (
  <Nav.Item key="login" as={Link} to="login">
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
      Logged in as {currentUser.username}
      <Button onClick={authService.logout}>Log out</Button>
    </Nav.Item>
  )
}

export default MyNavBar
