import { DBQueriesInterface } from '../queries'
import { allUserDetails, allGameInfo } from '../../../common/dummyData/dummyData'
import { CompletedGameInfo } from '../../../common/types'

export const getUser = jest.fn(async () => allUserDetails[0])
export const putUser = jest.fn(async () => allUserDetails[0])
export const addCompletedGame = jest.fn(async () => false)
export const getGame = jest.fn(async () => allGameInfo[1] as CompletedGameInfo)

export default jest.fn().mockImplementation((): DBQueriesInterface => {
  return {
    getUser,
    putUser,
    addCompletedGame,
    getGame: jest.fn()
  }
})
