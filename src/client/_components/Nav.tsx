import React from 'react';
import { Link } from 'react-router-dom';
import { useObservable } from 'rxjs-hooks';
import { Nav, Button, Navbar } from 'react-bootstrap';
import { AuthService } from '../_services/auth.service';

interface MyNavBarProps {
  authService: AuthService;
}

const MyNavBar: React.FC<MyNavBarProps> = ({ authService }) => {
  const session = useObservable(() => authService.currentSession$)
  console.log('session', session);
  return (
    <Navbar
      bg="light" expand="lg"
    >
      <Nav.Item key="lobby" as={Link} to="login">
        Lobby
      </Nav.Item>
      { session
        ? <Nav.Item key="logout">
            Logged in as {session.username}
            <Button onClick={() => authService.logout()}>Log out</Button>
          </Nav.Item>
        : <Nav.Item key="login" as={Link} to="login">
            Log In
          </Nav.Item>
      }
    </Navbar>
  );
}

export default MyNavBar;
