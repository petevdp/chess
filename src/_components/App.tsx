import React from 'react';
import '../styles/App.css';
import { Login } from './Login';
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
              <Login></Login>
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
