import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useObservable } from 'rxjs-hooks';
import { Nav, Button, Navbar } from 'react-bootstrap';
import { AuthService } from '../_services/auth.service';
import { useStatefulObservable } from '../__helpers/useStatefulObservable';
import { UserDetails } from '../../common/types';
import { Subscription } from 'rxjs';

interface MyNavBarProps {
  authService: AuthService | null;
}

const MyNavBar: React.FC<MyNavBarProps> = ({ authService }) => {
  const [currentUser, setCurrentUser] = useState(null as UserDetails | null);
  useEffect(() => {
    const subscriptions = new Subscription();
    authService && subscriptions.add(authService.currentUser$.subscribe(details => {
      console.log('details: ', details);
      setCurrentUser(details);
    }));
    console.log('hmm', currentUser);
    return () => subscriptions.unsubscribe();
  }, [authService]);
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
