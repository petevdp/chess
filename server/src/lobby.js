"use strict";
exports.__esModule = true;
var lobbyMember_1 = require("./lobbyMember");
var rxjs_1 = require("rxjs");
var game_1 = require("./game");
var lobbyCategory_1 = require("./lobbyCategory");
var Lobby = /** @class */ (function () {
    function Lobby() {
        var _this = this;
        this.members = new lobbyCategory_1.LobbyCategory();
        this.games = new lobbyCategory_1.LobbyCategory();
        this.lobbyChallengeSubject = new rxjs_1.Subject();
        // resolve incoming challenges
        this.lobbyChallengeSubject.subscribe({
            next: function (challengeDetails) {
                var challengerId = challengeDetails.challengerId, receiverId = challengeDetails.receiverId, id = challengeDetails.id;
                var resolutionSubject = new rxjs_1.Subject();
                var receiver = _this.members.componentActions[receiverId];
                if (!receiver) {
                    throw new Error('receiver does not exist!');
                }
                var challenger = _this.members.componentActions[challengerId];
                if (!challenger) {
                    throw new Error('challenger does not exist!');
                }
                // ask involved members to resolve the challenge.
                // The receiver can accept or decline, and the challenger can cancel.
                [receiver, challenger].forEach(function (mem) {
                    var memberResolutionObservable = mem.resolveChallenge(challengeDetails, resolutionSubject.asObservable());
                    memberResolutionObservable.subscribe(resolutionSubject.next);
                });
                resolutionSubject.subscribe({
                    next: function (isAccepted) {
                        // complete after only one value
                        resolutionSubject.complete();
                        _this.createGame([receiver, challenger]);
                    }
                });
            }
        });
    }
    Lobby.prototype.addLobbyMember = function (client) {
        var member = new lobbyMember_1.LobbyMember(client);
        this.members.addComponent(member);
        member.challengeObservable.subscribe({
            next: this.lobbyChallengeSubject.next
        });
        this.detailsObservable.subscribe({
            next: member.updateLobbyDetails
        });
    };
    Lobby.prototype.createGame = function (members) {
        var game = new game_1.Game(members.map(function (m) { return m.connection; }));
        this.games.addComponent(game);
    };
    return Lobby;
}());
exports.Lobby = Lobby;
