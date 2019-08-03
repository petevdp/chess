const express = require('express');
const app = express();
const http = require('http').createServer(app);
console.log((require('dotenv').config()));
const { PORT } = require('dotenv').config().parsed;

require('./sockets')(http);


http.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})
