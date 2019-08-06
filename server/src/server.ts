import * as express from 'express';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as HttpServer from 'http';

import Sockets from './sockets';

const app = express();

const http = HttpServer.createServer(app);

const { PORT } = dotenv.config({path: path.resolve('../.env')}).parsed;

Sockets(http);


http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
