"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
exports.ROOT_DIR = path_1.default.resolve(__dirname, '../../');
exports.SECRETS_DIR = path_1.default.join(exports.ROOT_DIR, 'secrets');
exports.JWT_SECRET_PATH = path_1.default.join(exports.SECRETS_DIR, 'jwtRS256.key');
exports.JWT_PUBLIC_PATH = path_1.default.join(exports.SECRETS_DIR, 'jwtRS256.key.pub');
