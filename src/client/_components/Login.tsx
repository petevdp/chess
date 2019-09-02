import React, { useState } from 'react';
import * as auth from '../_services/authentication.service';
import { Form, Icon, Input, Button } from 'antd';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    auth.login({username, password});
  }

  return (
    <div id="login">
      <h1 className="login__title">Log In</h1>
      <Form
        onSubmit={handleSubmit}
      >
        <Form.Item>
          <Input
            prefix={<Icon type="user"/>}
            placeholder="Username"
            value={username}
            onChange={(text) => setUsername(text.target.value)}
          ></Input>
        </Form.Item>
        <Form.Item>
          <Input
            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={event => setPassword(event.target.value)}
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
}
