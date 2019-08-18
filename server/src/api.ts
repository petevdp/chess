import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';

import { JWT_SECRET_PATH } from './constants';
import { UserDetails } from 'APIInterfaces/api';
import { fstat } from 'fs';

export const api = express();

const RSA_PRIVATE_KEY =  fs.readFileSync(JWT_SECRET_PATH);

api.use(bodyParser.json());
api.use(cors());

api.post('/login', (req, res) => {
  console.log('login route!');
  console.log(req.body);
  const { username, password } = req.body as UserDetails;

  // TODO add validations
  if (true) {
    const userId = username + password;
    const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn: 120,
      subject: userId
    });
    console.log(jwtBearerToken);

    res.json(jwtBearerToken);
  }
  res.status(200).send();
});
