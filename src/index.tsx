// this file would fit better in /client but it's necessary to put it here for create-react-app
import React from 'react'
import ReactDOM from 'react-dom'

import './client/styles/index.css'

import * as serviceWorker from './client/serviceWorker'

import FakeApp from './client/_components/__fakes__/App'
ReactDOM.render(<FakeApp />, document.getElementById('root'))

// import App from './client/_components/App'
// ReactDOM.render(<App />, document.getElementById('root'))

serviceWorker.unregister()
