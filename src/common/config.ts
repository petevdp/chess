export const SERVER_PORT = 3000
export const DEV_SERVER_PORT = 3001
export const HOST = 'localhost'

const BASE_SERVER_URL = `http://${HOST}:${SERVER_PORT}`

const API_PATH = 'api'

export const LOGIN_PATH = `${API_PATH}/login`
export const LOGOUT_PATH = `${API_PATH}/logout`
export const AUTH_PATH = `${API_PATH}/authenticate`

export const LOGIN_URL = `${BASE_SERVER_URL}/${LOGIN_PATH}`
export const SOCKET_URL = BASE_SERVER_URL
export const SOCKET_URL_CLIENT = `ws://${HOST}:${SERVER_PORT}`
