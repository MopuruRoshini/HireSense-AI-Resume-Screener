"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validate = void 0;
const response_1 = require("../utils/response");
const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            const summary = errors.map((e) => e.message).join('. ') || 'Validation failed';
            (0, response_1.sendError)(res, summary, 'VALIDATION_ERROR', 400, errors);
            return;
        }
        req.body = result.data;
        next();
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const errors = result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            const summary = errors.map((e) => e.message).join('. ') || 'Query validation failed';
            (0, response_1.sendError)(res, summary, 'VALIDATION_ERROR', 400, errors);
            return;
        }
        req.query = result.data;
        next();
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validate.middleware.js.map