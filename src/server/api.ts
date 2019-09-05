import * as fs from 'fs';
import express from 'express';
import { QueriesInterface, DBQueries } from './db/queries';
// import  cors from 'cors';
import uuidv4 from 'uuid/v4';
import bodyParser from 'body-parser';
import Moment from 'moment';
import { check, validationResult } from 'express-validator';

import { JWT_SECRET_PATH } from './constants';
import { UserLogin, UserDetails } from '../common/types';


const RSA_PRIVATE_KEY = fs.readFileSync(JWT_SECRET_PATH);

export const api = (dbQueries: DBQueries) => {

  const api = express();

  api.use(bodyParser.json());
  // TODO access control header still present for some reason

  // api.use(cors({
  //   origin: 'http://localhost:4200',
  //   credentials: true,
  // }));



  const loginSchema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: {
        type: 'string',
      },
      password: {
        type: 'string',
      }
    }
  };

  const userLoginSchema = [
    check('username').isLength({ min: 2 }),
    check('password').isLength({ min: 2 }),
  ]

  api.put('/signup', userLoginSchema, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.sendStatus(422).json({errors: errors.array()});
    }
    const { username, password } = req.body;
    const id = uuidv4();
    await dbQueries.addUser({username, id})
    req.session.userId = id;
    res.json({username, id});
  });

  api.put('/login', userLoginSchema, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.sendStatus(422).json({errors: errors.array()});
    }
    const { username, password } = req.body;
    console.log('username: ', username);
    const userMatches = (await dbQueries.getUserByUsername(username)).rows
    if (userMatches.length === 1) {
      const user = userMatches[0] as UserDetails;
      req.session.userId = user.id;
      res.json(user);
    } else {
      console.log('authorization error')
      res.sendStatus(401);
    }
  });

  api.put('/logout', (req, res) => {
    req.session.destroy(() => res.sendStatus(200));
  });

  return api
}
