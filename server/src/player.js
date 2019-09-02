"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var operators_1 = require("rxjs/operators");
var Player = /** @class */ (function () {
    function Player(connection, colour) {
        var _this = this;
        this.connection = connection;
        this.colour = colour;
        this.playerActionObservable = connection.messageObservable.pipe(operators_1.filter(function (msg) { return !!msg.game; }), operators_1.map(function (_a) {
            var game = _a.game;
            return (__assign({}, game, { colour: colour, playerId: _this.id }));
        }));
    }
    Object.defineProperty(Player.prototype, "user", {
        get: function () {
            return this.connection.user;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Player.prototype, "id", {
        get: function () {
            return this.user.id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Player.prototype, "details", {
        get: function () {
            return {
                user: this.user,
                colour: this.colour
            };
        },
        enumerable: true,
        configurable: true
    });
    Player.prototype.updateGame = function (gameUpdate) {
        this.connection.sendMessage({
            game: gameUpdate
        });
    };
    return Player;
}());
exports.Player = Player;
