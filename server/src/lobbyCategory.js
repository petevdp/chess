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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var LobbyCategory = /** @class */ (function () {
    function LobbyCategory() {
        var _this = this;
        // snapshot of current components
        this.componentActions = {};
        var detailsUpdateSubject = new rxjs_1.Subject();
        this.componentsUpdateSubject = new rxjs_1.Subject();
        // helper method to reduce updates into key/value store
        var addToState = function (state, _a) {
            var _b;
            var id = _a.id, value = _a.value;
            if (!value) {
                var _c = id, toDelete = state[_c], rest = __rest(state, [typeof _c === "symbol" ? _c : _c + ""]);
                return rest;
            }
            return __assign({}, state, (_b = {}, _b[id] = value, _b));
        };
        this.componentsUpdateSubject.pipe(operators_1.tap(function (_a) {
            var id = _a.id, value = _a.value;
            if (!value) {
                return;
            }
            value.detailsObservable.subscribe({
                // forward details to correct observable
                next: function (details) { return detailsUpdateSubject.next({ id: id, value: details }); },
                // if completed, remove those details from current state
                complete: function () { return detailsUpdateSubject.next({ id: id, value: null }); }
            });
        }), 
        // map to actions, turn into map, and set as componentActions
        operators_1.map(function (_a) {
            var id = _a.id, value = _a.value;
            return ({ id: id, value: value.actions });
        }), operators_1.reduce(addToState), operators_1.tap(function (components) { return _this.componentActions = components; }));
        this.detailsObservable = detailsUpdateSubject.pipe(operators_1.tap(function (_a) {
            var id = _a.id, value = _a.value;
            if (!value) {
                // delete from component actions if details are no longer being provided
                _this.componentActions = addToState(_this.componentActions, { id: id, value: null });
                return;
            }
        }), operators_1.reduce(addToState), operators_1.shareReplay(1));
    }
    LobbyCategory.prototype.addComponent = function (component) {
        this.componentsUpdateSubject.next({ id: component.id, value: component });
    };
    return LobbyCategory;
}());
exports.LobbyCategory = LobbyCategory;
