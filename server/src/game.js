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
var lodash_1 = require("lodash");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var chess_js_1 = require("chess.js");
var v4_1 = require("uuid/v4");
var player_1 = require("./player");
var Game = /** @class */ (function () {
    function Game(playerConnections) {
        var _this = this;
        this.actions = { temp: function () { } };
        this.requiredPlayerCount = 2;
        this.findOpponent = function (playerId) {
            return _this.players.find(function (p) { return p.id !== playerId; });
        };
        this.isValidPlayerAction = function (_a) {
            var move = _a.move, colour = _a.colour;
            return !(move && _this.isInvalidMove(move, colour));
        };
        this.id = v4_1["default"]();
        var colours = lodash_1["default"].shuffle(['b', 'w']);
        this.chess = chess_js_1["default"]();
        if (playerConnections.length !== 2) {
            throw new Error("wrong number of players! should be: " + this.requiredPlayerCount);
        }
        this.players = lodash_1["default"].zip(playerConnections, colours)
            .map(function (_a) {
            var connection = _a[0], colour = _a[1];
            return new player_1.Player(connection, colour);
        });
        var playerDetails = this.players.map(function (_a) {
            var details = _a.details;
            return details;
        });
        var gameDetails = {
            id: this.id,
            playerDetails: playerDetails,
            state: this.chess.fen()
        };
        this.gameUpdateObservable = rxjs_1.merge.apply(void 0, this.players.map(function (p) { return p.playerActionObservable; })).pipe(operators_1.filter(this.isValidPlayerAction), operators_1.map(this.getGameUpdateFromAction), operators_1.startWith({ start: gameDetails }), 
        // take until and including an update ending the game is issued
        operators_1.takeWhile(function (_a) {
            var end = _a.end;
            return !end;
        }, true), operators_1.shareReplay(1));
        this.players.forEach(function (player) {
            _this.gameUpdateObservable.subscribe(player.updateGame);
        });
        this.detailsObservable = this.gameUpdateObservable.pipe(operators_1.map(function (_a) {
            var state = _a.state;
            return (__assign({}, gameDetails, { state: state }));
        }), operators_1.shareReplay(1));
    }
    Game.prototype.isInvalidMove = function (move, colour) {
        return this.chess.turn() !== colour
            || !move
            || this.chess.moves({ square: move.from }).includes(move.to);
    };
    Game.prototype.getGameUpdateFromAction = function (playerAction) {
        var _this = this;
        var move = playerAction.move, playerId = playerAction.playerId;
        var actions = {
            move: function () {
                _this.chess.move(playerAction.move);
                var state = _this.chess.fen();
                if (_this.chess.in_checkmate()) {
                    return {
                        end: {
                            winnerId: _this.findOpponent(playerId).id,
                            reason: 'checkmate'
                        },
                        move: move,
                        state: state
                    };
                }
                if (_this.chess.in_stalemate()) {
                    return {
                        end: {
                            winnerId: null,
                            reason: 'stalemate'
                        },
                        move: move,
                        state: state
                    };
                }
                if (_this.chess.in_threefold_repitiion()) {
                    return {
                        end: {
                            winnerId: null,
                            reason: 'threefold repitition'
                        },
                        move: move,
                        state: state
                    };
                }
                if (_this.chess.in_draw()) {
                    return {
                        end: {
                            winnerId: null,
                            reason: 'draw'
                        },
                        move: move,
                        state: state
                    };
                }
                return {
                    type: 'ongoing',
                    move: move,
                    state: state
                };
            },
            resign: function () {
                return {
                    end: {
                        winnerId: _this.findOpponent(playerId).id,
                        reason: 'resigned'
                    },
                    state: _this.chess.fen()
                };
            },
            disconnect: function () {
                return {
                    end: {
                        winnerId: _this.findOpponent(playerId).id,
                        reason: 'disconnected'
                    },
                    state: _this.chess.fen()
                };
            },
            offerDraw: function () {
                return {
                    message: 'offer draw',
                    state: _this.chess.fen()
                };
            }
        };
        return actions[playerAction.type]();
    };
    return Game;
}());
exports.Game = Game;
