import React, { useState } from 'react';
import { AuthService, useCurrentUser } from '../_services/auth.service';
import { UserLogin } from '../../common/types';
import { Form, Row, Col } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { Redirect } from 'react-router';

interface LoginFormState extends UserLogin {
  status: 'clean' | 'rejected' | 'authenticated';
}

const useLoginForm = (authService: AuthService|null) => {
  const [inputs, setInputs] = useState({ username: '', password: '', status: 'clean' } as LoginFormState);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!authService) {
      return;
    }
    const { status, ...userLogin} = inputs;
    authService.login(userLogin)
      .catch(() => setInputs({...inputs, status: 'rejected'}));
  }
  const handleInputChange = (event: any) => {
    event.persist();
    const { name, value } = event.target;
    setInputs(inputs => ({ ...inputs, [name]: value }));
  }
  return {
    handleSubmit,
    handleInputChange,
    inputs,
  };
}

interface LoginFormProps {
  authService: AuthService|null;
}
const LoginForm: React.FC<LoginFormProps> = ({ authService }) => {
  const { handleSubmit, handleInputChange, inputs } = useLoginForm(authService);
  const currentUser = useCurrentUser(authService);

  const { username, password, status } = inputs;

  if (currentUser) {
    return  <Redirect to="lobby" />;
  }

  return (
    <div id="login">
      <h1>Log In</h1>
      <Form
        onSubmit={handleSubmit}
      >
        <Form.Group>
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="username"
            placeholder="Enter Username"
            onChange={handleInputChange}
            name="username"
            value={username}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter Password"
            name="password"
            value={password}
            onChange={handleInputChange}
          />
        </Form.Group>
        <Button type="submit">Submit</Button>
        {(status === 'rejected') && 'rejected!'}
      </Form>
    </div>
  )
};

const LoginWrapper: React.FC = ({ children }) => (
  <React.Fragment>
    <Row/>
      <Row>
        <Col>
          {children}
        </Col>
      </Row>
    <Row/>
  </React.Fragment>
);

export const Login: React.FC<LoginFormProps> = (props) => (
  <LoginWrapper>
    <LoginForm {...props} />
  </LoginWrapper>
);
