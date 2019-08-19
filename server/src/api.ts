import * as fs from 'fs';

import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';

import { Validator, ValidationError } from 'express-json-validator-middleware';

import { JWT_SECRET_PATH } from './constants';
import { UserDetails } from 'APIInterfaces/api';


export const api = express();

const RSA_PRIVATE_KEY = fs.readFileSync(JWT_SECRET_PATH);

api.use(bodyParser.json());
api.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
}));

const validator = new Validator({allErrors: true})

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
}

api.put('/login', validate({body: loginSchema}), (req, res) => {
  console.log('login route!');
  console.log(req.body);
  const { username, password } = req.body as UserDetails;

  // TODO add validations
  if (!true) {
    return res.sendStatus(401);
  }
  // res.set({
  //   'Access-Control-Allow-Credentials': 'true',
  //   'Access-Control-Allow-Origin': 'http://localhost:4200',
  // });

  // actual ids will come with db
  const userId = username + password as string;
  const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: 120,
    subject: userId
  });

  res.cookie('session_id', jwtBearerToken, { httpOnly: true, secure: true });
  res.sendStatus(200);
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
