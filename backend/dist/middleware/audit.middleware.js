"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const prisma_1 = require("../config/prisma");
const auditLog = (action, entityType) => {
    return async (req, _res, next) => {
        try {
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: req.user?.userId,
                    action,
                    entityType,
                    entityId: req.params.id ? String(req.params.id) : undefined,
                    metadata: JSON.parse(JSON.stringify({
                        method: req.method,
                        path: req.path,
                        body: sanitizeBody(req.body || {}),
                    })),
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
        }
        catch {
            // audit log failure should never block the request
        }
        next();
    };
};
exports.auditLog = auditLog;
function sanitizeBody(body) {
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.apiKey;
    delete sanitized.token;
    return sanitized;
}
//# sourceMappingURL=audit.middleware.js.map