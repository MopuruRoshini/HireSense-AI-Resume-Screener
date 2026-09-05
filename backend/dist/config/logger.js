"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const index_1 = require("./index");
exports.logger = winston_1.default.createLogger({
    level: index_1.config.nodeEnv === 'production' ? 'warn' : 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), index_1.config.nodeEnv === 'production'
        ? winston_1.default.format.json()
        : winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
        }))),
    transports: [
        new winston_1.default.transports.Console(),
        ...(index_1.config.nodeEnv === 'production'
            ? [new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' })]
            : []),
    ],
});
//# sourceMappingURL=logger.js.map