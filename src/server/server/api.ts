import express, { Response, Request } from 'express'
import { DBQueries } from '../db/queries'
import to from 'await-to-js'
import bodyParser from 'body-parser'
import { check, validationResult } from 'express-validator'
import { UserDetails } from '../../common/types'
import session from 'express-session'
import { Session } from 'inspector'

export const api = (dbQueries: DBQueries) => {
  const api = express()

  api.use(bodyParser.json())

  const userLoginSchema = [
    check('username').isLength({ min: 2 }),
    check('userType').isIn(['bot', 'human'])
  ]

  api.put('/login', userLoginSchema, async (req: Request, res: Response) => {
    const validationErrors = validationResult(req)
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({ errors: validationErrors.array() })
    }
    const { username, userType } = req.body
    const user = await dbQueries.getOrAddUser(username, userType) as UserDetails
    if (!req.session) {
      throw new Error('session not configured')
    }
    req.session.userId = user.id
    res.json(user)
  })

  api.get('/authenticate', async (req, res) => {
    if (!req.session) {
      res.sendStatus(401)
      return
    }
    const [, user] = await to(dbQueries.getUser({ id: req.session.userId }))
    if (!user) {
      res.sendStatus(401)
      return
    }
    res.json(user)
  })

  api.put('/logout', (req, res) => {
    req.session && req.session.destroy(() => res.sendStatus(200))
  })

  return api
}
