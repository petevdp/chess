import { BotDetails } from "./types"
import _ from 'lodash'
import { genFakeBot } from './dummyData/genMockData'

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

export const DISPLAYED_GAMES_PER_PAGE = 8

export const STARTING_BOTS: BotDetails[] = _.times(10).map(() => (
  genFakeBot(0)
))
