"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = require("../config/logger");
const response_1 = require("../utils/response");
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    logger_1.logger.error('Unhandled error', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });
    // Prisma errors
    if (err.constructor.name === 'PrismaClientKnownRequestError') {
        const prismaErr = err;
        if (prismaErr.code === 'P2002') {
            (0, response_1.sendError)(res, 'A record with this value already exists', 'DUPLICATE_ENTRY', 409);
            return;
        }
        if (prismaErr.code === 'P2025') {
            (0, response_1.sendError)(res, 'Record not found', 'NOT_FOUND', 404);
            return;
        }
    }
    (0, response_1.sendError)(res, 'Internal server error', 'INTERNAL_ERROR', 500);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    (0, response_1.sendError)(res, `Route ${req.method} ${req.path} not found`, 'NOT_FOUND', 404);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map