import React from "react";

import { Row, Col } from "react-bootstrap";

export const Center: React.FC = ({ children }) => (
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
