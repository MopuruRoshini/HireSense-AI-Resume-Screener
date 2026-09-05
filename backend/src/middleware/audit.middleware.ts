import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuditAction } from '@prisma/client';

export const auditLog = (action: AuditAction, entityType?: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await prisma.auditLog.create({
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
    } catch {
      // audit log failure should never block the request
    }
    next();
  };
};

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.apiKey;
  delete sanitized.token;
  return sanitized;
}
