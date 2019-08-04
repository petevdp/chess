const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const ROOT = path.resolve()

const app = express();

const http = require('http').createServer(app);

const { PORT } = dotenv.config({path: path.resolve('../.env')}).parsed.

require('./sockets')(http);


http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})
