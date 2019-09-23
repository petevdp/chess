import React, { ReactChildren } from "react"

import { Row, Col } from "react-bootstrap"

interface CenterProps {
  children: ReactChildren;
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
