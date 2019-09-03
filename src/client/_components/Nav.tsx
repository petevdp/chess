import React from 'react';
import { AuthProp } from "./Login";
import { Menu, Button } from 'antd';
import { Link } from 'react-router-dom';

export const Nav: React.FC<AuthProp> = ({ authService }) => {
  return (
    <Menu
      theme="dark"
      mode="horizontal"
    >
      <Menu.Item key="login">
        <Link to="/login">
          Log In
        </Link>
      </Menu.Item>
      <Menu.Item key="lobby">
        <Link to="/lobby">
          Lobby
        </Link>
      </Menu.Item>
    </Menu>
  );
}
