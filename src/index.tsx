import React from 'react'
import ReactDOM from 'react-dom'

import './client/styles/index.css'

import App from './client/_components/App'

import * as serviceWorker from './client/serviceWorker'

ReactDOM.render(<App />, document.getElementById('root'))

serviceWorker.unregister()
