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
var fs = require("fs");
var express = require("express");
var jwt = require("jsonwebtoken");
// import  cors from 'cors';
var body_parser_1 = require("body-parser");
var express_json_validator_middleware_1 = require("express-json-validator-middleware");
var constants_1 = require("./constants");
exports.api = express();
var RSA_PRIVATE_KEY = fs.readFileSync(constants_1.JWT_SECRET_PATH);
exports.api.use(body_parser_1["default"].json());
// TODO access control header still present for some reason
// api.use(cors({
//   origin: 'http://localhost:4200',
//   credentials: true,
// }));
var validator = new express_json_validator_middleware_1.Validator({ allErrors: true });
var validate = validator.validate;
var loginSchema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: {
            type: 'string'
        },
        password: {
            type: 'string'
        }
    }
};
exports.api.put('/login', validate({ body: loginSchema }), function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password;
    // TODO add validations
    if (!true) {
        return res.sendStatus(401);
    }
    var userId = username + password;
    var expiresIn = '3h';
    // currently not secure, sent over http
    var jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
        algorithm: 'RS256',
        expiresIn: "3h",
        subject: userId
    });
    var userDetails = {
        username: username,
        id: userId,
        expiresIn: expiresIn
    };
    res
        .status(200)
        .json(__assign({}, userDetails, { idToken: jwtBearerToken }));
});
// handling validation errors
exports.api.use(function (err, req, res, next) {
    if (err instanceof express_json_validator_middleware_1.ValidationError) {
        res.status(400).send('invalid');
        next();
        return;
    }
    next(err);
});
