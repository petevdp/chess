import React from 'react'

import { App } from "../App"
import { FakeAuthService } from "../../_services/__fakes__/auth.service"
import FakeSocketService from "../../_services/__fakes__/socket.service"

const servicesWithIO = {
  AuthServiceClass: FakeAuthService,
  SocketServiceClass: FakeSocketService
}

function FakeApp () {
  return <App servicesWithIO={servicesWithIO}/>
}

export default FakeApp
