import * as express from 'express';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as HttpServer from 'http';

// middleware
import * as cors from 'cors';
import * as bodyParser from 'body-parser';

import { api } from './api';
import Sockets from './sockets';
import { RoutesRecognized } from '@angular/router';

const app = express();
const http = HttpServer.createServer(app);
const { PORT } = dotenv.config({path: path.resolve('../.env')}).parsed;

const corsOptions = {
  origin: 'localhost:3000'
}


app.use(cors());
app.use(bodyParser.json());

Sockets(http);
app.use('/api', api(express));


http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
