import React from 'react';
import '../styles/App.css';
import { LoginForm } from './Login';
import { Layout, Row, Col } from 'antd';

const { Header, Footer, Content } = Layout;

const App: React.FC = () => {
  return (
    <div className="App">
      <Layout>
        <Header>
        </Header>
        <Content>
          <Row></Row>
          <Row type="flex" justify="center" align="middle">
            {/* <Col span={8}>
            </Col> */}
            <Col>
              <LoginForm></LoginForm>
            </Col>
            {/* <Col span={8}>
            </Col> */}
          </Row>
          <Row></Row>
        </Content>
        <Footer>

        </Footer>
      </Layout>
    </div>
  );
}

export default App;
