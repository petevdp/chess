import React, { useState } from 'react';
import { AuthService } from '../_services/auth.service';
import { UserLogin } from '../../common/types';
import { Form, Row, Col } from 'react-bootstrap';
import { Button } from 'react-bootstrap';


const useSignUpForm = (authService: AuthService) => {
  const [inputs, setInputs] = useState({username: '', password: ''} as UserLogin);
  const handleSubmit = (event: React.FormEvent) => {
    if (event) {
      event.preventDefault();
      authService.login(inputs);
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
  authService: AuthService;
}
const LoginForm: React.FC<LoginFormProps> = ({ authService }) => {
  const { handleSubmit, handleInputChange, inputs } = useSignUpForm(authService);
  const { username, password } = inputs;

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
