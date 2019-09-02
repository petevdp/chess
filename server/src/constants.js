"use strict";
exports.__esModule = true;
var path_1 = require("path");
exports.ROOT_DIR = path_1["default"].resolve(__dirname, '../../');
exports.SRC = path_1["default"].join(exports.ROOT_DIR, 'server', 'src');
exports.SECRETS_DIR = path_1["default"].join(exports.ROOT_DIR, 'secrets');
exports.JWT_SECRET_PATH = path_1["default"].join(exports.SECRETS_DIR, 'jwtRS256.key');
exports.JWT_PUBLIC_PATH = path_1["default"].join(exports.SECRETS_DIR, 'jwtRS256.key.pub');
