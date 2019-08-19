import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';

import { JWT_SECRET_PATH } from './constants';
import { UserDetails } from 'APIInterfaces/api';
import { fstat } from 'fs';

export const api = express();

const RSA_PRIVATE_KEY = fs.readFileSync(JWT_SECRET_PATH);

api.use(bodyParser.json());
api.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  exposedHeaders: 'Set-Cookie'
  // allowedHeaders: 'Set-Cookie,Cache,Content-Type
}));

api.put('/login', (req, res) => {
  console.log('login route!');
  console.log(req.body);
  const { username, password } = req.body as UserDetails;

  // TODO add validations
  if (true) {
    // actual ids will come with db
    // res.set({
    //   'Access-Control-Allow-Credentials': 'true',
    //   'Access-Control-Allow-Origin': 'http://localhost:4200',
    // });

    const userId = username + password;
    const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn: 120,
      subject: userId
    });

    res.cookie('session_id', jwtBearerToken, { httpOnly: true, secure: true });
  } else {
    return res.sendStatus(401);
  }
  res.send();
});
