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
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
// TODO: switch from socket.io to bare ws + observables.
var LobbyMember = /** @class */ (function () {
    function LobbyMember(connection) {
        var _this = this;
        this.connection = connection;
        this.challenge = function (challengeDetails, resolutionObservable) {
            var id = challengeDetails.id;
            var _a = _this.connection, messageObservable = _a.messageObservable, sendMessage = _a.sendMessage;
            var isOwnChallenge = function () { return (challengeDetails.challengerId === _this.id); };
            // give resolutionSubject valid responses
            var memberResolutionObservable = messageObservable.pipe(
            // complete when resolutionSubject completes
            operators_1.filter(function (msg) { return (!!msg.challengeResponse
                // is correct challenge
                && msg.challengeResponse.id === id
                && (
                // you can't accept your own challenge
                msg.challengeResponse.response
                    && isOwnChallenge())); }), operators_1.map(function (msg) {
                var response = msg.challengeResponse.response;
                // client can't accept own challenge, so only option is cancelled
                var outcome;
                if (isOwnChallenge()) {
                    outcome = 'cancelled';
                }
                else {
                    outcome = response
                        ? 'accepted'
                        : 'declined';
                }
                return { id: id, outcome: outcome };
            }), operators_1.first());
            // issue response request
            sendMessage({
                lobby: {
                    requestChallengeResponse: challengeDetails
                }
            });
            // respond to resolution
            resolutionObservable.subscribe({
                next: function (resolution) { return sendMessage({
                    lobby: {
                        resolveChallenge: resolution
                    }
                }); }
            });
            return memberResolutionObservable;
        };
        this.updateLobbyDetails = function (lobbyDetails) {
            _this.connection.sendMessage({
                lobby: {
                    updateLobbyDetails: lobbyDetails
                }
            });
        };
        var messageObservable = connection.messageObservable;
        this.challengeObservable = messageObservable.pipe(operators_1.filter(function (msg) { return !!msg.challenge; }), operators_1.map(function (msg) { return msg.challenge; }));
        this.stateSubject = new rxjs_1.BehaviorSubject({ currentGame: null });
        this.detailsObservable = this.stateSubject.pipe(operators_1.map(function (memberState) { return (__assign({}, memberState, _this.user)); }));
        this.actions = {
            resolveChallenge: this.challenge,
            updateLobbyDetails: this.updateLobbyDetails,
            connection: this.connection
        };
    }
    Object.defineProperty(LobbyMember.prototype, "user", {
        get: function () {
            return this.connection.user;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LobbyMember.prototype, "id", {
        get: function () {
            return this.user.id;
        },
        enumerable: true,
        configurable: true
    });
    return LobbyMember;
}());
exports.LobbyMember = LobbyMember;
