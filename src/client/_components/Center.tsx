import React, { ReactChild } from "react"

import { Row, Col } from "react-bootstrap"

interface CenterProps {
  children: ReactChild;
}

export function Center ({ children }: CenterProps) {
  return (
    <React.Fragment>
      <Row/>
      <Row>
        <Col>
          {children}
        </Col>
      </Row>
      <Row/>
    </React.Fragment>
  )
}
