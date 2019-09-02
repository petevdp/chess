"use strict";
exports.__esModule = true;
var express_1 = require("express");
var path_1 = require("path");
var dotenv_1 = require("dotenv");
var http_1 = require("http");
// middleware
var api_1 = require("./api");
var lobby_1 = require("./lobby");
var clientSocketConnetions_1 = require("./clientSocketConnetions");
// loads .env file into process.env
dotenv_1["default"].config({ path: path_1["default"].resolve('../.env') });
var app = express_1["default"]();
var http = http_1["default"].createServer(app);
var PORT = process.env.PORT;
var lobby = new lobby_1.Lobby();
var socketServer = new clientSocketConnetions_1.SocketServer(http);
socketServer.clientConnectionsObservable.subscribe({
    next: lobby.addLobbyMember
});
app.use('/api', api_1.api);
http.listen(PORT, function () {
    console.log("Listening on " + PORT);
});
