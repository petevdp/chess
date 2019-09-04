import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useObservable } from 'rxjs-hooks';
import { Nav, Button, Navbar } from 'react-bootstrap';
import { AuthService } from '../_services/auth.service';

interface MyNavBarProps {
  authService: AuthService;
}

const MyNavBar: React.FC<MyNavBarProps> = ({ authService }) => {
  const [ session, setSession] = useState();

  useEffect(() => {
    if (!authService) {
      return;
    }
    authService.currentSession$.subscribe(setSession);
  }, [authService]);

  return (
    <Navbar
      bg="light" expand="lg"
    >
      <Nav.Item key="lobby" as={Link} to="lobby">
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
