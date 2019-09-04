import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useObservable } from 'rxjs-hooks';
import { Nav, Button, Navbar } from 'react-bootstrap';
import { AuthService } from '../_services/auth.service';
import { useStatefulObservable } from '../__helpers/useStatefulObservable';

interface MyNavBarProps {
  authService: AuthService | null;
}

const MyNavBar: React.FC<MyNavBarProps> = ({ authService }) => {
  const currentUser = useStatefulObservable(authService && authService.currentUser$, null)
  console.log('currentuser', currentUser);
  return (
    <Navbar
      bg="light" expand="lg"
    >
      <Nav.Item key="lobby" as={Link} to="lobby">
        Lobby
      </Nav.Item>
      { currentUser
        ? <Nav.Item key="logout">
            Logged in as {currentUser.username}
            <Button onClick={() => authService && authService.logout()}>Log out</Button>
          </Nav.Item>
        : <Nav.Item key="login" as={Link} to="login">
            Log In
          </Nav.Item>
      }
    </Navbar>
  );
}

export default MyNavBar;
