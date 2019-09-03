import React, { useState } from 'react';
import { AuthService } from '../_services/auth.service';
import { Form, Icon, Input, Button, Row, Col } from 'antd';
import { UserLogin } from '../../common/types';


const useSignUpForm = (authService: AuthService) => {
  const [inputs, setInputs] = useState({} as UserLogin);
  const handleSubmit = (event: React.FormEvent) => {
    if (event) {
      event.preventDefault();
      authService.login(inputs);
    }
  }
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

export interface AuthProp {
  authService: AuthService;
}

const LoginForm: React.FC<AuthProp> = ({ authService }) => {
  const { handleSubmit, handleInputChange, inputs } = useSignUpForm(authService);
  const { username, password } = inputs;

  return (
    <div id="login">
      <h1 className="login__title">Log In</h1>
      <Form
        onSubmit={handleSubmit}
      >
        <Form.Item>
          <Input
            prefix={<Icon type="user" />}
            placeholder="Username"
            name='username'
            value={username}
            onChange={handleInputChange}
          ></Input>
        </Form.Item>
        <Form.Item>
          <Input
            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
            type="password"
            placeholder="Password"
            name='password'
            value={password}
            onChange={handleInputChange}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Log in
            </Button>
        </Form.Item>
      </Form>
    </div>
  )
};

const LoginWrapper: React.FC = ({ children }) => (
  <React.Fragment>
    <Row></Row>
      <Row type="flex" justify="center" align="middle">
        <Col>
          {children}
        </Col>
      </Row>
    <Row></Row>
  </React.Fragment>
);

export const Login: React.FC<AuthProp> = (props) =>
  <LoginWrapper>
    <LoginForm { ...props } />
  </LoginWrapper>
