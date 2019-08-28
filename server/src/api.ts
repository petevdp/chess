import * as fs from 'fs';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
// import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as Moment from 'moment';

import { Validator, ValidationError } from 'express-json-validator-middleware';

import { JWT_SECRET_PATH } from './constants';
import { UserLogin, SessionDetails, User } from '../../APIInterfaces/types';

export const api = express();

const RSA_PRIVATE_KEY = fs.readFileSync(JWT_SECRET_PATH);

api.use(bodyParser.json());
// TODO access control header still present for some reason

// api.use(cors({
//   origin: 'http://localhost:4200',
//   credentials: true,
// }));

const validator = new Validator({allErrors: true});

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

api.put('/login', validate({body: loginSchema}), (req, res) => {
  const { username, password } = req.body as UserLogin;

  // TODO add validations
  if (!true) {
    return res.sendStatus(401);
  }

  const userId = username + password as string;

  const expiresIn = '3h';

  // currently not secure, sent over http
  const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: `3h`,
    subject: userId,
  });

  const userDetails = {
    username,
    id: userId,
    expiresIn,
  } as User;

  res
    .status(200)
    .json({
      userDetails,
      idToken: jwtBearerToken,
    });
});

// handling validation errors
api.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(400).send('invalid');
    next();
    return;
  }
  next(err);
});
