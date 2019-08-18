import * as express from 'express';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as HttpServer from 'http';

// middleware

import { api } from './api';
import Sockets from './sockets';
import { RoutesRecognized } from '@angular/router';

// loads .env file into process.env
dotenv.config({path: path.resolve('../.env')});

const app = express();
const http = HttpServer.createServer(app);
const { PORT } = process.env;

Sockets(http);
app.use('/api', api);


http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
