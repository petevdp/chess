import * as fs from 'fs';
import express from 'express';
import { DBQueries } from './db/queries';
import to from 'await-to-js';
// import  cors from 'cors';
import uuidv4 from 'uuid/v4';
import bodyParser from 'body-parser';
import Moment from 'moment';
import { check, validationResult } from 'express-validator';

import { JWT_SECRET_PATH } from './constants';
import { UserLogin, UserDetails } from '../common/types';
import { DataIntegrityError } from 'slonik';


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

  api.put('/login', userLoginSchema, async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.sendStatus(422).json({errors: validationErrors.array()});
    }
    const { username } = req.body;
    console.log('username: ', username);
    const user = await dbQueries.getOrAddUser(req.body.username)
    res.json(user);
  });

  api.get('/authenticate', async (req, res) => {
    const [err, user] = await to(dbQueries.getUserById(req.session.userId));
    if (!user) {
      res.send(err).sendStatus(401);
    }
    res.json(user).sendStatus(200);
  })

  api.put('/logout', (req, res) => {
    req.session.destroy(() => res.sendStatus(200));
  });

  return api
}
