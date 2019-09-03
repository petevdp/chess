import React from "react";
import "../styles/App.css";
import { Login } from "./Login";
import { Nav } from "./Nav";
import { Layout, Row, Col } from "antd";
import { AuthService } from "../_services/auth.service";

import {
  BrowserRouter as Router,
  Route,
  Link,
  RouteComponentProps,
  Redirect,
} from 'react-router-dom';
import { Lobby } from "./Lobby";
const { Header, Footer, Content } = Layout;

const App: React.FC = () => {
  const authService = new AuthService();

  return (
    <div className="App">
      <Router>
        <Layout>
          <Header>
            <Nav {...{ authService }}></Nav>
          </Header>
          <Content>
            <Route
              path="/login"
              exact
              component={() => <Login authService={authService} />}
            />
            <Route
              path="/lobby"
              exact
              component={() => <Lobby {...{ authService }} />}
            />

            <Redirect to="login" path="/" />
          </Content>
          <Footer></Footer>
        </Layout>
      </Router>
    </div>
  );
};

export default App;
