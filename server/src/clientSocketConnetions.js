"use strict";
exports.__esModule = true;
var socket_io_1 = require("socket.io");
var v4_1 = require("uuid/v4");
var rxjs_1 = require("rxjs");
// TODO websocket user auth
var ClientConnection = /** @class */ (function () {
    function ClientConnection(socket) {
        this.socket = socket;
        this.user = {
            id: v4_1["default"](),
            username: 'placeholder'
        };
        this.messageObservable = new rxjs_1.Observable(function (subscriber) {
            socket
                .on('message', subscriber.next)
                .on('disconnect', function () { return subscriber.complete(); });
        });
    }
    Object.defineProperty(ClientConnection.prototype, "isActive", {
        get: function () {
            return this.socket.connected;
        },
        enumerable: true,
        configurable: true
    });
    ClientConnection.prototype.sendMessage = function (message) {
        if (this.socket.disconnected) {
            throw new Error('socket is disconnected!');
        }
        this.socket.send('message', message);
    };
    return ClientConnection;
}());
exports.ClientConnection = ClientConnection;
var SocketServer = /** @class */ (function () {
    function SocketServer(http) {
        var _this = this;
        this.broadcast = function (options) {
            _this.io.emit(options);
        };
        this.io = socket_io_1["default"](http);
        this.clientConnectionsObservable = new rxjs_1.Observable(function (subscriber) {
            _this.io.on('connection', function (socket) {
                subscriber.next(new ClientConnection(socket));
            });
        });
    }
    return SocketServer;
}());
exports.SocketServer = SocketServer;
