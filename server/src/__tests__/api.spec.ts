import * as request from 'supertest';
import * as express from 'express';

import { api } from '../api';
import { UserLogin } from '../../../APIInterfaces/types';

function initApp () {
  const app = express();
  app.use(api);
  return app;
}


// login helper functions

const login = (app: express.Application, userLogin): request.Test => {
  return request(app)
    .put('/login')
    .send(userLogin)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Origin', 'http://localhost:3000');
};

describe('PUT /login', () => {
  const app = initApp();
  test('It should return a SessionDetails object with valid input', async (done) => {
    const userLogin = {
      username: 'username',
      password: 'password',
    };
    const res = await login(app, userLogin);
    const { username, userId, expireTime } = res.body
    expect(username).toBe('username');
    expect(userId).toBe('usernamepassword');
    expect(typeof expireTime).toEqual('number');
    done();
  });
});
