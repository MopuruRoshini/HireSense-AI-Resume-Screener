import { Request, Response, NextFunction } from 'express';
import { AuditAction } from '@prisma/client';
export declare const auditLog: (action: AuditAction, entityType?: string) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=audit.middleware.d.ts.map