import React, { useState } from 'react';
import { AuthService } from '../_services/auth.service';
import { UserLogin } from '../../common/types';
import { Form, Row, Col } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { useEventCallback } from 'rxjs-hooks';
import { reject } from 'q';
import { Redirect } from 'react-router';

interface LoginFormState extends UserLogin {
  status: 'clean' | 'rejected' | 'authenticated';
}

const useLoginForm = (authService: AuthService|null) => {
  const [inputs, setInputs] = useState({username: '', password: '', status: 'clean'} as LoginFormState);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authService) {
      return;
    }
    const { status, ...userLogin} = inputs;
    const out = await authService.login(userLogin);
    if (!out) {
      return setInputs({...inputs, status: 'rejected'});
    }
  }
  const handleInputChange = (event: any) => {
    event.persist();
    const { name, value } = event.target;
    setInputs(inputs => ({ ...inputs, [name]: value }));
  }
  return {
    handleSubmit,
    handleInputChange,
    inputs
  };
}

interface LoginFormProps {
  authService: AuthService|null;
}
const LoginForm: React.FC<LoginFormProps> = ({ authService }) => {
  const { handleSubmit, handleInputChange, inputs } = useLoginForm(authService);
  const { username, password, status } = inputs;
  if (status === 'authenticated') {
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
        { (status === 'rejected') && 'rejected!'}
      </Form>
    </div>
  )
};

const LoginWrapper: React.FC = ({ children }) => (
  <React.Fragment>
    <Row></Row>
      <Row>
        <Col>
          {children}
        </Col>
      </Row>
    <Row></Row>
  </React.Fragment>
);

export const Login: React.FC<LoginFormProps> = (props) =>
  <LoginWrapper>
    <LoginForm { ...props } />
  </LoginWrapper>
