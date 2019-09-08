import React, { useState } from 'react';
import { AuthService } from '../_services/auth.service';
import { UserLogin } from '../../common/types';
import { Form, Row, Col } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { Redirect } from 'react-router';
import { Center } from './Center';

interface LoginFormState extends UserLogin {
  status: 'clean' | 'evaluating' | 'rejected' | 'authenticated';
}

const useLoginForm = (authService: AuthService) => {
  const [inputs, setInputs] = useState({ username: '', password: '', status: 'clean' } as LoginFormState);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.persist();
    authService.login(inputs);
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
  authService: AuthService;
}
const LoginForm: React.FC<LoginFormProps> = ({ authService }) => {
  const { handleSubmit, handleInputChange, inputs } = useLoginForm(authService);
  const currentUser = authService.useCurrentUser();

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
            placeholder="Enter Username"
            onChange={handleInputChange}
            name="username"
            value={username}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            placeholder="Enter Password"
            name="password"
            value={password}
            onChange={handleInputChange}
          />
        </Form.Group>
        <Button name="login" type="submit">Submit</Button>
        {(status === 'rejected') && 'rejected!'}
      </Form>
    </div>
  )
};

export const Login: React.FC<LoginFormProps> = (props) => (
  <Center>
    <LoginForm {...props} />
  </Center>
);
