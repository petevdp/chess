import * as fs from 'fs';
import express from 'express';
import * as jwt from 'jsonwebtoken';
import { IQueries, DBQueries } from './db/queries';
// import  cors from 'cors';
import uuidv4 from 'uuid/v4';
import bodyParser from 'body-parser';
import Moment from 'moment';

import { Validator, ValidationError } from 'express-json-validator-middleware';

import { JWT_SECRET_PATH } from './constants';
import { UserLogin, UserDetails } from '../common/types';


const RSA_PRIVATE_KEY = fs.readFileSync(JWT_SECRET_PATH);

export default (dbQueries: DBQueries) => {

  const api = express();

  api.use(bodyParser.json());
  // TODO access control header still present for some reason

  // api.use(cors({
  //   origin: 'http://localhost:4200',
  //   credentials: true,
  // }));

  const validator = new Validator({ allErrors: true });

  const validate = validator.validate;

  const loginSchema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: {
        type: 'string'
      },
      password: {
        type: 'string'
      }
    }
  };

  api.put('/signup', validate({ body: loginSchema }), async (req, res) => {
    console.log('signup')
    const { username, password } = req.body;
    const id = uuidv4();
    await dbQueries.addUser({username, id})
    req.session.userId = id;
    res.json({username, id});
  });

  api.put('/login', validate({ body: loginSchema }), async (req, res) => {
    const { username, password } = req.body;
    console.log('username: ', username);
    const userMatches = (await dbQueries.getUserByUsername(username)).rows
    if (userMatches.length === 1) {
      const user = userMatches[0] as UserDetails;
      req.session.userId = user.id;
      res.json(user);
    } else {
      console.log('authorization error')
      res.json(401);
    }
  });

  api.put('/logout', (req, res) => {
    req.session.destroy(() => res.sendStatus(200));
  });

  // handling validation errors
  api.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
      res.status(400).sendStatus('invalid');
      next();
      return;
    }
    next(err);
  });

  return api
}
