import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useObservable } from 'rxjs-hooks';
import { Nav, Button, Navbar } from 'react-bootstrap';
import { AuthService, useCurrentUser } from '../_services/auth.service';
import { useStatefulObservable } from '../__helpers/useStatefulObservable';
import { UserDetails } from '../../common/types';
import { Subscription } from 'rxjs';

interface MyNavBarProps {
  authService: AuthService;
}

const MyNavBar: React.FC<MyNavBarProps> = ({ authService }) => {
  const [currentUser, setCurrentUser] = useState(null as UserDetails | null);
  useEffect(() => {
    const subscriptions = new Subscription();
    subscriptions.add(authService.currentUser$.subscribe(details => {
      console.log('details: ', details);
      setCurrentUser(details);
    }));
    return () => subscriptions.unsubscribe();
  }, [authService]);
  return (
    <Navbar
      bg="light" expand="lg"
    >
      <Nav.Item key="lobby" as={Link} to="lobby">
        Lobby
      </Nav.Item>
      {currentUser ? <LoggedInDisplay {...{authService, currentUser}}  /> : <LoggedOutDisplay /> }
    </Navbar>
  );
}

const LoggedOutDisplay: React.FC = () => (
  <Nav.Item key="login" as={Link} to="login">
        Log In
  </Nav.Item>
)


interface LoggedInDisplayProps {
  authService: AuthService;
  currentUser: UserDetails;
}

const LoggedInDisplay: React.FC<LoggedInDisplayProps> = ({ authService, currentUser }) => {
  return (
    <Nav.Item key="logout">
      Logged in as {currentUser.username}
      <Button onClick={authService.logout}>Log out</Button>
    </Nav.Item>
  )
}

export default MyNavBar;
