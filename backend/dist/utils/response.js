"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, code = 'INTERNAL_ERROR', statusCode = 500, details) => {
    return res.status(statusCode).json({
        success: false,
        message,
        error: {
            code,
            message,
            ...(details !== undefined ? { details } : {}),
        },
    });
};
exports.sendError = sendError;
const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
    return res.status(200).json({
        success: true,
        data,
        message,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
};
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=response.js.map